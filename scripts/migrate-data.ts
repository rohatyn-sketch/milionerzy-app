/**
 * One-time migration script: data/users.json + data/cache.json → Firestore
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts --project <project-id>
 *
 * Requires:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *   - Original data files at ../aaa/data/users.json and ../aaa/data/cache.json
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectId = process.argv.find((_, i, arr) => arr[i - 1] === '--project') || process.env.GCP_PROJECT_ID;

if (!projectId) {
  console.error('Usage: npx tsx scripts/migrate-data.ts --project <project-id>');
  process.exit(1);
}

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const app = credPath
  ? initializeApp({ credential: cert(JSON.parse(readFileSync(credPath, 'utf-8')) as ServiceAccount) })
  : initializeApp({ projectId });

const db = getFirestore(app);

const ORIGINAL_DATA_DIR = resolve(__dirname, '../../aaa/data');

interface OriginalUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture: string;
  money: number;
  totalEarned: number;
  gamesPlayed: number;
  gamesWon: number;
  bestStreak: number;
  perfectGames: number;
  gamesWonNoLifelines: number;
  categoryStats: Record<string, number>;
  fastestAnswer: number | null;
  dailyChallengesCompleted: number;
  dailyCompleted: string | null;
  achievements: string[];
  ownedThemes: string[];
  ownedBackgrounds: string[];
  activeTheme: string;
  activeBackground: string;
  lifelines: { fifty: number; skip: number; time: number };
  soundSfx: boolean;
  soundMusic: boolean;
  classes?: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    questionCount: number;
    context?: string;
    generatedAt?: string;
    questions: unknown[];
  }>;
  activeClassId?: string;
  incorrectQuestions?: Record<string, number[]>;
  createdAt?: string;
  lastLogin?: string;
}

interface CacheEntry {
  className: string;
  context: string;
  questions: unknown[];
  questionCount: number;
  createdAt: string;
  createdBy: string;
}

async function migrateUsers() {
  const usersPath = resolve(ORIGINAL_DATA_DIR, 'users.json');
  if (!existsSync(usersPath)) {
    console.log('No users.json found, skipping user migration.');
    return 0;
  }

  const raw = readFileSync(usersPath, 'utf-8');
  const users: OriginalUser[] = JSON.parse(raw);
  console.log(`Found ${users.length} users to migrate.`);

  const batch = db.batch();
  let count = 0;

  for (const user of users) {
    const uid = user.googleId || user.id;
    const userRef = db.collection('users').doc(uid);

    batch.set(userRef, {
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt ? Timestamp.fromDate(new Date(user.createdAt)) : Timestamp.now(),
      lastLogin: user.lastLogin ? Timestamp.fromDate(new Date(user.lastLogin)) : Timestamp.now(),
      preferences: {
        activeTheme: user.activeTheme || 'default',
        activeBackground: user.activeBackground || 'default',
        soundSfx: user.soundSfx ?? true,
        soundMusic: user.soundMusic ?? false,
        ownedThemes: user.ownedThemes || ['default'],
        ownedBackgrounds: user.ownedBackgrounds || ['default'],
      },
      progress: {
        money: user.money || 0,
        totalEarned: user.totalEarned || 0,
        gamesPlayed: user.gamesPlayed || 0,
        gamesWon: user.gamesWon || 0,
        bestStreak: user.bestStreak || 0,
        perfectGames: user.perfectGames || 0,
        gamesWonNoLifelines: user.gamesWonNoLifelines || 0,
        categoryStats: user.categoryStats || {},
        fastestAnswer: user.fastestAnswer ?? null,
        dailyChallengesCompleted: user.dailyChallengesCompleted || 0,
        dailyCompleted: user.dailyCompleted || null,
      },
      lifelines: user.lifelines || { fifty: 0, skip: 0, time: 0 },
      achievements: user.achievements || [],
      activeClassId: user.activeClassId || 'default',
      incorrectQuestions: user.incorrectQuestions || {},
    });

    // Migrate classes as subcollection
    if (user.classes && user.classes.length > 0) {
      for (const cls of user.classes) {
        const classRef = userRef.collection('classes').doc(cls.id);
        batch.set(classRef, {
          name: cls.name,
          isDefault: cls.isDefault,
          questionCount: cls.questionCount,
          context: cls.context || '',
          generatedAt: cls.generatedAt ? Timestamp.fromDate(new Date(cls.generatedAt)) : null,
          questions: cls.questions || [],
        });
      }
    }

    count++;
  }

  await batch.commit();
  console.log(`Migrated ${count} users to Firestore.`);
  return count;
}

async function migrateCache() {
  const cachePath = resolve(ORIGINAL_DATA_DIR, 'cache.json');
  if (!existsSync(cachePath)) {
    console.log('No cache.json found, skipping cache migration.');
    return 0;
  }

  const raw = readFileSync(cachePath, 'utf-8');
  const cache: Record<string, CacheEntry> = JSON.parse(raw);
  const keys = Object.keys(cache);
  console.log(`Found ${keys.length} cache entries to migrate.`);

  const batch = db.batch();
  let count = 0;

  for (const [key, entry] of Object.entries(cache)) {
    const ref = db.collection('questionCache').doc(key);
    batch.set(ref, {
      className: entry.className,
      context: entry.context,
      questions: entry.questions,
      questionCount: entry.questionCount,
      createdAt: entry.createdAt ? Timestamp.fromDate(new Date(entry.createdAt)) : Timestamp.now(),
      createdBy: entry.createdBy || 'migration',
    });
    count++;
  }

  await batch.commit();
  console.log(`Migrated ${count} cache entries to Firestore.`);
  return count;
}

async function main() {
  console.log('Starting Milionerzy data migration to Firestore...');
  console.log(`Project: ${projectId}`);
  console.log(`Source: ${ORIGINAL_DATA_DIR}\n`);

  const userCount = await migrateUsers();
  const cacheCount = await migrateCache();

  console.log(`\nMigration complete: ${userCount} users, ${cacheCount} cache entries.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
