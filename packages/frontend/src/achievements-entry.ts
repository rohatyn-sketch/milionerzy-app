// achievements-entry.ts - "Postepy" (Progress) page entry point: a tabbed
// dashboard with an overview, detailed statistics (accuracy + personal
// records), achievements and the full best-scores list. The file and URL keep
// their historical name (achievements.html) so existing links keep working.
import './css/style.css';
import { formatMoney } from '@milionerzy/shared';
import { storage } from './state/storage';
import { applyTheme } from './ui/theme';
import { mountAppShell } from './ui/app-shell';
import { renderFull as renderLeaderboard, getAll as getLeaderboard } from './features/leaderboard';
import { getAllWithStatus } from './features/achievements';
import { initI18n, t, localeTag } from './features/i18n';

document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  mountAppShell('progress');
  initI18n();
  applyTheme();
  renderStats();
  renderDetailedStats();
  renderAchievements();
  renderLeaderboard('leaderboard-full');
  initTabs();
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

// Detailed statistics tab: lifetime accuracy and personal records.
function renderDetailedStats(): void {
  const set = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  const answered = storage.getQuestionsAnswered() || 0;
  const correct = storage.getCorrectAnswers() || 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  set('stat-accuracy', answered > 0 ? `${accuracy}%` : '—');
  set('stat-answered', answered.toLocaleString(localeTag()));
  set('stat-correct', correct.toLocaleString(localeTag()));

  // Fill the ring (a conic-gradient driven by --pct).
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

// APG tabs: click to switch, arrow keys / Home / End to move focus between tabs.
function initTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab-list [role="tab"]'));
  if (tabs.length === 0) return;

  const select = (tab: HTMLButtonElement, focus = true): void => {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      t.classList.toggle('active', selected);
      const panel = document.getElementById(t.getAttribute('aria-controls') || '');
      if (panel) panel.hidden = !selected;
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        select(tabs[next]);
      }
    });
  });
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
