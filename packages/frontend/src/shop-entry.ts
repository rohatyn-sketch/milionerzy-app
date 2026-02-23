// shop-entry.ts - Shop page entry point
import './css/style.css';
import { applyTheme } from './ui/theme';
import { initShop } from './features/shop';

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  initShop();
});
