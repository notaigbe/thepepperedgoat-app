
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Order, UserProfile, GiftCard } from '@/types';

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  userProfile: UserProfile;
  placeOrder: () => void;
  purchaseGiftCard: (giftCard: GiftCard) => void;
  redeemMerch: (merchId: string, pointsCost: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '1',
    name: 'Guest User',
    email: 'guest@jagabansla.com',
    phone: '+1 (555) 123-4567',
    points: 1250,
    orders: [],
    giftCards: [],
  });

  const addToCart = (item: CartItem) => {
    console.log('Adding to cart:', item.name);
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    console.log('Removing from cart:', itemId);
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    console.log('Updating cart quantity:', itemId, quantity);
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCart([]);
  };

  const placeOrder = () => {
    console.log('Placing order');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const pointsEarned = Math.floor(total);
    
    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      pointsEarned,
      date: new Date().toISOString(),
      status: 'pending',
    };

    setUserProfile((prev) => ({
      ...prev,
      points: prev.points + pointsEarned,
      orders: [newOrder, ...prev.orders],
    }));

    clearCart();
  };

  const purchaseGiftCard = (giftCard: GiftCard) => {
    console.log('Purchasing gift card:', giftCard);
    setUserProfile((prev) => ({
      ...prev,
      giftCards: [...prev.giftCards, { ...giftCard, purchaseDate: new Date().toISOString() }],
    }));
  };

  const redeemMerch = (merchId: string, pointsCost: number) => {
    console.log('Redeeming merch:', merchId, pointsCost);
    if (userProfile.points >= pointsCost) {
      setUserProfile((prev) => ({
        ...prev,
        points: prev.points - pointsCost,
      }));
    }
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        userProfile,
        placeOrder,
        purchaseGiftCard,
        redeemMerch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
