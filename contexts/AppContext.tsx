import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { MenuItem, MenuCategory, CartItem, Order, UserProfile, PaymentMethod, AppNotification, ThemeSettings, ThemeMode, ColorScheme, MerchRedemption, UserRole } from '@/types';
import { useColorScheme } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import type { Database } from '@/app/integrations/supabase/types';
import { 
  userService, 
  menuService, 
  orderService, 
  notificationService,
  paymentMethodService
} from '@/services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ToastConfig {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  userProfile: UserProfile | null;
  loadUserProfile: () => Promise<void>;
  placeOrder: (deliveryAddress?: string, pickupNotes?: string) => Promise<void>;
  addPaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  updateProfileImage: (imageUri: string) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  addNotification: (notification: AppNotification) => void;
  updateThemeMode: (mode: ThemeMode) => Promise<void>;
  updateColorScheme: (scheme: ColorScheme) => Promise<void>;
  currentColors: any;
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  toast: ToastConfig;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  loadMenuItems: () => Promise<void>;
  menuCategories: MenuCategory[];
  loadMenuCategories: () => Promise<void>;
  getUnreadNotificationCount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const orderChannelRef = useRef<RealtimeChannel | null>(null);
  const [toast, setToast] = useState<ToastConfig>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorScheme: 'default',
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  const loadMenuItems = useCallback(async () => {
    try {
      console.log('Loading menu items from Supabase (AppContext)');
      const { data, error } = await menuService.getMenuItems();
      if (error) { console.error('Error loading menu items:', error); return; }
      if (data) {
        const items: MenuItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          category_id: item.category_id,
          image_url: item.image_url,
          spicy_level: item.spicy_level,
          sort_order: item.sort_order,
          tag: item.tag,
        }));
        setMenuItems(items);
        console.log('Loaded', items.length, 'menu items in context');
      }
    } catch (error) {
      console.error('Exception loading menu items:', error);
    }
  }, []);

  const loadMenuCategories = useCallback(async () => {
    try {
      console.log('Loading menu categories from Supabase (AppContext)');
      const { data, error } = await menuService.getMenuCategories();
      if (error) { console.error('Error loading menu categories:', error); return; }
      if (data) {
        const categories: MenuCategory[] = data.map((category: any) => ({
          id: category.id,
          key: category.key,
          title: category.title,
          description: category.description,
          sort_order: category.sort_order,
        }));
        setMenuCategories([{ id: 'all', key: 'all', title: 'All', sort_order: -1 }, ...categories]);
        console.log('Loaded', categories.length, 'menu categories in context');
      }
    } catch (error) {
      console.error('Exception loading menu categories:', error);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Loading user profile for:', user.id);
      const { data: profile, error } = await userService.getUserProfile(user.id);
      if (error) { console.error('Error loading user profile:', error); return; }
      if (!profile) {
        console.log('No profile found, creating default profile');
        await (supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            user_id: user.id,
            name: user.user_metadata?.name || 'User',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            points: 0,
            user_role: 'user',
          } as any) as unknown) as { data: Database['public']['Tables']['user_profiles']['Row'][] | null; error: any };
        return loadUserProfile();
      }
      const { data: orders } = await orderService.getOrderHistory(user.id);
      const { data: paymentMethods } = await paymentMethodService.getPaymentMethods(user.id);
      const { data: notifications } = await notificationService.getNotifications(user.id);

      const fullProfile: UserProfile = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        address: profile.address ?? undefined,
        points: profile.points || 0,
        profileImage: profile.profile_image ?? undefined,
        userRole: profile.user_role as UserRole,
        orders: orders?.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number || 0,
          items: o.order_items?.map((oi: any) => ({
            id: oi.menu_item_id || oi.id,
            name: oi.name,
            price: parseFloat(oi.price),
            quantity: oi.quantity,
            description: '',
            category: '',
            image: '',
          })) || [],
          total: parseFloat(o.total),
          pointsEarned: o.points_earned,
          date: o.created_at,
          status: o.status,
          deliveryAddress: o.delivery_address,
          pickupNotes: o.pickup_notes,
        })) || [],
        paymentMethods: paymentMethods?.map((pm: any) => ({
          id: pm.id,
          type: pm.type,
          cardNumber: pm.card_number,
          cardholderName: pm.cardholder_name,
          expiryDate: pm.expiry_date,
          isDefault: pm.is_default,
        })) || [],
        notifications: notifications?.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          date: n.created_at,
          read: n.read,
          actionUrl: n.action_url,
        })) || [],
      };

      setUserProfile(fullProfile);
      console.log('User profile loaded successfully');
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [user]);

  useEffect(() => {
    loadMenuItems();
    loadMenuCategories();
  }, [loadMenuItems, loadMenuCategories]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [isAuthenticated, user, loadUserProfile]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (orderChannelRef.current) {
        supabase.removeChannel(orderChannelRef.current);
        orderChannelRef.current = null;
      }
      return;
    }
    if ((orderChannelRef.current?.state as any) === 'subscribed') return;

    const setupRealtimeSubscription = async () => {
      console.log('Setting up real-time order subscription for user:', user.id);
      const channel = supabase.channel(`orders-${user.id}`);
      orderChannelRef.current = channel;
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
          console.log('New order created:', payload);
          showToast('New order placed!', 'success');
          loadUserProfile();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
          console.log('Order updated:', payload);
          const order = payload.new as any;
          showToast(`Order status updated to: ${order.status}`, 'info');
          loadUserProfile();
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
          console.log('Order deleted:', payload);
          loadUserProfile();
        })
        .subscribe((status, err) => {
          console.log('Order subscription status:', status);
          if (err) console.error('Order subscription error:', err);
        });
    };

    setupRealtimeSubscription();
    return () => {
      if (orderChannelRef.current) {
        console.log('Cleaning up order subscription');
        supabase.removeChannel(orderChannelRef.current);
        orderChannelRef.current = null;
      }
    };
  }, [isAuthenticated, user, loadUserProfile]);

  // ─────────────────────────────────────────────────────────────────────────
  // THEME — light body with dark header, black/white palette
  // ─────────────────────────────────────────────────────────────────────────
  const getCurrentColors = () => {
    // Black · Gold · Silver — unified scheme across all screens.
    // Dark near-black header / warm parchment body / burnished gold accents.
    return {
      // ── Page / body ──────────────────────────────────────────────────────
      background:        '#F8F6F1',        // warm parchment page background
      card:              '#FFFFFF',        // card / modal surfaces
      cardGradientStart: '#FFFFFF',
      cardGradientEnd:   '#FAFAF7',        // faintly warm card footer tint

      // ── Header (dark strip at top) ───────────────────────────────────────
      headerBackground:    '#0A0A0A',      // near-black base
      headerBorder:        'rgba(184,146,42,0.2)',   // gold hairline
      headerGradientStart: '#0A0A0A',
      headerGradientEnd:   '#111108',      // very dark warm black

      // ── Typography ───────────────────────────────────────────────────────
      text:            '#1A1612',                    // warm dark ink on light bg
      textSecondary:   '#6B6055',                    // warm mid-tone muted text
      textOnDark:      '#F5F5F0',                    // off-white on dark header
      textMutedOnDark: '#A8A8B0',                    // cool silver muted on dark

      // ── Interactive / accent ─────────────────────────────────────────────
      primary:   '#B8922A',   // burnished gold — CTAs, active states, badges
      secondary: '#1A1612',   // dark ink — secondary actions, ghost borders
      accent:    '#D4A83A',   // bright gold — highlights, gradient top stop

      // ── Borders & separators ─────────────────────────────────────────────
      border:       'rgba(184,146,42,0.22)',  // gold hairline — cards, inputs
      borderStrong: 'rgba(184,146,42,0.40)',  // stronger gold — active borders

      // ── Gradients (for screens that use LinearGradient on background) ────
      gradientStart: '#F8F6F1',   // warm parchment — flat body, all same
      gradientMid:   '#F8F6F1',
      gradientEnd:   '#F5F0E8',   // very slightly deeper warm at bottom

      // ── Misc ─────────────────────────────────────────────────────────────
      highlight: 'rgba(184,146,42,0.12)',   // subtle gold tint for active fills
    };
  };

  const currentColors = getCurrentColors();

  const setTabBarVisible = (visible: boolean) => {
    console.log('Setting tab bar visibility:', visible);
    setIsTabBarVisible(visible);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const addToCart = (item: CartItem) => {
    console.log('Adding to cart:', item.name);
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        showToast(`Updated ${item.name} quantity in cart`, 'success');
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      showToast(`${item.name} added to cart!`, 'success');
      return [...prevCart, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(itemId); return; }
    setCart((prevCart) =>
      prevCart.map((item) => item.id === itemId ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => { setCart([]); };

  const placeOrder = async (deliveryAddress?: string, pickupNotes?: string) => {
    if (!user || !userProfile) { showToast('Please sign in to place an order', 'error'); return; }
    try {
      const { data, error } = await orderService.placeOrder(user.id, cart, deliveryAddress, pickupNotes);
      if (error) { showToast('Failed to place order', 'error'); return; }
      showToast('Order placed successfully!', 'success');
      clearCart();
      await loadUserProfile();
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Failed to place order', 'error');
    }
  };

  const addPaymentMethod = async (paymentMethod: PaymentMethod) => {
    if (!user) { showToast('Please sign in to add payment methods', 'error'); return; }
    try {
      const { error } = await paymentMethodService.addPaymentMethod(user.id, paymentMethod);
      if (error) { showToast('Failed to add payment method', 'error'); return; }
      showToast('Payment method added successfully!', 'success');
      await loadUserProfile();
    } catch (error) {
      console.error('Error adding payment method:', error);
      showToast('Failed to add payment method', 'error');
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await paymentMethodService.removePaymentMethod(paymentMethodId);
      if (error) { showToast('Failed to remove payment method', 'error'); return; }
      showToast('Payment method removed successfully!', 'success');
      await loadUserProfile();
    } catch (error) {
      console.error('Error removing payment method:', error);
      showToast('Failed to remove payment method', 'error');
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!user) return;
    try {
      const { error } = await paymentMethodService.setDefaultPaymentMethod(user.id, paymentMethodId);
      if (error) { showToast('Failed to set default payment method', 'error'); return; }
      showToast('Default payment method updated!', 'success');
      await loadUserProfile();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      showToast('Failed to set default payment method', 'error');
    }
  };

  const updateProfileImage = (imageUri: string) => {
    if (userProfile) setUserProfile({ ...userProfile, profileImage: imageUri });
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await notificationService.markAsRead(notificationId);
      if (error) { console.error('Error marking notification as read:', error); return; }
      await loadUserProfile();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const addNotification = (notification: AppNotification) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, notifications: [notification, ...userProfile.notifications] });
    }
  };

  const updateThemeMode = async (mode: ThemeMode) => {
    setThemeSettings((prev) => ({ ...prev, mode }));
  };

  const updateColorScheme = async (scheme: ColorScheme) => {
    setThemeSettings((prev) => ({ ...prev, colorScheme: scheme }));
  };

  const getUnreadNotificationCount = () => {
    if (!userProfile?.notifications) return 0;
    return userProfile.notifications.filter(n => !n.read).length;
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
        loadUserProfile,
        placeOrder,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        updateProfileImage,
        markNotificationAsRead,
        addNotification,
        updateThemeMode,
        updateColorScheme,
        currentColors,
        isTabBarVisible,
        setTabBarVisible,
        toast,
        showToast,
        hideToast,
        menuItems,
        setMenuItems,
        loadMenuItems,
        menuCategories,
        loadMenuCategories,
        getUnreadNotificationCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export type { CartItem } from '@/types';