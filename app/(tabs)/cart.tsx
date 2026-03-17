import { useApp } from '@/contexts/AppContext';
import type { CartItem } from '@/contexts/AppContext';
import React, { useState } from 'react';
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
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import Dialog from '@/components/Dialog';
import { blackGoldLight } from "@/styles/commonStyles";

export default function CartScreen() {
  const { cart, updateCartQuantity, removeFromCart, currentColors } = useApp();
  const router = useRouter();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'remove' | 'empty'>('remove');
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

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
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
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

      <Dialog
        visible={dialogVisible}
        title={dialogType === 'remove' ? 'Remove Item' : 'Empty Cart'}
        message={
          dialogType === 'remove'
            ? 'Are you sure you want to remove this item from your cart?'
            : 'Please add items to your cart before checking out.'
        }
        buttons={
          dialogType === 'remove'
            ? [
                { text: 'Cancel', onPress: () => setItemToRemove(null), style: 'cancel' },
                { text: 'Remove', onPress: handleConfirmRemove, style: 'destructive' },
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
    marginBottom: 12,
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
});