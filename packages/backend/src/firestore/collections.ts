export const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  LEADERBOARD: 'leaderboard',
  QUESTION_CACHE: 'questionCache',
} as const;

export function userClassesPath(uid: string): string {
  return `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.CLASSES}`;
}
