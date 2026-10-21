// shop-entry.ts - Shop page entry point
import './css/style.css';
import { applyTheme } from './ui/theme';
import { initShop } from './features/shop';
import { initI18n } from './features/i18n';
import { mountAppShell } from './ui/app-shell';
import { storage } from './state/storage';

document.addEventListener('DOMContentLoaded', () => {
  storage.init();
  // The shell must exist before i18n (the language switch goes in its bar).
  mountAppShell('shop');
  initI18n();
  applyTheme();
  initShop();
});
