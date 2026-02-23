// game-entry.ts - Game page entry point
import './css/style.css';
import { applyTheme } from './ui/theme';
import { initSound } from './features/sound';
import { loadCachedQuestions } from './features/questions';
import { initGame } from './game/game';
import { initKeyboard } from './features/keyboard';

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  initSound();
  loadCachedQuestions();
  initGame();
  initKeyboard();
});
