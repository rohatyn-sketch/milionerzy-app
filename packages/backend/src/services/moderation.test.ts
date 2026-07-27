import { describe, it, expect } from 'vitest';
import { normalizeForMatch, findBlockedTerm, isBlocked, filterQuestions } from './moderation';
import { parseModeration } from './gemini.service';

describe('normalizeForMatch', () => {
  it('lowercases and strips Polish diacritics', () => {
    expect(normalizeForMatch('JEBAĆ')).toBe('jebac');
    expect(normalizeForMatch('Zażółć gęślą')).toBe('zazolc gesla');
  });

  it('flattens punctuation used to break up words', () => {
    expect(normalizeForMatch('k.u.r.w.a')).toBe('k u r w a');
    expect(normalizeForMatch('  wiele   spacji  ')).toBe('wiele spacji');
  });

  it('handles null and undefined without throwing', () => {
    expect(normalizeForMatch(undefined as any)).toBe('');
    expect(normalizeForMatch(null as any)).toBe('');
  });
});

describe('findBlockedTerm', () => {
  it('allows ordinary school topics', () => {
    const clean = [
      'Matematyka: ułamki zwykłe',
      'Historia Polski XX wieku',
      'Biologia — rozmnażanie roślin',
      'Fizyka klasa 7, ciśnienie i gęstość',
      'Język angielski: czasy przeszłe',
      'Chemia: układ okresowy pierwiastków',
    ];
    for (const topic of clean) {
      expect(findBlockedTerm(topic), `expected clean: ${topic}`).toBeNull();
    }
  });

  it('blocks profanity regardless of case or diacritics', () => {
    expect(findBlockedTerm('kurwa mać')).not.toBeNull();
    expect(findBlockedTerm('JEBAĆ to wszystko')).not.toBeNull();
  });

  it('blocks sexual, drug and hate-speech topics', () => {
    expect(findBlockedTerm('seks i erotyka')).not.toBeNull();
    expect(findBlockedTerm('narkotyki i dopalacze')).not.toBeNull();
    expect(findBlockedTerm('fuck this quiz')).not.toBeNull();
  });

  it('matches inflected forms from a single stem', () => {
    // "jeb" covers the whole family without listing each ending
    expect(findBlockedTerm('jebany')).not.toBeNull();
    expect(findBlockedTerm('jebac')).not.toBeNull();
  });

  it('only matches at a word boundary, so legitimate words pass', () => {
    // "sex" must start a word - it should not fire inside an unrelated token
    expect(findBlockedTerm('Middlesex County geography')).toBeNull();
  });

  it('exposes a boolean helper', () => {
    expect(isBlocked('Matematyka')).toBe(false);
    expect(isBlocked('porno')).toBe(true);
  });
});

describe('filterQuestions', () => {
  const good = {
    question: 'Ile wynosi 2 + 2?',
    category: 'Dodawanie',
    answers: [
      { text: '4', correct: true },
      { text: '5', correct: false },
    ],
    explanation: 'Dwa dodać dwa to cztery.',
  };

  it('keeps clean questions untouched', () => {
    const { kept, removed } = filterQuestions([good]);
    expect(kept).toEqual([good]);
    expect(removed).toBe(0);
  });

  it('drops a question when any field contains blocked content', () => {
    const badAnswer = { ...good, answers: [{ text: 'kurwa', correct: true }] };
    const badExplanation = { ...good, explanation: 'To jest porno.' };
    const badPrompt = { ...good, question: 'Co to jest seks?' };

    for (const bad of [badAnswer, badExplanation, badPrompt]) {
      const { kept, removed } = filterQuestions([good, bad]);
      expect(removed).toBe(1);
      expect(kept).toEqual([good]);
    }
  });

  it('survives malformed question objects', () => {
    const { kept } = filterQuestions([{}, { answers: null }, good]);
    expect(kept).toHaveLength(3);
  });
});

describe('parseModeration', () => {
  it('parses a plain JSON verdict', () => {
    expect(parseModeration('{"allowed": true, "reason": "ok"}')).toEqual({
      allowed: true,
      reason: 'ok',
    });
    expect(parseModeration('{"allowed": false, "reason": "tresci dla doroslych"}')).toEqual({
      allowed: false,
      reason: 'tresci dla doroslych',
    });
  });

  it('parses a verdict wrapped in a markdown code fence', () => {
    const fenced = '```json\n{"allowed": false, "reason": "przemoc"}\n```';
    expect(parseModeration(fenced)).toEqual({ allowed: false, reason: 'przemoc' });
  });

  it('returns null when the reply cannot be understood, so it is not an approval', () => {
    expect(parseModeration('I think that topic is fine!')).toBeNull();
    expect(parseModeration('{"allowed":')).toBeNull();
    expect(parseModeration('')).toBeNull();
  });

  it('returns null when "allowed" is missing or not a boolean', () => {
    expect(parseModeration('{"reason": "brak werdyktu"}')).toBeNull();
    expect(parseModeration('{"allowed": "yes"}')).toBeNull();
  });
});
