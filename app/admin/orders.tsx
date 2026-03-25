import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Order, CartItem } from '@/types';
import { orderService, notificationService } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';
import { DeliveryTracking } from '@/components/DeliveryTracking';
import { RESTAURANT_PICKUP_ADDRESS, DeliveryProvider } from '@/constants/DeliveryConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  gold: "#C9A84C",
  goldDim: "#C9A84C55",
  goldFaint: "#C9A84C18",
  surface: "#111613",
  surfaceRaised: "#181C19",
  divider: "#FFFFFF0D",
  dividerStrong: "#FFFFFF18",
  textPrimary: "#F0EDE6",
  textSecondary: "#7A8A7E",
  textMuted: "#3D4D41",
  danger: "#C0392B",
  dangerFaint: "#C0392B18",
  success: "#2ECC71",
  successFaint: "#2ECC7118",
  warning: "#E8A838",
  warningFaint: "#E8A83818",
  info: "#4ECDC4",
  infoFaint: "#4ECDC418",
  radius: 4,
};

interface OrderWithItems extends Order {
  items: CartItem[];
  userId?: string;
}

const STATUS_CONFIG = {
  pending:   { color: D.warning,  label: 'PENDING'   },
  preparing: { color: D.info,     label: 'PREPARING' },
  ready:     { color: D.gold,     label: 'READY'     },
  completed: { color: D.success,  label: 'COMPLETED' },
} as const;

export default function AdminOrderManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '', message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: typeof dialogConfig.buttons) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };
  const showToast = (type: typeof toastType, message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders();
      if (res.error) throw res.error;
      const transformedOrders = (res.data || []).map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || 0,
        userId: order.user_id,
        items: (order.order_items || []).map((item: any) => ({
          id: item.id || item.item_id || '',
          name: item.item_name || item.name || '',
          description: item.description || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          category: item.category || '',
          image: item.image || '',
        })),
        total: order.total || 0,
        pointsEarned: order.points_earned || 0,
        date: order.created_at || new Date().toISOString(),
        status: order.status || 'pending',
        deliveryAddress: order.delivery_address,
        pickupNotes: order.pickup_notes,
      }));
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Failed to load orders', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusFilterOptions = [
    { value: 'all', label: 'ALL' },
    { value: 'pending', label: 'PENDING' },
    { value: 'preparing', label: 'PREPARING' },
    { value: 'ready', label: 'READY' },
    { value: 'completed', label: 'COMPLETED' },
  ];

  const getStatusMessage = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Your order has been received and is pending confirmation.';
      case 'preparing': return 'Your order is being prepared by our kitchen staff.';
      case 'ready': return 'Your order is ready for pickup or delivery!';
      case 'completed': return 'Your order has been completed. Thank you!';
      default: return 'Your order status has been updated.';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status'], userId?: string) => {
    (async () => {
      try {
        const res = await orderService.updateOrderStatus(orderId, newStatus);
        if (res.error || !res.data) throw res.error || new Error('Update failed');
        const updatedOrder = res.data as any;
        const transformedOrder: OrderWithItems = {
          id: updatedOrder.id,
          orderNumber: updatedOrder.order_number || 0,
          userId: updatedOrder.user_id,
          items: (updatedOrder.order_items || []).map((item: any) => ({
            id: item.id || item.item_id || '',
            name: item.item_name || item.name || '',
            description: item.description || '',
            price: item.price || 0,
            quantity: item.quantity || 1,
            category: item.category || '',
            image: item.image || '',
          })),
          total: updatedOrder.total || 0,
          pointsEarned: updatedOrder.points_earned || 0,
          date: updatedOrder.created_at || new Date().toISOString(),
          status: updatedOrder.status || 'pending',
          deliveryAddress: updatedOrder.delivery_address,
          pickupNotes: updatedOrder.pickup_notes,
          uberDeliveryId: updatedOrder.uber_delivery_id,
          uberDeliveryStatus: updatedOrder.uber_delivery_status,
          uberTrackingUrl: updatedOrder.uber_tracking_url,
          uberCourierName: updatedOrder.uber_courier_name,
          uberCourierPhone: updatedOrder.uber_courier_phone,
          uberCourierLocation: updatedOrder.uber_courier_location,
          uberDeliveryEta: updatedOrder.uber_delivery_eta,
          uberProofOfDelivery: updatedOrder.uber_proof_of_delivery,
          doordashDeliveryId: updatedOrder.doordash_delivery_id,
          doordashDeliveryStatus: updatedOrder.doordash_delivery_status,
          doordashTrackingUrl: updatedOrder.doordash_tracking_url,
          doordashDasherName: updatedOrder.doordash_dasher_name,
          doordashDasherPhone: updatedOrder.doordash_dasher_phone,
          doordashDasherLocation: updatedOrder.doordash_dasher_location,
          doordashDeliveryEta: updatedOrder.doordash_delivery_eta,
          doordashProofOfDelivery: updatedOrder.doordash_proof_of_delivery,
          deliveryProvider: updatedOrder.delivery_provider,
          deliveryTriggeredAt: updatedOrder.delivery_triggered_at,
        };
        setOrders((prev) => prev.map((o) => (o.id === orderId ? transformedOrder : o)));

        if (userId) {
          const statusMessage = getStatusMessage(newStatus);
          await notificationService.createNotification({
            userId,
            title: `Order #${transformedOrder.orderNumber} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            message: statusMessage,
            type: 'order',
            actionUrl: '/order-history',
          });
        }

        if (newStatus === 'ready' && transformedOrder.deliveryAddress && !transformedOrder.uberDeliveryId && !transformedOrder.doordashDeliveryId) {
          const settingsJson = await AsyncStorage.getItem('delivery_settings');
          const settings = settingsJson ? JSON.parse(settingsJson) : { defaultProvider: 'uber_direct' };
          const defaultProvider: DeliveryProvider = settings.defaultProvider || 'uber_direct';
          showDialog(
            'Trigger Delivery?',
            `Dispatch ${defaultProvider === 'doordash' ? 'DoorDash' : 'Uber Direct'} for this order?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => {} },
              { text: `${defaultProvider === 'doordash' ? 'DoorDash' : 'Uber Direct'}`, style: 'default', onPress: () => triggerDelivery(orderId, transformedOrder, defaultProvider) },
              { text: `${defaultProvider === 'doordash' ? 'Uber Direct' : 'DoorDash'}`, style: 'default', onPress: () => triggerDelivery(orderId, transformedOrder, defaultProvider === 'doordash' ? 'uber_direct' : 'doordash') },
            ]
          );
        } else {
          showToast('success', 'Status updated');
        }
      } catch (err) {
        console.error('Update order status failed', err);
        showToast('error', 'Unable to update status');
      }
    })();
  };

  const triggerDelivery = async (orderId: string, order: OrderWithItems, provider: DeliveryProvider) => {
    try {
      const providerName = provider === 'doordash' ? 'DoorDash' : 'Uber Direct';
      showToast('info', `Dispatching ${providerName}…`);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const addressParts = (order.deliveryAddress || '').split(',').map((p: string) => p.trim());
      const streetAddress = addressParts[0] || '';
      const cityState = addressParts[1] || '';
      const zipCode = addressParts[2] || '';
      const pickupAddress = RESTAURANT_PICKUP_ADDRESS.address;
      const dropoffAddress = {
        street: streetAddress,
        city: cityState.split(' ')[0] || 'Los Angeles',
        state: cityState.split(' ')[1] || 'CA',
        zipCode,
        country: 'US',
      };
      const functionName = provider === 'doordash' ? 'trigger-doordash-delivery' : 'trigger-uber-delivery';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          orderId, pickupAddress, dropoffAddress,
          pickupPhoneNumber: RESTAURANT_PICKUP_ADDRESS.phoneNumber,
          dropoffPhoneNumber: '+1234567890',
          pickupName: RESTAURANT_PICKUP_ADDRESS.name,
          dropoffName: 'Customer',
          pickupNotes: RESTAURANT_PICKUP_ADDRESS.notes,
          dropoffNotes: order.pickupNotes || '',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to trigger delivery');
      showToast('success', `${providerName} dispatched`);
      await fetchOrders();
    } catch (err: any) {
      showToast('error', `Dispatch failed: ${err.message}`);
    }
  };

  const filteredOrders =
    selectedStatus === 'all' ? orders : orders.filter((o) => o.status === selectedStatus);

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={fetchOrders}>
          <IconSymbol name="arrow.clockwise" size={18} color={D.textSecondary} />
        </Pressable>
      </View>

      {/* ── Status filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {statusFilterOptions.map((opt) => {
          const active = selectedStatus === opt.value;
          const cfg = opt.value !== 'all' ? STATUS_CONFIG[opt.value as keyof typeof STATUS_CONFIG] : null;
          return (
            <Pressable
              key={opt.value}
              style={[styles.filterChip, active && styles.filterChipActive, active && cfg ? { borderColor: cfg.color, backgroundColor: cfg.color + '18' } : null]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedStatus(opt.value);
              }}
            >
              <Text style={[styles.filterChipText, active && cfg ? { color: cfg.color } : active ? { color: D.gold } : null]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.countLabel}>{filteredOrders.length} ORDERS</Text>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={D.gold} />
            <Text style={styles.loadingText}>LOADING ORDERS</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="receipt" size={40} color={D.textMuted} />
            <Text style={styles.emptyText}>NO ORDERS</Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {filteredOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? { color: D.textMuted, label: order.status.toUpperCase() };
              return (
                <View key={order.id} style={styles.orderCard}>

                  {/* Card accent */}
                  <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

                  {/* Order header */}
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '55' }]}>
                      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={styles.itemsSection}>
                    {order.items.map((item: CartItem, index: number) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemQty}>{item.quantity}×</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Total */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                  </View>

                  {/* Status actions */}
                  <View style={styles.actionsSection}>
                    <Text style={styles.actionsLabel}>UPDATE STATUS</Text>
                    <View style={styles.actionButtons}>
                      {(['pending', 'preparing', 'ready', 'completed'] as const).map((status) => {
                        const sCfg = STATUS_CONFIG[status];
                        const isActive = order.status === status;
                        return (
                          <Pressable
                            key={status}
                            style={[
                              styles.actionBtn,
                              { borderColor: isActive ? sCfg.color : D.dividerStrong },
                              isActive && { backgroundColor: sCfg.color + '18' },
                            ]}
                            onPress={() => handleStatusChange(order.id, status, order.userId)}
                          >
                            <Text style={[styles.actionBtnText, { color: isActive ? sCfg.color : D.textMuted }]}>
                              {sCfg.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {(order.uberDeliveryId || order.doordashDeliveryId) && (
                    <View style={styles.deliverySection}>
                      <DeliveryTracking order={order} onRefresh={fetchOrders} />
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />
      <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message}
        buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)}
        currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.surface },
  scrollView: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  backButton: { padding: 4, marginRight: 14 },
  headerCenter: { flex: 1 },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 3, color: D.gold, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '300', letterSpacing: 0.5, color: D.textPrimary },
  refreshButton: { padding: 4 },

  filterBar: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4, maxHeight: 62 },
  filterBarContent: { gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.divider,
  },
  filterChipActive: { borderColor: D.goldDim },
  filterChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: D.textMuted },

  countLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
  },

  loadingContainer: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  loadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },

  ordersContainer: { paddingHorizontal: 20, gap: 1 },

  orderCard: {
    backgroundColor: D.surfaceRaised,
    marginBottom: 12,
    borderRadius: D.radius,
    overflow: 'hidden',
  },
  cardAccent: { height: 2 },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  orderNumber: { fontSize: 17, fontWeight: '600', letterSpacing: 0.3, color: D.textPrimary },
  orderDate: { fontSize: 11, color: D.textSecondary, marginTop: 3, letterSpacing: 0.3 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: D.radius,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  itemsSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
    gap: 6,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemQty: { fontSize: 12, fontWeight: '700', color: D.textMuted, width: 24 },
  itemName: { flex: 1, fontSize: 13, color: D.textSecondary, letterSpacing: 0.2 },
  itemPrice: { fontSize: 13, fontWeight: '500', color: D.textPrimary },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  totalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  totalAmount: { fontSize: 18, fontWeight: '300', letterSpacing: 0.5, color: D.textPrimary },

  actionsSection: { paddingHorizontal: 16, paddingVertical: 14 },
  actionsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted, marginBottom: 10 },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: D.radius,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  deliverySection: {
    borderTopWidth: 1,
    borderTopColor: D.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});