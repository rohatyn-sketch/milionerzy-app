// Deterministic, offline content moderation.
//
// This runs alongside the AI moderator in gemini.service.ts. The AI call is the
// smarter of the two, but it depends on a network round-trip that can fail; this
// layer never can. It is used in two places:
//   1. before the AI call, so blatant input is rejected without spending a request
//   2. after generation, so nothing inappropriate reaches the cache or the player
//
// Matching is intentionally stem-based: entries are word *prefixes*, so a single
// stem covers Polish inflections ("jeb" -> "jebac", "jebany", ...). Text is
// normalized first (lowercased, diacritics stripped, punctuation flattened) so
// that "JEBAĆ" and "j.e.b.a.c" reduce to the same form as "jebac".

const BLOCKED_TERMS: string[] = [
  // wulgaryzmy PL
  'kurw', 'chuj', 'huj', 'pierdol', 'pierdal', 'jeb', 'pizd', 'skurwiel',
  'skurwysyn', 'cipa', 'cipy', 'kutas', 'dziwk', 'szmata', 'spierdal',
  'wypierdal', 'zjeb', 'wyjeb', 'najeb',
  // tresci seksualne
  'seks', 'sex', 'porno', 'porn', 'penis', 'wagin', 'erekcj', 'masturbacj',
  'orgazm', 'erotyk', 'erotyczn', 'pedofil', 'molestow',
  // przemoc / substancje / mowa nienawisci
  'narkotyk', 'kokain', 'heroin', 'marihuan', 'amfetamin', 'samobojstw',
  'samobojcz', 'terroryzm', 'terrorysc', 'nazizm', 'hitler',
  // ang. wulgaryzmy / mowa nienawisci
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'cunt', 'nigger',
  'faggot', 'rape',
];

/**
 * Lowercase, strip Polish diacritics, and flatten anything that is not a letter
 * or digit into a single space. Punctuation-based evasion ("k.u.r.w.a") and
 * accented spellings both collapse onto the same normalized form.
 */
export function normalizeForMatch(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    // 'l' with stroke is its own letter, not l + a combining mark, so NFD leaves
    // it intact and it would otherwise be stripped as punctuation - splitting the
    // word in half and hiding whatever follows it.
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns the blocked stem found in `text`, or null when the text looks clean.
 * Matching anchors on a word boundary so the stem must start a word — this keeps
 * legitimate words that merely contain a stem from tripping the filter.
 */
export function findBlockedTerm(text: string): string | null {
  const normalized = normalizeForMatch(text);
  if (!normalized) return null;

  for (const term of BLOCKED_TERMS) {
    const stem = normalizeForMatch(term);
    if (!stem) continue;
    const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}`).test(normalized)) return term;
  }
  return null;
}

export function isBlocked(text: string): boolean {
  return findBlockedTerm(text) !== null;
}

/**
 * Flattens a generated question into the single string used for output
 * screening: prompt text, category, every answer, and the explanation.
 */
export function questionToText(question: any): string {
  const answers = Array.isArray(question?.answers)
    ? question.answers.map((a: any) => a?.text ?? '').join(' ')
    : '';
  return [question?.question, question?.category, answers, question?.explanation]
    .filter(Boolean)
    .join(' ');
}

/**
 * Drops any generated question containing blocked content. Returns the kept
 * questions plus the number removed so the caller can log/act on it.
 */
export function filterQuestions(questions: any[]): { kept: any[]; removed: number } {
  const kept = questions.filter((q) => !isBlocked(questionToText(q)));
  return { kept, removed: questions.length - kept.length };
}
