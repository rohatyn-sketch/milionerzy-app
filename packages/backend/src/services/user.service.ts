import { db } from '../config';
import { COLLECTIONS } from '../firestore/collections';

export async function getUser(uid: string): Promise<any | null> {
  const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  return doc.exists ? doc.data() : null;
}

export async function createOrUpdateUser(uid: string, profile: any): Promise<void> {
  const ref = db.collection(COLLECTIONS.USERS).doc(uid);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.update({ ...profile, lastLogin: new Date().toISOString() });
  } else {
    await ref.set({
      ...profile,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      preferences: {
        activeTheme: 'default',
        activeBackground: 'default',
        soundSfx: true,
        soundMusic: true,
        ownedThemes: [],
        ownedBackgrounds: [],
      },
      progress: {
        money: 0, totalEarned: 0, gamesPlayed: 0, gamesWon: 0,
        bestStreak: 0, perfectGames: 0, gamesWonNoLifelines: 0,
        categoryStats: {}, fastestAnswer: null,
        dailyChallengesCompleted: 0, dailyCompleted: null,
      },
      lifelines: { fifty: 0, skip: 0, time: 0 },
      achievements: [],
      activeClassId: 'default_fizyka7',
      incorrectQuestions: {},
    });
  }
}
