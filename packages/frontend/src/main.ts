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
import { loadCachedQuestions, loadQuestionsForClass, getQuestions } from './features/questions';
import { isFirstTimePlayer, startMenuOnboarding } from './features/onboarding';
import { initI18n, t } from './features/i18n';
import { renderPracticeButton } from './ui/practice-button';
import { setupDialog, openDialog } from './ui/dialog';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  initI18n();
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
  setupQuestionCount();
  updateSubtitle();
  updateFormulasVisibility();

  renderClassCards(onClassUpdate);

  // First-time players get a guided tour of the menu, then of their first game.
  if (isFirstTimePlayer()) {
    requestAnimationFrame(() => startMenuOnboarding());
  }
});

function onClassUpdate(): void {
  updateSubtitle();
  updateFormulasVisibility();
  updatePracticeButton();
  updateMoneyDisplay();
  updateQuestionCountSlider();
}

const QUESTION_COUNT_MIN = 5;

// Wire the "how many questions per game" slider. The max follows the active
// class's available questions; the chosen value is stored and read by the game.
function setupQuestionCount(): void {
  const slider = document.getElementById('question-count-slider') as HTMLInputElement | null;
  if (!slider) return;

  slider.addEventListener('input', () => {
    storage.setQuestionCount(parseInt(slider.value, 10));
    updateQuestionCountValue();
  });

  updateQuestionCountSlider();
}

function updateQuestionCountSlider(): void {
  const slider = document.getElementById('question-count-slider') as HTMLInputElement | null;
  const control = document.getElementById('question-count-control');
  if (!slider || !control) return;

  const available = getQuestions().length;
  // Nothing to choose from (shouldn't happen with the bundled set), hide it.
  if (available <= QUESTION_COUNT_MIN) {
    control.style.display = 'none';
    return;
  }
  control.style.display = '';

  const min = QUESTION_COUNT_MIN;
  const max = available;
  slider.min = String(min);
  slider.max = String(max);

  // Default to the full set (preserves the original "play everything" behaviour)
  // until the player picks a number; always clamp into the current range.
  const stored = storage.getQuestionCount();
  const value = Math.min(max, Math.max(min, stored ?? max));
  slider.value = String(value);
  updateQuestionCountValue();
}

function updateQuestionCountValue(): void {
  const slider = document.getElementById('question-count-slider') as HTMLInputElement | null;
  const valueEl = document.getElementById('question-count-value');
  if (slider && valueEl) valueEl.textContent = slider.value;
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
  renderPracticeButton(isLoggedIn());
}

function setupFormulasModal(): void {
  const btn = document.getElementById('formulas-btn');
  const modal = document.getElementById('formulas-modal');
  if (!btn || !modal) return;

  // Dialog behaviour (focus in/out, Tab trap, Esc, backdrop) lives in ui/dialog.ts.
  setupDialog(modal, document.getElementById('formulas-close'));
  btn.addEventListener('click', () => openDialog(modal));
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
      msg.style.color = 'var(--success-color)';
      msg.textContent = t('code.ok', 'Kod poprawny! Otrzymujesz 1 000 000 PLN!');
      input.value = '';
    } else {
      msg.style.color = 'var(--error-color)';
      msg.textContent = t('code.bad', 'Niepoprawny kod!');
    }
    setTimeout(() => { msg.textContent = ''; }, 3000);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

function setupSoundToggles(): void {
  // Each toggle shows its state as text and exposes it as aria-pressed.
  const bind = (
    el: HTMLElement | null,
    isOn: () => boolean,
    toggle: () => boolean,
    label: (on: boolean) => string,
  ) => {
    if (!el) return;
    const paint = (on: boolean) => {
      el.textContent = label(on);
      el.classList.toggle('active', on);
      el.setAttribute('aria-pressed', String(on));
    };
    paint(isOn());
    el.addEventListener('click', () => paint(toggle()));
  };

  bind(document.getElementById('sfx-toggle'), isSfxEnabled, toggleSfx,
    (on) => (on ? t('sfx.on', 'SFX: ON') : t('sfx.off', 'SFX: OFF')));
  bind(document.getElementById('music-toggle'), isMusicEnabled, toggleMusic,
    (on) => (on ? t('music.on', 'Muzyka: ON') : t('music.off', 'Muzyka: OFF')));
}

function setupDailyChallenge(): void {
  const section = document.getElementById('daily-section');
  const dailyBtn = document.getElementById('daily-btn') as HTMLAnchorElement | null;
  const countdown = document.getElementById('daily-countdown');
  const statusEl = document.getElementById('daily-status');
  if (!section) return;

  const status = getDailyStatus();

  if (status.completed) {
    if (dailyBtn) {
      dailyBtn.classList.add('disabled');
      dailyBtn.textContent = t('daily.done', 'Ukonczone!');
      // Really disabled, not just greyed out: no href, announced as disabled.
      dailyBtn.removeAttribute('href');
      dailyBtn.setAttribute('aria-disabled', 'true');
      dailyBtn.setAttribute('role', 'link');
    }
    if (statusEl) statusEl.textContent = t('daily.completedMsg', 'Wyzwanie ukonczone! Nastepne za:');
    if (countdown) startDailyCountdown('daily-countdown');
  } else {
    if (dailyBtn) {
      dailyBtn.classList.remove('disabled');
      dailyBtn.textContent = t('daily.playN', 'Zagraj ({n} pytan)', { n: status.questionsCount });
      dailyBtn.href = 'game.html?daily=true';
    }
    if (statusEl) statusEl.innerHTML = `${t('daily.bonus', 'Bonus:')} <span class="bonus">x${status.multiplier} PLN</span>`;
    if (countdown) countdown.textContent = '';
  }
}

function setupLeaderboardPreview(): void {
  renderLeaderboardPreview('leaderboard-preview');
}

function updateSubtitle(): void {
  const el = document.getElementById('subtitle-text');
  if (!el) return;
  el.textContent = t('menu.subtitle', 'Wybierz klase i graj!');
}

function updateFormulasVisibility(): void {
  const btn = document.getElementById('formulas-btn');
  if (!btn) return;
  btn.style.display = storage.getActiveClass() === 'default_fizyka7' ? '' : 'none';
}
