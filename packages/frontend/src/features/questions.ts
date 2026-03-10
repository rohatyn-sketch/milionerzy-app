import type { Question } from '@milionerzy/shared';
import { FALLBACK_QUESTIONS, shuffleAnswers, getRandomQuestions as sharedGetRandom, getMainCategory } from '@milionerzy/shared';
import { storage } from '../state/storage';

/** Ensure every question has an id for incorrect tracking */
function ensureIds(questions: Question[]): Question[] {
  return questions.map((q, i) => q.id ? q : { ...q, id: `q_${i}` });
}

let currentQuestions: Question[] = ensureIds([...FALLBACK_QUESTIONS]);

export function setQuestions(q: Question[]): void {
  currentQuestions = ensureIds(q);
}

export function getQuestions(): Question[] {
  return currentQuestions;
}

export function loadCachedQuestions(): boolean {
  const activeClassId = storage.getActiveClass();

  if (activeClassId === 'default_fizyka7') {
    currentQuestions = ensureIds([...FALLBACK_QUESTIONS]);
    return true;
  }

  const cached = storage.getClassQuestions(activeClassId);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    currentQuestions = ensureIds(cached);
    return true;
  }

  currentQuestions = ensureIds([...FALLBACK_QUESTIONS]);
  return false;
}

export function loadQuestionsForClass(classId: string): boolean {
  if (classId === 'default_fizyka7') {
    currentQuestions = ensureIds([...FALLBACK_QUESTIONS]);
    return true;
  }
  const cached = storage.getClassQuestions(classId);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    currentQuestions = ensureIds(cached);
    return true;
  }
  currentQuestions = ensureIds([...FALLBACK_QUESTIONS]);
  return false;
}

export function getRandomQuestions(count = 10): Question[] {
  return sharedGetRandom(currentQuestions, count);
}

export { shuffleAnswers, getMainCategory };

// Initialize on import
loadCachedQuestions();
