import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import { LinearGradient } from 'expo-linear-gradient';
import { blackGoldLight } from '@/styles/commonStyles';

// ─── Semantic status colours ──────────────────────────────────────────
const SUCCESS_GREEN = "#2E7D52";
const ERROR_RED     = "#C0392B";
const WARN_AMBER    = "#C07A10";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  id: string;
  total: number;
  points_earned: number;
  status: string;
  payment_status: string;
  delivery_address: string | null;
  pickup_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { currentColors, setTabBarVisible, loadUserProfile } = useApp();

  const [order, setOrder]   = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (!orderId) { setError('No order ID provided'); setLoading(false); return; }
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true); setError(null);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`id, total, points_earned, status, payment_status,
                 delivery_address, pickup_notes, created_at,
                 order_items (id, name, price, quantity)`)
        .eq('id', orderId)
        .single();
      if (fetchError) throw new Error('Failed to load order details');
      if (!data) throw new Error('Order not found');
      setOrder(data as OrderDetails);
      await loadUserProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':  return SUCCESS_GREEN;
      case 'processing': return WARN_AMBER;
      case 'pending':    return blackGoldLight.GOLD;
      case 'failed':     return ERROR_RED;
      default:           return blackGoldLight.INK_MID;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':  return 'checkmark.circle.fill';
      case 'processing': return 'hourglass';
      case 'pending':    return 'clock.fill';
      case 'failed':     return 'xmark.circle.fill';
      default:           return 'info.circle.fill';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':  return 'Payment Successful';
      case 'processing': return 'Processing Payment';
      case 'pending':    return 'Payment Pending';
      case 'failed':     return 'Payment Failed';
      default:           return 'Unknown Status';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending':   return 'Order Received';
      case 'preparing': return 'Preparing Your Order';
      case 'ready':     return 'Order Ready';
      case 'completed': return 'Order Completed';
      case 'cancelled': return 'Order Cancelled';
      default:          return status;
    }
  };

  // ─── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient
        colors={[blackGoldLight.BODY_BG, blackGoldLight.BODY_BG, "#F5F0E8"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.centreContainer}>
            <ActivityIndicator size="large" color={blackGoldLight.GOLD} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────
  if (error || !order) {
    return (
      <LinearGradient
        colors={[blackGoldLight.BODY_BG, blackGoldLight.BODY_BG, "#F5F0E8"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.centreContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={64} color={blackGoldLight.GOLD} />
            <Text style={styles.errorTitle}>Unable to Load Order</Text>
            <Text style={styles.errorText}>
              {error || "We couldn't find your order details. Please try again."}
            </Text>
            <LinearGradient
              colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Pressable
                style={styles.primaryButtonInner}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace('/(tabs)/(home)');
                }}
              >
                <Text style={styles.primaryButtonText}>Go to Home</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const isDelivery       = !!order.delivery_address;
  const paymentSuccessful = order.payment_status === 'succeeded';

  return (
    <LinearGradient
      colors={[blackGoldLight.BODY_BG, blackGoldLight.BODY_BG, "#F5F0E8"]}
      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Success header ── */}
          <View style={styles.successHeader}>
            <LinearGradient
              colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.successIconContainer}
            >
              <IconSymbol
                name={getStatusIcon(order.payment_status)}
                size={50}
                color={blackGoldLight.INK_WHITE}
              />
            </LinearGradient>
            <Text style={styles.successTitle}>
              {paymentSuccessful ? 'Order Confirmed!' : getStatusText(order.payment_status)}
            </Text>
            <Text style={styles.successSubtitle}>
              {paymentSuccessful
                ? `Your ${isDelivery ? 'delivery' : 'pickup'} order has been confirmed and is being prepared.`
                : "We're processing your order. You'll receive a notification once it's confirmed."}
            </Text>
          </View>

          {/* ── Order ID pill ── */}
          <View style={styles.orderIdCard}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>{order.id.substring(0, 8).toUpperCase()}</Text>
          </View>

          {/* ── Payment status ── */}
          <LinearGradient
            colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.statusRow}>
              <IconSymbol name={getStatusIcon(order.payment_status)} size={32} color={getStatusColor(order.payment_status)} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Payment Status</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(order.payment_status) }]}>
                  {getStatusText(order.payment_status)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Order status ── */}
          <LinearGradient
            colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.statusRow}>
              <IconSymbol name="bag.fill" size={32} color={blackGoldLight.GOLD} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Order Status</Text>
                <Text style={styles.statusValue}>{getOrderStatusText(order.status)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Points earned ── */}
          {paymentSuccessful && order.points_earned > 0 && (
            <LinearGradient
              colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.card, styles.pointsCard]}
            >
              <LinearGradient
                colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.pointsIconContainer}
              >
                <IconSymbol name="star.fill" size={28} color={blackGoldLight.INK_WHITE} />
              </LinearGradient>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsTitle}>Points Earned</Text>
                <Text style={styles.pointsValue}>+{order.points_earned} points</Text>
              </View>
            </LinearGradient>
          )}

          {/* ── Order summary ── */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <LinearGradient
            colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {order.order_items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.orderItem,
                  index === order.order_items.length - 1 && styles.orderItemLast,
                ]}
              >
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}

            {/* Fading gold divider */}
            <LinearGradient
              colors={['transparent', blackGoldLight.BORDER_GOLD, blackGoldLight.BORDER_GOLD, 'transparent']}
              locations={[0, 0.15, 0.85, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 1, marginTop: 12, marginBottom: 12 }}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </LinearGradient>

          {/* ── Delivery / pickup info ── */}
          {isDelivery ? (
            <LinearGradient
              colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.deliveryHeader}>
                <IconSymbol name="location.fill" size={20} color={blackGoldLight.GOLD} />
                <Text style={styles.deliveryTitle}>Delivery Address</Text>
              </View>
              <Text style={styles.deliveryText}>{order.delivery_address}</Text>
            </LinearGradient>
          ) : order.pickup_notes ? (
            <LinearGradient
              colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.deliveryHeader}>
                <IconSymbol name="bag.fill" size={20} color={blackGoldLight.GOLD} />
                <Text style={styles.deliveryTitle}>Pickup Notes</Text>
              </View>
              <Text style={styles.deliveryText}>{order.pickup_notes}</Text>
            </LinearGradient>
          ) : null}

          {/* ── Action buttons ── */}
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Pressable
                style={styles.primaryButtonInner}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace('/order-history');
                }}
              >
                <Text style={styles.primaryButtonText}>View Order History</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.secondaryButton}
            >
              <Pressable
                style={styles.secondaryButtonInner}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace('/(tabs)/(home)');
                }}
              >
                <Text style={styles.secondaryButtonText}>Back to Home</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea:          { flex: 1 },
  scrollView:        { flex: 1 },
  scrollContent:     { padding: 20, paddingBottom: 40 },

  centreContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 16,
  },
  loadingText: {
    marginTop: 8, fontSize: 15,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
  },
  errorTitle: {
    fontSize: 22, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK, textAlign: 'center',
  },
  errorText: {
    fontSize: 15, fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID, textAlign: 'center', lineHeight: 22,
  },

  // Success header
  successHeader: { alignItems: 'center', marginBottom: 28, paddingTop: 16 },
  successIconContainer: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  successTitle: {
    fontSize: 30, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK, marginBottom: 8,
    textAlign: 'center', letterSpacing: 0.3,
  },
  successSubtitle: {
    fontSize: 15, fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID, textAlign: 'center', lineHeight: 22,
  },

  // Order ID
  orderIdCard: {
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  orderIdLabel: {
    fontSize: 11, fontFamily: 'LibertinusSans_400Regular',
    letterSpacing: 2, textTransform: 'uppercase',
    color: blackGoldLight.INK_SOFT, marginBottom: 4, textAlign: 'center',
  },
  orderIdValue: {
    fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: blackGoldLight.INK, textAlign: 'center', letterSpacing: 2,
  },

  // Generic card
  card: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: blackGoldLight.GOLD, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },

  // Status
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusInfo: { flex: 1 },
  statusLabel: {
    fontSize: 13, fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SOFT, marginBottom: 4,
  },
  statusValue: {
    fontSize: 17, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },

  // Points
  pointsCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pointsIconContainer: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  pointsInfo: { flex: 1 },
  pointsTitle: {
    fontSize: 14, fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID, marginBottom: 4,
  },
  pointsValue: {
    fontSize: 22, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.GOLD,
  },

  // Section title
  sectionTitle: {
    fontSize: 19, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK, marginBottom: 12, letterSpacing: 0.3,
  },

  // Order items
  orderItem: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: blackGoldLight.BORDER_LIGHT,
  },
  orderItemLast: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  itemQuantity: {
    fontSize: 14, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_MID, width: 40,
  },
  itemName: {
    flex: 1, fontSize: 14, fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK,
  },
  itemPrice: {
    fontSize: 14, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: {
    fontSize: 17, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK,
  },
  totalValue: {
    fontSize: 22, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.GOLD,
  },

  // Delivery
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  deliveryTitle: {
    fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK,
  },
  deliveryText: {
    fontSize: 14, fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID, lineHeight: 20,
  },

  // Buttons
  buttonContainer: { gap: 12, marginTop: 8 },
  primaryButton: {
    borderRadius: 36, overflow: 'hidden',
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7,
  },
  primaryButtonInner: { paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: {
    fontSize: 16, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE, letterSpacing: 0.3,
  },
  secondaryButton: {
    borderRadius: 36, overflow: 'hidden',
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
  },
  secondaryButtonInner: { paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: {
    fontSize: 16, fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.GOLD, letterSpacing: 0.3,
  },
});