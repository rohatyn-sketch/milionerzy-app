import { storage } from '../state/storage';
import {
  getStreakMultiplier,
  getFireEmoji,
  isNewMultiplierLevel,
} from '@milionerzy/shared';

let currentStreak = 0;

export function initStreak(): void { currentStreak = 0; }
export function resetStreak(): void { currentStreak = 0; }

export function incrementStreak(): number {
  currentStreak++;
  checkBestStreak();
  return currentStreak;
}

export function getCurrent(): number { return currentStreak; }
export function getMultiplier(): number { return getStreakMultiplier(currentStreak); }
export function getFireDisplay(): string { return getFireEmoji(currentStreak); }
export function isNewLevel(): boolean { return isNewMultiplierLevel(currentStreak); }

function checkBestStreak(): boolean {
  const best = storage.getBestStreak() || 0;
  if (currentStreak > best) {
    storage.setBestStreak(currentStreak);
    return true;
  }
  return false;
}

export function getDisplayInfo() {
  return {
    streak: currentStreak,
    multiplier: getMultiplier(),
    fire: getFireDisplay(),
    isActive: currentStreak >= 3,
  };
}
