export interface ShopTheme {
  id: string;
  name: string;
  price: number;
  cssClass: string;
  description: string;
}

export interface ShopBackground {
  id: string;
  name: string;
  price: number;
  cssClass: string;
  description?: string;
}

export interface LifelineItem {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  type: 'fifty' | 'skip' | 'time';
}
