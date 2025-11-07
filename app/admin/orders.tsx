
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Order } from '@/types';
import * as Haptics from 'expo-haptics';

export default function AdminOrderManagement() {
  const router = useRouter();
  
  // Mock orders data
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1001',
      items: [
        {
          id: '1',
          name: 'Jollof Rice',
          description: 'Traditional West African rice dish',
          price: 14.99,
          category: 'Main Dishes',
          image: '',
          quantity: 2,
        },
        {
          id: '2',
          name: 'Suya Skewers',
          description: 'Spicy grilled meat skewers',
          price: 12.99,
          category: 'Appetizers',
          image: '',
          quantity: 1,
        },
      ],
      total: 42.97,
      pointsEarned: 43,
      date: new Date().toISOString(),
      status: 'pending',
    },
    {
      id: '1002',
      items: [
        {
          id: '3',
          name: 'Egusi Soup',
          description: 'Melon seed soup',
          price: 16.99,
          category: 'Main Dishes',
          image: '',
          quantity: 1,
        },
      ],
      total: 16.99,
      pointsEarned: 17,
      date: new Date(Date.now() - 3600000).toISOString(),
      status: 'preparing',
    },
    {
      id: '1003',
      items: [
        {
          id: '8',
          name: 'Zobo Drink',
          description: 'Refreshing hibiscus tea',
          price: 3.99,
          category: 'Drinks',
          image: '',
          quantity: 3,
        },
      ],
      total: 11.97,
      pointsEarned: 12,
      date: new Date(Date.now() - 7200000).toISOString(),
      status: 'ready',
    },
  ]);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: colors.text },
    { value: 'pending', label: 'Pending', color: '#FFA500' },
    { value: 'preparing', label: 'Preparing', color: '#4ECDC4' },
    { value: 'ready', label: 'Ready', color: '#95E1D3' },
    { value: 'completed', label: 'Completed', color: '#4CAF50' },
  ];

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    console.log('Changing order status:', orderId, newStatus);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'preparing':
        return '#4ECDC4';
      case 'ready':
        return '#95E1D3';
      case 'completed':
        return '#4CAF50';
      default:
        return colors.textSecondary;
    }
  };

  const filteredOrders =
    selectedStatus === 'all'
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Order Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statusOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.statusChip,
              selectedStatus === option.value && styles.statusChipActive,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedStatus(option.value);
            }}
          >
            <Text
              style={[
                styles.statusChipText,
                selectedStatus === option.value && styles.statusChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersContainer}>
          {filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{order.id}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.date).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '20' },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: getStatusColor(order.status) }]}
                  >
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.orderTotal}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.statusActions}>
                <Text style={styles.actionsLabel}>Update Status:</Text>
                <View style={styles.actionButtons}>
                  {(['pending', 'preparing', 'ready', 'completed'] as const).map(
                    (status) => (
                      <Pressable
                        key={status}
                        style={[
                          styles.actionButton,
                          order.status === status && styles.actionButtonActive,
                          { borderColor: getStatusColor(status) },
                        ]}
                        onPress={() => handleStatusChange(order.id, status)}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            order.status === status && {
                              color: getStatusColor(status),
                            },
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            </View>
          ))}

          {filteredOrders.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="receipt-long" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusFilterContent: {
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 14,
    color: colors.text,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    gap: 8,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 16,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  actionButtonActive: {
    backgroundColor: colors.card,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
