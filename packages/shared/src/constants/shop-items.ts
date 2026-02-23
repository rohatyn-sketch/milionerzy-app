import type { ShopTheme, ShopBackground, LifelineItem } from '../types/shop';

export const SHOP_THEMES: ShopTheme[] = [
  { id: 'gold', name: 'Zloty', price: 500000, cssClass: 'theme-gold', description: 'Elegancki zloty motyw' },
  { id: 'cosmic', name: 'Kosmiczny', price: 750000, cssClass: 'theme-cosmic', description: 'Motyw kosmosu z gwiazdami' },
  { id: 'neon', name: 'Neonowy', price: 1000000, cssClass: 'theme-neon', description: 'Jasny neonowy motyw' },
];

export const SHOP_BACKGROUNDS: ShopBackground[] = [
  { id: 'gradient1', name: 'Gradient 1', price: 200000, cssClass: 'bg-gradient1' },
  { id: 'gradient2', name: 'Gradient 2', price: 200000, cssClass: 'bg-gradient2' },
  { id: 'gradient3', name: 'Gradient 3', price: 200000, cssClass: 'bg-gradient3' },
  { id: 'gradient4', name: 'Gradient 4', price: 300000, cssClass: 'bg-gradient4' },
  { id: 'gradient5', name: 'Gradient 5', price: 300000, cssClass: 'bg-gradient5' },
  { id: 'gradient6', name: 'Gradient 6', price: 500000, cssClass: 'bg-gradient6' },
];

export const SHOP_LIFELINES: LifelineItem[] = [
  { id: 'fifty', name: '50:50', price: 100000, description: 'Usun 2 bledne odpowiedzi', icon: '✂️', type: 'fifty' },
  { id: 'skip', name: 'Pominięcie', price: 150000, description: 'Pomin pytanie', icon: '⏭️', type: 'skip' },
  { id: 'time', name: 'Dodatkowy czas', price: 75000, description: '+30 sekund', icon: '⏱️', type: 'time' },
];
