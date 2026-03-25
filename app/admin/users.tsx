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
import { supabase } from '@/app/integrations/supabase/client';
import { userService, eventService } from '@/services/supabaseService';
import { useApp } from '@/contexts/AppContext';
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
  teal: "#4ECDC4",
  tealFaint: "#4ECDC418",
  radius: 4,
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  // points: number;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  active: boolean;
  userRole: 'user' | 'admin' | 'super_admin';
}

interface UserRSVP {
  id: string;
  event_id: string;
  event: { id: string; title: string; date: string };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ name, role }: { name: string; role: User['userRole'] }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const bg = role === 'super_admin' ? D.orange : role === 'admin' ? D.purple : D.gold;
  return (
    <View style={[avatarStyles.circle, { backgroundColor: bg + '30', borderColor: bg + '60' }]}>
      <Text style={[avatarStyles.initials, { color: bg }]}>{initials}</Text>
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

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: User['userRole'] }) {
  if (role === 'user') return null;
  const isSA = role === 'super_admin';
  return (
    <View style={[badgeStyles.badge, { borderColor: isSA ? D.orange + '70' : D.purple + '70', backgroundColor: isSA ? D.orangeFaint : D.purpleFaint }]}>
      <Text style={[badgeStyles.text, { color: isSA ? D.orange : D.purple }]}>
        {isSA ? 'SUPER ADMIN' : 'ADMIN'}
      </Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: D.radius,
    borderWidth: 1,
  },
  text: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
});

export default function AdminUserManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRSVPs, setUserRSVPs] = useState<UserRSVP[]>([]);
  const [loadingRSVPs, setLoadingRSVPs] = useState(false);
  const [bannedEvents, setBannedEvents] = useState<Set<string>>(new Set());

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

  const isSuperAdmin = userProfile?.userRole === 'super_admin';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      let query = (supabase as any).from('user_profiles').select('*');
      if (!isSuperAdmin) query = query.eq('user_role', 'user');
      const { data: userProfiles, error: usersError } = await query;
      if (usersError) throw usersError;
      const { data: orders, error: ordersError } = await (supabase as any).from('orders').select('user_id, total, created_at');
      if (ordersError) throw ordersError;
      const formattedUsers: User[] = (userProfiles || []).map((profile: any) => {
        const userOrders = (orders || []).filter((o: any) => o.user_id === profile.id);
        const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        return {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || 'N/A',
          // points: profile.points || 0,
          totalOrders: userOrders.length,
          totalSpent,
          joinDate: profile.created_at || new Date().toISOString(),
          active: true,
          userRole: profile.user_role || 'user',
        };
      });
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const loadUserRSVPs = async (userId: string) => {
    try {
      setLoadingRSVPs(true);
      const { data, error } = await eventService.getUserRSVPs(userId);
      if (error) { showToast('error', 'Failed to load RSVPs'); return; }
      setUserRSVPs(data || []);
      const { data: bans, error: bansError } = await eventService.getUserEventBans(userId);
      if (!bansError && bans) setBannedEvents(new Set(bans.map((ban: any) => ban.event_id)));
    } catch { showToast('error', 'Failed to load RSVPs'); }
    finally { setLoadingRSVPs(false); }
  };

  const handleViewUserDetails = async (user: User) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUser(user);
    await loadUserRSVPs(user.id);
  };

  const handleCancelUserRSVP = (userId: string, eventId: string, eventTitle: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showDialog('Cancel RSVP', `Cancel "${eventTitle}" for this user?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Confirm', style: 'destructive', onPress: async () => {
        const { error } = await eventService.adminCancelRSVP(userId, eventId);
        if (error) { showToast('error', 'Failed to cancel RSVP'); return; }
        showToast('success', 'RSVP cancelled');
        if (selectedUser) await loadUserRSVPs(selectedUser.id);
      }},
    ]);
  };

  const handleBanUserFromEvent = (userId: string, eventId: string, eventTitle: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showDialog('Ban from Event', `Ban this user from "${eventTitle}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Ban', style: 'destructive', onPress: async () => {
        const { error } = await eventService.banUserFromEvent(userId, eventId, 'Banned by admin');
        if (error) { showToast('error', 'Failed to ban user'); return; }
        showToast('success', 'User banned from event');
        if (selectedUser) await loadUserRSVPs(selectedUser.id);
      }},
    ]);
  };

  const handleUnbanUserFromEvent = (userId: string, eventId: string, eventTitle: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showDialog('Unban from Event', `Unban this user from "${eventTitle}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Unban', onPress: async () => {
        const { error } = await eventService.unbanUserFromEvent(userId, eventId);
        if (error) { showToast('error', 'Failed to unban user'); return; }
        showToast('success', 'User unbanned');
        if (selectedUser) await loadUserRSVPs(selectedUser.id);
      }},
    ]);
  };

  const handlePromoteToAdmin = (userId: string, userName: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showDialog('Promote to Admin', `Promote ${userName} to admin?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Promote', onPress: async () => {
        const { error } = await userService.updateUserRole(userId, 'admin');
        if (error) { showToast('error', 'Failed to promote'); return; }
        showToast('success', `${userName} promoted`);
        fetchUsers();
      }},
    ]);
  };

  const handleRevokeAdmin = (userId: string, userName: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showDialog('Revoke Admin', `Revoke admin from ${userName}?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        const { error } = await userService.updateUserRole(userId, 'user');
        if (error) { showToast('error', 'Failed to revoke'); return; }
        showToast('success', `Admin revoked from ${userName}`);
        fetchUsers();
      }},
    ]);
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeRegularUsers = users.filter((u) => u.active && u.userRole === 'user').length;

  const toastEl = <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)}
    currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />;
  const dialogEl = <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message}
    buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)}
    currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }} />;

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedUser(null); setUserRSVPs([]); setBannedEvents(new Set());
          }}>
            <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>USER DETAIL</Text>
            <Text style={styles.headerTitle}>{selectedUser.name}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* User info rows */}
          <View style={styles.infoSection}>
            {[
              { label: 'EMAIL', value: selectedUser.email },
              { label: 'PHONE', value: selectedUser.phone },
              // { label: 'POINTS', value: selectedUser.points.toLocaleString() },
              { label: 'ROLE', value: selectedUser.userRole.replace('_', ' ').toUpperCase() },
            ].map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* RSVPs */}
          <Text style={styles.sectionLabel}>EVENT RSVPS</Text>

          {loadingRSVPs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={D.gold} />
            </View>
          ) : userRSVPs.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={32} color={D.textMuted} />
              <Text style={styles.emptyText}>NO RSVPS</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {userRSVPs.map((rsvp) => {
                const isBanned = bannedEvents.has(rsvp.event_id);
                return (
                  <View key={rsvp.id} style={styles.rsvpRow}>
                    <View style={styles.rsvpInfo}>
                      <Text style={styles.rsvpTitle}>{rsvp.event.title}</Text>
                      <Text style={styles.rsvpDate}>
                        {new Date(rsvp.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      {isBanned && (
                        <View style={styles.bannedBadge}>
                          <Text style={styles.bannedBadgeText}>BANNED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.rsvpButtons}>
                      <Pressable style={styles.rsvpBtn} onPress={() => handleCancelUserRSVP(selectedUser.id, rsvp.event_id, rsvp.event.title)}>
                        <IconSymbol name="xmark" size={13} color={D.danger} />
                      </Pressable>
                      {isBanned ? (
                        <Pressable style={[styles.rsvpBtn, styles.rsvpBtnSuccess]} onPress={() => handleUnbanUserFromEvent(selectedUser.id, rsvp.event_id, rsvp.event.title)}>
                          <IconSymbol name="checkmark" size={13} color={D.success} />
                        </Pressable>
                      ) : (
                        <Pressable style={[styles.rsvpBtn, styles.rsvpBtnDanger]} onPress={() => handleBanUserFromEvent(selectedUser.id, rsvp.event_id, rsvp.event.title)}>
                          <IconSymbol name="nosign" size={13} color={D.danger} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
        {toastEl}{dialogEl}
      </SafeAreaView>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (router.canGoBack()) router.back(); else router.replace('/(admin)' as any);
        }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Users</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={16} color={D.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          placeholderTextColor={D.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { value: users.length, label: isSuperAdmin ? 'TOTAL' : 'USERS' },
            { value: activeRegularUsers, label: 'ACTIVE' },
            // { value: users.reduce((s, u) => s + u.points, 0).toLocaleString(), label: 'POINTS' },
          ].map((s) => (
            <View key={s.label} style={styles.statCell}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{filteredUsers.length} MEMBERS</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={D.gold} />
            <Text style={styles.loadingText}>LOADING</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredUsers.map((user) => (
              <Pressable key={user.id} style={styles.userRow} onPress={() => handleViewUserDetails(user)}>
                <UserAvatar name={user.name} role={user.userRole} />
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <RoleBadge role={user.userRole} />
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <View style={styles.userMetaRow}>
                    <Text style={styles.userMeta}>{user.totalOrders} orders</Text>
                    <Text style={styles.userMetaDot}>·</Text>
                    <Text style={styles.userMeta}>${user.totalSpent.toFixed(0)} spent</Text>
                    <Text style={styles.userMetaDot}>·</Text>
                    {/* <Text style={styles.userMeta}>{user.points} pts</Text> */}
                  </View>
                </View>
                <View style={styles.userRowActions}>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // router.push({ pathname: '/admin/manage-points', params: { userId: user.id, userName: user.name, currentPoints: user.points.toString() } } as any);
                    }}
                  >
                    <IconSymbol name="star.circle.fill" size={18} color={D.gold} />
                  </Pressable>
                  {isSuperAdmin && user.userRole !== 'super_admin' && (
                    <Pressable
                      style={styles.iconBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        user.userRole === 'admin' ? handleRevokeAdmin(user.id, user.name) : handlePromoteToAdmin(user.id, user.name);
                      }}
                    >
                      <IconSymbol
                        name={user.userRole === 'admin' ? 'minus.circle.fill' : 'shield.lefthalf.filled'}
                        size={18}
                        color={user.userRole === 'admin' ? D.danger : D.purple}
                      />
                    </Pressable>
                  )}
                  <IconSymbol name="chevron.right" size={14} color={D.textMuted} />
                </View>
              </Pressable>
            ))}

            {filteredUsers.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol name="person.2" size={36} color={D.textMuted} />
                <Text style={styles.emptyText}>NO USERS FOUND</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      {toastEl}{dialogEl}
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

  listContainer: { paddingHorizontal: 20, gap: 1 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surfaceRaised,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userName: { fontSize: 15, fontWeight: '500', letterSpacing: 0.2, color: D.textPrimary },
  userEmail: { fontSize: 12, color: D.textSecondary, marginTop: 2 },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  userMeta: { fontSize: 11, color: D.textMuted, fontWeight: '500' },
  userMetaDot: { fontSize: 11, color: D.textMuted },
  userRowActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 8 },

  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },

  // Detail view
  infoSection: { marginHorizontal: 20, marginTop: 20, borderRadius: D.radius, overflow: 'hidden', borderWidth: 1, borderColor: D.divider },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: D.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  infoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  infoValue: { fontSize: 14, color: D.textPrimary, fontWeight: '400', letterSpacing: 0.2 },

  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surfaceRaised,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  rsvpInfo: { flex: 1 },
  rsvpTitle: { fontSize: 14, fontWeight: '500', color: D.textPrimary, letterSpacing: 0.2 },
  rsvpDate: { fontSize: 11, color: D.textSecondary, marginTop: 3 },
  bannedBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: D.dangerFaint,
    borderWidth: 1,
    borderColor: D.danger + '55',
    borderRadius: D.radius,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bannedBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: D.danger },
  rsvpButtons: { flexDirection: 'row', gap: 6 },
  rsvpBtn: {
    width: 32, height: 32,
    borderRadius: D.radius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: D.dividerStrong,
  },
  rsvpBtnDanger: { backgroundColor: D.dangerFaint, borderColor: D.danger + '55' },
  rsvpBtnSuccess: { backgroundColor: D.successFaint, borderColor: D.success + '55' },
});