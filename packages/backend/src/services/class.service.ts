import { db } from '../config';
import { COLLECTIONS, userClassesPath } from '../firestore/collections';
import { Timestamp } from 'firebase-admin/firestore';

export interface ClassData {
  name: string;
  isDefault: boolean;
  questionCount: number;
  context?: string;
  generatedAt?: string;
  questions: unknown[];
}

export async function getClasses(uid: string) {
  const snapshot = await db.collection(userClassesPath(uid)).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getClass(uid: string, classId: string) {
  const doc = await db.collection(userClassesPath(uid)).doc(classId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createClass(uid: string, classId: string, data: ClassData) {
  await db.collection(userClassesPath(uid)).doc(classId).set({
    name: data.name,
    isDefault: data.isDefault,
    questionCount: data.questionCount,
    context: data.context || '',
    generatedAt: data.generatedAt ? Timestamp.fromDate(new Date(data.generatedAt)) : null,
    questions: data.questions,
  });
}

export async function updateClassQuestions(uid: string, classId: string, questions: unknown[]) {
  await db.collection(userClassesPath(uid)).doc(classId).update({
    questions,
    questionCount: questions.length,
    generatedAt: Timestamp.now(),
  });
}

export async function deleteClass(uid: string, classId: string) {
  await db.collection(userClassesPath(uid)).doc(classId).delete();
}
