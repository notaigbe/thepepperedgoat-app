import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { imageService } from "@/services/supabaseService";
import Toast from "@/components/Toast";
import { colors } from "@/styles/commonStyles";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = 320;

export default function HomeScreen() {
  const router = useRouter();
  const { currentColors, menuItems, menuCategories, loadMenuItems, loadMenuCategories, addToCart, getUnreadNotificationCount } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const unreadCount = getUnreadNotificationCount();

  useEffect(() => {
    async function fetchHeaderImage() {
      try {
        const imageUrl = imageService.getPublicUrl("assets", "/logos/peppered-goat-logo.jpg");
        setHeaderImage(imageUrl);
      } catch (error) {
        console.error("Failed to load header image:", error);
      }
    }
    fetchHeaderImage();
  }, []);

  useEffect(() => {
    if (menuItems.length === 0) {
      setLoading(true);
      loadMenuItems().finally(() => setLoading(false));
    }
    if (menuCategories.length === 0) {
      loadMenuCategories();
    }
  }, [menuItems.length, menuCategories.length, loadMenuItems, loadMenuCategories]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = searchQuery.trim() === "" || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const selectedCategoryObj = menuCategories.find(cat => cat.key === selectedCategory);
      const selectedCategoryId = selectedCategoryObj?.id;
      const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategoryId;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, menuItems, menuCategories]);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleCategoryPress = useCallback((category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    setShowCategoryModal(false);
  }, []);

  const handleItemPress = useCallback((itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/item-detail?id=${itemId}`);
  }, [router]);

  const handleAddToCart = useCallback((item: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({ ...item, quantity: 1 });
    showToast("success", `${item.name} added to cart`);
  }, [addToCart, showToast]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === "all") return "All Items";
    return menuCategories.find(cat => cat.key === selectedCategory)?.title || "All Items";
  }, [selectedCategory, menuCategories]);

  const renderMenuItemCard = useCallback(({ item }: { item: any }) => (
    <Pressable 
      style={styles.menuItemCard}
      onPress={() => handleItemPress(item.id)}
      android_ripple={{ color: 'rgba(226, 111, 91, 0.1)' }}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.cardImage}
          />
        </View>
        
        <View style={styles.cardInfoContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>
          ${item.price.toFixed(2)}
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart(item);
          }}
        >
          <IconSymbol
            name={Platform.OS === 'ios' ? "plus" : "add"}
            size={18}
            color="rgba(255, 255, 255, 0.9)"
          />
        </Pressable>
      </View>
    </Pressable>
  ), [handleItemPress, handleAddToCart]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerSection}>
      <Text style={styles.sectionLabel}>Browse Menu</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {headerImage && (
              <Image 
                source={{ uri: headerImage }}
                style={styles.logo}
              />
            )}
            <View>
              <Text style={styles.brandName}>The Peppered Goat</Text>
              <Text style={styles.brandTagline}>STUBBORNLY SPICY</Text>
            </View>
          </View>
          <Pressable 
            onPress={() => router.push("/notifications")}
            style={styles.notificationButton}
          >
            <IconSymbol
              name={Platform.OS === 'ios' ? "bell.fill" : "notifications"}
              size={24}
              color="#FFFFFF"
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <IconSymbol
            name={Platform.OS === 'ios' ? "magnifyingglass" : "search"}
            size={16}
            color="rgba(255, 255, 255, 0.5)"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Find your favourite..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch}>
              <IconSymbol
                name={Platform.OS === 'ios' ? "xmark.circle.fill" : "cancel"}
                size={18}
                color="rgba(226, 111, 91, 0.8)"
              />
            </Pressable>
          )}
        </View>

        <Pressable 
          style={styles.filterButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <IconSymbol
            name={Platform.OS === 'ios' ? "line.3.horizontal.decrease.circle.fill" : "filter-list"}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.categoryModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Categories</Text>

            {/* <Pressable
              style={[
                styles.categoryOption,
                selectedCategory === "all" && styles.categoryOptionActive
              ]}
              onPress={() => handleCategoryPress("all")}
            >
              <Text style={[
                styles.categoryOptionText,
                selectedCategory === "all" && styles.categoryOptionTextActive
              ]}>
                All Items
              </Text>
              {selectedCategory === "all" && (
                <View style={styles.checkmark} />
              )}
           </Pressable> */}

            {menuCategories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.key && styles.categoryOptionActive
                ]}
                onPress={() => handleCategoryPress(category.key)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory === category.key && styles.categoryOptionTextActive
                ]}>
                  {category.title}
                </Text>
                {selectedCategory === category.key && (
                  <View style={styles.checkmark} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Menu Items List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E26F5B" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderMenuItemCard}
          keyExtractor={(item) => item.id}
          // ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          scrollIndicatorInsets={{ right: 1 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No items found' : 'No items available'}
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
    backgroundColor: '#0F0F0F',
  },
  headerContainer: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  brandName: {
    fontSize: 32,
    fontFamily: 'MrDeHaviland_400Regular',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  brandTagline: {
    fontSize: 9,
    fontFamily: 'LibertinusSans_400Regular',
    letterSpacing: 2.5,
    color: '#E26F5B',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E26F5B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'LibertinusSans_400Regular',
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(91, 206, 226, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(91, 206, 226, 0.53)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  categoryModal: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(226, 111, 91, 0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 111, 91, 0.1)',
  },
  categoryOptionActive: {
    backgroundColor: 'rgba(91, 226, 215, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  categoryOptionText: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  categoryOptionTextActive: {
    color: '#ffffff',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E26F5B',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 111, 91, 0.1)',
  },
  sectionLabel: {
    fontSize: 24,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  menuItemCard: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'column',
  },
  cardTop: {
    flexDirection: 'row',
    minHeight: 140,
  },
  cardImageContainer: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(226, 111, 91, 0.05)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardInfoContainer: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 19,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardPrice: {
    fontSize: 18,
    fontFamily: 'Cormorant_700Bold',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 206, 226, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(91, 206, 226, 0.53)',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'LibertinusSans_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});