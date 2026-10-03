// game-entry.ts - Game page entry point
import './css/style.css';
import { storage } from './state/storage';
import { applyTheme } from './ui/theme';
import { initSound } from './features/sound';
import { loadCachedQuestions } from './features/questions';
import { initGame } from './game/game';
import { initKeyboard } from './features/keyboard';
import { initAuth, waitForAuth } from './auth/auth';
import { initI18n } from './features/i18n';

document.addEventListener('DOMContentLoaded', async () => {
  storage.init();
  initI18n();
  initAuth({ skipRestore: true });
  applyTheme();
  initSound('game');
  loadCachedQuestions();
  await waitForAuth();
  initGame();
  initKeyboard();
});
