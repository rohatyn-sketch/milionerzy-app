import { storage } from '../state/storage';
import { ACHIEVEMENTS } from '@milionerzy/shared';
import type { AchievementProgress } from '@milionerzy/shared';
import { playAchievement } from './sound';

interface AchievementStats {
  gamesWon: number;
  gamesPlayed: number;
  bestStreak: number;
  totalEarned: number;
  fastestAnswer: number;
  perfectGames: number;
  categoryCorrect: Record<string, number>;
  dailyChallengesCompleted: number;
  achievementsUnlocked: number;
  gamesWonNoLifelines: number;
}

type ConditionFn = (stats: AchievementStats) => boolean;

const CONDITIONS: Record<string, ConditionFn> = {
  first_win: (s) => s.gamesWon >= 1,
  streak_3: (s) => s.bestStreak >= 3,
  streak_5: (s) => s.bestStreak >= 5,
  streak_10: (s) => s.bestStreak >= 10,
  millionaire: (s) => s.totalEarned >= 1000000,
  speed_demon: (s) => s.fastestAnswer <= 5,
  perfect_game: (s) => s.perfectGames >= 1,
  master_density: (s) => (s.categoryCorrect['Gestosc'] || 0) >= 10,
  master_pressure: (s) => (s.categoryCorrect['Cisnienie'] || 0) >= 10,
  master_archimedes: (s) => (s.categoryCorrect['Archimedes'] || 0) >= 10,
  daily_champion: (s) => s.dailyChallengesCompleted >= 1,
  collector: (s) => s.achievementsUnlocked >= 5,
  no_lifelines: (s) => s.gamesWonNoLifelines >= 1,
};

function getUnlocked(): string[] {
  return storage.getAchievements() || [];
}

function isUnlocked(id: string): boolean {
  return getUnlocked().includes(id);
}

function getCurrentStats(): AchievementStats {
  return {
    gamesWon: storage.getGamesWon() || 0,
    gamesPlayed: storage.getGamesPlayed() || 0,
    bestStreak: storage.getBestStreak() || 0,
    totalEarned: storage.getTotalEarned() || 0,
    fastestAnswer: storage.getFastestAnswer() ?? Infinity,
    perfectGames: storage.getPerfectGames() || 0,
    categoryCorrect: storage.getCategoryStats() || {},
    dailyChallengesCompleted: storage.getDailyChallengesCompleted() || 0,
    achievementsUnlocked: (storage.getAchievements() || []).length,
    gamesWonNoLifelines: storage.getGamesWonNoLifelines() || 0,
  };
}

function unlock(id: string): boolean {
  if (isUnlocked(id)) return false;
  const list = getUnlocked();
  list.push(id);
  storage.setAchievements(list);

  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  if (achievement) {
    showNotification(achievement);
    playAchievement();
  }
  return true;
}

function showNotification(achievement: { icon: string; name: string; description: string }): void {
  const el = document.createElement('div');
  el.className = 'achievement-notification';
  el.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-info">
      <div class="achievement-title">Osiagniecie odblokowane!</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.description}</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 100);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 500);
  }, 4000);
}

export function checkAll(): void {
  const stats = getCurrentStats();
  ACHIEVEMENTS.forEach(a => {
    const condFn = CONDITIONS[a.id];
    if (condFn && !isUnlocked(a.id) && condFn(stats)) {
      unlock(a.id);
    }
  });
}

export function check(id: string): boolean {
  const condFn = CONDITIONS[id];
  if (!condFn || isUnlocked(id)) return false;
  const stats = getCurrentStats();
  if (condFn(stats)) { unlock(id); return true; }
  return false;
}

export function getProgress(id: string): AchievementProgress | null {
  const stats = getCurrentStats();
  switch (id) {
    case 'streak_3': return { current: stats.bestStreak, target: 3 };
    case 'streak_5': return { current: stats.bestStreak, target: 5 };
    case 'streak_10': return { current: stats.bestStreak, target: 10 };
    case 'millionaire': return { current: stats.totalEarned, target: 1000000 };
    case 'master_density': return { current: stats.categoryCorrect['Gestosc'] || 0, target: 10 };
    case 'master_pressure': return { current: stats.categoryCorrect['Cisnienie'] || 0, target: 10 };
    case 'master_archimedes': return { current: stats.categoryCorrect['Archimedes'] || 0, target: 10 };
    case 'collector': return { current: stats.achievementsUnlocked, target: 5 };
    default: return null;
  }
}

export function getAllWithStatus() {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: isUnlocked(a.id),
    progress: getProgress(a.id),
  }));
}
