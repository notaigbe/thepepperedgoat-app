import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { userService } from '@/services/supabaseService';
import { useApp } from '@/contexts/AppContext';
import { UserRole } from '@/types';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';

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
  purple: "#9B59B6",
  purpleFaint: "#9B59B618",
  orange: "#E67E22",
  orangeFaint: "#E67E2218",
  radius: 4,
};

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_role: UserRole;
  created_at: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; faint: string }> = {
  user:        { label: 'USER',        color: D.textMuted,  faint: '#FFFFFF08' },
  admin:       { label: 'ADMIN',       color: D.purple,     faint: D.purpleFaint },
  super_admin: { label: 'SUPER ADMIN', color: D.orange,     faint: D.orangeFaint },
};

function AdminAvatar({ name, role }: { name: string; role: UserRole }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const cfg = ROLE_CONFIG[role];
  return (
    <View style={[avatarStyles.circle, { backgroundColor: cfg.faint, borderColor: cfg.color + '50' }]}>
      <Text style={[avatarStyles.initials, { color: cfg.color }]}>{initials}</Text>
    </View>
  );
}
const avatarStyles = StyleSheet.create({
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  initials: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});

export default function AdminManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
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
    setDialogConfig({ title, message, buttons }); setDialogVisible(true);
  };
  const showToast = (type: typeof toastType, message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await userService.getAllUsers();
      if (error) throw error;
      const adminUsers = (data || [])
        .filter((u: any) => u.user_role === 'admin' || u.user_role === 'super_admin')
        .map((u: any) => ({
          id: u.id, name: u.name, email: u.email,
          phone: u.phone || 'N/A', user_role: u.user_role as UserRole, created_at: u.created_at,
        }));
      setAdmins(adminUsers);
    } catch {
      showToast('error', 'Failed to load admin users');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.userRole !== 'super_admin') {
      showDialog('Access Denied', 'Only super-admins can access this page.', [
        { text: 'OK', onPress: () => router.back(), style: 'default' },
      ]);
      return;
    }
    fetchAdmins();
  }, [userProfile, router, fetchAdmins]);

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const confirmUpdate = async () => {
      const { error } = await userService.updateUserRole(userId, newRole);
      if (error) { showToast('error', 'Failed to update role'); return; }
      showToast('success', 'Role updated');
      fetchAdmins();
    };
    if (newRole === 'super_admin') {
      showDialog('Confirm Super Admin', 'Grant full super-admin control?', [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        { text: 'Confirm', style: 'destructive', onPress: confirmUpdate },
      ]);
    } else {
      confirmUpdate();
    }
  };

  const handleDeleteAdmin = (userId: string, userName: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showDialog('Delete Admin', `Delete ${userName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await userService.deleteUser(userId);
        if (error) { showToast('error', 'Failed to delete admin'); return; }
        showToast('success', 'Admin deleted');
        fetchAdmins();
      }},
    ]);
  };

  const handlePromoteUser = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showDialog('Promote User', 'Go to User Management to promote a user to admin.', [
      { text: 'Go to Users', onPress: () => router.push('/admin/users' as any), style: 'default' },
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
    ]);
  };

  const filteredAdmins = admins.filter(
    (a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userProfile?.userRole !== 'super_admin') return null;

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (router.canGoBack()) router.back(); else router.replace('/admin' as any);
        }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Admins</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={handlePromoteUser}>
          <IconSymbol name="person.fill" size={18} color={D.gold} />
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={16} color={D.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search admins…"
          placeholderTextColor={D.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: admins.filter((a) => a.user_role === 'super_admin').length, label: 'SUPER ADMINS' },
            { value: admins.filter((a) => a.user_role === 'admin').length, label: 'ADMINS' },
            { value: admins.length, label: 'TOTAL' },
          ].map((s) => (
            <View key={s.label} style={styles.statCell}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{filteredAdmins.length} ACCOUNTS</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={D.gold} />
            <Text style={styles.loadingText}>LOADING</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredAdmins.map((admin) => {
              const cfg = ROLE_CONFIG[admin.user_role];
              return (
                <View key={admin.id} style={styles.adminCard}>
                  {/* Left accent bar */}
                  <View style={[styles.cardAccentBar, { backgroundColor: cfg.color }]} />

                  <View style={styles.cardInner}>
                    {/* Identity */}
                    <View style={styles.identityRow}>
                      <AdminAvatar name={admin.name} role={admin.user_role} />
                      <View style={styles.adminInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.adminName}>{admin.name}</Text>
                          <View style={[styles.roleBadge, { borderColor: cfg.color + '60', backgroundColor: cfg.faint }]}>
                            <Text style={[styles.roleBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.adminEmail}>{admin.email}</Text>
                        <Text style={styles.adminMeta}>
                          Added {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>

                    {/* Role selector */}
                    <View style={styles.roleSelector}>
                      <Text style={styles.roleSelectorLabel}>ROLE</Text>
                      <View style={styles.roleButtons}>
                        {(['admin', 'super_admin'] as UserRole[]).map((role) => {
                          const rCfg = ROLE_CONFIG[role];
                          const isActive = admin.user_role === role;
                          return (
                            <Pressable
                              key={role}
                              style={[
                                styles.roleBtn,
                                { borderColor: isActive ? rCfg.color : D.dividerStrong },
                                isActive && { backgroundColor: rCfg.faint },
                              ]}
                              onPress={() => handleUpdateRole(admin.id, role)}
                            >
                              <Text style={[styles.roleBtnText, { color: isActive ? rCfg.color : D.textMuted }]}>
                                {rCfg.label}
                              </Text>
                            </Pressable>
                          );
                        })}

                        {/* Delete */}
                        <Pressable style={styles.deleteBtn} onPress={() => handleDeleteAdmin(admin.id, admin.name)}>
                          <IconSymbol name="trash.fill" size={14} color={D.danger} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredAdmins.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol name="shield.lefthalf.filled" size={36} color={D.textMuted} />
                <Text style={styles.emptyText}>NO ADMINS FOUND</Text>
                <Pressable style={styles.promoteBtn} onPress={handlePromoteUser}>
                  <Text style={styles.promoteBtnText}>PROMOTE A USER</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
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
  addBtn: { padding: 4 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.divider,
  },
  searchInput: { flex: 1, fontSize: 14, color: D.textPrimary, letterSpacing: 0.2 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: D.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: D.divider,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: D.surfaceRaised,
    borderRightWidth: 1,
    borderRightColor: D.divider,
  },
  statValue: { fontSize: 20, fontWeight: '300', color: D.textPrimary, letterSpacing: 0.5 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: D.textMuted, marginTop: 4 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },

  listContainer: { paddingHorizontal: 20, gap: 10 },

  adminCard: {
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: D.divider,
  },
  cardAccentBar: { width: 2 },
  cardInner: { flex: 1, padding: 16 },

  identityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  adminInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 },
  adminName: { fontSize: 15, fontWeight: '500', color: D.textPrimary, letterSpacing: 0.2 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: D.radius,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
  adminEmail: { fontSize: 12, color: D.textSecondary },
  adminMeta: { fontSize: 11, color: D.textMuted, marginTop: 2 },

  roleSelector: {
    borderTopWidth: 1,
    borderTopColor: D.divider,
    paddingTop: 12,
  },
  roleSelectorLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: D.textMuted, marginBottom: 8 },
  roleButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: D.radius,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleBtnText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: D.radius,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: D.dangerFaint,
    borderWidth: 1,
    borderColor: D.danger + '55',
  },

  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  promoteBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.goldDim,
    backgroundColor: D.goldFaint,
  },
  promoteBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.gold },
});