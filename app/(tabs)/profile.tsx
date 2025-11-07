
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { userProfile } = useApp();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable>
            <IconSymbol name="gear" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.circle.fill" size={80} color={colors.primary} />
            </View>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
            <Text style={styles.profilePhone}>{userProfile.phone}</Text>
          </View>

          {/* Points Card */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <IconSymbol name="star.fill" size={32} color={colors.highlight} />
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsLabel}>Reward Points</Text>
                <Text style={styles.pointsValue}>{userProfile.points}</Text>
              </View>
            </View>
            <Text style={styles.pointsSubtext}>
              Earn 1 point for every dollar spent. Use points for discounts or redeem exclusive merch!
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <IconSymbol name="bag.fill" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{userProfile.orders.length}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="giftcard.fill" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{userProfile.giftCards.length}</Text>
              <Text style={styles.statLabel}>Gift Cards</Text>
            </View>
          </View>

          {/* Order History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {userProfile.orders.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="bag" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>No orders yet</Text>
              </View>
            ) : (
              userProfile.orders.slice(0, 5).map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderDate}>
                      {new Date(order.date).toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusBadge, styles[`status${order.status}`]]}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderItems}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                    <View style={styles.orderPoints}>
                      <IconSymbol name="star.fill" size={14} color={colors.highlight} />
                      <Text style={styles.orderPointsText}>+{order.pointsEarned} pts</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Pressable style={styles.actionButton}>
              <IconSymbol name="person.fill" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <IconSymbol name="location.fill" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Delivery Addresses</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <IconSymbol name="creditcard.fill" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Payment Methods</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <IconSymbol name="bell.fill" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Notifications</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
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
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pointsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
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
  pointsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statuspending: {
    backgroundColor: colors.highlight,
  },
  statuspreparing: {
    backgroundColor: colors.secondary,
  },
  statusready: {
    backgroundColor: colors.accent,
  },
  statuscompleted: {
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  orderItems: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
});
