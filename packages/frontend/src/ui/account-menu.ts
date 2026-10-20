import { t } from '../features/i18n';

// Signed-in account control for the top bar, following the common pattern
// (Google, YouTube, GitHub): a round avatar button that opens a small menu
// with the player's name and email and "Wyloguj". The name and logout used to
// sit in the bar itself, making it wide and out of line with the language
// button next to it.

export interface AccountUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

function initials(user: AccountUser): string {
  const source = (user.displayName || user.email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source[0];
  return letters.toUpperCase();
}

// Avatar image with an initials fallback (Google photos sometimes fail to load).
function avatar(user: AccountUser, className: string): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = `account-avatar ${className}`;
  wrap.setAttribute('aria-hidden', 'true');
  wrap.textContent = initials(user);
  if (user.photoURL) {
    const img = document.createElement('img');
    img.src = user.photoURL;
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('load', () => wrap.classList.add('has-photo'));
    img.addEventListener('error', () => img.remove());
    wrap.appendChild(img);
  }
  return wrap;
}

export function renderAccountMenu(container: HTMLElement, user: AccountUser, onLogout: () => void): void {
  container.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'account-menu';

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'account-btn';
  button.className = 'account-btn';
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'account-panel');
  const label = `${t('auth.account', 'Konto')}: ${user.displayName || user.email || ''}`.trim();
  button.setAttribute('aria-label', label);
  button.title = label;
  button.appendChild(avatar(user, 'account-avatar--button'));

  const panel = document.createElement('div');
  panel.id = 'account-panel';
  panel.className = 'account-panel';
  panel.setAttribute('role', 'menu');
  panel.setAttribute('aria-labelledby', 'account-btn');
  panel.hidden = true;

  const head = document.createElement('div');
  head.className = 'account-panel-head';
  head.appendChild(avatar(user, 'account-avatar--panel'));
  const who = document.createElement('div');
  who.className = 'account-who';
  const name = document.createElement('div');
  name.className = 'account-name';
  name.textContent = user.displayName || '';
  const email = document.createElement('div');
  email.className = 'account-email';
  email.textContent = user.email || '';
  who.append(name, email);
  head.appendChild(who);

  const logout = document.createElement('button');
  logout.type = 'button';
  logout.id = 'logout-btn';
  logout.className = 'account-item';
  logout.setAttribute('role', 'menuitem');
  logout.textContent = t('auth.logout', 'Wyloguj');
  logout.addEventListener('click', () => onLogout());

  panel.append(head, logout);
  root.append(button, panel);
  container.appendChild(root);

  const close = (refocus: boolean): void => {
    if (panel.hidden) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
    if (refocus) button.focus();
  };
  const onOutside = (e: MouseEvent): void => {
    if (!root.contains(e.target as Node)) close(false);
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  button.addEventListener('click', () => {
    if (!panel.hidden) {
      close(false);
      return;
    }
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    logout.focus();
    document.addEventListener('click', onOutside, true);
    document.addEventListener('keydown', onKey, true);
  });
}
