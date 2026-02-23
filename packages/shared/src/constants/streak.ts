export interface StreakTier {
  threshold: number;
  multiplier: number;
}

export const STREAK_TIERS: StreakTier[] = [
  { threshold: 0, multiplier: 1.0 },
  { threshold: 3, multiplier: 2.0 },
  { threshold: 5, multiplier: 3.0 },
  { threshold: 7, multiplier: 4.0 },
  { threshold: 10, multiplier: 5.0 },
];

export function getStreakMultiplier(streak: number): number {
  let multiplier = 1.0;
  for (const tier of STREAK_TIERS) {
    if (streak >= tier.threshold) {
      multiplier = tier.multiplier;
    }
  }
  return multiplier;
}

export function getFireEmoji(streak: number): string {
  if (streak >= 10) return '\u{1F525}\u{1F525}\u{1F525}';
  if (streak >= 7) return '\u{1F525}\u{1F525}';
  if (streak >= 3) return '\u{1F525}';
  return '';
}

export function isNewMultiplierLevel(streak: number): boolean {
  return STREAK_TIERS.some(t => t.threshold === streak && streak > 0);
}
