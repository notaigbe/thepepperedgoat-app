
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, placeOrder, userProfile } = useApp();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [usePoints, setUsePoints] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const pointsDiscount = usePoints ? Math.min(userProfile.points * 0.01, subtotal * 0.2) : 0;
  const total = subtotal + tax - pointsDiscount;
  const pointsToEarn = Math.floor(total);

  const handlePlaceOrder = () => {
    console.log('Placing order');
    
    if (!deliveryAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter a delivery address.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    placeOrder();
    
    Alert.alert(
      'Order Placed!',
      `Your order has been placed successfully! You earned ${pointsToEarn} points.`,
      [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/(home)/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your delivery address"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <TextInput
              style={styles.input}
              placeholder="Any special requests? (Optional)"
              placeholderTextColor={colors.textSecondary}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <Pressable style={styles.paymentOption}>
              <IconSymbol name="creditcard.fill" size={24} color={colors.primary} />
              <Text style={styles.paymentText}>Credit Card</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Pressable
              style={styles.pointsToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setUsePoints(!usePoints);
              }}
            >
              <View style={styles.pointsToggleLeft}>
                <IconSymbol name="star.fill" size={24} color={colors.highlight} />
                <View style={styles.pointsToggleInfo}>
                  <Text style={styles.pointsToggleTitle}>Use Reward Points</Text>
                  <Text style={styles.pointsToggleSubtitle}>
                    You have {userProfile.points} points available
                  </Text>
                </View>
              </View>
              <View style={[styles.checkbox, usePoints && styles.checkboxActive]}>
                {usePoints && <IconSymbol name="checkmark" size={16} color={colors.card} />}
              </View>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8.75%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            {usePoints && pointsDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.primary }]}>
                  Points Discount
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  -${pointsDiscount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.pointsEarnCard}>
              <IconSymbol name="star.fill" size={20} color={colors.highlight} />
              <Text style={styles.pointsEarnText}>
                You&apos;ll earn {pointsToEarn} points with this order!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderButtonText}>Place Order - ${total.toFixed(2)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  paymentOption: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  pointsToggle: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  pointsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pointsToggleInfo: {
    flex: 1,
  },
  pointsToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pointsToggleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.text,
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  pointsEarnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  pointsEarnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  placeOrderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
});
