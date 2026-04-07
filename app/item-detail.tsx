import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { MenuItem } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { getOrderingStatusFromSettings } from "@/utils/orderingHours";
import { storeSettingsService } from "@/services/supabaseService";
import type { StoreSettings } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";

// ─── Spice helpers ────────────────────────────────────────────────────────────
const SPICE_LABELS: Record<number, string> = {
  1: "Mild",
  2: "Medium",
  3: "Hot",
  4: "Extra Hot",
  5: "Inferno",
};
const spiceLabel = (level: number) =>
  SPICE_LABELS[level] ?? (level > 5 ? "Inferno" : "Mild");

// ─── Constants ────────────────────────────────────────────────────────────────
const HERO_HEIGHT = 420;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart, currentColors, menuItems, menuCategories } = useApp();

  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [orderingStatus, setOrderingStatus] = useState(() => getOrderingStatusFromSettings(null));
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    storeSettingsService.getSettings().then(({ data }) => { if (data) setStoreSettings(data); });
    const channel = supabase.channel("store-settings-item-detail")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new) setStoreSettings(payload.new as StoreSettings);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setOrderingStatus(getOrderingStatusFromSettings(storeSettings));
    const interval = setInterval(
      () => setOrderingStatus(getOrderingStatusFromSettings(storeSettings)),
      60_000,
    );
    return () => clearInterval(interval);
  }, [storeSettings]);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [lastAddedQuantity, setLastAddedQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const notificationTranslateY = useRef(new Animated.Value(-80)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;

  const itemId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (menuItems?.length && itemId) {
      const foundItem = menuItems.find((i) => String(i.id) === String(itemId));
      setItem(foundItem || null);
    }
  }, [menuItems, itemId]);

  const category = menuCategories?.find((c) => c.id === item?.category_id);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showNotificationToast = (qty: number) => {
    setLastAddedQuantity(qty);
    setShowNotification(true);
    notificationTranslateY.setValue(-80);
    notificationOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(notificationTranslateY, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(notificationOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(notificationTranslateY, {
          toValue: -80,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => setShowNotification(false));
    }, 2800);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!orderingStatus.isOpen) return;
    const qty = quantity;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.timing(addButtonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(addButtonScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    addToCart({ ...item!, quantity: qty });
    showNotificationToast(qty);
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity((q) => Math.max(1, q + delta));
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // ── Loading / error shells ─────────────────────────────────────────────────
  const StateShell = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <View style={[styles.backRow, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={handleBackPress}>
          <IconSymbol name="chevron.left" size={20} color={currentColors.primary} />
        </Pressable>
      </View>
      <View style={styles.centred}>{children}</View>
    </SafeAreaView>
  );

  if (!menuItems?.length) {
    return (
      <StateShell>
        <Text style={[styles.stateText, { color: currentColors.textSecondary }]}>
          Loading…
        </Text>
      </StateShell>
    );
  }
  if (!item) {
    return (
      <StateShell>
        <Text style={[styles.stateText, { color: currentColors.textSecondary }]}>
          Item not found
        </Text>
      </StateShell>
    );
  }

  const totalPrice = (item.price * quantity).toFixed(2);

  return (
    <View style={[styles.root, { backgroundColor: currentColors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero image — edge-to-edge, behind everything ── */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: item.image_url ?? undefined }} style={styles.heroImage} />
        <LinearGradient
          colors={["rgba(0,0,0,0.52)", "transparent", "rgba(0,0,0,0.78)"]}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Popular badge */}
        {(item as any).popular && (
          <View style={[styles.popularBadge, { bottom: 108 }]}>
            <IconSymbol name="star.fill" size={10} color="#0A0A0A" />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
      </View>

      {/* ── Back button — above ScrollView in root stacking context ── */}
      <View style={[styles.backRow, { top: insets.top + 12 }]} pointerEvents="box-none">
        <Pressable style={styles.backBtn} onPress={handleBackPress} hitSlop={12}>
          <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* ── Toast ── */}
      {showNotification && (
        <Animated.View
          style={[
            styles.toast,
            {
              top: insets.top + 14,
              opacity: notificationOpacity,
              transform: [{ translateY: notificationTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={["#2A2009", "#181100"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.toastGradient}
          >
            <View style={styles.toastIcon}>
              <IconSymbol name="checkmark.circle.fill" size={22} color="#C9A84C" />
            </View>
            <View>
              <Text style={styles.toastTitle}>Added to Cart</Text>
              <Text style={styles.toastSub}>
                {lastAddedQuantity}× {item.name}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer so card overlaps hero */}
        <View style={{ height: HERO_HEIGHT - 36 }} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: currentColors.card ?? currentColors.background,
              borderColor: "rgba(201,168,76,0.18)",
            },
          ]}
        >
          {/* Thin gold accent rule */}
          <View style={styles.cardRule} />

          {/* Name + Price */}
          <View style={styles.namePriceRow}>
            <Text
              style={[styles.itemName, { color: currentColors.textSecondary }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </View>

          {/* Meta pills */}
          <View style={styles.pillRow}>
            {category?.title && (
              <View style={[styles.pill, { borderColor: "rgba(201,168,76,0.32)" }]}>
                <IconSymbol name="tag" size={11} color="#C9A84C" />
                <Text style={styles.pillText}>{category.title}</Text>
              </View>
            )}
            {item.spicy_level != null && item.spicy_level > 0 && (
              <View style={[styles.pill, { borderColor: "rgba(220,80,50,0.38)" }]}>
                <Text style={styles.chiliEmoji}>
                  {"🌶️".repeat(Math.min(item.spicy_level, 5))}
                </Text>
                <Text style={[styles.pillText, { color: "#E05840" }]}>
                  {spiceLabel(item.spicy_level)}
                </Text>
              </View>
            )}
            {item.tag && (
              <View style={[styles.pill, { borderColor: "rgba(201,168,76,0.16)" }]}>
                <Text style={[styles.pillText, { color: currentColors.textSecondary, opacity: 0.55 }]}>
                  {item.tag}
                </Text>
              </View>
            )}
          </View>

          {/* Hairline divider */}
          <View style={[styles.divider, { backgroundColor: "rgba(201,168,76,0.12)" }]} />

          {/* Description */}
          {!!item.description && (
            <Text style={[styles.description, { color: currentColors.textSecondary }]}>
              {item.description}
            </Text>
          )}

          {/* Quantity selector */}
          <View style={[styles.qtyCard, { borderColor: "rgba(201,168,76,0.16)" }]}>
            <Text
              style={[styles.qtyLabel, { color: currentColors.textSecondary }]}
            >
              QTY
            </Text>
            <View style={styles.qtyControls}>
              <Pressable
                style={({ pressed }) => [
                  styles.qtyBtn,
                  {
                    borderColor: "rgba(201,168,76,0.32)",
                    backgroundColor: pressed
                      ? "rgba(201,168,76,0.09)"
                      : "transparent",
                  },
                ]}
                onPress={() => handleQuantityChange(-1)}
              >
                <IconSymbol name="minus" size={16} color="#C9A84C" />
              </Pressable>

              <Text style={[styles.qtyValue, { color: currentColors.textSecondary }]}>
                {quantity}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.qtyBtn,
                  {
                    borderColor: "rgba(201,168,76,0.32)",
                    backgroundColor: pressed
                      ? "rgba(201,168,76,0.09)"
                      : "transparent",
                  },
                ]}
                onPress={() => handleQuantityChange(1)}
              >
                <IconSymbol name="plus" size={16} color="#C9A84C" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            borderTopColor: "rgba(201,168,76,0.14)",
            backgroundColor: currentColors.background,
          },
        ]}
      >
        {/* Upward fade above footer */}
        <LinearGradient
          colors={["transparent", currentColors.background]}
          style={styles.footerFade}
          pointerEvents="none"
        />

        <View style={styles.footerInner}>
          {/* Total */}
          <View style={styles.totalBlock}>
            <Text
              style={[styles.totalCaption, { color: currentColors.textSecondary }]}
            >
              TOTAL
            </Text>
            <Text style={[styles.totalAmount, { color: currentColors.textSecondary }]}>
              ${totalPrice}
            </Text>
          </View>

          {/* CTA button */}
          <Animated.View style={[styles.ctaFlex, { transform: [{ scale: addButtonScale }], opacity: orderingStatus.isOpen ? 1 : 0.45 }]}>
            <Pressable onPress={handleAddToCart} style={styles.ctaWrapper} disabled={!orderingStatus.isOpen}>
              <LinearGradient
                colors={orderingStatus.isOpen ? ["#C9A84C", "#A07828", "#C9A84C"] : ["#888", "#666", "#888"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <IconSymbol name={orderingStatus.isOpen ? "cart.fill" : "clock"} size={18} color="#0A0A0A" />
                <Text style={styles.ctaText}>
                  {orderingStatus.isOpen ? "Add to Cart" : orderingStatus.message}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  centred: { flex: 1, justifyContent: "center", alignItems: "center" },
  stateText: { fontSize: 16, fontFamily: "Inter_400Regular", opacity: 0.6 },

  // Hero
  heroContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    zIndex: 0,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },

  // Back button
  backRow: { position: "absolute", left: 20, zIndex: 20 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Popular badge
  popularBadge: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#C9A84C",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  popularText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#0A0A0A",
    letterSpacing: 0.4,
  },

  // Toast
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  toastGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 0.8,
    borderColor: "rgba(201,168,76,0.28)",
    borderRadius: 16,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(201,168,76,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  toastTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#C9A84C",
    marginBottom: 1,
  },
  toastSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },

  // Scroll
  scrollView: { flex: 1 },

  // Content card
  card: {
    marginHorizontal: 12,
    borderRadius: 28,
    borderWidth: 0.8,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardRule: {
    height: 1,
    width: 44,
    backgroundColor: "#C9A84C",
    borderRadius: 1,
    marginBottom: 22,
    opacity: 0.65,
  },

  // Name + Price
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  itemName: {
    flex: 1,
    fontSize: 26,
    fontFamily: "LibertinusSans_700Bold",
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  itemPrice: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#C9A84C",
    letterSpacing: -0.4,
    paddingTop: 2,
  },

  // Pills
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.8,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#C9A84C",
    letterSpacing: 0.2,
  },
  chiliEmoji: { fontSize: 11 },

  // Divider
  divider: { height: 1, marginBottom: 20 },

  // Description
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 25,
    marginBottom: 28,
    opacity: 0.72,
  },

  // Qty
  qtyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 0.8,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  qtyLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.6,
    opacity: 0.42,
  },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 20 },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    minWidth: 30,
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    zIndex: 10,
  },
  footerFade: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  totalBlock: { gap: 1 },
  totalCaption: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.8,
    opacity: 0.38,
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  ctaFlex: { flex: 1 },
  ctaWrapper: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0A0A0A",
    letterSpacing: 0.2,
  },
});