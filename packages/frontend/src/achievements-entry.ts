// achievements-entry.ts - Achievements page entry point
import './css/style.css';
import { ACHIEVEMENTS } from '@milionerzy/shared';
import { applyTheme } from './ui/theme';
import { storage } from './state/storage';
import { getAllWithStatus } from './features/achievements';

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  renderAchievements();
});

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
    const card = document.createElement('div');
    card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

    let progressHtml = '';
    const prog = achievement.progress;
    if (!achievement.unlocked && prog) {
      const percent = Math.min(100, (prog.current / prog.target) * 100);
      progressHtml = `
        <div class="achievement-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
          <span class="progress-text">${prog.current} / ${prog.target}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '&#128274;'}</div>
      <div class="achievement-info">
        <h3 class="achievement-name">${achievement.name}</h3>
        <p class="achievement-description">${achievement.description}</p>
        ${progressHtml}
      </div>
    `;

    grid.appendChild(card);
  });
}
