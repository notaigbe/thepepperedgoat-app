import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Toast from '@/components/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import Dialog from '@/components/Dialog';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';
import { blackGoldLight } from '@/styles/commonStyles';

// ─── Semantic status colours ──────────────────────────────────────────
const SUCCESS_GREEN = "#2E7D52";
const ERROR_RED     = "#C0392B";
const WARN_AMBER    = "#C07A10";

interface OrderItem {
  id: string; name: string; price: number; quantity: number;
}

interface Order {
  id: string; order_number: number; user_id: string;
  total: number; points_earned: number;
  status: string; payment_status: string;
  delivery_address: string | null; pickup_notes: string | null;
  created_at: string; updated_at: string;
  cancellation_deadline: string | null;
  order_items: OrderItem[];
}

export default function OrderDetailScreen() {
  const router    = useRouter();
  const { orderId } = useLocalSearchParams();
  const { showToast, currentColors, userProfile } = useApp();

  const [order, setOrder]               = useState<Order | null>(null);
  const [loading, setLoading]           = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canModify, setCanModify]       = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modifyNotes, setModifyNotes]   = useState('');
  const [cancelling, setCancelling]     = useState(false);
  const [modifying, setModifying]       = useState(false);

  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders').select(`*, order_items (*)`).eq('id', orderId).single();
      if (error) throw error;
      setOrder(data as Order);
    } catch (error) {
      console.error('Error loading order:', error);
      showToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => { loadOrderDetails(); }, [loadOrderDetails]);

  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      if (order.cancellation_deadline) {
        const deadline  = new Date(order.cancellation_deadline).getTime();
        const remaining = Math.max(0, deadline - Date.now());
        setTimeRemaining(remaining);
        setCanModify(
          remaining > 0 &&
          order.payment_status === 'succeeded' &&
          (order.status === 'pending' || order.status === 'preparing')
        );
        if (remaining === 0) clearInterval(interval);
      } else {
        setTimeRemaining(0); setCanModify(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/cancel-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Failed to cancel order'); }
      showToast('Order cancelled successfully. Refund will be processed within 5-7 business days.', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadOrderDetails();
      setTimeout(() => router.back(), 2000);
    } catch (error: any) {
      showToast(error.message || 'Failed to cancel order', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCancelling(false); setShowCancelDialog(false);
    }
  };

  const handleModifyOrder = async () => {
    if (!modifyNotes.trim()) { showToast('Please enter modification details', 'error'); return; }
    try {
      setModifying(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/modify-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId, notes: modifyNotes }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Failed to modify order'); }
      showToast('Modification request submitted successfully', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModifyDialog(false); setModifyNotes('');
      await loadOrderDetails();
    } catch (error: any) {
      showToast(error.message || 'Failed to modify order', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setModifying(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return blackGoldLight.GOLD;
      case 'preparing': return WARN_AMBER;
      case 'ready':     return SUCCESS_GREEN;
      case 'completed': return SUCCESS_GREEN;
      case 'cancelled': return ERROR_RED;
      default:          return blackGoldLight.INK_MID;
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centreContainer}>
          <ActivityIndicator size="large" color={blackGoldLight.GOLD} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centreContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={blackGoldLight.GOLD} />
          <Text style={styles.errorText}>Order not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Orders</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[blackGoldLight.BODY_BG, blackGoldLight.BODY_BG, "#F5F0E8"]}
      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>

          {/* ── Header ── */}
          <LinearGradient
            colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              style={styles.backButton}
            >
              <IconSymbol name="chevron.left" size={24} color={blackGoldLight.INK_WHITE} />
            </Pressable>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* ── Timer card ── */}
            {canModify && (
              <LinearGradient
                colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <IconSymbol name="clock" size={24} color={WARN_AMBER} />
                <View style={styles.timerContent}>
                  <Text style={styles.timerTitle}>Time to cancel/modify</Text>
                  <Text style={[styles.timerValue, { color: WARN_AMBER }]}>{formatTime(timeRemaining)}</Text>
                </View>
              </LinearGradient>
            )}

            {/* ── Order info ── */}
            <LinearGradient
              colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Order Number</Text>
                <Text style={styles.orderValue}>#{order.order_number}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusBadgeText}>{order.status}</Text>
                </View>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Payment Status</Text>
                <Text style={[styles.orderValue, { textTransform: 'capitalize' }]}>{order.payment_status}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Order Date</Text>
                <Text style={styles.orderValue}>
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              {order.delivery_address && (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>Delivery Address</Text>
                  <Text style={styles.orderValue}>{order.delivery_address}</Text>
                </View>
              )}
              {order.pickup_notes && (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>Notes</Text>
                  <Text style={styles.orderValue}>{order.pickup_notes}</Text>
                </View>
              )}
            </LinearGradient>

            {/* ── Order items ── */}
            <LinearGradient
              colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <Text style={styles.sectionTitle}>Order Items</Text>
              {order.order_items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
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
                style={{ height: 1, marginVertical: 14 }}
              />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
              </View>
              <View style={styles.pointsRow}>
                <IconSymbol name="star.fill" size={16} color={blackGoldLight.GOLD} />
                <Text style={styles.pointsText}>+{order.points_earned} points earned</Text>
              </View>
            </LinearGradient>

            {/* ── Action buttons ── */}
            {canModify && (
              <View style={styles.actionButtons}>
                <LinearGradient
                  colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Pressable
                    style={styles.buttonInner}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModifyDialog(true); }}
                    disabled={modifying}
                  >
                    <IconSymbol name="pencil" size={20} color={blackGoldLight.INK_WHITE} />
                    <Text style={styles.buttonText}>Modify Order</Text>
                  </Pressable>
                </LinearGradient>

                <LinearGradient
                  colors={['#C0392B', '#96281B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Pressable
                    style={styles.buttonInner}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCancelDialog(true); }}
                    disabled={cancelling}
                  >
                    <IconSymbol name="xmark.circle" size={20} color={blackGoldLight.INK_WHITE} />
                    <Text style={styles.buttonText}>Cancel Order</Text>
                  </Pressable>
                </LinearGradient>
              </View>
            )}

            {/* ── Expired window info ── */}
            {!canModify && order.status !== 'cancelled' && order.payment_status === 'succeeded' && (
              <LinearGradient
                colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.card, styles.infoCard]}
              >
                <IconSymbol name="info.circle" size={20} color={blackGoldLight.GOLD} />
                <Text style={styles.infoText}>
                  The 5-minute modification window has expired. Please contact support for any changes.
                </Text>
              </LinearGradient>
            )}
          </ScrollView>
        </View>

        {/* Cancel Dialog */}
        <Dialog
          visible={showCancelDialog}
          title="Cancel Order"
          message="Are you sure you want to cancel this order? A full refund will be processed to your original payment method within 5-7 business days."
          buttons={[
            { text: 'No, Keep Order', onPress: () => setShowCancelDialog(false), style: 'cancel' },
            { text: cancelling ? 'Cancelling...' : 'Yes, Cancel Order', onPress: handleCancelOrder, style: 'destructive' },
          ]}
          onHide={() => setShowCancelDialog(false)}
        />

        {/* Modify Dialog */}
        <Dialog
          visible={showModifyDialog}
          title="Modify Order"
          message="Please describe the changes you'd like to make to your order:"
          buttons={[
            { text: 'Cancel', onPress: () => { setShowModifyDialog(false); setModifyNotes(''); }, style: 'cancel' },
            { text: modifying ? 'Submitting...' : 'Submit Request', onPress: handleModifyOrder, style: 'default' },
          ]}
          onHide={() => { setShowModifyDialog(false); setModifyNotes(''); }}
        >
          <TextInput
            style={styles.modifyInput}
            placeholder="e.g., Add extra sauce, change delivery address, remove an item..."
            placeholderTextColor={blackGoldLight.INK_SOFT}
            value={modifyNotes}
            onChangeText={setModifyNotes}
            multiline numberOfLines={4} textAlignVertical="top"
          />
        </Dialog>

        <Toast />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea:          { flex: 1 },
  container:         { flex: 1, backgroundColor: blackGoldLight.BODY_BG },
  content:           { flex: 1, padding: 16 },

  centreContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 40 },
  loadingText:     { fontSize: 15, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID },
  errorText:       { fontSize: 18, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK, textAlign: 'center' },
  backLink:        { marginTop: 8, padding: 12 },
  backLinkText:    { fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.GOLD },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: blackGoldLight.BORDER_GOLD,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(184,146,42,0.15)',
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
  },
  headerTitle: {
    fontSize: 20, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_WHITE,
  },

  // Generic card
  card: {
    flexDirection: undefined as any,
    borderRadius: 16, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: blackGoldLight.GOLD, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },

  // Timer
  timerContent: { flex: 1 },
  timerTitle: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID, marginBottom: 4 },
  timerValue: { fontSize: 22, fontFamily: 'LibertinusSans_700Bold' },

  // Order rows
  orderRow:    { marginBottom: 14 },
  orderLabel:  { fontSize: 12, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_SOFT, marginBottom: 3 },
  orderValue:  { fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 12, fontFamily: 'LibertinusSans_700Bold', color: '#FFFFFF', textTransform: 'capitalize' },

  // Section
  sectionTitle: { fontSize: 16, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK, marginBottom: 14 },

  // Items
  itemRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemQuantity:{ fontSize: 13, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_MID, width: 38 },
  itemName:    { flex: 1, fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK },
  itemPrice:   { fontSize: 13, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontSize: 16, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK },
  totalValue: { fontSize: 20, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.GOLD },

  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pointsText: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID },

  // Buttons
  actionButtons: { gap: 12, marginBottom: 16 },
  button:        { borderRadius: 36, overflow: 'hidden', shadowColor: blackGoldLight.GOLD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonInner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, gap: 8 },
  buttonText:    { fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_WHITE },

  // Info card
  infoCard: { flexDirection: 'row', gap: 12 },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID, lineHeight: 19 },

  // Modify input
  modifyInput: {
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    borderRadius: 12, padding: 12, marginTop: 12,
    minHeight: 100, textAlignVertical: 'top',
    fontSize: 14, fontFamily: 'LibertinusSans_400Regular',
    backgroundColor: blackGoldLight.CARD_BG, color: blackGoldLight.INK,
  },
});