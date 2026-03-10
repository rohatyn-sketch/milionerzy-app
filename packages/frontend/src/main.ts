// main.ts - Menu glowne entry point
import './css/style.css';
import { formatMoney } from '@milionerzy/shared';
import { storage } from './state/storage';
import { applyTheme } from './ui/theme';
import { renderClassCards } from './ui/class-selector';
import { setupSetupPanel, setupImageUpload, setupGenerateButton } from './ui/setup-panel';
import { initAuth, isLoggedIn } from './auth/auth';
import { initSound, isSfxEnabled, isMusicEnabled, toggleSfx, toggleMusic } from './features/sound';
import { getStatus as getDailyStatus, startCountdown as startDailyCountdown } from './features/daily';
import { renderPreview as renderLeaderboardPreview } from './features/leaderboard';
import { loadCachedQuestions, loadQuestionsForClass } from './features/questions';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  initAuth();
  initSound();
  loadCachedQuestions();

  updateMoneyDisplay();
  updateStatsDisplay();
  updatePracticeButton();
  applyTheme();
  setupFormulasModal();
  setupCodeInput();
  setupSoundToggles();
  setupDailyChallenge();
  setupLeaderboardPreview();

  setupSetupPanel();
  setupImageUpload();
  setupGenerateButton(onClassUpdate);
  updateSubtitle();
  updateFormulasVisibility();

  renderClassCards(onClassUpdate);
});

function onClassUpdate(): void {
  updateSubtitle();
  updateFormulasVisibility();
  updatePracticeButton();
  updateMoneyDisplay();
}

function updateMoneyDisplay(): void {
  const el = document.getElementById('money-amount');
  if (el) el.textContent = formatMoney(storage.getMoney() || 0);
}

function updateStatsDisplay(): void {
  const gp = document.getElementById('games-played');
  const gw = document.getElementById('games-won');
  const bs = document.getElementById('best-streak');
  if (gp) gp.textContent = String(storage.getGamesPlayed());
  if (gw) gw.textContent = String(storage.getGamesWon());
  if (bs) bs.textContent = String(storage.getBestStreak());
}

function updatePracticeButton(): void {
  const btn = document.getElementById('practice-btn') as HTMLAnchorElement | null;
  const count = document.getElementById('practice-count');
  if (!btn || !count) return;

  if (!isLoggedIn()) {
    count.textContent = '(0)';
    btn.classList.add('disabled');
    btn.title = 'Zaloguj sie, aby korzystac z trybu cwiczen';
    return;
  }

  btn.title = '';
  const incorrectCount = storage.getIncorrectCount();
  if (incorrectCount > 0) {
    count.textContent = `(${incorrectCount})`;
    btn.classList.remove('disabled');
  } else {
    count.textContent = '(0)';
    btn.classList.add('disabled');
  }
}

function setupFormulasModal(): void {
  const btn = document.getElementById('formulas-btn');
  const modal = document.getElementById('formulas-modal');
  const close = document.getElementById('formulas-close');
  if (!btn || !modal) return;

  btn.addEventListener('click', () => modal.classList.add('active'));
  close?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) modal.classList.remove('active');
  });
}

function setupCodeInput(): void {
  const input = document.getElementById('code-input') as HTMLInputElement | null;
  const btn = document.getElementById('code-btn');
  const msg = document.getElementById('code-message');
  if (!btn || !input || !msg) return;

  btn.addEventListener('click', () => {
    const code = input.value.trim();
    if (code === 'Markot') {
      storage.setMoney((storage.getMoney() || 0) + 1000000);
      updateMoneyDisplay();
      msg.style.color = '#4CAF50';
      msg.textContent = 'Kod poprawny! Otrzymujesz 1 000 000 PLN!';
      input.value = '';
    } else {
      msg.style.color = '#f44336';
      msg.textContent = 'Niepoprawny kod!';
    }
    setTimeout(() => { msg.textContent = ''; }, 3000);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

function setupSoundToggles(): void {
  const sfxToggle = document.getElementById('sfx-toggle');
  const musicToggle = document.getElementById('music-toggle');

  if (sfxToggle) {
    const sfxOn = isSfxEnabled();
    sfxToggle.textContent = sfxOn ? 'SFX: ON' : 'SFX: OFF';
    sfxToggle.classList.toggle('active', sfxOn);
    sfxToggle.addEventListener('click', () => {
      const enabled = toggleSfx();
      sfxToggle.textContent = enabled ? 'SFX: ON' : 'SFX: OFF';
      sfxToggle.classList.toggle('active', enabled);
    });
  }

  if (musicToggle) {
    const musicOn = isMusicEnabled();
    musicToggle.textContent = musicOn ? 'Muzyka: ON' : 'Muzyka: OFF';
    musicToggle.classList.toggle('active', musicOn);
    musicToggle.addEventListener('click', () => {
      const enabled = toggleMusic();
      musicToggle.textContent = enabled ? 'Muzyka: ON' : 'Muzyka: OFF';
      musicToggle.classList.toggle('active', enabled);
    });
  }
}

function setupDailyChallenge(): void {
  const section = document.getElementById('daily-section');
  const dailyBtn = document.getElementById('daily-btn') as HTMLAnchorElement | null;
  const countdown = document.getElementById('daily-countdown');
  const statusEl = document.getElementById('daily-status');
  if (!section) return;

  const status = getDailyStatus();

  if (status.completed) {
    if (dailyBtn) { dailyBtn.classList.add('disabled'); dailyBtn.textContent = 'Ukonczone!'; }
    if (statusEl) statusEl.textContent = 'Wyzwanie ukonczone! Nastepne za:';
    if (countdown) startDailyCountdown('daily-countdown');
  } else {
    if (dailyBtn) {
      dailyBtn.classList.remove('disabled');
      dailyBtn.textContent = `Zagraj (${status.questionsCount} pytan)`;
      dailyBtn.href = 'game.html?daily=true';
    }
    if (statusEl) statusEl.innerHTML = `Bonus: <span class="bonus">x${status.multiplier} PLN</span>`;
    if (countdown) countdown.textContent = '';
  }
}

function setupLeaderboardPreview(): void {
  renderLeaderboardPreview('leaderboard-preview');
}

function updateSubtitle(): void {
  const el = document.getElementById('subtitle-text');
  if (!el) return;
  el.textContent = 'Wybierz klase i graj!';
}

function updateFormulasVisibility(): void {
  const btn = document.getElementById('formulas-btn');
  if (!btn) return;
  btn.style.display = storage.getActiveClass() === 'default_fizyka7' ? '' : 'none';
}
