import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";
import Toast from "@/components/Toast";
import Dialog from "@/components/Dialog";
import { ActivityIndicator } from "react-native";
import { supabase } from "@/app/integrations/supabase/client";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { blackGoldLight } from "@/styles/commonStyles";

const STORAGE_KEYS = {
  REMEMBER_ME: '@remember_me',
  SAVED_EMAIL: '@saved_email',
  SAVED_PASSWORD: '@saved_password',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { currentColors, userProfile, showToast, loadUserProfile } = useApp();
  const { isAuthenticated, signIn, signUp, signOut, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  const isAdmin = userProfile?.userRole === 'admin' || userProfile?.userRole === 'super_admin';

  useEffect(() => { loadSavedCredentials(); }, []);

  const loadSavedCredentials = async () => {
    try {
      const [savedRememberMe, savedEmail, savedPassword] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD),
      ]);
      if (savedRememberMe === 'true' && savedEmail) {
        setRememberMe(true); setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
      }
    } catch (error) { console.error('Error loading saved credentials:', error); }
  };

  const saveCredentials = async (e: string, p: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, e);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, p);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
      }
    } catch (error) { console.error('Error saving credentials:', error); }
  };

  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
    } catch (error) { console.error('Error clearing credentials:', error); }
  };

  useEffect(() => {
  const fetchProfileImage = async () => {
    if (!userProfile?.profileImage || !isAuthenticated) return;
    setImageLoading(true);
    try {
      const path = userProfile.profileImage;
      
      // Only use path directly if it's truly a storage path, never a signed URL
      if (path.startsWith('http')) {
        // Stale signed URL in DB — do NOT use it, just show placeholder
        setProfileImageUrl(null);
        return;
      }
      
      const { data, error } = await supabase.storage
        .from('profile')
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      
      if (error || !data?.signedUrl) {
        setProfileImageUrl(null);
        return;
      }
      
      setProfileImageUrl(data.signedUrl);
    } catch (err) {
      console.error('Failed to load profile image:', err);
      setProfileImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };
  
  fetchProfileImage();
}, [userProfile?.profileImage, isAuthenticated]);

  const handleRefresh = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await loadUserProfile();
      showLocalToast('success', 'Profile refreshed');
    } catch (error) {
      showLocalToast('error', 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const showLocalToast = (type: "success" | "error" | "info", message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  const showDialog = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  ) => {
    setDialogConfig({ title, message, buttons }); setDialogVisible(true);
  };

  const handleAuth = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) { showLocalToast("error", "Please fill in all required fields"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showLocalToast("error", "Please enter a valid email address"); return; }
    if (password.length < 6) { showLocalToast("error", "Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name) { showLocalToast("error", "Please enter your name"); setLoading(false); return; }
        const { error } = await signUp(email, password, name, phone, inviteCode);
        if (error) {
          if (error.message?.includes('already registered')) showLocalToast("error", "This email is already registered. Please sign in instead.");
          else showLocalToast("error", error.message || "Sign up failed. Please try again.");
        } else {
          showLocalToast("success", "Account created! Please check your email to verify your account.");
          await saveCredentials(email, password, rememberMe);
          setEmail(""); setPassword(""); setName(""); setPhone(""); setInviteCode("");
          setIsSignUp(false); setShowPassword(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.includes('Invalid login credentials')) showLocalToast("error", "Invalid email or password. Please try again.");
          else if (error.message?.includes('Email not confirmed')) showLocalToast("error", "Please verify your email before signing in.");
          else showLocalToast("error", error.message || "Sign in failed. Please try again.");
        } else {
          showLocalToast("success", "Welcome back!");
          await saveCredentials(email, password, rememberMe);
          setPassword(""); setShowPassword(false);
        }
      }
    } catch (error: any) {
      showLocalToast("error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showDialog("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            setName(""); setPhone(""); setInviteCode(""); setIsSignUp(false); setShowPassword(false);
            if (!rememberMe) { setEmail(""); setPassword(""); }
            showLocalToast("success", "Signed out successfully");
          } catch (error) {
            showLocalToast("error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleMenuPress = (route: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const toggleRememberMe = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!newValue) await clearSavedCredentials();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showLocalToast('info', 'Enter your email above, then tap "Forgot password?"');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showLocalToast('error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) showLocalToast('error', error.message || 'Failed to send reset email');
      else showLocalToast('success', 'Password reset email sent — check your inbox');
    } finally {
      setLoading(false);
    }
  };

  // ── Auth screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={blackGoldLight.HEADER_TOP} />
        <SafeAreaView style={styles.flex} edges={["top"]}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            {/* Dark header with radial gold bloom */}
            <LinearGradient
              colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authHeaderContainer}
            >
              {/* Gold bloom — top-right, mirrors WelcomeHeader */}
              <LinearGradient
                colors={[blackGoldLight.GOLD, "rgba(184,146,42,0.07)", "transparent"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerBloom}
                pointerEvents="none"
              />
              <View style={styles.authHeaderInner}>
                <IconSymbol name="person.circle.fill" size={52} color={blackGoldLight.SILVER_SOFT} />
                <Text style={styles.authTitle}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>
                <Text style={styles.authSubtitle}>
                  {isSignUp ? "Sign up to start earning points" : "Sign in to your account"}
                </Text>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.authContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.authForm}>
                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <IconSymbol name="person" size={18} color={blackGoldLight.INK_MID} />
                    <TextInput style={styles.input} placeholder="Full Name"
                      placeholderTextColor={blackGoldLight.INK_SOFT}
                      value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <IconSymbol name="envelope" size={18} color={blackGoldLight.INK_MID} />
                  <TextInput style={styles.input} placeholder="Email"
                    placeholderTextColor={blackGoldLight.INK_SOFT}
                    value={email} onChangeText={setEmail} autoCapitalize="none"
                    keyboardType="email-address" editable={!loading} />
                </View>

                <View style={styles.inputContainer}>
                  <IconSymbol name="lock" size={18} color={blackGoldLight.INK_MID} />
                  <TextInput style={styles.input} placeholder="Password"
                    placeholderTextColor={blackGoldLight.INK_SOFT}
                    value={password} onChangeText={setPassword}
                    secureTextEntry={!showPassword} autoCapitalize="none" editable={!loading} />
                  <Pressable
                    onPress={() => { setShowPassword(!showPassword); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} disabled={loading}
                  >
                    <IconSymbol name={showPassword ? "eye.slash.fill" : "eye.fill"} size={18} color={blackGoldLight.INK_MID} />
                  </Pressable>
                </View>

                {!isSignUp && (
                  <>
                    <Pressable style={styles.rememberMeContainer} onPress={toggleRememberMe} disabled={loading}>
                      <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && <IconSymbol name="checkmark" size={12} color={blackGoldLight.INK_WHITE} />}
                      </View>
                      <Text style={styles.rememberMeText}>Remember me</Text>
                    </Pressable>
                    <Pressable style={styles.forgotPasswordButton} onPress={handleForgotPassword} disabled={loading}>
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </Pressable>
                  </>
                )}

                {isSignUp && (
                  <>
                    <View style={styles.inputContainer}>
                      <IconSymbol name="phone.fill" size={18} color={blackGoldLight.INK_MID} />
                      <TextInput style={styles.input} placeholder="Phone (optional)"
                        placeholderTextColor={blackGoldLight.INK_SOFT}
                        value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!loading} />
                    </View>
                    <View style={styles.inputContainer}>
                      <IconSymbol name="gift.fill" size={18} color={blackGoldLight.INK_MID} />
                      <TextInput style={styles.input} placeholder="Invite Code (optional)"
                        placeholderTextColor={blackGoldLight.INK_SOFT}
                        value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" editable={!loading} />
                    </View>
                    <Text style={styles.inviteCodeHint}>Have a referral code? Enter it to earn bonus points!</Text>
                  </>
                )}

                {/* Auth button — gold gradient pill */}
                <LinearGradient
                  colors={loading
                    ? [blackGoldLight.INK_MID, blackGoldLight.INK_MID]
                    : [blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.authButton, loading && { opacity: 0.65 }]}
                >
                  <Pressable
                    style={styles.authButtonInner}
                    onPress={handleAuth}
                    disabled={loading}
                    android_ripple={{ color: "rgba(255,255,255,0.15)" }}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={blackGoldLight.INK_WHITE} />
                        <Text style={styles.authButtonText}>Please wait...</Text>
                      </View>
                    ) : (
                      <Text style={styles.authButtonText}>{isSignUp ? "Sign Up" : "Sign In"}</Text>
                    )}
                  </Pressable>
                </LinearGradient>

                <Pressable style={styles.switchButton} onPress={() => {
                  setIsSignUp(!isSignUp);
                  if (!rememberMe) { setEmail(""); setPassword(""); }
                  setName(""); setPhone(""); setInviteCode(""); setShowPassword(false);
                }} disabled={loading}>
                  <Text style={styles.switchButtonText}>
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                    <Text style={styles.switchButtonHighlight}>{isSignUp ? "Sign In" : "Sign Up"}</Text>
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <Toast visible={toastVisible} message={toastMessage} type={toastType}
            onHide={() => setToastVisible(false)} currentColors={currentColors} />
          <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message}
            buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)} currentColors={currentColors} />
        </SafeAreaView>
      </View>
    );
  }

  // ── Authenticated profile screen ─────────────────────────────────────────
  const menuItems = [
    ...(isAdmin ? [{
      route: "/admin", icon: "person.badge.shield.checkmark",
      title: "Admin Dashboard", subtitle: "Manage app settings and users",
      iconBg: blackGoldLight.GOLD_DIM, iconColor: blackGoldLight.GOLD,
    }] : []),
    {
      route: "/order-history", icon: "receipt",
      title: "Order History", subtitle: `${userProfile?.orders?.length || 0} orders`,
      iconBg: blackGoldLight.GOLD_DIM, iconColor: blackGoldLight.GOLD,
    },
    ...(Platform.OS !== 'web' ? [{
      route: "/payment-methods", icon: "creditcard.fill",
      title: "Payment Methods", subtitle: `${userProfile?.paymentMethods?.length || 0} cards`,
      iconBg: blackGoldLight.GOLD_DIM, iconColor: blackGoldLight.GOLD,
    }] : []),
    {
      route: "/invite-friend", icon: "person.2.fill",
      title: "Invite a Friend", subtitle: "Share your referral code and earn rewards",
      iconBg: blackGoldLight.GOLD_DIM, iconColor: blackGoldLight.GOLD,
    },
    {
      route: "/help", icon: "questionmark.circle.fill",
      title: "Help & Support", subtitle: "FAQs and contact information",
      iconBg: blackGoldLight.SILVER_DIM, iconColor: blackGoldLight.SILVER,
    },
    {
      route: "/delete-account", icon: "person.crop.circle.badge.xmark",
      title: "Delete Account", subtitle: "Permanently delete your account",
      iconBg: "rgba(192,57,43,0.08)", iconColor: "#C0392B",
      titleColor: "#C0392B",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={blackGoldLight.HEADER_TOP} />
      <SafeAreaView style={styles.flex} edges={["top"]}>

        {/* Dark profile header with radial bloom */}
        <LinearGradient
          colors={[blackGoldLight.GOLD, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeaderContainer}
        >
          {/* Gold bloom — top-right */}
          <LinearGradient
            colors={["rgba(212,168,58,0.2)", "rgba(184,146,42,0.07)", "transparent"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerBloom}
            pointerEvents="none"
          />
          <View style={styles.profileHeaderInner}>
            <View style={styles.profileImageContainer}>
              {imageLoading ? (
                <View style={styles.profileImagePlaceholder}>
                  <ActivityIndicator size="large" color={blackGoldLight.SILVER_SOFT} />
                </View>
              ) : profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.profileImage}
                  onError={() => setProfileImageUrl(null)} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <IconSymbol name="person" size={44} color={blackGoldLight.SILVER_SOFT} />
                </View>
              )}
              <Pressable style={styles.editImageButton} onPress={() => handleMenuPress("/edit-profile")}>
                <IconSymbol name="camera" size={14} color={blackGoldLight.GOLD} />
              </Pressable>
            </View>

            <Text style={styles.profileName}>{userProfile?.name}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email}</Text>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.profileContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={blackGoldLight.GOLD}
              colors={[blackGoldLight.GOLD]}
            />
          }
        >
          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <Pressable
                key={item.route}
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}
                onPress={() => handleMenuPress(item.route)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                  <IconSymbol name={item.icon as any} size={22} color={item.iconColor} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, item.titleColor ? { color: item.titleColor } : null]}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={blackGoldLight.INK_MID} />
              </Pressable>
            ))}

            {/* Sign out */}
            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={handleSignOut}
            >
              <View style={[styles.menuIcon, { backgroundColor: blackGoldLight.SILVER_DIM }]}>
                <IconSymbol name="rectangle.portrait.and.arrow.forward" size={22} color={blackGoldLight.INK_MID} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Sign Out</Text>
                <Text style={styles.menuSubtitle}>Sign out of your account</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={blackGoldLight.INK_MID} />
            </Pressable>
          </View>
        </ScrollView>

        <Toast visible={toastVisible} message={toastMessage} type={toastType}
          onHide={() => setToastVisible(false)} currentColors={currentColors} />
        <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message}
          buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)} currentColors={currentColors} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: blackGoldLight.BODY_BG },
  flex: { flex: 1 },

  // ── Header shared ────────────────────────────────────────────────────────
  headerBloom: {
    position: 'absolute',
    top: 0, right: 0,
    width: '100%', height: '100%',
    zIndex: 0,
  } as any,

  // ── Auth — dark header ───────────────────────────────────────────────────
  authHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
    overflow: 'hidden',
    position: 'relative',
  },
  authHeaderInner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 6,
    zIndex: 1,
  },
  authTitle: {
    fontSize: 26,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    marginTop: 8,
  },
  authSubtitle: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SILVER,
    textAlign: 'center',
  },

  // ── Auth — form ──────────────────────────────────────────────────────────
  authContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 120 },
  authForm: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK,
  },
  inviteCodeHint: {
    fontSize: 12,
    color: blackGoldLight.INK_MID,
    marginTop: -6,
    marginBottom: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  rememberMeContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, marginTop: -4, gap: 8,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: {
    // Active checkbox: gold fill
    backgroundColor: blackGoldLight.GOLD,
    borderColor: blackGoldLight.GOLD,
  },
  rememberMeText: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
  },

  // Auth button — gold gradient pill with LinearGradient wrapper
  authButton: {
    borderRadius: 36,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  authButtonInner: { paddingVertical: 16, alignItems: 'center' },
  authButtonText: {
    fontSize: 16,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 15,
  },
  switchButton: { marginTop: 22, alignItems: 'center' },
  switchButtonText: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
  },
  switchButtonHighlight: {
    // Gold highlight on the action word
    color: blackGoldLight.GOLD,
    fontFamily: 'LibertinusSans_700Bold',
  },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 14, marginTop: -4 },
  forgotPasswordText: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.GOLD,
  },

  // ── Profile header ───────────────────────────────────────────────────────
  profileHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
    overflow: 'hidden',
    position: 'relative',
  },
  profileHeaderInner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    zIndex: 1,
  },
  profileImageContainer: { position: 'relative', marginBottom: 14 },
  profileImage: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2,
    borderColor: blackGoldLight.BORDER_GOLD,
  },
  profileImagePlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center', alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    // White pill with gold icon — consistent with bell/logo pills
    backgroundColor: blackGoldLight.CARD_BG,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SILVER,
    marginBottom: 20,
  },
  pointsCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pointsValue: {
    fontSize: 30,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.GOLD,  // gold points value
  },
  pointsLabel: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SILVER,
  },

  // ── Menu items ───────────────────────────────────────────────────────────
  profileContent: { paddingBottom: 120 },
  menuSection: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_LIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuContent: { flex: 1 },
  menuTitle: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
  },
});