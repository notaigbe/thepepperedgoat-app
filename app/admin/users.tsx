
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  active: boolean;
}

export default function AdminUserManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock users data
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      points: 1250,
      totalOrders: 15,
      totalSpent: 425.50,
      joinDate: '2024-01-15',
      active: true,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 234-5678',
      points: 850,
      totalOrders: 8,
      totalSpent: 280.00,
      joinDate: '2024-02-20',
      active: true,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+1 (555) 345-6789',
      points: 2100,
      totalOrders: 25,
      totalSpent: 750.25,
      joinDate: '2023-12-10',
      active: true,
    },
  ]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.title}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {users.filter((u) => u.active).length}
            </Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {users.reduce((sum, u) => sum + u.points, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        <View style={styles.usersContainer}>
          {filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitials}>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: user.active ? '#4CAF50' : '#FF6B6B' },
                  ]}
                />
              </View>

              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <IconSymbol name="stars" size={20} color={colors.primary} />
                  <Text style={styles.userStatValue}>{user.points}</Text>
                  <Text style={styles.userStatLabel}>Points</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol name="receipt-long" size={20} color="#4ECDC4" />
                  <Text style={styles.userStatValue}>{user.totalOrders}</Text>
                  <Text style={styles.userStatLabel}>Orders</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol name="attach-money" size={20} color="#95E1D3" />
                  <Text style={styles.userStatValue}>
                    ${user.totalSpent.toFixed(0)}
                  </Text>
                  <Text style={styles.userStatLabel}>Spent</Text>
                </View>
              </View>

              <View style={styles.userFooter}>
                <Text style={styles.joinDate}>
                  Joined: {new Date(user.joinDate).toLocaleDateString()}
                </Text>
                <Pressable
                  style={styles.viewButton}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    console.log('View user details:', user.id);
                  }}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <IconSymbol
                    name="chevron-right"
                    size={16}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
            </View>
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="people" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No users found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  usersContainer: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  joinDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
