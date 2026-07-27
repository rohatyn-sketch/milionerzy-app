import { findBlockedTerm, filterQuestions } from './moderation';

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

Bezpieczenstwo tresci (KRYTYCZNE):
- Odbiorcami sa uczniowie szkolni. Kazde pytanie, odpowiedz i wyjasnienie musi byc
  odpowiednie dla dziecka i utrzymane w tonie szkolno-edukacyjnym.
- Nie generuj tresci wulgarnych, seksualnych, drastycznych, dotyczacych narkotykow
  ani mowy nienawisci.
- Jesli temat lub kontekst zawiera cokolwiek nieodpowiedniego, zignoruj te czesc
  i trzymaj sie wylacznie tresci edukacyjnych.

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

/**
 * Parses the moderator's JSON verdict. Returns null when the reply cannot be
 * understood, so the caller can retry rather than silently letting the topic
 * through — an unreadable verdict is not an approval.
 */
export function parseModeration(text: string): { allowed: boolean; reason: string } | null {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;

  try {
    const parsed = JSON.parse(objMatch[0]);
    if (typeof parsed.allowed !== 'boolean') return null;
    return { allowed: parsed.allowed, reason: parsed.reason || '' };
  } catch {
    return null;
  }
}

export type ModerationSource = 'blocklist' | 'ai' | 'unavailable';

export interface ModerationResult {
  allowed: boolean;
  reason: string;
  source: ModerationSource;
}

const MODERATION_ATTEMPTS = 3;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * When every moderation attempt fails we block by default: an unchecked topic is
 * not a safe topic. This costs almost no availability in practice, because the
 * moderator and the generator call the same Gemini endpoint — if moderation
 * cannot reach it, generation would fail moments later anyway. Set
 * MODERATION_FAIL_OPEN=true to invert this for debugging.
 */
function failOpenEnabled(): boolean {
  return process.env.MODERATION_FAIL_OPEN === 'true';
}

/**
 * Decides whether a topic may be turned into a quiz.
 *
 * Two layers, cheapest first:
 *   1. a local blocklist that always runs and never fails
 *   2. the Gemini moderator, retried, for everything requiring judgement
 */
export async function moderateTopic(
  className: string,
  context?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<ModerationResult> {
  // Layer 1 - deterministic. Catches blatant input without spending a request,
  // and keeps working when the API is down.
  const blocked = findBlockedTerm(`${className} ${context || ''}`);
  if (blocked) {
    console.warn('[Moderation] Blocked by local blocklist');
    return {
      allowed: false,
      reason: 'temat zawiera niedozwolone slownictwo',
      source: 'blocklist',
    };
  }

  // Layer 2 - AI judgement, retried so one bad round-trip is not a verdict.
  const key = process.env.GEMINI_API_KEY || '';
  const prompt = buildModerationPrompt(className, context, !!(imageBase64 && mimeType));

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  for (let attempt = 1; attempt <= MODERATION_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            // gemini-3-flash is a thinking model: it spends output tokens on
            // internal reasoning before the answer. thinkingLevel 'low' keeps it
            // cheap, and 1024 tokens leaves room so the JSON verdict is never
            // truncated.
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1024,
              thinkingConfig: { thinkingLevel: 'low' },
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[Moderation] attempt ${attempt}/${MODERATION_ATTEMPTS} API error ${response.status} - ${err}`);
      } else {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        // A MAX_TOKENS cutoff means the verdict may be half-written; retry
        // instead of trusting a partial answer.
        if (candidate?.finishReason === 'MAX_TOKENS') {
          console.warn(`[Moderation] attempt ${attempt}/${MODERATION_ATTEMPTS} truncated verdict`);
        } else if (!text) {
          console.warn(`[Moderation] attempt ${attempt}/${MODERATION_ATTEMPTS} empty response`);
        } else {
          const verdict = parseModeration(text);
          if (verdict) return { ...verdict, source: 'ai' };
          console.warn(`[Moderation] attempt ${attempt}/${MODERATION_ATTEMPTS} unparseable verdict`);
        }
      }
    } catch (err: any) {
      console.warn(`[Moderation] attempt ${attempt}/${MODERATION_ATTEMPTS} request failed:`, err?.message);
    }

    if (attempt < MODERATION_ATTEMPTS) await sleep(250 * attempt);
  }

  if (failOpenEnabled()) {
    console.warn('[Moderation] unavailable, allowing because MODERATION_FAIL_OPEN=true');
    return { allowed: true, reason: '', source: 'unavailable' };
  }

  console.error('[Moderation] unavailable after retries, blocking request');
  return { allowed: false, reason: '', source: 'unavailable' };
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

  // Output-side screening: the topic passing moderation does not guarantee every
  // generated question is clean, and these get cached and replayed to players.
  const { kept, removed } = filterQuestions(questions);
  if (removed > 0) {
    console.warn(`[Moderation] Dropped ${removed} generated question(s) containing blocked content`);
  }
  if (kept.length === 0) {
    throw new Error('All generated questions were rejected by the content filter');
  }

  if (kept.length < 50) {
    console.warn(`[Gemini] Only ${kept.length} questions generated (minimum 50 expected)`);
  }

  return kept.map((q: any, index: number) => ({
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
