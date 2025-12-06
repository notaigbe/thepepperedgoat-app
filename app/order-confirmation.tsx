
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

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          points_earned,
          status,
          payment_status,
          delivery_address,
          pickup_notes,
          created_at,
          order_items (
            id,
            name,
            price,
            quantity
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        throw new Error('Failed to load order details');
      }

      if (!data) {
        throw new Error('Order not found');
      }

      setOrder(data as OrderDetails);
      
      // Reload user profile to update points
      await loadUserProfile();
    } catch (err) {
      console.error('Error in fetchOrderDetails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return '#10B981';
      case 'processing':
        return currentColors.highlight;
      case 'pending':
        return currentColors.secondary;
      case 'failed':
        return '#EF4444';
      default:
        return currentColors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'checkmark.circle.fill';
      case 'processing':
        return 'hourglass';
      case 'pending':
        return 'clock.fill';
      case 'failed':
        return 'xmark.circle.fill';
      default:
        return 'info.circle.fill';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Payment Successful';
      case 'processing':
        return 'Processing Payment';
      case 'pending':
        return 'Payment Pending';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'preparing':
        return 'Preparing Your Order';
      case 'ready':
        return 'Order Ready';
      case 'completed':
        return 'Order Completed';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return status;
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentColors.background,
    },
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: currentColors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: currentColors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    successHeader: {
      alignItems: 'center',
      marginBottom: 32,
      paddingTop: 20,
    },
    successIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      elevation: 6,
    },
    successTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    successSubtitle: {
      fontSize: 16,
      color: currentColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    statusCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
      backgroundColor: currentColors.card,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statusInfo: {
      flex: 1,
    },
    statusLabel: {
      fontSize: 14,
      color: currentColors.textSecondary,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    pointsCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    pointsIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pointsInfo: {
      flex: 1,
    },
    pointsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.text,
      marginBottom: 4,
    },
    pointsValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.primary,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 16,
    },
    orderSummaryCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
      backgroundColor: currentColors.card,
    },
    orderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentColors.background,
    },
    orderItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    itemQuantity: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.textSecondary,
      width: 40,
    },
    itemName: {
      flex: 1,
      fontSize: 16,
      color: currentColors.text,
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.text,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 2,
      borderTopColor: currentColors.background,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.primary,
    },
    deliveryCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
      backgroundColor: currentColors.card,
    },
    deliveryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.text,
      marginBottom: 8,
    },
    deliveryText: {
      fontSize: 14,
      color: currentColors.textSecondary,
      lineHeight: 20,
    },
    orderIdCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      backgroundColor: currentColors.background,
      borderWidth: 1,
      borderColor: currentColors.border,
      borderStyle: 'dashed',
    },
    orderIdLabel: {
      fontSize: 12,
      color: currentColors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    orderIdValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentColors.text,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    buttonContainer: {
      gap: 12,
      marginTop: 20,
    },
    primaryButton: {
      backgroundColor: currentColors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      elevation: 4,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.card,
    },
    secondaryButton: {
      backgroundColor: currentColors.card,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: currentColors.primary,
    },
    secondaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.primary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={64}
            color={currentColors.primary}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Unable to Load Order</Text>
          <Text style={styles.errorText}>
            {error || 'We couldn\'t find your order details. Please try again.'}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.replace('/(tabs)/(home)');
            }}
          >
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDelivery = !!order.delivery_address;
  const paymentSuccessful = order.payment_status === 'succeeded';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <LinearGradient
            colors={[currentColors.primary, currentColors.secondary]}
            style={styles.successIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconSymbol
              name={getStatusIcon(order.payment_status)}
              size={50}
              color={currentColors.card}
            />
          </LinearGradient>
          <Text style={styles.successTitle}>
            {paymentSuccessful ? 'Order Confirmed!' : getStatusText(order.payment_status)}
          </Text>
          <Text style={styles.successSubtitle}>
            {paymentSuccessful
              ? `Your ${isDelivery ? 'delivery' : 'pickup'} order has been confirmed and is being prepared.`
              : 'We\'re processing your order. You\'ll receive a notification once it\'s confirmed.'}
          </Text>
        </View>

        {/* Order ID */}
        <View style={styles.orderIdCard}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderIdValue}>{order.id.substring(0, 8).toUpperCase()}</Text>
        </View>

        {/* Payment Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <IconSymbol
              name={getStatusIcon(order.payment_status)}
              size={32}
              color={getStatusColor(order.payment_status)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Payment Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(order.payment_status) }]}>
                {getStatusText(order.payment_status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <IconSymbol
              name="bag.fill"
              size={32}
              color={currentColors.primary}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Order Status</Text>
              <Text style={styles.statusValue}>
                {getOrderStatusText(order.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Points Earned */}
        {paymentSuccessful && order.points_earned > 0 && (
          <LinearGradient
            colors={[currentColors.highlight + '40', currentColors.accent + '40']}
            style={styles.pointsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.pointsIconContainer, { backgroundColor: currentColors.primary }]}>
              <IconSymbol name="star.fill" size={32} color={currentColors.card} />
            </View>
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsTitle}>Points Earned</Text>
              <Text style={styles.pointsValue}>+{order.points_earned} points</Text>
            </View>
          </LinearGradient>
        )}

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.orderSummaryCard}>
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
              <Text style={styles.itemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery/Pickup Information */}
        {isDelivery ? (
          <View style={styles.deliveryCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IconSymbol name="location.fill" size={20} color={currentColors.primary} />
              <Text style={styles.deliveryTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.deliveryText}>{order.delivery_address}</Text>
          </View>
        ) : order.pickup_notes ? (
          <View style={styles.deliveryCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IconSymbol name="bag.fill" size={20} color={currentColors.primary} />
              <Text style={styles.deliveryTitle}>Pickup Notes</Text>
            </View>
            <Text style={styles.deliveryText}>{order.pickup_notes}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.replace('/order-history');
            }}
          >
            <Text style={styles.primaryButtonText}>View Order History</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.replace('/(tabs)/(home)');
            }}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
