
import React from 'react';
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
import * as Haptics from 'expo-haptics';

export default function AdminAnalytics() {
  const router = useRouter();

  const metrics = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$12,450',
      change: '+12.5%',
      positive: true,
      icon: 'attach-money' as const,
      color: '#4CAF50',
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: '127',
      change: '+8.3%',
      positive: true,
      icon: 'receipt-long' as const,
      color: colors.primary,
    },
    {
      id: 'users',
      title: 'Active Users',
      value: '1,234',
      change: '+15.2%',
      positive: true,
      icon: 'people' as const,
      color: '#4ECDC4',
    },
    {
      id: 'avg-order',
      title: 'Avg Order Value',
      value: '$98.03',
      change: '-2.1%',
      positive: false,
      icon: 'trending-up' as const,
      color: '#95E1D3',
    },
  ];

  const topItems = [
    { name: 'Jollof Rice', orders: 45, revenue: '$674.55' },
    { name: 'Suya Skewers', orders: 38, revenue: '$493.62' },
    { name: 'Egusi Soup', orders: 32, revenue: '$543.68' },
    { name: 'Zobo Drink', orders: 28, revenue: '$111.72' },
    { name: 'Fried Rice', orders: 25, revenue: '$349.75' },
  ];

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
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsContainer}>
          {metrics.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <View
                style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}
              >
                <IconSymbol name={metric.icon} size={28} color={metric.color} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text
                  style={[
                    styles.metricChange,
                    { color: metric.positive ? '#4CAF50' : '#FF6B6B' },
                  ]}
                >
                  {metric.change} from last month
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          <View style={styles.topItemsContainer}>
            {topItems.map((item, index) => (
              <View key={index} style={styles.topItem}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemContent}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemOrders}>{item.orders} orders</Text>
                </View>
                <Text style={styles.topItemRevenue}>{item.revenue}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New order placed</Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#4ECDC4' }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New user registered</Text>
                <Text style={styles.activityTime}>15 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Order completed</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#95E1D3' }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Gift card purchased</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            📊 Connect Supabase for real-time analytics
          </Text>
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
  metricsContainer: {
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  metricChange: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  topItemsContainer: {
    gap: 12,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topItemContent: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  topItemOrders: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topItemRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activityContainer: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
