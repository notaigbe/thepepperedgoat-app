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
import { colors } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// ─── Design tokens (matches admin suite) ──────────────────────────────────────
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
  radius: 4,
};

const ADMIN_STORAGE_KEYS = {
  REMEMBER_ME:    "@admin_remember_me",
  SAVED_USERNAME: "@admin_saved_username",
  SAVED_PASSWORD: "@admin_saved_password",
};

const ADMIN_SECTIONS = [
  { id: "menu",                title: "Menu",               description: "Items, categories & availability", icon: "fork.knife" as const,               route: "/admin/menu",                color: D.gold,       superAdminOnly: false },
  { id: "orders",              title: "Orders",             description: "View and update order statuses",   icon: "receipt" as const,                  route: "/admin/orders",              color: "#C07A10",    superAdminOnly: false },
  { id: "users",               title: "Users",              description: "Accounts, points & RSVPs",         icon: "person.3" as const,                 route: "/admin/users",               color: D.textSecondary, superAdminOnly: false },
  { id: "admins",              title: "Admin Access",       description: "Roles & permissions",              icon: "shield.lefthalf.filled" as const,   route: "/admin/admins",              color: D.danger,     superAdminOnly: true  },
  { id: "notifications",       title: "Notifications",      description: "Broadcast to customers",           icon: "bell.fill" as const,                route: "/admin/notifications",       color: D.gold,       superAdminOnly: false },
  { id: "analytics",           title: "Analytics",          description: "Revenue, orders & engagement",     icon: "chart.bar" as const,                route: "/admin/analytics",           color: D.textSecondary, superAdminOnly: true  },
  { id: "delivery",            title: "Delivery",           description: "Uber Direct & DoorDash config",    icon: "shipping.truck.fill" as const,      route: "/admin/delivery-settings",   color: "#C07A10",    superAdminOnly: false },
  { id: "notification-emails", title: "Email Recipients",   description: "Admin notification emails",        icon: "envelope" as const,                 route: "/admin/notification-emails", color: D.gold,       superAdminOnly: true  },
];

export default function AdminDashboard() {
  const router                          = useRouter();
  const { signIn, isAuthenticated, signOut } = useAuth();
  const { userProfile }                 = useApp();
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [rememberMe, setRememberMe]     = useState(false);
  const [viewAsAdmin, setViewAsAdmin]   = useState(false);
  const [stats, setStats]               = useState({ totalOrders: 0, activeUsers: 0, revenue: 0 });

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig]   = useState({
    title: "", message: "",
    buttons: [] as Array<{ text: string; onPress: () => void; style?: "default" | "destructive" | "cancel" }>,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType]       = useState<"success" | "error" | "info">("success");

  const showDialog = (title: string, message: string, buttons: typeof dialogConfig.buttons) => {
    setDialogConfig({ title, message, buttons }); setDialogVisible(true);
  };
  const showToast = (type: typeof toastType, message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  // ── Credentials ──────────────────────────────────────────────────────────────
  useEffect(() => { loadSavedCredentials(); }, []);

  const loadSavedCredentials = async () => {
    try {
      const [rem, usr, pwd] = await Promise.all([
        AsyncStorage.getItem(ADMIN_STORAGE_KEYS.REMEMBER_ME),
        AsyncStorage.getItem(ADMIN_STORAGE_KEYS.SAVED_USERNAME),
        AsyncStorage.getItem(ADMIN_STORAGE_KEYS.SAVED_PASSWORD),
      ]);
      if (rem === "true" && usr) { setRememberMe(true); setUsername(usr); if (pwd) setPassword(pwd); }
    } catch {}
  };

  const saveCredentials = async (u: string, p: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.setItem(ADMIN_STORAGE_KEYS.REMEMBER_ME, "true");
        await AsyncStorage.setItem(ADMIN_STORAGE_KEYS.SAVED_USERNAME, u);
        await AsyncStorage.setItem(ADMIN_STORAGE_KEYS.SAVED_PASSWORD, p);
      } else {
        await Promise.all(Object.values(ADMIN_STORAGE_KEYS).map((k) => AsyncStorage.removeItem(k)));
      }
    } catch {}
  };

  const clearSavedCredentials = async () => {
    try { await Promise.all(Object.values(ADMIN_STORAGE_KEYS).map((k) => AsyncStorage.removeItem(k))); } catch {}
  };

  // ── Role helpers ──────────────────────────────────────────────────────────────
  const isAdmin              = userProfile?.userRole === "admin" || userProfile?.userRole === "super_admin";
  const isSuperAdmin         = userProfile?.userRole === "super_admin";
  const effectiveRole        = isSuperAdmin && viewAsAdmin ? "admin" : userProfile?.userRole;
  const isEffectivelyAdmin   = effectiveRole === "admin";
  const shouldShowAnalytics  = isSuperAdmin && !viewAsAdmin;

  // ── Auth handlers ─────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!username || !password) { showToast("error", "Email and password are required"); return; }
    const email = username.includes("@") ? username : `${username}@thepepperedgoat.com`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("error", "Enter a valid email address"); return; }
    if (password.length < 6) { showToast("error", "Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      if (error.message?.includes("Invalid login credentials")) showToast("error", "Invalid email or password");
      else if (error.message?.includes("Email not confirmed")) showToast("error", "Verify your email before signing in");
      else showToast("error", error.message || "Login failed");
    } else {
      showToast("success", "Welcome back");
      await saveCredentials(username, password, rememberMe);
      setPassword(""); setShowPassword(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signOut();
      if (!rememberMe) { setUsername(""); setPassword(""); }
    } catch { showToast("error", "Failed to log out"); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const ordersRes = await orderService.getAllOrders();
      const orders    = ordersRes.data || [];
      let usersQuery  = (supabase as any).from("user_profiles").select("*");
      if (isEffectivelyAdmin) usersQuery = usersQuery.eq("user_role", "user");
      const usersRes = await usersQuery;
      const users    = usersRes.data || [];
      setStats({
        totalOrders: orders.length,
        activeUsers: users.length,
        revenue: orders.reduce((s: number, o: any) => s + (o.total || 0), 0),
      });
    } catch {
      setStats({ totalOrders: 0, activeUsers: 0, revenue: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [isEffectivelyAdmin]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && shouldShowAnalytics) fetchStats();
  }, [isAuthenticated, isAdmin, viewAsAdmin, fetchStats, shouldShowAnalytics]);

  const visibleSections = ADMIN_SECTIONS.filter(
    (s) => !s.superAdminOnly || (isSuperAdmin && !viewAsAdmin)
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
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
            {/* ── Hero gradient ── */}
            <LinearGradient
              colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.loginHero}
            >
              {/* Subtle diagonal gold bloom */}
              <LinearGradient
                colors={["rgba(201,168,76,0.16)", "transparent"]}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <View style={styles.loginIconWrap}>
                <IconSymbol name="shield.lefthalf.filled" size={32} color={D.gold} />
              </View>
              <Text style={styles.loginEyebrow}>THE PEPPERED GOAT</Text>
              <Text style={styles.loginTitle}>Admin</Text>
            </LinearGradient>

            {/* ── Form ── */}
            <View style={styles.loginForm}>

              {/* Email */}
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={styles.inputRow}>
                <IconSymbol name="person" size={16} color={D.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@thepepperedgoat.com"
                  placeholderTextColor={D.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              {/* Password */}
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <IconSymbol name="lock.fill" size={16} color={D.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={D.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Pressable onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPassword(!showPassword); }} disabled={loading}>
                  <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={16} color={D.textMuted} />
                </Pressable>
              </View>

              {/* Remember me */}
              <Pressable
                style={styles.rememberRow}
                onPress={async () => {
                  const next = !rememberMe;
                  setRememberMe(next);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (!next) await clearSavedCredentials();
                }}
                disabled={loading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <IconSymbol name="checkmark" size={11} color={D.surface} />}
                </View>
                <Text style={styles.rememberLabel}>Remember me</Text>
              </Pressable>

              {/* Sign in button */}
              <LinearGradient
                colors={loading ? [D.textMuted, D.textMuted] : [blackGoldLight.GOLD_BRIGHT, D.gold]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.signInBtn, loading && { opacity: 0.55 }]}
              >
                <Pressable style={styles.signInBtnInner} onPress={handleLogin} disabled={loading}>
                  {loading ? (
                    <View style={styles.signInBtnContent}>
                      <ActivityIndicator size="small" color={D.surface} />
                      <Text style={styles.signInBtnText}>SIGNING IN…</Text>
                    </View>
                  ) : (
                    <Text style={styles.signInBtnText}>SIGN IN</Text>
                  )}
                </Pressable>
              </LinearGradient>

              {/* User profile link */}
              <Pressable
                style={styles.switchLink}
                onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile" as any); }}
                disabled={loading}
              >
                <IconSymbol name="person.badge.shield.checkmark" size={14} color={D.textMuted} />
                <Text style={styles.switchLinkText}>Switch to User Profile</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />
        <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message} buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)} currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }} />
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTHENTICATED DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"] as any}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.dashHeader}
        >
          <LinearGradient
            colors={["rgba(201,168,76,0.14)", "transparent"]}
            start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View style={styles.dashHeaderLeft}>
            <Text style={styles.dashEyebrow}>THE PEPPERED GOAT</Text>
            <Text style={styles.dashTitle}>Dashboard</Text>
            <View style={styles.rolePillRow}>
              {isSuperAdmin && !viewAsAdmin ? (
                <View style={[styles.rolePill, { borderColor: D.goldDim, backgroundColor: D.goldFaint }]}>
                  <IconSymbol name="shield.checkered" size={10} color={D.gold} />
                  <Text style={[styles.rolePillText, { color: D.gold }]}>SUPER ADMIN</Text>
                </View>
              ) : (
                <View style={[styles.rolePill, { borderColor: D.dividerStrong }]}>
                  <IconSymbol name="shield.lefthalf.filled" size={10} color={D.textSecondary} />
                  <Text style={[styles.rolePillText, { color: D.textSecondary }]}>ADMIN</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconBtn} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile" as any); }}>
              <IconSymbol name="person.circle.fill" size={20} color={D.gold} />
            </Pressable>
            <Pressable style={styles.headerIconBtn} onPress={handleLogout}>
              <IconSymbol name="rectangle.portrait.and.arrow.forward" size={20} color={D.gold} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Role switcher ── */}
        {isSuperAdmin && (
          <View style={styles.roleSwitcherCard}>
            <View style={styles.roleSwitcherRow}>
              <IconSymbol
                name={viewAsAdmin ? "shield.lefthalf.filled" : "shield.checkered"}
                size={18}
                color={D.gold}
              />
              <View style={styles.roleSwitcherText}>
                <Text style={styles.roleSwitcherTitle}>
                  {viewAsAdmin ? "Viewing as Admin" : "Viewing as Super Admin"}
                </Text>
                <Text style={styles.roleSwitcherHint}>
                  {viewAsAdmin ? "Toggle to restore super admin view" : "Toggle to preview admin view"}
                </Text>
              </View>
              <Switch
                value={viewAsAdmin}
                onValueChange={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewAsAdmin(!viewAsAdmin); }}
                trackColor={{ false: D.dividerStrong, true: D.goldDim }}
                thumbColor={viewAsAdmin ? D.gold : D.textMuted}
              />
            </View>
          </View>
        )}

        {/* ── Stats ── */}
        {shouldShowAnalytics && (
          <>
            <Text style={styles.sectionLabel}>OVERVIEW</Text>
            <View style={styles.statsRow}>
              {[
                { icon: "cart.fill" as const,         label: "ORDERS",  value: stats.totalOrders,                         color: D.gold },
                { icon: "person.3" as const,          label: "USERS",   value: stats.activeUsers,                         color: D.textSecondary },
                { icon: "dollarsign.circle" as const, label: "REVENUE", value: `$${(stats.revenue / 1000).toFixed(1)}K`,  color: D.gold },
              ].map((s) => (
                <LinearGradient
                  key={s.label}
                  colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.statCard}
                >
                  <IconSymbol name={s.icon} size={22} color={s.color} />
                  {statsLoading ? (
                    <ActivityIndicator color={s.color} style={{ marginVertical: 6 }} size="small" />
                  ) : (
                    <Text style={styles.statValue}>{s.value}</Text>
                  )}
                  <Text style={styles.statLabel}>{s.label}</Text>
                </LinearGradient>
              ))}
            </View>
          </>
        )}

        {/* ── Navigation sections ── */}
        <Text style={styles.sectionLabel}>MANAGE</Text>
        <View style={styles.sectionsContainer}>
          {visibleSections.map((section) => (
            <Pressable
              key={section.id}
              style={({ pressed }) => [styles.sectionCard, pressed && { opacity: 0.7 }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(section.route as any); }}
            >
              <View style={[styles.sectionIconWrap, { backgroundColor: section.color + "18", borderColor: section.color + "40" }]}>
                <IconSymbol name={section.icon} size={22} color={section.color} />
              </View>
              <View style={styles.sectionText}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDesc}>{section.description}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={D.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />
      <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message} buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)} currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: D.surface },
  flex:               { flex: 1 },
  scrollContent:      { paddingBottom: 40 },
  loginScrollContent: { flexGrow: 1 },

  // ── Login hero ──
  loginHero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36,
    borderBottomWidth: 1,
    borderBottomColor: D.goldDim,
    overflow: "hidden",
  },
  loginIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: D.goldFaint,
    borderWidth: 1,
    borderColor: D.goldDim,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  loginEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
    color: D.gold,
    marginBottom: 6,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 1,
    color: D.textPrimary,
  },

  // ── Login form ──
  loginForm: {
    padding: 24,
    backgroundColor: D.surface,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: D.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: D.dividerStrong,
  },
  input: {
    flex: 1,
    fontSize: 14,
    letterSpacing: 0.2,
    color: D.textPrimary,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.dividerStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: D.gold,
    borderColor: D.gold,
  },
  rememberLabel: {
    fontSize: 13,
    color: D.textSecondary,
    letterSpacing: 0.3,
  },

  signInBtn: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: D.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  signInBtnInner:   { paddingVertical: 15, alignItems: "center" },
  signInBtnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  signInBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: D.surface,
  },

  switchLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
    opacity: 0.6,
  },
  switchLinkText: {
    fontSize: 12,
    color: D.textSecondary,
    letterSpacing: 0.3,
  },

  // ── Dashboard header ──
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: D.goldDim,
    overflow: "hidden",
  },
  dashHeaderLeft: { flex: 1 },
  dashEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
    color: D.gold,
    marginBottom: 4,
  },
  dashTitle: {
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: 0.5,
    color: D.textPrimary,
    marginBottom: 8,
  },
  rolePillRow: { flexDirection: "row" },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: D.radius,
    borderWidth: 1,
  },
  rolePillText: { fontSize: 8, fontWeight: "700", letterSpacing: 1.5 },

  headerActions: { flexDirection: "row", gap: 6, paddingTop: 2 },
  headerIconBtn: {
    padding: 9,
    borderRadius: D.radius,
    backgroundColor: D.goldFaint,
    borderWidth: 1,
    borderColor: D.goldDim,
  },

  // ── Role switcher ──
  roleSwitcherCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: D.dividerStrong,
  },
  roleSwitcherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleSwitcherText: { flex: 1 },
  roleSwitcherTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: D.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  roleSwitcherHint: {
    fontSize: 11,
    color: D.textMuted,
  },

  // ── Stats ──
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: D.textMuted,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: D.radius,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: D.goldDim,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 0.5,
    color: D.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: D.textMuted,
  },

  // ── Sections ──
  sectionsContainer: {
    paddingHorizontal: 20,
    gap: 1,
  },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: D.surfaceRaised,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: D.radius,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginRight: 14,
  },
  sectionText: { flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
    color: D.textPrimary,
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 12,
    color: D.textSecondary,
  },
});