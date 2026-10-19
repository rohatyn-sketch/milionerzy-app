import { db } from '../config';
import { COLLECTIONS } from '../firestore/collections';
import { generateWithGemini } from './gemini.service';

export function cacheKeyFor(className: string, context?: string): string {
  return `${className}_${context || ''}`.replace(/\s+/g, '_').toLowerCase();
}

/**
 * Cached questions for a topic, or null. Serving these costs nothing, so they
 * keep working even when the AI budget is exhausted.
 */
export async function getCachedQuestions(className: string, context?: string): Promise<any[] | null> {
  const cached = await db.collection(COLLECTIONS.QUESTION_CACHE).doc(cacheKeyFor(className, context)).get();
  return cached.exists ? cached.data()!.questions : null;
}

export async function generateAndCache(
  uid: string,
  className: string,
  context?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<any[]> {
  const cacheKey = cacheKeyFor(className, context);
  const cached = await getCachedQuestions(className, context);
  if (cached) return cached;

  const questions = await generateWithGemini(uid, className, context, imageBase64, mimeType);

  await db.collection(COLLECTIONS.QUESTION_CACHE).doc(cacheKey).set({
    className,
    context: context || '',
    questions,
    questionCount: questions.length,
    createdAt: new Date().toISOString(),
    createdBy: uid,
  });

  return questions;
}

export async function getCriteria(): Promise<any[]> {
  const snap = await db.collection(COLLECTIONS.QUESTION_CACHE).get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return { className: d.className, questionCount: d.questionCount, context: d.context };
  });
}
