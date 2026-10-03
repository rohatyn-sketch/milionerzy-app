// shop-entry.ts - Shop page entry point
import './css/style.css';
import { applyTheme } from './ui/theme';
import { initShop } from './features/shop';
import { initI18n } from './features/i18n';

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  applyTheme();
  initShop();
});
