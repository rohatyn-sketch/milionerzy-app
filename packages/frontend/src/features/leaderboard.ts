import { storage } from '../state/storage';
import { formatMoney } from '@milionerzy/shared';

interface LocalEntry {
  name: string;
  score: number;
  date: string;
  id: number;
}

const MAX_ENTRIES = 10;

export function getAll(): LocalEntry[] {
  return storage.getLeaderboard() || [];
}

export function getTop(count = 3): LocalEntry[] {
  return getAll().slice(0, count);
}

export function addScore(score: number, name = 'Gracz'): number | null {
  const lb = getAll();
  const entry: LocalEntry = { name, score, date: new Date().toISOString(), id: Date.now() };
  lb.push(entry);
  lb.sort((a, b) => b.score - a.score);
  if (lb.length > MAX_ENTRIES) lb.length = MAX_ENTRIES;
  storage.setLeaderboard(lb);
  const idx = lb.findIndex(e => e.id === entry.id);
  return idx !== -1 ? idx + 1 : null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function renderFull(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const lb = getAll();
  if (lb.length === 0) {
    container.innerHTML = '<p class="leaderboard-empty">Brak wynikow. Zagraj, aby pojawic sie na tablicy!</p>';
    return;
  }

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  let html = '<div class="leaderboard-list">';
  lb.forEach((entry, i) => {
    html += `
      <div class="leaderboard-entry ${i < 3 ? 'top-3' : ''}">
        <span class="leaderboard-rank">${medals[i] || (i + 1)}</span>
        <span class="leaderboard-name">${entry.name}</span>
        <span class="leaderboard-score">${formatMoney(entry.score)}</span>
        <span class="leaderboard-date">${formatDate(entry.date)}</span>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

export function renderPreview(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const top3 = getTop(3);
  if (top3.length === 0) {
    container.innerHTML = '<p class="leaderboard-empty">Brak wynikow</p>';
    return;
  }

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  let html = '<div class="leaderboard-preview">';
  top3.forEach((entry, i) => {
    html += `
      <div class="leaderboard-preview-entry">
        <span class="leaderboard-medal">${medals[i]}</span>
        <span class="leaderboard-preview-score">${formatMoney(entry.score)}</span>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}
