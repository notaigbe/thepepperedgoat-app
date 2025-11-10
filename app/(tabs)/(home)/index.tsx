
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';
import { menuService } from '@/services/supabaseService';
import { MenuItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const menuCategories = [
  'All',
  'Appetizers',
  'Main Dishes',
  'Sides',
  'Desserts',
  'Drinks',
];

// Responsive font size calculation
const getResponsiveFontSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = baseSize * scale;
  return Math.round(newSize);
};

// Responsive padding calculation
const getResponsivePadding = (basePadding: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newPadding = basePadding * scale;
  return Math.max(Math.round(newPadding), basePadding * 0.8);
};

export default function HomeScreen() {
  const router = useRouter();
  const { currentColors } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      console.log('Loading menu items from Supabase');
      setLoading(true);
      const { data, error } = await menuService.getMenuItems();
      
      if (error) {
        console.error('Error loading menu items:', error);
        return;
      }

      if (data) {
        const items: MenuItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          category: item.category,
          image: item.image,
          popular: item.popular,
        }));
        setMenuItems(items);
        console.log('Loaded', items.length, 'menu items');
      }
    } catch (error) {
      console.error('Exception loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const handleCategoryPress = (category: string) => {
    console.log('Category selected:', category);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleItemPress = (itemId: string) => {
    console.log('Item pressed:', itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/item-detail?id=${itemId}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={require('@/assets/images/32297f18-8c85-4435-9bd9-0ac1fa24076e.png')}
              style={styles.logo}
            />
            <Text style={[styles.headerSubtitle, { color: currentColors.textSecondary }]}>Authentic West African Cuisine</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')}>
            <IconSymbol name="bell.fill" size={24} color={currentColors.primary} />
          </Pressable>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {menuCategories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: currentColors.card,
                  paddingHorizontal: getResponsivePadding(16),
                  paddingVertical: getResponsivePadding(10),
                },
                selectedCategory === category && { backgroundColor: currentColors.primary },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { 
                    color: currentColors.text,
                    fontSize: getResponsiveFontSize(14),
                  },
                  selectedCategory === category && { color: currentColors.card },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Menu Items */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.primary} />
            <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
              Loading menu...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.menuContainer}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="restaurant" size={64} color={currentColors.textSecondary} />
                <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
                  No items in this category
                </Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.menuItem, { backgroundColor: currentColors.card }]}
                  onPress={() => handleItemPress(item.id)}
                >
                  <Image source={{ uri: item.image }} style={[styles.menuItemImage, { backgroundColor: currentColors.accent }]} />
                  {item.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: currentColors.primary }]}>
                      <IconSymbol name="star.fill" size={12} color={currentColors.card} />
                      <Text style={[styles.popularText, { color: currentColors.card }]}>Popular</Text>
                    </View>
                  )}
                  <View style={styles.menuItemInfo}>
                    <Text style={[styles.menuItemName, { color: currentColors.text }]}>{item.name}</Text>
                    <Text style={[styles.menuItemDescription, { color: currentColors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.menuItemFooter}>
                      <Text style={[styles.menuItemPrice, { color: currentColors.primary }]}>${item.price.toFixed(2)}</Text>
                      <View style={[styles.addButton, { backgroundColor: currentColors.primary }]}>
                        <IconSymbol name="plus" size={20} color={currentColors.card} />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 0,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  menuItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  menuItemImage: {
    width: '100%',
    height: 200,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItemInfo: {
    padding: 16,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
