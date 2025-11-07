
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Order, UserProfile, GiftCard, PaymentMethod, AppNotification } from '@/types';

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
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  removePaymentMethod: (paymentMethodId: string) => void;
  setDefaultPaymentMethod: (paymentMethodId: string) => void;
  updateProfileImage: (imageUri: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  addNotification: (notification: AppNotification) => void;
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
    paymentMethods: [],
    notifications: [
      {
        id: '1',
        title: 'Welcome to Jagabans LA!',
        message: 'Start earning points with every purchase. Check out our menu!',
        type: 'general',
        date: new Date().toISOString(),
        read: false,
      },
    ],
    rsvpEvents: [],
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

    const orderNotification: AppNotification = {
      id: Date.now().toString(),
      title: 'Order Placed Successfully!',
      message: `Your order of $${total.toFixed(2)} has been placed. You earned ${pointsEarned} points!`,
      type: 'order',
      date: new Date().toISOString(),
      read: false,
    };

    addNotification(orderNotification);
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

  const addPaymentMethod = (paymentMethod: PaymentMethod) => {
    console.log('Adding payment method');
    setUserProfile((prev) => {
      const isFirstCard = prev.paymentMethods.length === 0;
      const newPaymentMethod = { ...paymentMethod, isDefault: isFirstCard };
      return {
        ...prev,
        paymentMethods: [...prev.paymentMethods, newPaymentMethod],
      };
    });
  };

  const removePaymentMethod = (paymentMethodId: string) => {
    console.log('Removing payment method:', paymentMethodId);
    setUserProfile((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== paymentMethodId),
    }));
  };

  const setDefaultPaymentMethod = (paymentMethodId: string) => {
    console.log('Setting default payment method:', paymentMethodId);
    setUserProfile((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === paymentMethodId,
      })),
    }));
  };

  const updateProfileImage = (imageUri: string) => {
    console.log('Updating profile image');
    setUserProfile((prev) => ({
      ...prev,
      profileImage: imageUri,
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    setUserProfile((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
    }));
  };

  const addNotification = (notification: AppNotification) => {
    console.log('Adding notification:', notification.title);
    setUserProfile((prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
    }));
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
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        updateProfileImage,
        markNotificationAsRead,
        addNotification,
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
