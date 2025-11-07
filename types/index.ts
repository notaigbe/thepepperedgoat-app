
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  pointsEarned: number;
  date: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
}

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  inStock: boolean;
}

export interface GiftCard {
  id: string;
  amount: number;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  purchaseDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  orders: Order[];
  giftCards: GiftCard[];
}
