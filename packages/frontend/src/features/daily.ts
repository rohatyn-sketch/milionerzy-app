import { storage } from '../state/storage';
import { getDailySeed, seededRandom, DAILY_QUESTIONS_COUNT, DAILY_MONEY_MULTIPLIER } from '@milionerzy/shared';
import type { Question } from '@milionerzy/shared';

export { DAILY_MONEY_MULTIPLIER };

function getTodayString(): string {
  const t = new Date();
  return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
}

export function getDailyQuestions(questions: Question[]): Question[] {
  const seed = getDailySeed();
  const rng = seededRandom(seed);
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, DAILY_QUESTIONS_COUNT);
}

export function isCompletedToday(): boolean {
  const last = storage.getDailyCompleted();
  return last === getTodayString();
}

export function markCompleted(): void {
  storage.setDailyCompleted(getTodayString());
  storage.incrementDailyChallengesCompleted();
}

export function getTimeUntilReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    total: diff,
  };
}

export function formatTimeUntilReset(): string {
  const t = getTimeUntilReset();
  return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}:${String(t.seconds).padStart(2, '0')}`;
}

export function getStatus() {
  const completed = isCompletedToday();
  return {
    completed,
    available: !completed,
    questionsCount: DAILY_QUESTIONS_COUNT,
    multiplier: DAILY_MONEY_MULTIPLIER,
    timeFormatted: formatTimeUntilReset(),
  };
}

export function startCountdown(elementId: string): ReturnType<typeof setInterval> | null {
  const el = document.getElementById(elementId);
  if (!el) return null;
  const update = () => { el.textContent = formatTimeUntilReset(); };
  update();
  return setInterval(update, 1000);
}
