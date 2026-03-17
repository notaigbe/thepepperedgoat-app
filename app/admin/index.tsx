import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { blackGoldLight } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";

const ADMIN_STORAGE_KEYS = {
  REMEMBER_ME:    '@admin_remember_me',
  SAVED_USERNAME: '@admin_saved_username',
  SAVED_PASSWORD: '@admin_saved_password',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { signIn, isAuthenticated, signOut } = useAuth();
  const { userProfile } = useApp();
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [rememberMe, setRememberMe]     = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, activeUsers: 0, revenue: 0 });
  const [viewAsAdmin, setViewAsAdmin]   = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig]   = useState({
    title: '', message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType]       = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: typeof dialogConfig.buttons) => {
    setDialogConfig({ title, message, buttons }); setDialogVisible(true);
  };
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  useEffect(() => { loadSavedCredentials(); }, []);

  const loadSavedCredentials = async () => {
    try {
      const [rem, usr, pwd] = await Promise.all([
        AsyncStorage.getItem(ADMIN_STORAGE_KEYS.REMEMBER_ME),
        AsyncStorage.getItem(ADMIN_STORAGE_KEYS.SAVED_USERNAME),
        AsyncStorage.getItem(ADMIN_STORAGE_KEYS.SAVED_PASSWORD),
      ]);
      if (rem === 'true' && usr) { setRememberMe(true); setUsername(usr); if (pwd) setPassword(pwd); }
    } catch (e) { console.error('Error loading saved admin credentials:', e); }
  };

  const saveCredentials = async (u: string, p: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.setItem(ADMIN_STORAGE_KEYS.REMEMBER_ME, 'true');
        await AsyncStorage.setItem(ADMIN_STORAGE_KEYS.SAVED_USERNAME, u);
        await AsyncStorage.setItem(ADMIN_STORAGE_KEYS.SAVED_PASSWORD, p);
      } else {
        await AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.REMEMBER_ME);
        await AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.SAVED_USERNAME);
        await AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.SAVED_PASSWORD);
      }
    } catch (e) { console.error('Error saving admin credentials:', e); }
  };

  const clearSavedCredentials = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.REMEMBER_ME),
        AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.SAVED_USERNAME),
        AsyncStorage.removeItem(ADMIN_STORAGE_KEYS.SAVED_PASSWORD),
      ]);
    } catch (e) { console.error('Error clearing saved admin credentials:', e); }
  };

  const isAdmin       = userProfile?.userRole === 'admin' || userProfile?.userRole === 'super_admin';
  const isSuperAdmin  = userProfile?.userRole === 'super_admin';
  const effectiveRole = isSuperAdmin && viewAsAdmin ? 'admin' : userProfile?.userRole;
  const isEffectivelyAdmin   = effectiveRole === 'admin';
  const shouldShowAnalytics  = isSuperAdmin && !viewAsAdmin;

  const handleLogin = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!username || !password) { showToast('error', 'Please enter both email and password'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = username.includes("@") ? username : `${username}@thepepperedgoat.com`;
    if (!emailRegex.test(email)) { showToast('error', 'Please enter a valid email address'); return; }
    if (password.length < 6) { showToast('error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      if (error.message?.includes('Invalid login credentials')) showToast('error', 'Invalid email or password. Please check your credentials and try again.');
      else if (error.message?.includes('Email not confirmed')) showToast('error', 'Please verify your email before signing in.');
      else showToast('error', error.message || 'Login failed. Please try again.');
    } else {
      showToast('success', 'Welcome to Admin Dashboard!');
      await saveCredentials(username, password, rememberMe);
      setPassword(""); setShowPassword(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signOut();
      if (!rememberMe) { setUsername(""); setPassword(""); }
      showToast('success', 'Logged out successfully');
    } catch (e) { showToast('error', 'Failed to log out. Please try again.'); }
  };

  const togglePasswordVisibility = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPassword(!showPassword);
  };

  const toggleRememberMe = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!newValue) await clearSavedCredentials();
  };

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const ordersResponse = await orderService.getAllOrders();
      const orders = ordersResponse.data || [];
      let usersQuery = (supabase as any).from("user_profiles").select("*");
      if (isEffectivelyAdmin) usersQuery = usersQuery.eq('user_role', 'user');
      const usersResponse = await usersQuery;
      const users = usersResponse.data || [];
      setStats({
        totalOrders: orders.length,
        activeUsers: users.length,
        revenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
      setStats({ totalOrders: 0, activeUsers: 0, revenue: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [isEffectivelyAdmin]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && shouldShowAnalytics) fetchStats();
  }, [isAuthenticated, isAdmin, viewAsAdmin, fetchStats, shouldShowAnalytics]);

  const allAdminSections = [
    { id: "menu",       title: "Menu Management",    description: "Add, edit, and remove menu items",      icon: "fork.knife" as const,                         route: "/admin/menu",                color: blackGoldLight.GOLD,       superAdminOnly: false },
    { id: "orders",     title: "Order Management",   description: "View and update order statuses",         icon: "receipt" as const,                             route: "/admin/orders",              color: "#C07A10",                  superAdminOnly: false },
    { id: "users",      title: "User Management",    description: "Manage user accounts and profiles",      icon: "person.3" as const,                            route: "/admin/users",               color: blackGoldLight.SILVER,     superAdminOnly: false },
    { id: "admins",     title: "Admin Management",   description: "Manage admin roles and permissions",     icon: "shield.lefthalf.filled" as const,              route: "/admin/admins",              color: "#C0392B",                  superAdminOnly: true  },
    { id: "notifications", title: "Notifications",   description: "Send push notifications",                icon: "bell.fill" as const,                           route: "/admin/notifications",       color: blackGoldLight.GOLD_BRIGHT, superAdminOnly: false },
    { id: "analytics",  title: "Analytics",          description: "View sales and engagement metrics",      icon: "chart.bar" as const,                           route: "/admin/analytics",           color: blackGoldLight.SILVER,     superAdminOnly: true  },
    { id: "delivery",   title: "Delivery Settings",  description: "Configure Uber Direct delivery",         icon: "truck.box" as const,                           route: "/admin/delivery-settings",   color: "#C07A10",                  superAdminOnly: false },
    { id: "notification-emails", title: "Notification Emails", description: "Manage admin email recipients", icon: "envelope.badge" as const,                   route: "/admin/notification-emails", color: blackGoldLight.GOLD,       superAdminOnly: true  },
  ];

  const adminSections = allAdminSections.filter(
    (s) => !s.superAdminOnly || (isSuperAdmin && !viewAsAdmin)
  );

  const handleSectionPress = (route: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };
  const handleUserProfilePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/profile" as any);
  };
  const handleToggleViewMode = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewAsAdmin(!viewAsAdmin);
  };

  // ─── Login screen ─────────────────────────────────────────────────
  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.loginScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginContainer}>
              {/* Login header — dark with gold bloom */}
              <LinearGradient
                colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.loginHeaderGradient}
              >
                <LinearGradient
                  colors={["rgba(212,168,58,0.18)", "rgba(184,146,42,0.06)", "transparent"]}
                  start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                <View style={styles.loginHeader}>
                  <View style={styles.loginIconWrap}>
                    <IconSymbol name="shield.lefthalf.filled" size={36} color={blackGoldLight.GOLD} />
                  </View>
                  <Text style={styles.loginTitle}>Admin Dashboard</Text>
                  <Text style={styles.loginSubtitle}>The Peppered Goat</Text>
                </View>
              </LinearGradient>

              <View style={styles.loginForm}>
                <View style={styles.inputContainer}>
                  <IconSymbol name="person" size={20} color={blackGoldLight.INK_MID} />
                  <TextInput
                    style={styles.input} placeholder="Email or Username"
                    placeholderTextColor={blackGoldLight.INK_SOFT}
                    value={username} onChangeText={setUsername}
                    autoCapitalize="none" keyboardType="email-address" editable={!loading}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <IconSymbol name="lock.fill" size={20} color={blackGoldLight.INK_MID} />
                  <TextInput
                    style={styles.input} placeholder="Password"
                    placeholderTextColor={blackGoldLight.INK_SOFT}
                    value={password} onChangeText={setPassword}
                    secureTextEntry={!showPassword} autoCapitalize="none" editable={!loading}
                  />
                  <Pressable onPress={togglePasswordVisibility} style={styles.eyeBtn} disabled={loading}>
                    <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={20} color={blackGoldLight.INK_MID} />
                  </Pressable>
                </View>

                <Pressable style={styles.rememberMeContainer} onPress={toggleRememberMe} disabled={loading}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <IconSymbol name="checkmark" size={14} color={blackGoldLight.INK_WHITE} />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </Pressable>

                <LinearGradient
                  colors={loading
                    ? [blackGoldLight.INK_MID, blackGoldLight.INK_MID]
                    : [blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]
                  }
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, loading && { opacity: 0.65 }]}
                >
                  <Pressable style={styles.loginButtonInner} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                      <View style={styles.loginButtonContent}>
                        <ActivityIndicator size="small" color={blackGoldLight.INK_WHITE} />
                        <Text style={styles.loginButtonText}>Signing In...</Text>
                      </View>
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </Pressable>
                </LinearGradient>

                <Pressable style={styles.userProfileButton} onPress={handleUserProfilePress} disabled={loading}>
                  <IconSymbol name="person.badge.shield.checkmark" size={16} color={blackGoldLight.INK_MID} />
                  <Text style={styles.userProfileButtonText}>Switch to User Profile</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} currentColors={{}} />
        <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message} buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)} currentColors={{}} />
      </SafeAreaView>
    );
  }

  // ─── Authenticated admin dashboard ───────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Dashboard header ── */}
        <LinearGradient
          colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.dashHeader}
        >
          <LinearGradient
            colors={["rgba(212,168,58,0.18)", "transparent"]}
            start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />
          <View style={styles.dashHeaderLeft}>
            <Text style={styles.dashTitle}>Admin Dashboard</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.dashSubtitle}>The Peppered Goat Management</Text>
              {isSuperAdmin && !viewAsAdmin && (
                <View style={[styles.badge, { backgroundColor: blackGoldLight.GOLD }]}>
                  <IconSymbol name="shield.checkered" size={10} color={blackGoldLight.INK_WHITE} />
                  <Text style={styles.badgeText}>Super Admin</Text>
                </View>
              )}
              {((isAdmin && !isSuperAdmin) || (isSuperAdmin && viewAsAdmin)) && (
                <View style={[styles.badge, { backgroundColor: blackGoldLight.INK_MID }]}>
                  <IconSymbol name="shield.lefthalf.filled" size={10} color={blackGoldLight.INK_WHITE} />
                  <Text style={styles.badgeText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerButtons}>
            <Pressable style={styles.headerIconBtn} onPress={handleUserProfilePress}>
              <IconSymbol name="person.circle.fill" size={22} color={blackGoldLight.GOLD} />
            </Pressable>
            <Pressable style={styles.headerIconBtn} onPress={handleLogout}>
              <IconSymbol name="rectangle.portrait.and.arrow.forward" size={22} color={blackGoldLight.GOLD} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Role switcher ── */}
        {isSuperAdmin && (
          <View style={styles.roleSwitcherContainer}>
            <View style={styles.roleSwitcher}>
              <View style={styles.roleSwitcherLeft}>
                <IconSymbol name={viewAsAdmin ? "shield.lefthalf.filled" : "shield.checkered"} size={20} color={blackGoldLight.GOLD} />
                <Text style={styles.roleSwitcherLabel}>
                  {viewAsAdmin ? "Viewing as Admin" : "Viewing as Super Admin"}
                </Text>
              </View>
              <Switch
                value={viewAsAdmin} onValueChange={handleToggleViewMode}
                trackColor={{ false: blackGoldLight.BORDER_LIGHT, true: blackGoldLight.GOLD }}
                thumbColor={blackGoldLight.INK_WHITE}
                ios_backgroundColor={blackGoldLight.BORDER_LIGHT}
              />
            </View>
            <Text style={styles.roleSwitcherHint}>
              {viewAsAdmin ? "Toggle to view super admin features" : "Toggle to preview admin view"}
            </Text>
          </View>
        )}

        {/* ── Stats ── */}
        {shouldShowAnalytics && (
          <View style={styles.statsContainer}>
            {[
              { icon: "cart.fill",        label: "Total Orders", value: stats.totalOrders,                        color: blackGoldLight.GOLD,       loading: statsLoading },
              { icon: "person.3",         label: "Total Users",  value: stats.activeUsers,                        color: blackGoldLight.SILVER,     loading: statsLoading },
              { icon: "dollarsign.circle",label: "Revenue",      value: `$${(stats.revenue / 1000).toFixed(1)}K`, color: blackGoldLight.GOLD_BRIGHT, loading: statsLoading },
            ].map((stat) => (
              <LinearGradient
                key={stat.label}
                colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <IconSymbol name={stat.icon as any} size={28} color={stat.color} />
                {stat.loading
                  ? <ActivityIndicator color={stat.color} style={{ marginVertical: 6 }} />
                  : <Text style={styles.statValue}>{stat.value}</Text>
                }
                <Text style={styles.statLabel}>{stat.label}</Text>
              </LinearGradient>
            ))}
          </View>
        )}

        {/* ── Section cards ── */}
        <View style={styles.sectionsContainer}>
          {adminSections.map((section) => (
            <Pressable
              key={section.id}
              style={({ pressed }) => [styles.sectionCard, pressed && { opacity: 0.75 }]}
              onPress={() => handleSectionPress(section.route)}
            >
              <View style={[styles.sectionIcon, { backgroundColor: section.color + "22" }]}>
                <IconSymbol name={section.icon} size={28} color={section.color} />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={blackGoldLight.INK_MID} />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>✅ Connected to Supabase for real-time syncing</Text>
        </View>
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} currentColors={{}} />
      <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message} buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)} currentColors={{}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: blackGoldLight.BODY_BG },
  flex:              { flex: 1 },
  scrollContent:     { paddingBottom: 40 },
  loginScrollContent:{ flexGrow: 1 },

  // Login
  loginContainer: { flex: 1, justifyContent: 'center', minHeight: 600 },
  loginHeaderGradient: {
    borderBottomWidth: 1, borderBottomColor: blackGoldLight.BORDER_GOLD,
    overflow: 'hidden', position: 'relative',
  },
  loginHeader: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28, gap: 6, zIndex: 1 },
  loginIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  loginTitle:    { fontSize: 26, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_WHITE },
  loginSubtitle: { fontSize: 14, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_SILVER },
  loginForm:     { padding: 24 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    marginBottom: 14, borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK },
  eyeBtn: { padding: 4 },
  rememberMeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: -4, gap: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: blackGoldLight.GOLD, borderColor: blackGoldLight.GOLD },
  rememberMeText: { fontSize: 14, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID },
  loginButton: {
    borderRadius: 36, overflow: 'hidden', marginTop: 4,
    shadowColor: blackGoldLight.GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  loginButtonInner: { paddingVertical: 16, alignItems: 'center' },
  loginButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginButtonText: { fontSize: 16, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_WHITE },
  userProfileButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 10, gap: 6, opacity: 0.7 },
  userProfileButtonText: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID },

  // Dashboard header
  dashHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: blackGoldLight.BORDER_GOLD,
    overflow: 'hidden', position: 'relative',
  },
  dashHeaderLeft: { flex: 1 },
  dashTitle: { fontSize: 24, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_WHITE },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  dashSubtitle: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_SILVER },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  badgeText: { fontSize: 10, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK_WHITE },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    padding: 8, backgroundColor: 'rgba(184,146,42,0.15)',
    borderRadius: 10, borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
  },

  // Role switcher
  roleSwitcherContainer: {
    margin: 16, marginBottom: 8,
    backgroundColor: blackGoldLight.CARD_BG, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  roleSwitcher:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleSwitcherLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  roleSwitcherLabel: { fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK },
  roleSwitcherHint:  { fontSize: 12, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID, marginTop: 6 },

  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 16 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: blackGoldLight.GOLD, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK, marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID, marginTop: 3, textAlign: 'center' },

  // Sections
  sectionsContainer: { paddingHorizontal: 16, gap: 10 },
  sectionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: blackGoldLight.CARD_BG, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: blackGoldLight.BORDER_LIGHT,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  sectionContent: { flex: 1 },
  sectionTitle: { fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: blackGoldLight.INK },
  sectionDescription: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID, marginTop: 2 },

  // Footer
  footer:     { padding: 24, alignItems: 'center' },
  footerText: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: blackGoldLight.INK_MID, textAlign: 'center' },
});