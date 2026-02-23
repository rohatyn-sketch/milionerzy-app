import { db } from '../config';
import { COLLECTIONS } from '../firestore/collections';
import { generateWithGemini } from './gemini.service';

export async function generateAndCache(
  uid: string,
  className: string,
  context?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<any[]> {
  const cacheKey = `${className}_${context || ''}`.replace(/\s+/g, '_').toLowerCase();
  const cached = await db.collection(COLLECTIONS.QUESTION_CACHE).doc(cacheKey).get();

  if (cached.exists) {
    return cached.data()!.questions;
  }

  const questions = await generateWithGemini(className, context, imageBase64, mimeType);

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
