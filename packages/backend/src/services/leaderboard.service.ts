import { db } from '../config';
import { COLLECTIONS } from '../firestore/collections';

export async function getLeaderboard(limit = 10): Promise<any[]> {
  const snap = await db.collection(COLLECTIONS.LEADERBOARD).orderBy('score', 'desc').limit(limit).get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return { name: d.name, score: d.score, date: d.date };
  });
}

export async function submitScore(userId: string, name: string, score: number): Promise<void> {
  await db.collection(COLLECTIONS.LEADERBOARD).add({
    userId, name, score, date: new Date().toISOString(),
  });
}
