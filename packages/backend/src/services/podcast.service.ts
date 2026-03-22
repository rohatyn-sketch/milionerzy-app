import { createHash } from 'crypto';
import { db } from '../config';
import { getStorage } from 'firebase-admin/storage';
import { COLLECTIONS } from '../firestore/collections';

const PODCAST_BUCKET = process.env.PODCAST_BUCKET || 'milionerzy-487910-podcasts';
const PODCAST_CACHE_COLLECTION = 'podcastCache';

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

function questionHash(questionText: string): string {
  return createHash('sha256').update(questionText.trim().toLowerCase()).digest('hex').slice(0, 16);
}

// Check global cache for an existing podcast for this question
async function findGlobalPodcast(questionText: string): Promise<PodcastResult | null> {
  const hash = questionHash(questionText);
  const doc = await db.collection(PODCAST_CACHE_COLLECTION).doc(hash).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    podcastId: doc.id,
    audioUrl: data.audioUrl,
    title: data.title,
    duration: data.duration,
    script: data.script,
  };
}

// Link a podcast to a user (so they can find it later)
async function linkPodcastToUser(uid: string, podcastId: string, questionText: string): Promise<void> {
  await db
    .collection(COLLECTIONS.USERS)
    .doc(uid)
    .collection('podcasts')
    .doc(podcastId)
    .set({ questionText, linkedAt: new Date().toISOString() }, { merge: true });
}

// Lookup which questions (by text) have podcasts available
export async function lookupPodcasts(questionTexts: string[]): Promise<Record<string, PodcastResult>> {
  const result: Record<string, PodcastResult> = {};

  // Batch read from global cache
  const hashes = questionTexts.map(q => questionHash(q));
  const uniqueHashes = [...new Set(hashes)];

  // Firestore getAll supports up to 100 docs
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueHashes.length; i += 100) {
    chunks.push(uniqueHashes.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const refs = chunk.map(h => db.collection(PODCAST_CACHE_COLLECTION).doc(h));
    const docs = await db.getAll(...refs);

    for (const doc of docs) {
      if (doc.exists) {
        const data = doc.data()!;
        // Map back to original question text
        const matchingQuestions = questionTexts.filter(q => questionHash(q) === doc.id);
        for (const qt of matchingQuestions) {
          result[qt] = {
            podcastId: doc.id,
            audioUrl: data.audioUrl,
            title: data.title,
            duration: data.duration,
            script: data.script,
          };
        }
      }
    }
  }

  return result;
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
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
      estimatedDuration += (line.text.length / 5 / 150) * 60;
    }
  }

  const audioBuffer = Buffer.concat(audioChunks);
  return { audioBuffer, duration: Math.round(estimatedDuration) };
}

// Step 4: Upload to Storage and save to global cache
async function uploadAndCache(
  podcastId: string,
  audioBuffer: Buffer,
  title: string,
  duration: number,
  script: string,
  questionText: string,
  category: string,
): Promise<string> {
  const bucket = getStorage().bucket(PODCAST_BUCKET);
  const filePath = `podcasts/${podcastId}.mp3`;
  const file = bucket.file(filePath);

  await file.save(audioBuffer, {
    metadata: {
      contentType: 'audio/mpeg',
      metadata: { podcastId },
    },
  });

  const [audioUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  });

  // Save to global cache keyed by question hash
  const hash = questionHash(questionText);
  await db.collection(PODCAST_CACHE_COLLECTION).doc(hash).set({
    podcastId,
    title,
    audioUrl,
    duration,
    script,
    questionText,
    category,
    createdAt: new Date().toISOString(),
    storagePath: filePath,
  });

  return audioUrl;
}

export async function generatePodcast(uid: string, req: PodcastRequest): Promise<PodcastResult> {
  // Check global cache first (shared across all users)
  const cached = await findGlobalPodcast(req.questionText);
  if (cached) {
    // Link to this user for their history
    await linkPodcastToUser(uid, cached.podcastId, req.questionText);
    return cached;
  }

  // Generate content → script → audio
  const content = await generateContent(req);
  const { lines, title } = await generateScript(content, req.category);
  const scriptText = lines.map(l => `${l.speaker}: ${l.text}`).join('\n');
  const { audioBuffer, duration } = await synthesizeAudio(lines);

  const podcastId = questionHash(req.questionText);
  const audioUrl = await uploadAndCache(podcastId, audioBuffer, title, duration, scriptText, req.questionText, req.category);

  // Link to generating user
  await linkPodcastToUser(uid, podcastId, req.questionText);

  return { podcastId, audioUrl, title, duration, script: scriptText };
}
