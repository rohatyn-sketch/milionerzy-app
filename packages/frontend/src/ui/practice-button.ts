import { storage } from '../state/storage';
import { t } from '../features/i18n';

// The "practice your mistakes" button only works when signed in and when there
// are wrong answers to revisit. The only explanation for its greyed-out state
// used to be a hover tooltip, which touch-screen and keyboard users never see.
// Now the reason is printed under the button (WCAG 3.3.2), and the link is
// properly disabled (no href + aria-disabled) instead of only looking disabled.
export function renderPracticeButton(loggedIn: boolean): void {
  const btn = document.getElementById('practice-btn') as HTMLAnchorElement | null;
  const count = document.getElementById('practice-count');
  const hint = document.getElementById('practice-hint');
  if (!btn || !count) return;

  const incorrect = loggedIn ? storage.getIncorrectCount() : 0;
  const enabled = loggedIn && incorrect > 0;

  count.textContent = incorrect > 0 ? String(incorrect) : '';
  count.hidden = incorrect === 0;
  btn.classList.toggle('disabled', !enabled);
  btn.title = '';
  if (enabled) {
    btn.setAttribute('href', 'game.html?practice=true');
    btn.removeAttribute('aria-disabled');
    btn.removeAttribute('role');
  } else {
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
    btn.setAttribute('role', 'link');
  }

  if (hint) {
    hint.textContent = !loggedIn
      ? t('practice.loginReq', 'Zaloguj sie, aby korzystac z trybu cwiczen')
      : incorrect === 0
        ? t('practice.empty', 'Pytania, na ktore odpowiesz zle, trafia tutaj do powtorki.')
        : '';
    hint.hidden = hint.textContent === '';
  }
}
