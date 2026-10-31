// stats-entry.ts - the "Statystyki" (Statistics) page: a top-level destination
// (in the app bar next to Start / Postepy / Sklep) with the player's overview
// numbers, lifetime accuracy and personal records.
import './css/style.css';
import { formatMoney } from '@milionerzy/shared';
import { storage } from './state/storage';
import { applyTheme } from './ui/theme';
import { mountAppShell } from './ui/app-shell';
import { getAll as getLeaderboard } from './features/leaderboard';
import { initI18n, t, localeTag } from './features/i18n';

document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  mountAppShell('stats');
  initI18n();
  applyTheme();
  renderStats();
});

function renderStats(): void {
  const set = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  // Overview tiles
  set('money-amount', formatMoney(storage.getMoney() || 0));
  set('games-played', String(storage.getGamesPlayed() || 0));
  set('games-won', String(storage.getGamesWon() || 0));
  set('best-streak', String(storage.getBestStreak() || 0));

  // Accuracy
  const answered = storage.getQuestionsAnswered() || 0;
  const correct = storage.getCorrectAnswers() || 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  set('stat-accuracy', answered > 0 ? `${accuracy}%` : '—');
  set('stat-answered', answered.toLocaleString(localeTag()));
  set('stat-correct', correct.toLocaleString(localeTag()));

  const ring = document.getElementById('accuracy-ring');
  if (ring) ring.style.setProperty('--pct', String(answered > 0 ? accuracy : 0));

  const played = storage.getGamesPlayed() || 0;
  const won = storage.getGamesWon() || 0;
  set('stat-winrate', played > 0 ? `${Math.round((won / played) * 100)}%` : '—');

  // Personal records
  set('rec-streak', String(storage.getBestStreak() || 0));
  const fastest = storage.getFastestAnswer();
  set('rec-fastest', fastest !== null ? t('stats.seconds', '{s} s', { s: fastest.toFixed(1) }) : '—');
  set('rec-perfect', String(storage.getPerfectGames() || 0));

  const scores = getLeaderboard();
  const bestWin = scores.length > 0 ? Math.max(...scores.map(e => e.score)) : null;
  set('rec-bestwin', bestWin !== null ? formatMoney(bestWin) : '—');
}
