// app-shell.ts - the persistent app bar + primary navigation.
//
// Every top-level page (Start, Postepy, Sklep) shares one bar: brand, the
// three destinations, the wallet balance, the language switch and (on Start)
// sign-in. Wide screens show the destinations in the top bar; phones get them
// as a bottom tab bar (3 visible tabs, never a hamburger menu), where thumbs
// reach them.
//
// The game screen deliberately does NOT use the shell: a quiz round is a
// focused mode with a single "end game" exit.

import { formatMoney } from '@milionerzy/shared';
import { storage } from '../state/storage';
import { t } from '../features/i18n';
import { icon, type IconName } from './icons';

export type ShellPage = 'home' | 'progress' | 'shop';

interface NavItem {
  page: ShellPage;
  href: string;
  icon: IconName;
  key: string;
  pl: string;
}

const NAV: NavItem[] = [
  { page: 'home', href: 'index.html', icon: 'house', key: 'nav.home', pl: 'Start' },
  // The Progress page keeps its historical URL so old links keep working.
  { page: 'progress', href: 'achievements.html', icon: 'trophy', key: 'nav.progress', pl: 'Postepy' },
  { page: 'shop', href: 'shop.html', icon: 'storefront', key: 'nav.shop', pl: 'Sklep' },
];

/** Event fired by storage.setMoney so every money readout stays in sync. */
export const MONEY_EVENT = 'edufiszka:money';

export function mountAppShell(page: ShellPage): void {
  const bar = document.getElementById('app-bar');
  if (!bar || bar.dataset.mounted) return;
  bar.dataset.mounted = 'true';
  document.documentElement.dataset.page = page;

  const links = NAV.map((item) => {
    const current = item.page === page ? ' aria-current="page"' : '';
    return `<li><a class="app-nav-link" href="${item.href}"${current}>${icon(item.icon)}<span>${t(item.key, item.pl)}</span></a></li>`;
  }).join('');

  bar.innerHTML = `
    <div class="app-bar-inner">
      <a class="app-bar-brand" href="index.html">EduFiszka</a>
      <nav class="app-nav" aria-label="${t('nav.label', 'Nawigacja glowna')}">
        <ul class="app-nav-list">${links}</ul>
      </nav>
      <div class="app-bar-actions" id="app-bar-actions">
        <a class="wallet-chip" id="wallet-chip" href="shop.html">
          ${icon('coins', 20)}<span id="wallet-amount"></span>
        </a>
        ${page === 'home' ? '<div class="auth-area" id="auth-area"></div>' : ''}
      </div>
    </div>
  `;

  refreshWallet();
  window.addEventListener(MONEY_EVENT, refreshWallet);
  // Another tab (e.g. a finished game) may change the balance.
  window.addEventListener('storage', refreshWallet);
}

export function refreshWallet(): void {
  const amount = document.getElementById('wallet-amount');
  const chip = document.getElementById('wallet-chip');
  if (!amount || !chip) return;
  const money = formatMoney(storage.getMoney() || 0);
  amount.textContent = money;
  const label = t('wallet.label', 'Portfel: {money}', { money });
  chip.setAttribute('aria-label', label);
  chip.title = label;
}
