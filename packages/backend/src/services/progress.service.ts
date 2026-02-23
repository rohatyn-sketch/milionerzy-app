import { db } from '../config';
import { COLLECTIONS, userClassesPath } from '../firestore/collections';

export async function getProgress(uid: string): Promise<any> {
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  if (!userDoc.exists) throw new Error('User not found');

  const userData = userDoc.data()!;
  const classesSnap = await db.collection(userClassesPath(uid)).get();
  const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return {
    progress: userData.progress || {},
    preferences: userData.preferences || {},
    lifelines: userData.lifelines || { fifty: 0, skip: 0, time: 0 },
    achievements: userData.achievements || [],
    activeClassId: userData.activeClassId || 'default_fizyka7',
    classes,
    incorrectQuestions: userData.incorrectQuestions || {},
  };
}

export async function saveProgress(uid: string, data: any): Promise<void> {
  const ref = db.collection(COLLECTIONS.USERS).doc(uid);
  const update: any = {};
  if (data.progress) update.progress = data.progress;
  if (data.preferences) update.preferences = data.preferences;
  if (data.lifelines) update.lifelines = data.lifelines;
  if (data.achievements) update.achievements = data.achievements;
  if (data.activeClassId) update.activeClassId = data.activeClassId;
  if (data.incorrectQuestions) update.incorrectQuestions = data.incorrectQuestions;
  await ref.update(update);
}
