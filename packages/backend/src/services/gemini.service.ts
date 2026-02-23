export function buildPrompt(className: string, context?: string): string {
  return `Jestes ekspertem od tworzenia pytan quizowych. Wygeneruj dokladnie 65 pytan do quizu "Milionerzy" na temat: "${className}".
${context ? `\nDodatkowy kontekst: ${context}` : ''}

Wymagania:
- 55 pytan wielokrotnego wyboru (4 odpowiedzi, dokladnie 1 poprawna)
- 10 pytan prawda/falsz (2 odpowiedzi: "Prawda" i "Falsz")
- Kazde pytanie musi miec pole "category" pasujace do tematu
- Kazde pytanie musi miec pole "explanation" z krotkim wyjasnieniem
- Pytania powinny byc zroznicowane pod wzgledem trudnosci

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
    "category": "kategoria",
    "explanation": "wyjasnienie poprawnej odpowiedzi",
    "type": "multiple-choice"
  }
]`;
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

  return questions.map((q: any) => ({
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
  const prompt = buildPrompt(className, context);

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
