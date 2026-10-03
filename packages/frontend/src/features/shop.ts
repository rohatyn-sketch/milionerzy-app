import { storage } from '../state/storage';
import { THEMES, BACKGROUNDS, LIFELINE_ITEMS, formatMoney } from '@milionerzy/shared';
import { applyTheme } from '../ui/theme';
import { t } from './i18n';

let elements: {
  moneyAmount: HTMLElement | null;
  themesContainer: HTMLElement | null;
  backgroundsContainer: HTMLElement | null;
  lifelinesContainer: HTMLElement | null;
} = { moneyAmount: null, themesContainer: null, backgroundsContainer: null, lifelinesContainer: null };

function cacheElements() {
  elements = {
    moneyAmount: document.getElementById('money-amount'),
    themesContainer: document.getElementById('themes-container'),
    backgroundsContainer: document.getElementById('backgrounds-container'),
    lifelinesContainer: document.getElementById('lifelines-container'),
  };
}

function updateMoneyDisplay() {
  if (elements.moneyAmount) {
    elements.moneyAmount.textContent = formatMoney(storage.getMoney() || 0);
  }
}

function showMessage(text: string) {
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:20px;right:20px;background:var(--success-color);color:black;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:1000;animation:fadeIn 0.3s ease';
  msg.textContent = text;
  document.body.appendChild(msg);
  setTimeout(() => {
    msg.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => msg.remove(), 300);
  }, 2000);
}

function renderThemes() {
  const container = elements.themesContainer;
  if (!container) return;
  container.innerHTML = '';

  const activeTheme = storage.getActiveTheme();

  // Default theme
  const defaultItem = document.createElement('div');
  defaultItem.className = 'shop-item owned';
  defaultItem.innerHTML = `
    <h3 class="shop-item-name">${t('shop.defaultTheme', 'Domyslny motyw')}</h3>
    <p class="shop-item-desc">${t('shop.defaultThemeDesc', 'Klasyczny niebieski motyw Milionerzy.')}</p>
    <p class="shop-item-price">${t('shop.free', 'Darmowy')}</p>
    <button class="shop-item-btn ${activeTheme === 'default' || !activeTheme ? 'active' : 'activate'}">
      ${activeTheme === 'default' || !activeTheme ? t('shop.active', 'Aktywny') : t('shop.activate', 'Aktywuj')}
    </button>
  `;
  defaultItem.querySelector('button')!.addEventListener('click', () => {
    storage.setActiveTheme('default');
    applyTheme();
    render();
  });
  container.appendChild(defaultItem);

  THEMES.forEach(theme => {
    const owned = storage.hasTheme(theme.id);
    const isActive = activeTheme === theme.id;
    const money = storage.getMoney() || 0;

    const name = t(`theme.${theme.id}.name`, theme.name);
    const el = document.createElement('div');
    el.className = `shop-item ${owned ? 'owned' : ''}`;
    el.innerHTML = `
      <h3 class="shop-item-name">${name}</h3>
      <p class="shop-item-desc">${t(`theme.${theme.id}.desc`, theme.description)}</p>
      <p class="shop-item-price">${owned ? t('shop.owned', 'Posiadane') : formatMoney(theme.price)}</p>
      <button class="shop-item-btn ${owned ? (isActive ? 'active' : 'activate') : 'buy'}"
              ${!owned && money < theme.price ? 'disabled' : ''}>
        ${owned ? (isActive ? t('shop.active', 'Aktywny') : t('shop.activate', 'Aktywuj')) : t('shop.buy', 'Kup')}
      </button>
    `;
    el.querySelector('button')!.addEventListener('click', () => {
      if (isActive) return;
      if (owned) {
        storage.setActiveTheme(theme.id);
        applyTheme();
        render();
      } else if (money >= theme.price) {
        storage.setMoney(money - theme.price);
        storage.addTheme(theme.id);
        storage.setActiveTheme(theme.id);
        applyTheme();
        updateMoneyDisplay();
        render();
        showMessage(t('shop.boughtActivated', 'Kupiono i aktywowano: {name}', { name }));
      }
    });
    container.appendChild(el);
  });
}

function renderBackgrounds() {
  const container = elements.backgroundsContainer;
  if (!container) return;
  container.innerHTML = '';

  const activeBg = storage.getActiveBackground();

  const defaultItem = document.createElement('div');
  defaultItem.className = 'shop-item owned';
  defaultItem.innerHTML = `
    <h3 class="shop-item-name">${t('shop.defaultBg', 'Domyslne tlo')}</h3>
    <p class="shop-item-desc">${t('shop.defaultBgDesc', 'Klasyczne ciemne tlo gry Milionerzy.')}</p>
    <p class="shop-item-price">${t('shop.free', 'Darmowe')}</p>
    <button class="shop-item-btn ${activeBg === 'default' || !activeBg ? 'active' : 'activate'}">
      ${activeBg === 'default' || !activeBg ? t('shop.active', 'Aktywne') : t('shop.activate', 'Aktywuj')}
    </button>
  `;
  defaultItem.querySelector('button')!.addEventListener('click', () => {
    storage.setActiveBackground('default');
    applyTheme();
    render();
  });
  container.appendChild(defaultItem);

  BACKGROUNDS.forEach(bg => {
    const owned = storage.hasBackground(bg.id);
    const isActive = activeBg === bg.id;
    const money = storage.getMoney() || 0;

    const name = t(`bg.${bg.id}.name`, bg.name);
    const el = document.createElement('div');
    el.className = `shop-item ${owned ? 'owned' : ''}`;
    el.innerHTML = `
      <h3 class="shop-item-name">${name}</h3>
      <p class="shop-item-desc">${t(`bg.${bg.id}.desc`, bg.description || '')}</p>
      <p class="shop-item-price">${owned ? t('shop.owned', 'Posiadane') : formatMoney(bg.price)}</p>
      <button class="shop-item-btn ${owned ? (isActive ? 'active' : 'activate') : 'buy'}"
              ${!owned && money < bg.price ? 'disabled' : ''}>
        ${owned ? (isActive ? t('shop.active', 'Aktywne') : t('shop.activate', 'Aktywuj')) : t('shop.buy', 'Kup')}
      </button>
    `;
    el.querySelector('button')!.addEventListener('click', () => {
      if (isActive) return;
      if (owned) {
        storage.setActiveBackground(bg.id);
        applyTheme();
        render();
      } else if (money >= bg.price) {
        storage.setMoney(money - bg.price);
        storage.addBackground(bg.id);
        storage.setActiveBackground(bg.id);
        applyTheme();
        updateMoneyDisplay();
        render();
        showMessage(t('shop.boughtActivated', 'Kupiono i aktywowano: {name}', { name }));
      }
    });
    container.appendChild(el);
  });
}

function renderLifelines() {
  const container = elements.lifelinesContainer;
  if (!container) return;
  container.innerHTML = '';

  LIFELINE_ITEMS.forEach(ll => {
    const count = storage.getLifelineCount(ll.id as 'fifty' | 'skip' | 'time');
    const money = storage.getMoney() || 0;

    const name = t(`ll.${ll.id}.name`, ll.name);
    const el = document.createElement('div');
    el.className = 'shop-item';
    el.innerHTML = `
      <h3 class="shop-item-name">${name}</h3>
      <p class="shop-item-desc">${t(`ll.${ll.id}.desc`, ll.description)}</p>
      <p class="shop-item-price">${formatMoney(ll.price)}</p>
      <p style="color: var(--secondary-color); margin-bottom: 10px;">${t('shop.youHave', 'Posiadasz: {n}', { n: count })}</p>
      <button class="shop-item-btn buy" ${money < ll.price ? 'disabled' : ''}>${t('shop.buy', 'Kup')}</button>
    `;
    el.querySelector('button')!.addEventListener('click', () => {
      const m = storage.getMoney() || 0;
      if (m >= ll.price) {
        storage.setMoney(m - ll.price);
        storage.addLifeline(ll.id as 'fifty' | 'skip' | 'time', 1);
        updateMoneyDisplay();
        render();
        showMessage(t('shop.bought', 'Kupiono: {name}', { name }));
      }
    });
    container.appendChild(el);
  });
}

function render() {
  renderThemes();
  renderBackgrounds();
  renderLifelines();
}

export function initShop(): void {
  cacheElements();
  applyTheme();
  render();
  updateMoneyDisplay();
}
