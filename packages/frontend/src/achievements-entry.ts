// achievements-entry.ts - "Postepy" (Progress) page entry point: stats,
// achievements and the full best-scores list. The file and URL keep their
// historical name (achievements.html) so existing links keep working.
import './css/style.css';
import { formatMoney } from '@milionerzy/shared';
import { storage } from './state/storage';
import { applyTheme } from './ui/theme';
import { mountAppShell } from './ui/app-shell';
import { renderFull as renderLeaderboard } from './features/leaderboard';
import { getAllWithStatus } from './features/achievements';
import { initI18n, t } from './features/i18n';

document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  mountAppShell('progress');
  initI18n();
  applyTheme();
  renderStats();
  renderAchievements();
  renderLeaderboard('leaderboard-full');
});

function renderStats(): void {
  const set = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set('money-amount', formatMoney(storage.getMoney() || 0));
  set('games-played', String(storage.getGamesPlayed() || 0));
  set('games-won', String(storage.getGamesWon() || 0));
  set('best-streak', String(storage.getBestStreak() || 0));
}

function renderAchievements(): void {
  const grid = document.getElementById('achievements-grid');
  const countEl = document.getElementById('achievements-count');
  const totalEl = document.getElementById('achievements-total');
  if (!grid) return;

  const allAchievements = getAllWithStatus();
  const unlockedCount = allAchievements.filter(a => a.unlocked).length;

  if (countEl) countEl.textContent = String(unlockedCount);
  if (totalEl) totalEl.textContent = String(allAchievements.length);

  grid.innerHTML = '';

  allAchievements.forEach(achievement => {
    const card = document.createElement('li');
    card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

    let progressHtml = '';
    const prog = achievement.progress;
    if (!achievement.unlocked && prog) {
      const percent = Math.min(100, (prog.current / prog.target) * 100);
      progressHtml = `
        <div class="achievement-progress">
          <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${prog.target}" aria-valuenow="${prog.current}" aria-label="${t(`ach.${achievement.id}.name`, achievement.name)}">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
          <span class="progress-text">${prog.current} / ${prog.target}</span>
        </div>
      `;
    }

    // Locked/unlocked used to be shown only by opacity and an icon swap; say
    // it in text too (WCAG 1.4.1: don't rely on colour/appearance alone).
    const status = achievement.unlocked
      ? t('ach.statusUnlocked', 'Odblokowane')
      : t('ach.statusLocked', 'Zablokowane');

    card.innerHTML = `
      <div class="achievement-icon" aria-hidden="true">${achievement.unlocked ? achievement.icon : '&#128274;'}</div>
      <div class="achievement-info">
        <h3 class="achievement-name">${t(`ach.${achievement.id}.name`, achievement.name)}</h3>
        <p class="achievement-description">${t(`ach.${achievement.id}.desc`, achievement.description)}</p>
        <p class="achievement-status">${status}</p>
        ${progressHtml}
      </div>
    `;

    grid.appendChild(card);
  });
}
