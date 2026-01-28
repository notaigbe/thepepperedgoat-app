import { useApp } from '@/contexts/AppContext';
import type { CartItem } from '@/contexts/AppContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import Dialog from '@/components/Dialog';
import { LinearGradient } from 'expo-linear-gradient';

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
    console.log('Quantity change:', itemId, change);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      updateCartQuantity(itemId, item.quantity + change);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    console.log('Removing item:', itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemToRemove(itemId);
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
    console.log('Proceeding to checkout');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cart.length === 0) {
      setDialogType('empty');
      setDialogVisible(true);
      return;
    }
    router.push('/checkout');
  };

  return (
    <View
      style={[styles.gradientContainer, { backgroundColor: currentColors.background }]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View
            style={[styles.header, { backgroundColor: currentColors.card, borderBottomColor: currentColors.border }]}
          >
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Shopping Cart</Text>
            <Text style={[styles.itemCount, { color: currentColors.textSecondary }]}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="cart.fill" size={80} color={currentColors.textSecondary} />
              <Text style={[styles.emptyText, { color: currentColors.text }]}>
                Your cart is empty
              </Text>
              <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
                Add some delicious items to get started!
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.browseButton,
                  { 
                    backgroundColor: currentColors.primary,
                    opacity: pressed ? 0.9 : 1,
                  }
                ]}
                onPress={() => router.push('/')}
              >
                <Text style={styles.browseButtonText}>
                  Browse Menu
                </Text>
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
                  <LinearGradient
                    key={item.id}
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.cartItem, { borderColor: currentColors.border }]}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.itemImage}
                      />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, { color: currentColors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemPrice, { color: currentColors.secondary }]}>
                        ${item.price.toFixed(2)}
                      </Text>
                      <View style={styles.quantityContainer}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.quantityButton,
                            { 
                              backgroundColor: currentColors.background,
                              borderColor: currentColors.border,
                              opacity: pressed ? 0.6 : 1,
                            }
                          ]}
                          onPress={() => handleQuantityChange(item.id, -1)}
                        >
                          <IconSymbol name="minus" size={14} color={currentColors.text} />
                        </Pressable>
                        <Text style={[styles.quantity, { color: currentColors.text }]}>{item.quantity}</Text>
                        <Pressable
                          style={({ pressed }) => [
                            styles.quantityButton,
                            { 
                              backgroundColor: currentColors.background,
                              borderColor: currentColors.border,
                              opacity: pressed ? 0.6 : 1,
                            }
                          ]}
                          onPress={() => handleQuantityChange(item.id, 1)}
                        >
                          <IconSymbol name="plus" size={14} color={currentColors.text} />
                        </Pressable>
                      </View>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.removeButton,
                        { opacity: pressed ? 0.5 : 1 }
                      ]}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <IconSymbol name="trash" size={20} color={currentColors.textSecondary} />
                    </Pressable>
                  </LinearGradient>
                ))}
              </ScrollView>

              {/* Summary */}
              <View
                style={[styles.summary, { backgroundColor: currentColors.card, borderTopColor: currentColors.border }]}
              >
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.summaryValue, { color: currentColors.text }]}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Tax (9.75%)</Text>
                  <Text style={[styles.summaryValue, { color: currentColors.text }]}>${tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: currentColors.border }]}>
                  <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: currentColors.primary }]}>${total.toFixed(2)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.checkoutButton,
                    { 
                      backgroundColor: currentColors.primary,
                      opacity: pressed ? 0.9 : 1,
                    }
                  ]}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutButtonText}>
                    Proceed to Checkout
                  </Text>
                  <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          )}
        </View>
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
                  {
                    text: 'Cancel',
                    onPress: () => setItemToRemove(null),
                    style: 'cancel',
                  },
                  {
                    text: 'Remove',
                    onPress: handleConfirmRemove,
                    style: 'destructive',
                  },
                ]
              : [
                  {
                    text: 'OK',
                    onPress: () => {},
                    style: 'default',
                  },
                ]
          }
          onHide={() => {
            setDialogVisible(false);
            setItemToRemove(null);
          }}
          currentColors={currentColors}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 0.2,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 2,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  browseButtonText: {
    fontSize: 15,
    fontFamily: 'Cormorant_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 0,
    padding: 12,
    marginBottom: 16,
    borderWidth: 0.2,
    elevation: 8,
  },
  imageContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0.2,
    elevation: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 0,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Cormorant_700Bold',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
    }),
  },
  quantity: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
    minWidth: 28,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'flex-start',
  },
  summary: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    borderTopWidth: 0.2,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Cormorant_600SemiBold',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 0.2,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Cormorant_700Bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 2,
    marginTop: 20,
    elevation: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  checkoutButtonText: {
    fontSize: 15,
    fontFamily: 'Cormorant_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});