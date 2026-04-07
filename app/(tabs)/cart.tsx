import { useApp } from '@/contexts/AppContext';
import type { CartItem } from '@/contexts/AppContext';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import Dialog from '@/components/Dialog';
import { blackGoldLight } from "@/styles/commonStyles";
import { getOrderingStatusFromSettings } from "@/utils/orderingHours";
import { storeSettingsService } from "@/services/supabaseService";
import type { StoreSettings } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";
// import swallowImage from '@/assets/images/swallow.jpeg';
// import soupImage from '@/assets/images/soup.jpg';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CartScreen() {
  const { cart, updateCartQuantity, removeFromCart, currentColors, menuItems, addToCart, menuCategories, userProfile } = useApp();

  const getCategoryKey = (categoryId: string | null) => {
    if (!categoryId) return '';
    return menuCategories.find(c => c.id === categoryId)?.key?.toLowerCase() ?? '';
  };
  const router = useRouter();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'remove' | 'empty' | 'signin' | 'closed'>('remove');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [orderingStatus, setOrderingStatus] = useState(() => getOrderingStatusFromSettings(null));
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  useEffect(() => {
    storeSettingsService.getSettings().then(({ data }) => { if (data) setStoreSettings(data); });
    const channel = supabase.channel("store-settings-cart")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new) setStoreSettings(payload.new as StoreSettings);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setOrderingStatus(getOrderingStatusFromSettings(storeSettings));
    const interval = setInterval(
      () => setOrderingStatus(getOrderingStatusFromSettings(storeSettings)),
      60_000,
    );
    return () => clearInterval(interval);
  }, [storeSettings]);
  const [swallowDrawerVisible, setSwallowDrawerVisible] = useState(false);
  const [soupDrawerVisible, setSoupDrawerVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const soupDrawerAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const swallows = menuItems.filter(item =>
    getCategoryKey(item.category_id).includes('swallow')
  );

  const soups = menuItems.filter(item =>
    getCategoryKey(item.category_id).includes('soup')
  );

  const openSwallowDrawer = () => {
    setSwallowDrawerVisible(true);
    Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
  };

  const closeSwallowDrawer = () => {
    Animated.timing(drawerAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => setSwallowDrawerVisible(false));
  };

  const openSoupDrawer = () => {
    setSoupDrawerVisible(true);
    Animated.spring(soupDrawerAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
  };

  const closeSoupDrawer = () => {
    Animated.timing(soupDrawerAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => setSoupDrawerVisible(false));
  };

  const soupQuantity = cart
    .filter(item => getCategoryKey(item.category_id).includes('soup'))
    .reduce((sum, item) => sum + item.quantity, 0);

  const swallowQuantity = cart
    .filter(item => getCategoryKey(item.category_id).includes('swallow'))
    .reduce((sum, item) => sum + item.quantity, 0);

  const showSwallowBadge = soupQuantity > 0 && swallowQuantity < soupQuantity;
  const showSoupBadge = swallowQuantity > 0 && soupQuantity < swallowQuantity;

  // const firstCartSoupImageUrl = cart.find(item => getCategoryKey(item.category_id).includes('soup'))?.image_url;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0975;
  const total = subtotal + tax;

  const handleQuantityChange = (itemId: string, change: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = cart.find((i) => i.id === itemId);
    if (item) updateCartQuantity(itemId, item.quantity + change);
  };

  const handleRemoveItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemToRemove(itemId);
    setDialogType('remove');
    setDialogVisible(true);
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      removeFromCart(itemToRemove);
      setItemToRemove(null);
    }
  };

  const handleCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cart.length === 0) {
      setDialogType('empty');
      setDialogVisible(true);
      return;
    }
    if (!orderingStatus.isOpen) {
      setDialogType('closed');
      setDialogVisible(true);
      return;
    }
    if (!userProfile) {
      setDialogType('signin');
      setDialogVisible(true);
      return;
    }
    router.push('/checkout');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Dark header — matches HomeScreen */}
      <LinearGradient
        colors={[blackGoldLight.GOLD, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <SafeAreaView style={{ backgroundColor: 'transparent' }} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <Text style={styles.itemCount}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="cart.fill" size={72} color="rgba(0,0,0,0.15)" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add some delicious items to get started!</Text>
          <Pressable style={styles.browseButton} onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>Browse Menu</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
          >
            {cart.map((item) => (
              <React.Fragment key={item.id}>
                <View style={{ position: 'relative', marginBottom: 24 }}>
                  <View style={[styles.cartItem, { marginBottom: 0 }]}>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: item.image_url ?? undefined }} style={styles.itemImage} />
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                      <View style={styles.quantityContainer}>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item.id, -1)}
                        >
                          <IconSymbol name="minus" size={14} color="#000000" />
                        </Pressable>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item.id, 1)}
                        >
                          <IconSymbol name="plus" size={14} color="#000000" />
                        </Pressable>
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.4 : 1 }]}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <IconSymbol name="trash" size={20} color="rgba(0,0,0,0.35)" />
                    </Pressable>
                  </View>

                  {/* Prompt to add a soup when a swallow is in the cart without a matching soup */}
                  {/* {getCategoryKey(item.category_id).includes('swallow') && showSoupBadge && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        openSoupDrawer();
                      }}
                      style={styles.pairingBadge}
                    >
                      <View style={styles.pairingBadgeInner}>
                        
                          <Image
                            source={ soupImage}
                            style={styles.pairingBadgeImage}
                          />

                        <Text style={styles.pairingBadgeText}>Add a Soup</Text>
                        <IconSymbol name="arrow.right" size={11} color="rgba(255,255,255,0.8)" />
                      </View>
                    </Pressable>
                  )} */}

                  {/* Prompt to add a swallow when a soup is in the cart without a matching swallow */}
                  {/* {getCategoryKey(item.category_id).includes('soup') && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        openSwallowDrawer();
                      }}
                      style={styles.pairingBadge}
                    >
                      <View style={styles.pairingBadgeInner}>
                        <Image
                          source={swallowImage}
                          style={styles.pairingBadgeImage}
                        />
                        <Text style={styles.pairingBadgeText}>Extra Swallow</Text>
                        <IconSymbol name="arrow.right" size={11} color="rgba(255,255,255,0.8)" />
                      </View>
                    </Pressable>
                  )} */}
                </View>
              </React.Fragment>
            ))}
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (9.75%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.checkoutButton, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </>
      )}

      {/* ── Swallow Drawer ─────────────────────────────────────────────────── */}
      {/* <Modal visible={swallowDrawerVisible} transparent animationType="none" onRequestClose={closeSwallowDrawer}>
        <Pressable style={styles.drawerBackdrop} onPress={closeSwallowDrawer} />
        <Animated.View style={[styles.drawer, { transform: [{ translateY: drawerAnim }] }]}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
            <Image source={swallowImage} style={styles.drawerHeaderImage} />
            <Text style={styles.drawerTitle}>Add extra Swallow</Text>
            <Pressable onPress={closeSwallowDrawer} style={styles.drawerClose}>
              <IconSymbol name="xmark" size={20} color="rgba(0,0,0,0.4)" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerList}>
            {swallows.length === 0 ? (
              <Text style={styles.drawerEmpty}>No swallows available</Text>
            ) : (
              swallows.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.drawerItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    addToCart({ ...item, quantity: 1 });
                    closeSwallowDrawer();
                  }}
                >
                  <Image source={{ uri: item.image_url }} style={styles.drawerItemImage} />
                  <View style={styles.drawerItemInfo}>
                    <Text style={styles.drawerItemName}>{item.name}</Text>
                    <Text style={styles.drawerItemDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={styles.drawerItemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <IconSymbol name="plus.circle.fill" size={28} color={blackGoldLight.GOLD} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Modal> */}

      {/* ── Soup Drawer ────────────────────────────────────────────────────── */}
      {/* <Modal visible={soupDrawerVisible} transparent animationType="none" onRequestClose={closeSoupDrawer}>
        <Pressable style={styles.drawerBackdrop} onPress={closeSoupDrawer} />
        <Animated.View style={[styles.drawer, { transform: [{ translateY: soupDrawerAnim }] }]}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
              <Image source={ soupImage } style={styles.drawerHeaderImage} />
            <Text style={styles.drawerTitle}>Add a Soup</Text>
            <Pressable onPress={closeSoupDrawer} style={styles.drawerClose}>
              <IconSymbol name="xmark" size={20} color="rgba(0,0,0,0.4)" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerList}>
            {soups.length === 0 ? (
              <Text style={styles.drawerEmpty}>No soups available</Text>
            ) : (
              soups.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.drawerItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    addToCart({ ...item, quantity: 1 });
                    closeSoupDrawer();
                  }}
                >
                  <Image source={{ uri: item.image_url }} style={styles.drawerItemImage} />
                  <View style={styles.drawerItemInfo}>
                    <Text style={styles.drawerItemName}>{item.name}</Text>
                    <Text style={styles.drawerItemDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={styles.drawerItemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <IconSymbol name="plus.circle.fill" size={28} color={blackGoldLight.GOLD} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Modal> */}

      <Dialog
        visible={dialogVisible}
        title={
          dialogType === 'remove' ? 'Remove Item' :
          dialogType === 'signin' ? 'Sign In Required' :
          dialogType === 'closed' ? 'Kitchen Closed' :
          'Empty Cart'
        }
        message={
          dialogType === 'remove'
            ? 'Are you sure you want to remove this item from your cart?'
            : dialogType === 'signin'
            ? 'You need to be signed in to proceed to checkout.'
            : dialogType === 'closed'
            ? orderingStatus.message
            : 'Please add items to your cart before checking out.'
        }
        buttons={
          dialogType === 'remove'
            ? [
                { text: 'Cancel', onPress: () => setItemToRemove(null), style: 'cancel' },
                { text: 'Remove', onPress: handleConfirmRemove, style: 'destructive' },
              ]
            : dialogType === 'signin'
            ? [
                { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/(tabs)/profile'), style: 'default' },
              ]
            : [{ text: 'OK', onPress: () => {}, style: 'default' }]
        }
        onHide={() => { setDialogVisible(false); setItemToRemove(null); }}
        currentColors={currentColors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: blackGoldLight.BODY_BG,
  },
  // ── Dark header ──────────────────────────────────────────────────────────
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  // ── Empty state ──────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 22,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#000000',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
    marginBottom: 28,
  },
  browseButton: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 36,
    backgroundColor: blackGoldLight.GOLD,
  },
  browseButtonText: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // ── Cart list ────────────────────────────────────────────────────────────
  cartList: { flex: 1 },
  cartListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  itemImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
    marginBottom: 4,
    lineHeight: 19,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_MID,
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
  },
  quantity: {
    fontSize: 16,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  // ── Pairing badge ────────────────────────────────────────────────────────
  pairingBadge: {
    position: 'absolute',
    bottom: -18,
    right: 12,
    zIndex: 10,
  },
  pairingBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
    elevation: 10,
  },
  pairingBadgeImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pairingBadgeText: {
    fontFamily: 'LibertinusSans_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // ── Summary ──────────────────────────────────────────────────────────────
  summary: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    borderTopWidth: 1,
    borderTopColor: blackGoldLight.BORDER_GOLD,
    shadowColor: blackGoldLight.INK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(0,0,0,0.5)',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: blackGoldLight.INK,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 36,
    marginTop: 20,
    backgroundColor: blackGoldLight.GOLD,
    shadowColor: blackGoldLight.INK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // ── Drawers ──────────────────────────────────────────────────────────────
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
  },
  drawerHeaderImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  drawerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },
  drawerClose: {
    padding: 4,
  },
  drawerList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  drawerEmpty: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    backgroundColor: blackGoldLight.BODY_BG,
    gap: 12,
  },
  drawerItemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  drawerItemInfo: {
    flex: 1,
    gap: 2,
  },
  drawerItemName: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },
  drawerItemDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(0,0,0,0.45)',
  },
  drawerItemPrice: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_MID,
    marginTop: 2,
  },
});