import { storage } from '../state/storage';
import { THEMES, BACKGROUNDS, LIFELINE_ITEMS, formatMoney } from '@milionerzy/shared';
import { applyTheme } from '../ui/theme';

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
    <h3 class="shop-item-name">Domyslny motyw</h3>
    <p class="shop-item-desc">Klasyczny niebieski motyw Milionerzy.</p>
    <p class="shop-item-price">Darmowy</p>
    <button class="shop-item-btn ${activeTheme === 'default' || !activeTheme ? 'active' : 'activate'}">
      ${activeTheme === 'default' || !activeTheme ? 'Aktywny' : 'Aktywuj'}
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

    const el = document.createElement('div');
    el.className = `shop-item ${owned ? 'owned' : ''}`;
    el.innerHTML = `
      <h3 class="shop-item-name">${theme.name}</h3>
      <p class="shop-item-desc">${theme.description}</p>
      <p class="shop-item-price">${owned ? 'Posiadane' : formatMoney(theme.price)}</p>
      <button class="shop-item-btn ${owned ? (isActive ? 'active' : 'activate') : 'buy'}"
              ${!owned && money < theme.price ? 'disabled' : ''}>
        ${owned ? (isActive ? 'Aktywny' : 'Aktywuj') : 'Kup'}
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
        showMessage(`Kupiono i aktywowano: ${theme.name}`);
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
    <h3 class="shop-item-name">Domyslne tlo</h3>
    <p class="shop-item-desc">Klasyczne ciemne tlo gry Milionerzy.</p>
    <p class="shop-item-price">Darmowe</p>
    <button class="shop-item-btn ${activeBg === 'default' || !activeBg ? 'active' : 'activate'}">
      ${activeBg === 'default' || !activeBg ? 'Aktywne' : 'Aktywuj'}
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

    const el = document.createElement('div');
    el.className = `shop-item ${owned ? 'owned' : ''}`;
    el.innerHTML = `
      <h3 class="shop-item-name">${bg.name}</h3>
      <p class="shop-item-desc">${bg.description}</p>
      <p class="shop-item-price">${owned ? 'Posiadane' : formatMoney(bg.price)}</p>
      <button class="shop-item-btn ${owned ? (isActive ? 'active' : 'activate') : 'buy'}"
              ${!owned && money < bg.price ? 'disabled' : ''}>
        ${owned ? (isActive ? 'Aktywne' : 'Aktywuj') : 'Kup'}
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
        showMessage(`Kupiono i aktywowano: ${bg.name}`);
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

    const el = document.createElement('div');
    el.className = 'shop-item';
    el.innerHTML = `
      <h3 class="shop-item-name">${ll.name}</h3>
      <p class="shop-item-desc">${ll.description}</p>
      <p class="shop-item-price">${formatMoney(ll.price)}</p>
      <p style="color: var(--secondary-color); margin-bottom: 10px;">Posiadasz: ${count}</p>
      <button class="shop-item-btn buy" ${money < ll.price ? 'disabled' : ''}>Kup</button>
    `;
    el.querySelector('button')!.addEventListener('click', () => {
      const m = storage.getMoney() || 0;
      if (m >= ll.price) {
        storage.setMoney(m - ll.price);
        storage.addLifeline(ll.id as 'fifty' | 'skip' | 'time', 1);
        updateMoneyDisplay();
        render();
        showMessage(`Kupiono: ${ll.name}`);
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
