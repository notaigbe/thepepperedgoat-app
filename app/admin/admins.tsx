
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import { userService } from '@/services/supabaseService';
import { useApp } from '@/contexts/AppContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: string;
}

export default function AdminManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Check if user is super admin
    if (!userProfile?.isSuperAdmin) {
      Alert.alert(
        'Access Denied',
        'Only super-admins can access this page.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }
    fetchAdmins();
  }, [userProfile]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await userService.getAllUsers();

      if (error) throw error;

      // Filter to show only admin and super-admin users
      const adminUsers = (data || [])
        .filter((user: any) => user.is_admin || user.is_super_admin)
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || 'N/A',
          is_admin: user.is_admin || false,
          is_super_admin: user.is_super_admin || false,
          created_at: user.created_at,
        }));

      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error fetching admins:', error);
      Alert.alert('Error', 'Failed to load admin users');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const newStatus = !currentStatus;
      const { error } = await userService.updateUserAdminStatus(userId, newStatus);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Admin status ${newStatus ? 'granted' : 'revoked'} successfully`
      );
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin status:', error);
      Alert.alert('Error', 'Failed to update admin status');
    }
  };

  const handleToggleSuperAdminStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const newStatus = !currentStatus;

      // Confirm before granting super-admin
      if (newStatus) {
        Alert.alert(
          'Confirm Super-Admin',
          'Are you sure you want to grant super-admin privileges? This will give full control over all admin functions.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              style: 'destructive',
              onPress: async () => {
                const { error } = await userService.updateUserSuperAdminStatus(
                  userId,
                  newStatus
                );

                if (error) throw error;

                Alert.alert('Success', 'Super-admin status granted successfully');
                fetchAdmins();
              },
            },
          ]
        );
      } else {
        const { error } = await userService.updateUserSuperAdminStatus(
          userId,
          newStatus
        );

        if (error) throw error;

        Alert.alert('Success', 'Super-admin status revoked successfully');
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error updating super-admin status:', error);
      Alert.alert('Error', 'Failed to update super-admin status');
    }
  };

  const handleDeleteAdmin = async (userId: string, userName: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      Alert.alert(
        'Delete Admin',
        `Are you sure you want to delete ${userName}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const { error } = await userService.deleteUser(userId);

              if (error) throw error;

              Alert.alert('Success', 'Admin deleted successfully');
              fetchAdmins();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting admin:', error);
      Alert.alert('Error', 'Failed to delete admin');
    }
  };

  const handlePromoteUser = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      'Promote User',
      'To promote a user to admin, go to User Management and select the user you want to promote.',
      [
        {
          text: 'Go to Users',
          onPress: () => router.push('/admin/users' as any),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userProfile?.isSuperAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/admin' as any);
            }
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Admin Management</Text>
        <Pressable style={styles.addButton} onPress={handlePromoteUser}>
          <IconSymbol name="person-add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search admins..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {admins.filter((a) => a.is_super_admin).length}
            </Text>
            <Text style={styles.statLabel}>Super Admins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {admins.filter((a) => a.is_admin && !a.is_super_admin).length}
            </Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{admins.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading admins...</Text>
          </View>
        ) : (
          <View style={styles.adminsContainer}>
            {filteredAdmins.map((admin) => (
              <View key={admin.id} style={styles.adminCard}>
                <View style={styles.adminHeader}>
                  <View
                    style={[
                      styles.adminAvatar,
                      {
                        backgroundColor: admin.is_super_admin
                          ? '#FF6B35'
                          : colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.adminInitials}>
                      {admin.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <View style={styles.adminInfo}>
                    <View style={styles.adminNameRow}>
                      <Text style={styles.adminName}>{admin.name}</Text>
                      {admin.is_super_admin && (
                        <View style={styles.superAdminBadge}>
                          <IconSymbol
                            name="verified"
                            size={14}
                            color="#FFFFFF"
                          />
                          <Text style={styles.superAdminBadgeText}>
                            Super Admin
                          </Text>
                        </View>
                      )}
                      {admin.is_admin && !admin.is_super_admin && (
                        <View style={styles.adminBadge}>
                          <IconSymbol
                            name="admin-panel-settings"
                            size={14}
                            color="#FFFFFF"
                          />
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.adminEmail}>{admin.email}</Text>
                    <Text style={styles.adminPhone}>{admin.phone}</Text>
                  </View>
                </View>

                <View style={styles.adminActions}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      admin.is_admin && styles.actionButtonActive,
                    ]}
                    onPress={() =>
                      handleToggleAdminStatus(admin.id, admin.is_admin)
                    }
                  >
                    <IconSymbol
                      name={admin.is_admin ? 'check-circle' : 'radio-button-unchecked'}
                      size={20}
                      color={admin.is_admin ? '#4CAF50' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        admin.is_admin && styles.actionButtonTextActive,
                      ]}
                    >
                      Admin
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionButton,
                      admin.is_super_admin && styles.actionButtonActive,
                    ]}
                    onPress={() =>
                      handleToggleSuperAdminStatus(
                        admin.id,
                        admin.is_super_admin
                      )
                    }
                  >
                    <IconSymbol
                      name={
                        admin.is_super_admin
                          ? 'check-circle'
                          : 'radio-button-unchecked'
                      }
                      size={20}
                      color={
                        admin.is_super_admin ? '#FF6B35' : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        admin.is_super_admin && styles.actionButtonTextActive,
                      ]}
                    >
                      Super Admin
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAdmin(admin.id, admin.name)}
                  >
                    <IconSymbol name="delete" size={20} color="#FF6B6B" />
                  </Pressable>
                </View>

                <View style={styles.adminFooter}>
                  <Text style={styles.joinDate}>
                    Added: {new Date(admin.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}

            {filteredAdmins.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol
                  name="admin-panel-settings"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No admins found</Text>
                <Pressable
                  style={styles.promoteButton}
                  onPress={handlePromoteUser}
                >
                  <Text style={styles.promoteButtonText}>Promote a User</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
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
  addButton: {
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
  adminsContainer: {
    padding: 16,
    gap: 16,
  },
  adminCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  adminInfo: {
    flex: 1,
  },
  adminNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  adminEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adminPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  superAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  superAdminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonActive: {
    backgroundColor: colors.card,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionButtonTextActive: {
    color: colors.text,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminFooter: {
    marginTop: 12,
  },
  joinDate: {
    fontSize: 12,
    color: colors.textSecondary,
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
    marginBottom: 24,
  },
  promoteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  promoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
