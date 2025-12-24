
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Order } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

interface DeliveryTrackingProps {
  order: Order;
  onRefresh?: () => void;
}

export function DeliveryTracking({ order, onRefresh }: DeliveryTrackingProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const handleOpenTracking = () => {
    const trackingUrl = order.deliveryProvider === 'doordash' 
      ? order.doordashTrackingUrl 
      : order.uberTrackingUrl;
    
    if (trackingUrl) {
      Linking.openURL(trackingUrl);
    }
  };

  const handleCallDriver = () => {
    const driverPhone = order.deliveryProvider === 'doordash'
      ? order.doordashDasherPhone
      : order.uberCourierPhone;
    
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`);
    }
  };

  const getDeliveryStatusInfo = (status?: string, provider?: string) => {
    if (provider === 'doordash') {
      switch (status) {
        case 'created':
          return {
            label: 'Created',
            icon: 'clock',
            color: '#FFA500',
            description: 'Delivery request created',
          };
        case 'confirmed':
          return {
            label: 'Dasher Assigned',
            icon: 'person',
            color: '#4ECDC4',
            description: 'A dasher has been assigned to your order',
          };
        case 'picked_up':
          return {
            label: 'On the Way',
            icon: 'local-shipping',
            color: '#95E1D3',
            description: 'Your order is on the way!',
          };
        case 'delivered':
          return {
            label: 'Delivered',
            icon: 'check-circle',
            color: '#4CAF50',
            description: 'Order has been delivered',
          };
        case 'cancelled':
          return {
            label: 'Canceled',
            icon: 'cancel',
            color: '#F44336',
            description: 'Delivery was canceled',
          };
        default:
          return {
            label: 'Unknown',
            icon: 'help',
            color: colors.textSecondary,
            description: 'Status unknown',
          };
      }
    } else {
      // Uber Direct statuses
      switch (status) {
        case 'pending':
          return {
            label: 'Pending',
            icon: 'clock',
            color: '#FFA500',
            description: 'Waiting for driver assignment',
          };
        case 'en_route_to_pickup':
          return {
            label: 'Driver En Route',
            icon: 'car',
            color: '#4ECDC4',
            description: 'Driver is heading to the restaurant',
          };
        case 'at_pickup':
          return {
            label: 'At Restaurant',
            icon: 'storefront',
            color: '#4ECDC4',
            description: 'Driver is picking up your order',
          };
        case 'en_route_to_dropoff':
          return {
            label: 'On the Way',
            icon: 'local-shipping',
            color: '#95E1D3',
            description: 'Your order is on the way!',
          };
        case 'delivered':
          return {
            label: 'Delivered',
            icon: 'check-circle',
            color: '#4CAF50',
            description: 'Order has been delivered',
          };
        case 'canceled':
          return {
            label: 'Canceled',
            icon: 'cancel',
            color: '#F44336',
            description: 'Delivery was canceled',
          };
        default:
          return {
            label: 'Unknown',
            icon: 'help',
            color: colors.textSecondary,
            description: 'Status unknown',
          };
      }
    }
  };

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case 'doordash':
        return 'DoorDash';
      case 'uber_direct':
        return 'Uber Direct';
      default:
        return 'Delivery';
    }
  };

  // Check if there's an active delivery
  const hasDelivery = order.uberDeliveryId || order.doordashDeliveryId;
  
  if (!hasDelivery) {
    return null;
  }

  const deliveryStatus = order.deliveryProvider === 'doordash' 
    ? order.doordashDeliveryStatus 
    : order.uberDeliveryStatus;
  
  const statusInfo = getDeliveryStatusInfo(deliveryStatus, order.deliveryProvider);
  
  const driverName = order.deliveryProvider === 'doordash'
    ? order.doordashDasherName
    : order.uberCourierName;
  
  const driverPhone = order.deliveryProvider === 'doordash'
    ? order.doordashDasherPhone
    : order.uberCourierPhone;
  
  const deliveryEta = order.deliveryProvider === 'doordash'
    ? order.doordashDeliveryEta
    : order.uberDeliveryEta;
  
  const trackingUrl = order.deliveryProvider === 'doordash'
    ? order.doordashTrackingUrl
    : order.uberTrackingUrl;
  
  const proofOfDelivery = order.deliveryProvider === 'doordash'
    ? order.doordashProofOfDelivery
    : order.uberProofOfDelivery;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.card, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconSymbol name={statusInfo.icon} size={24} color={statusInfo.color} />
            <View style={styles.headerText}>
              <Text style={styles.title}>{getProviderName(order.deliveryProvider)} Tracking</Text>
              <Text style={[styles.status, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleRefresh} disabled={refreshing} style={styles.refreshButton}>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol name="refresh" size={20} color={colors.primary} />
            )}
          </Pressable>
        </View>

        <Text style={styles.description}>{statusInfo.description}</Text>

        {driverName && (
          <View style={styles.driverInfo}>
            <View style={styles.driverHeader}>
              <IconSymbol name="person" size={20} color={colors.text} />
              <Text style={styles.driverName}>{driverName}</Text>
            </View>
            {driverPhone && (
              <Pressable onPress={handleCallDriver} style={styles.callButton}>
                <IconSymbol name="phone" size={16} color={colors.primary} />
                <Text style={styles.callButtonText}>Call Driver</Text>
              </Pressable>
            )}
          </View>
        )}

        {deliveryEta && (
          <View style={styles.etaContainer}>
            <IconSymbol name="schedule" size={18} color={colors.textSecondary} />
            <Text style={styles.etaText}>
              ETA: {new Date(deliveryEta).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        )}

        {trackingUrl && (
          <Pressable onPress={handleOpenTracking} style={styles.trackButton}>
            <IconSymbol name="map" size={18} color="#FFFFFF" />
            <Text style={styles.trackButtonText}>Track on Map</Text>
          </Pressable>
        )}

        {proofOfDelivery && (
          <View style={styles.proofContainer}>
            <Text style={styles.proofTitle}>Proof of Delivery</Text>
            {proofOfDelivery.notes && (
              <Text style={styles.proofNotes}>{proofOfDelivery.notes}</Text>
            )}
            {proofOfDelivery.signatureImageUrl && (
              <Pressable
                onPress={() => Linking.openURL(proofOfDelivery.signatureImageUrl!)}
                style={styles.proofLink}
              >
                <IconSymbol name="draw" size={16} color={colors.primary} />
                <Text style={styles.proofLinkText}>View Signature</Text>
              </Pressable>
            )}
            {proofOfDelivery.photoUrl && (
              <Pressable
                onPress={() => Linking.openURL(proofOfDelivery.photoUrl!)}
                style={styles.proofLink}
              >
                <IconSymbol name="photo" size={16} color={colors.primary} />
                <Text style={styles.proofLinkText}>View Photo</Text>
              </Pressable>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  driverInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  proofContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  proofTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  proofNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  proofLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  proofLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
