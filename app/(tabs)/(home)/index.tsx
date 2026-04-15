import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  StatusBar,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { imageService, storeSettingsService } from "@/services/supabaseService";
import type { StoreSettings } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";
import Toast from "@/components/Toast";
import { LinearGradient } from "expo-linear-gradient";
import { blackGoldLight } from "@/styles/commonStyles";
import { getOrderingStatusFromSettings } from "@/utils/orderingHours";

// ─── Card geometry ────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD    = 20;
const CARD_W   = SCREEN_W - H_PAD * 2;
const IMG_SIZE = 116;   // image panel width & height
const R        = 16;    // card corner radius
const IMG_R    = 12;    // image inner corner radius (bottom-right only)

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}


// ─────────────────────────────────────────────────────────────────────
// WELCOME HEADER — Black & Gold
// ─────────────────────────────────────────────────────────────────────
interface WelcomeHeaderProps {
  headerImage: string | null;
  unreadCount: number;
  onNotificationPress: () => void;
  fadeAnim: Animated.Value;
  firstName?: string | null;
}

function WelcomeHeader({
  headerImage,
  unreadCount,
  onNotificationPress,
  fadeAnim,
  firstName,
}: WelcomeHeaderProps) {
  const greeting = getGreeting();

  return (
    // ── Base: near-black flat fill ──────────────────────────────────
    <View style={hStyles.headerRoot}>

      {/* Layer 1 — gold radial bloom from top-right (logo/bell corner) */}
      <LinearGradient
        colors={["rgba(212,168,58,0.28)", "rgba(184,146,42,0.10)", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={hStyles.radialTopRight}
        pointerEvents="none"
      />

      {/* Layer 2 — warm amber glow from centre-bottom bleeding up */}
      <LinearGradient
        colors={["transparent", "transparent", "rgba(201,155,40,0.12)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={hStyles.radialBottomCentre}
        pointerEvents="none"
      />

      {/* Layer 3 — cool silver whisper from bottom-left */}
      <LinearGradient
        colors={["transparent", "rgba(192,192,200,0.07)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={hStyles.radialBottomLeft}
        pointerEvents="none"
      />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
        {/* Top bar */}
        <View style={hStyles.topBar}>
          {/* Logo — gold-bordered pill */}
          <View style={hStyles.logoPill}>
            {headerImage ? (
              <Image source={{ uri: headerImage }} style={hStyles.logoImg} />
            ) : (
              <View style={hStyles.logoMark}>
                <Text style={hStyles.logoMarkText}>◈</Text>
              </View>
            )}
          </View>

          {/* Brand */}
          <View style={hStyles.brandBlock}>
            <Text style={hStyles.brandName}>The Peppered Goat</Text>
            <Text style={hStyles.brandTagline}>STUBBORNLY SPICY</Text>
          </View>

          {/* Bell — silver-bordered pill */}
          <Pressable onPress={onNotificationPress} hitSlop={12} style={hStyles.bellPill}>
            <IconSymbol
              name={Platform.OS === "ios" ? "bell.fill" : "notifications"}
              size={20}
              color={blackGoldLight.SILVER}
            />
            {unreadCount > 0 && (
              <View style={hStyles.bellBadge}>
                <Text style={hStyles.bellBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Fading gold/silver rule */}
        <LinearGradient
          colors={["transparent", blackGoldLight.GOLD, blackGoldLight.GOLD, "transparent"]}
          locations={[0, 0.5, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={hStyles.rule}
        />

        {/* Greeting */}
        <Animated.View style={[hStyles.greetingBlock, { opacity: fadeAnim }]}>
          <Text style={hStyles.greetingTime}>{firstName ? `${greeting}, ${firstName}` : greeting}</Text>
          <Text style={hStyles.greetingLine1}>What shall we</Text>
          <Text style={hStyles.greetingLine2}>tempt you with?</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const hStyles = StyleSheet.create({
  headerRoot: {
    backgroundColor: blackGoldLight.HEADER_TOP,   // solid near-black base
    position: "relative",
    overflow: "hidden",
  },
  // Gold bloom — top-right corner, spreads diagonally inward
  radialTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  // Warm amber — rises from the bottom centre (where the greeting lives)
  radialBottomCentre: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    zIndex: 0,
  },
  // Cool silver — bottom-left corner, very subtle
  radialBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "50%",
    height: "50%",
    zIndex: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  logoPill: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 52,
    height: 52,
    resizeMode: "cover",
  },
  logoMark: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    fontSize: 24,
    color: blackGoldLight.GOLD,
  },
  brandBlock: {
    flex: 1,
  },
  brandName: {
    fontSize: 19,
    fontFamily: "PlaylistScript",
    color: blackGoldLight.INK_WHITE,
    letterSpacing: 0.4,
  },
  brandTagline: {
    fontSize: 8,
    fontFamily: "LibertinusSans_400Regular",
    letterSpacing: 3.5,
    color: blackGoldLight.GOLD,
    marginTop: 3,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  bellPill: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: blackGoldLight.SILVER_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_SILVER,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: blackGoldLight.GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#000000",
  },
  rule: {
    height: 1.5,
  },
  greetingBlock: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 32,
  },
  greetingTime: {
    fontSize: 13,
    fontFamily: "LibertinusSans_400Regular",
    color: blackGoldLight.INK_SILVER,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  greetingLine1: {
    fontSize: 36,
    fontFamily: "LibertinusSans_400Regular",
    color: blackGoldLight.INK_WHITE,
    lineHeight: 42,
  },
  greetingLine2: {
    fontSize: 36,
    fontFamily: "LibertinusSans_700Bold",
    color: blackGoldLight.GOLD,
    lineHeight: 44,
  },
});

// ─────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const {
    currentColors,
    menuItems,
    menuCategories,
    loadMenuItems,
    loadMenuCategories,
    addToCart,
    getUnreadNotificationCount,
    userProfile,
  } = useApp();

  const firstName = userProfile?.name?.split(" ")[0] ?? null;

  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [headerImage, setHeaderImage]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType]       = useState<"success" | "error" | "info">("success");
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [orderingStatus, setOrderingStatus] = useState(() => getOrderingStatusFromSettings(null));

  // Fetch settings once, then keep in sync via realtime
  useEffect(() => {
    storeSettingsService.getSettings().then(({ data }) => { if (data) setStoreSettings(data); });
    const channel = supabase.channel("store-settings-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new) setStoreSettings(payload.new as StoreSettings);
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Recompute status when settings change or every minute (for scheduled open/close)
  useEffect(() => {
    setOrderingStatus(getOrderingStatusFromSettings(storeSettings));
    const interval = setInterval(
      () => setOrderingStatus(getOrderingStatusFromSettings(storeSettings)),
      60_000,
    );
    return () => clearInterval(interval);
  }, [storeSettings]);

  const unreadCount = getUnreadNotificationCount();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 750, delay: 120, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    async function fetchHeaderImage() {
      try {
        const imageUrl = imageService.getPublicUrl("assets", "/logos/peppered-goat-logo.jpg");
        setHeaderImage(imageUrl);
      } catch (error) { console.error("Failed to load header image:", error); }
    }
    fetchHeaderImage();
  }, []);

  // AppContext already loads menu data on mount — just track loading state here
useEffect(() => {
  setLoading(menuItems.length === 0);
}, [menuItems.length]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const selectedCategoryObj = menuCategories.find((cat) => cat.key === selectedCategory);
      const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategoryObj?.id;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, menuItems, menuCategories]);

  const sectionData = useMemo(() => {
    if (selectedCategory !== "all") {
      return [{ title: "", data: filteredItems }];
    }
    const categoryMap = new Map<string, { title: string; data: any[] }>();
    for (const cat of menuCategories) {
      if (cat.key !== "all") categoryMap.set(cat.id, { title: cat.title, data: [] });
    }
    const uncategorized: any[] = [];
    for (const item of filteredItems) {
      if (item.category_id && categoryMap.has(item.category_id)) {
        categoryMap.get(item.category_id)!.data.push(item);
      } else {
        uncategorized.push(item);
      }
    }
    const sections = [...categoryMap.values()].filter((s) => s.data.length > 0);
    if (uncategorized.length > 0) sections.push({ title: "Other", data: uncategorized });
    return sections;
  }, [filteredItems, menuCategories, selectedCategory]);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  }, []);

  const handleCategoryPress = useCallback((category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category); setShowCategoryModal(false);
  }, []);

  const handleItemPress = useCallback((itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/item-detail?id=${itemId}`);
  }, [router]);

  const handleAddToCart = useCallback((item: any) => {
    if (!orderingStatus.isOpen) {
      showToast("info", orderingStatus.message);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({ ...item, quantity: 1 });
    showToast("success", `${item.name} added to cart`);
  }, [addToCart, showToast, orderingStatus.isOpen, orderingStatus.message]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery(""); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleNotificationPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/notifications");
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (Platform.OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await loadMenuItems();
      if (Platform.OS === "ios") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn("Refresh failed:", error);
      showToast("error", "Failed to refresh. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [loadMenuItems, showToast]);

  // ─── Card ─────────────────────────────────────────────────────────
  const renderMenuItemCard = useCallback(({ item }: { item: any }) => (
    <Pressable
      onPress={() => handleItemPress(item.id)}
      android_ripple={{ color: "rgba(184,146,42,0.06)" }}
      style={styles.card}
    >
      {/*
        Standard row card — no SVG.
        Left column: image panel, flush top-left, rounded only on
        bottom-right corner so it sits naturally inside the card.
        Right column: title + description.
        Bottom: full-width footer with price + add button.
      */}

      {/* Top section: image + text side by side */}
      <View style={styles.cardTop}>
        {/* Image — flush top-left of card */}
        <View style={styles.cardImageWrap}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.cardImage}
            />
          ) : (
            <View style={[styles.cardImage, styles.cardImageFallback]} />
          )}
        </View>

        {/* Text */}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>

      {/* Footer: gold top border, price left, add button right */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
        <Pressable
          style={[styles.addButton, !orderingStatus.isOpen && styles.addButtonDisabled]}
          onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}
          hitSlop={8}
          android_ripple={{ color: "rgba(0,0,0,0.15)", radius: 20, borderless: true }}
        >
          <LinearGradient
            colors={orderingStatus.isOpen
              ? [blackGoldLight.GOLD, blackGoldLight.HEADER_BOT]
              : ["rgba(180,180,180,0.4)", "rgba(150,150,150,0.4)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <IconSymbol
              name={Platform.OS === "ios" ? "plus" : "add"}
              size={18}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  ), [handleItemPress, handleAddToCart]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={blackGoldLight.HEADER_TOP} />

      {/* Welcome header */}
      <WelcomeHeader
        headerImage={headerImage}
        unreadCount={unreadCount}
        onNotificationPress={handleNotificationPress}
        fadeAnim={fadeAnim}
        firstName={firstName}
      />

      {/* Closed banner */}
      {!orderingStatus.isOpen && (
        <View style={styles.closedBanner}>
          <IconSymbol
            name={Platform.OS === "ios" ? "clock.fill" : "schedule"}
            size={15}
            color={blackGoldLight.GOLD}
          />
          <Text style={styles.closedBannerText}>{orderingStatus.message}</Text>
        </View>
      )}

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <IconSymbol
            name={Platform.OS === "ios" ? "magnifyingglass" : "search"}
            size={16}
            color={blackGoldLight.INK_MID}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Find your favourite..."
            placeholderTextColor="rgba(26,22,18,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <IconSymbol
                name={Platform.OS === "ios" ? "xmark.circle.fill" : "cancel"}
                size={18}
                color={blackGoldLight.INK_MID}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.filterButton, selectedCategory !== "all" && styles.filterButtonActive]}
          onPress={() => setShowCategoryModal(true)}
          hitSlop={8}
        >
          <IconSymbol
            name={Platform.OS === "ios" ? "line.3.horizontal.decrease.circle.fill" : "filter-list"}
            size={20}
            color={selectedCategory !== "all" ? "#FFFFFF" : blackGoldLight.GOLD}
          />
        </Pressable>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.categoryModal}>
            <LinearGradient
              colors={["transparent", blackGoldLight.BORDER_GOLD, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHandleRule}
            />
            <Text style={styles.modalTitle}>Categories</Text>
            {[...menuCategories].map((category) => (
              <Pressable
                key={category.id ?? category.key}
                style={[styles.categoryOption, selectedCategory === category.key && styles.categoryOptionActive]}
                onPress={() => handleCategoryPress(category.key)}
              >
                <Text style={[styles.categoryOptionText, selectedCategory === category.key && styles.categoryOptionTextActive]}>
                  {category.title}
                </Text>
                {selectedCategory === category.key && (
                  <LinearGradient
                    colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkmark}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Menu List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={blackGoldLight.GOLD} />
        </View>
      ) : (
        <SectionList
          sections={sectionData}
          renderItem={renderMenuItemCard}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
                <View style={styles.sectionHeaderRule} />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={blackGoldLight.GOLD}
              colors={[blackGoldLight.GOLD]}
              progressBackgroundColor={blackGoldLight.CARD_BG}
              title="Refreshing menu…"
              titleColor={blackGoldLight.INK_SOFT}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? "No items found" : "No items available"}
              </Text>
            </View>
          }
        />
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={currentColors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: blackGoldLight.BODY_BG,
  },

  // ─── Closed banner ────────────────────────────────────────────────
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
  },
  closedBannerText: {
    fontSize: 13,
    fontFamily: "LibertinusSans_400Regular",
    color: blackGoldLight.GOLD,
    flex: 1,
  },

  // ─── Search ───────────────────────────────────────────────────────
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: blackGoldLight.BODY_BG,
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_LIGHT,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: blackGoldLight.INK,
    fontSize: 15,
    fontFamily: "LibertinusSans_400Regular",
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: blackGoldLight.CARD_BG,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: blackGoldLight.GOLD,
    borderColor: blackGoldLight.GOLD,
  },

  // ─── Modal ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  categoryModal: {
    backgroundColor: blackGoldLight.CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "70%",
    borderTopWidth: 1,
    borderTopColor: blackGoldLight.BORDER_GOLD,
  },
  modalHandleRule: {
    height: 3,
    borderRadius: 2,
    width: 48,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "LibertinusSans_700Bold",
    color: blackGoldLight.INK,
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_LIGHT,
  },
  categoryOptionActive: {
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderRadius: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
  },
  categoryOptionText: {
    fontSize: 15,
    fontFamily: "LibertinusSans_400Regular",
    color: blackGoldLight.INK_MID,
  },
  categoryOptionTextActive: {
    fontFamily: "LibertinusSans_700Bold",
    color: blackGoldLight.GOLD,
  },
  checkmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // ─── List ─────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // ─── Card ─────────────────────────────────────────────────────────
  // Standard white rounded card — no SVG, no clip path.
  // Image sits flush in the top-left corner, rounded only where it
  // meets card interior (bottom-right corner). Card itself has full
  // border-radius on all four outer corners.
  card: {
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: R,
    marginVertical: 8,
    overflow: "hidden",   // clips image to card corners cleanly
    borderWidth: 1,
    ...Platform.select({
      ios: {
        borderColor: blackGoldLight.BORDER_GOLD,
        shadowColor: blackGoldLight.GOLD,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        borderColor: blackGoldLight.BORDER_LIGHT,
        elevation: 4,
      },
    }),
  },

  // Top section: image left, text right
  cardTop: {
    flexDirection: "row",
    minHeight: IMG_SIZE,
  },

  // Image container — flush top-left, fixed square size
  cardImageWrap: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    flexShrink: 0,
    // No borderRadius here — overflow:hidden on card handles top-left,
    // and we add a bottom-right radius below on the image itself
  },
  cardImage: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    resizeMode: "cover",
    // Only round the bottom-right corner — the card clips the others
    // borderBottomRightRadius: IMG_R,
  },
  cardImageFallback: {
    backgroundColor: blackGoldLight.GOLD_DIM,
  },

  // Text block to the right of the image
  cardText: {
    flex: 1,
    paddingTop: 14,
    paddingRight: 14,
    paddingLeft: 12,
    paddingBottom: 10,
    justifyContent: "flex-start",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "LibertinusSans_700Bold",
    color: blackGoldLight.INK,
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: "LibertinusSans_400Regular",
    color: blackGoldLight.INK_SOFT,
    lineHeight: 17,
  },

  // Footer — sits below the top section, full card width
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: blackGoldLight.BORDER_GOLD,
    backgroundColor: blackGoldLight.CARD_FOOTER,
  },
  cardPrice: {
    fontSize: 18,
    fontFamily: "LibertinusSans_700Bold",
    color: blackGoldLight.INK,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    opacity: 0.45,
  },

  // ─── Section Header ───────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: blackGoldLight.BODY_BG,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: "LibertinusSans_700Bold",
    color: blackGoldLight.GOLD,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionHeaderRule: {
    flex: 1,
    height: 1,
    backgroundColor: blackGoldLight.BORDER_GOLD,
    opacity: 0.5,
  },

  // ─── States ───────────────────────────────────────────────────────
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "LibertinusSans_400Regular",
    fontStyle: "italic",
    color: blackGoldLight.INK_SOFT,
  },
});