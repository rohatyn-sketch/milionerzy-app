import { storage } from '../state/storage';

export function applyTheme(): void {
  const theme = storage.getActiveTheme();
  const background = storage.getActiveBackground();

  document.body.className = '';
  if (theme && theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }
  if (background && background !== 'default') {
    document.body.classList.add(`bg-${background}`);
  }

  const stars = document.querySelector('.stars') as HTMLElement | null;
  if (stars) {
    stars.style.display = theme === 'cosmic' ? 'block' : 'none';
  }
}
