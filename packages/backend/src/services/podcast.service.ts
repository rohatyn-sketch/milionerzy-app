import { db } from '../config';
import { getStorage } from 'firebase-admin/storage';
import { COLLECTIONS } from '../firestore/collections';

const PODCAST_BUCKET = process.env.PODCAST_BUCKET || 'milionerzy-487910-podcasts';

interface PodcastRequest {
  questionText: string;
  category: string;
  correctAnswer: string;
  explanation?: string;
}

interface PodcastResult {
  podcastId: string;
  audioUrl: string;
  title: string;
  duration: number;
  script: string;
}

interface ScriptLine {
  speaker: 'Host' | 'Expert';
  text: string;
}

// Check if a podcast already exists for this question (cache)
async function findCachedPodcast(uid: string, questionText: string): Promise<PodcastResult | null> {
  const snap = await db
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .collection('podcasts')
    .where('questionText', '==', questionText)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  return {
    podcastId: doc.id,
    audioUrl: data.audioUrl,
    title: data.title,
    duration: data.duration,
    script: data.script,
  };
}

// Step 1: Generate educational content via Gemini
async function generateContent(req: PodcastRequest): Promise<string> {
  const key = process.env.GEMINI_API_KEY || '';

  const prompt = `Jestes ekspertem edukacyjnym. Uczeń odpowiedzial blednie na pytanie quizowe i potrzebuje pomocy w zrozumieniu tematu.

Pytanie: "${req.questionText}"
Poprawna odpowiedz: "${req.correctAnswer}"
Kategoria: "${req.category}"
${req.explanation ? `Wyjasnienie z quizu: "${req.explanation}"` : ''}

Napisz zwiezly material edukacyjny (400-600 slow) na temat tego pytania. Wymagania:
- Wyjasniej temat w przystepny sposob, jakbys tlumaczy uczniowi
- Uzyj przykladow z zycia codziennego
- Odwoluj sie do wiarygodnych zrodel edukacyjnych (podreczniki, encyklopedie)
- Pokaz dlaczego poprawna odpowiedz jest prawidlowa
- Wspomnij o typowych bledach i nieporozumieniach
- Pisz po polsku

Odpowiedz TYLKO materialem edukacyjnym, bez dodatkowego formatowania.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini content generation failed: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty content from Gemini');
  return text;
}

// Step 2: Convert content to podcast script via Gemini
async function generateScript(content: string, category: string): Promise<{ lines: ScriptLine[]; title: string }> {
  const key = process.env.GEMINI_API_KEY || '';

  const prompt = `Przeksztalc ponizszy material edukacyjny w scenariusz podcastu. Podcast to rozmowa dwoch osob:
- Host: prowadzacy, ciekawy, zadaje pytania, zartuje
- Expert: ekspert od tematu, tlumaczy w przystepny sposob

Kategoria: ${category}

Material:
${content}

Wymagania:
- Naturalny, wciagajacy dialog (jakby rozmowa na zywo)
- Dodaj odrobine humoru i entuzjazmu
- 8-12 wymian zdanm (kazda osoba mowi 1-3 zdania na raz)
- Zacznij od krotkiego wprowadzenia Hosta
- Zakoncz podsumowaniem

Zwroc JSON (TYLKO tablice, bez dodatkowego tekstu):
{
  "title": "krotki tytul odcinka po polsku",
  "lines": [
    {"speaker": "Host", "text": "tresc wypowiedzi"},
    {"speaker": "Expert", "text": "tresc wypowiedzi"}
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini script generation failed: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty script from Gemini');

  // Parse JSON from response
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objectMatch) throw new Error('No JSON found in script response');

  const parsed = JSON.parse(objectMatch[0]);
  return {
    title: parsed.title || `Podcast: ${category}`,
    lines: parsed.lines || [],
  };
}

// Step 3: Synthesize audio via Google Cloud TTS
async function synthesizeAudio(lines: ScriptLine[]): Promise<{ audioBuffer: Buffer; duration: number }> {
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
  const ttsClient = new TextToSpeechClient();

  // Polish voices - distinct for each speaker
  const voiceConfig: Record<string, { name: string; ssmlGender: 'MALE' | 'FEMALE' }> = {
    Host: { name: 'pl-PL-Wavenet-B', ssmlGender: 'MALE' },
    Expert: { name: 'pl-PL-Wavenet-D', ssmlGender: 'FEMALE' },
  };

  const audioChunks: Buffer[] = [];
  let estimatedDuration = 0;

  for (const line of lines) {
    const voice = voiceConfig[line.speaker] || voiceConfig.Host;

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: line.text },
      voice: {
        languageCode: 'pl-PL',
        name: voice.name,
        ssmlGender: voice.ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        sampleRateHertz: 24000,
        speakingRate: 1.0,
      },
    });

    if (response.audioContent) {
      const chunk = Buffer.isBuffer(response.audioContent)
        ? response.audioContent
        : Buffer.from(response.audioContent as Uint8Array);
      audioChunks.push(chunk);

      // Rough duration estimate: ~150 words/min, average 5 chars/word
      estimatedDuration += (line.text.length / 5 / 150) * 60;
    }
  }

  // Simple concatenation of MP3 chunks (works for sequential playback)
  const audioBuffer = Buffer.concat(audioChunks);
  return { audioBuffer, duration: Math.round(estimatedDuration) };
}

// Step 4: Upload to Firebase Storage and save metadata
async function uploadAndSave(
  uid: string,
  podcastId: string,
  audioBuffer: Buffer,
  title: string,
  duration: number,
  script: string,
  questionText: string,
  category: string,
): Promise<string> {
  const bucket = getStorage().bucket(PODCAST_BUCKET);
  const filePath = `users/${uid}/podcasts/${podcastId}.mp3`;
  const file = bucket.file(filePath);

  await file.save(audioBuffer, {
    metadata: {
      contentType: 'audio/mpeg',
      metadata: { uid, podcastId },
    },
  });

  // Make file accessible via signed URL (valid for 7 days)
  const [audioUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  // Save metadata to Firestore
  await db
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .collection('podcasts')
    .doc(podcastId)
    .set({
      title,
      audioUrl,
      duration,
      script,
      questionText,
      category,
      createdAt: new Date().toISOString(),
    });

  return audioUrl;
}

export async function generatePodcast(uid: string, req: PodcastRequest): Promise<PodcastResult> {
  // Check cache first
  const cached = await findCachedPodcast(uid, req.questionText);
  if (cached) return cached;

  // Generate content → script → audio
  const content = await generateContent(req);
  const { lines, title } = await generateScript(content, req.category);

  const scriptText = lines.map(l => `${l.speaker}: ${l.text}`).join('\n');

  const { audioBuffer, duration } = await synthesizeAudio(lines);

  const podcastId = `podcast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const audioUrl = await uploadAndSave(uid, podcastId, audioBuffer, title, duration, scriptText, req.questionText, req.category);

  return { podcastId, audioUrl, title, duration, script: scriptText };
}
