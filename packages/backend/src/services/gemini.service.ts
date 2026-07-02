export function buildPrompt(className: string, context?: string, hasImage?: boolean): string {
  return `Jestes ekspertem od tworzenia pytan quizowych. Wygeneruj pytania do quizu "Milionerzy" na temat: "${className}".
${context ? `\nDodatkowy kontekst / kryteria: ${context}` : ''}
${hasImage ? '\nDolaczono zdjecie z kryteriami sukcesu / materialem. Przeanalizuj je dokladnie i wygeneruj pytania scisle oparte na tresci ze zdjecia.' : ''}

Zasady generowania:
- Przeanalizuj podany temat i kontekst, aby zidentyfikowac WSZYSTKIE kryteria / podtematy
- Dla KAZDEGO kryterium / podtematu wygeneruj dokladnie 3 pytania (minimum 2)
- MINIMUM 50 pytan lacznie — jesli kryteriow jest malo, wygeneruj wiecej pytan na kazde kryterium (4-5)
- Kazde pytanie wielokrotnego wyboru musi miec 4 odpowiedzi (dokladnie 1 poprawna)
- Mozesz tez tworzyc pytania prawda/falsz (2 odpowiedzi: "Prawda" i "Falsz")
- Kazde pytanie musi miec pole "category" odpowiadajace kryterium/podtematowi
- Kazde pytanie musi miec pole "explanation" z krotkim wyjasnieniem
- Pytania powinny byc zroznicowane pod wzgledem trudnosci (latwe, srednie, trudne)
- WAZNE: Wszystkie wygenerowane pytania zostana uzyte w jednej rundzie gry

Format JSON (TYLKO tablica, bez dodatkowego tekstu):
[
  {
    "question": "tresc pytania",
    "answers": [
      {"text": "odpowiedz 1", "correct": true},
      {"text": "odpowiedz 2", "correct": false},
      {"text": "odpowiedz 3", "correct": false},
      {"text": "odpowiedz 4", "correct": false}
    ],
    "category": "nazwa kryterium/podtematu",
    "explanation": "wyjasnienie poprawnej odpowiedzi",
    "type": "multiple-choice"
  }
]`;
}

export function buildModerationPrompt(className: string, context?: string, hasImage?: boolean): string {
  return `Jestes moderatorem tresci dla edukacyjnej gry quizowej dla uczniow szkolnych.
Twoim zadaniem jest ocenic, czy podany temat nadaje sie do wygenerowania pytan szkolno-edukacyjnych.

Temat: "${className}"
${context ? `Dodatkowy kontekst: "${context}"` : ''}
${hasImage ? 'Dolaczono rowniez zdjecie z materialem — ocen takze jego tresc.' : ''}

DOZWOLONE sa wylacznie tematy o charakterze szkolno-edukacyjnym, np.:
matematyka, fizyka, chemia, biologia, geografia, historia, jezyk polski, jezyki obce,
literatura, informatyka, przyroda, wiedza o spoleczenstwie, plastyka, muzyka, technika,
edukacja zdrowotna, oraz ogolna wiedza akademicka na poziomie szkolnym.

NIEDOZWOLONE sa tematy:
- tresci dla doroslych, seksualne lub sugestywne
- przemoc, okrucienstwo, tresci drastyczne
- narkotyki, uzaleznienia (poza edukacyjnym ujeciem profilaktycznym)
- mowa nienawisci, dyskryminacja
- tresci obrazliwe, wulgarne lub nielegalne
- tematy calkowicie niezwiazane z edukacja szkolna (np. plotki, memy, tresci losowe)

Odpowiedz WYLACZNIE obiektem JSON, bez dodatkowego tekstu:
{"allowed": true lub false, "reason": "krotkie uzasadnienie po polsku"}`;
}

export function parseModeration(text: string): { allowed: boolean; reason: string } {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objMatch) {
    // Fail open so a malformed moderator reply doesn't block a valid topic.
    console.warn('[Moderation] No JSON object in response, allowing by default');
    return { allowed: true, reason: '' };
  }

  try {
    const parsed = JSON.parse(objMatch[0]);
    return { allowed: parsed.allowed !== false, reason: parsed.reason || '' };
  } catch {
    console.warn('[Moderation] Failed to parse response, allowing by default');
    return { allowed: true, reason: '' };
  }
}

export async function moderateTopic(
  className: string,
  context?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<{ allowed: boolean; reason: string }> {
  const key = process.env.GEMINI_API_KEY || '';
  const prompt = buildModerationPrompt(className, context, !!(imageBase64 && mimeType));

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0, maxOutputTokens: 256 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.warn(`[Moderation] API error ${response.status}, allowing by default - ${err}`);
      return { allowed: true, reason: '' };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn('[Moderation] Empty response, allowing by default');
      return { allowed: true, reason: '' };
    }

    return parseModeration(text);
  } catch (err: any) {
    console.warn('[Moderation] Request failed, allowing by default:', err?.message);
    return { allowed: true, reason: '' };
  }
}

export function parseResponse(text: string): any[] {
  let cleaned = text.trim();

  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error('No JSON array found in response');

  const questions = JSON.parse(arrayMatch[0]);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid questions array');
  }

  if (questions.length < 50) {
    console.warn(`[Gemini] Only ${questions.length} questions generated (minimum 50 expected)`);
  }

  return questions.map((q: any, index: number) => ({
    id: `q_${index}`,
    question: q.question,
    answers: q.answers,
    category: q.category || '',
    explanation: q.explanation || '',
    type: q.type || (q.answers.length === 2 ? 'true-false' : 'multiple-choice'),
  }));
}

export async function generateWithGemini(
  className: string,
  context?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<any[]> {
  const key = process.env.GEMINI_API_KEY || '';
  const prompt = buildPrompt(className, context, !!(imageBase64 && mimeType));

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseResponse(text);
}
