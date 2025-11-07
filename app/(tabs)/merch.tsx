
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { merchItems } from '@/data/merchData';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function MerchScreen() {
  const { userProfile, redeemMerch } = useApp();

  const handleRedeem = (merchId: string, pointsCost: number, merchName: string, inStock: boolean) => {
    console.log('Redeeming merch:', merchId);
    
    if (!inStock) {
      Alert.alert('Out of Stock', 'This item is currently out of stock.');
      return;
    }

    if (userProfile.points < pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${pointsCost - userProfile.points} more points to redeem this item.`
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Redeem Merch',
      `Redeem ${merchName} for ${pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            redeemMerch(merchId, pointsCost);
            Alert.alert('Success!', `You&apos;ve redeemed ${merchName}! We&apos;ll ship it to you soon.`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Merch Store</Text>
            <Text style={styles.headerSubtitle}>Redeem exclusive items with points</Text>
          </View>
        </View>

        <View style={styles.pointsCard}>
          <IconSymbol name="star.fill" size={32} color={colors.highlight} />
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{userProfile.points}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {merchItems.map((item) => (
            <View key={item.id} style={styles.merchItem}>
              <Image source={{ uri: item.image }} style={styles.merchImage} />
              {!item.inStock && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
              <View style={styles.merchInfo}>
                <Text style={styles.merchName}>{item.name}</Text>
                <Text style={styles.merchDescription}>{item.description}</Text>
                <View style={styles.merchFooter}>
                  <View style={styles.pointsCostContainer}>
                    <IconSymbol name="star.fill" size={16} color={colors.highlight} />
                    <Text style={styles.pointsCost}>{item.pointsCost} pts</Text>
                  </View>
                  <Pressable
                    style={[
                      styles.redeemButton,
                      (!item.inStock || userProfile.points < item.pointsCost) &&
                        styles.redeemButtonDisabled,
                    ]}
                    onPress={() => handleRedeem(item.id, item.pointsCost, item.name, item.inStock)}
                  >
                    <Text style={styles.redeemButtonText}>Redeem</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pointsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  merchItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  merchImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.accent,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  outOfStockText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  merchInfo: {
    padding: 16,
  },
  merchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  merchDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  merchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.card,
  },
});
