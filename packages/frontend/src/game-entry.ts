// game-entry.ts - Game page entry point
import './css/style.css';
import { storage } from './state/storage';
import { applyTheme } from './ui/theme';
import { initSound } from './features/sound';
import { loadCachedQuestions } from './features/questions';
import { initGame } from './game/game';
import { initKeyboard } from './features/keyboard';

document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  applyTheme();
  initSound();
  loadCachedQuestions();
  initGame();
  initKeyboard();
});
