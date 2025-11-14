
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { menuItems as staticMenuItems } from '@/data/menuData';
import { menuService } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';

export default function WebsiteMenu() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = React.useState(staticMenuItems);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await menuService.getMenuItems();
        if (res.error) throw res.error;
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to load menu items', err);
      }
    })();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))]
  const filteredItems = selectedCategory === 'All' ? items : items.filter((item) => item.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.navbar}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
          >
            <IconSymbol name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.logo}>Jagabans LA</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Our Menu</Text>
          <Text style={styles.subtitle}>
            Explore our selection of authentic West African dishes
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedCategory(category);
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.menuGrid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  {item.popular && (
                    <View style={styles.popularBadge}>
                      <IconSymbol name="star" size={12} color="#FFD700" />
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Order?</Text>
          <Text style={styles.ctaDescription}>
            Download our mobile app for easy ordering and exclusive rewards
          </Text>
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get the App</Text>
          </Pressable>
        </View>
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
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  header: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryFilter: {
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  categoryFilterContent: {
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 40,
    gap: 24,
    justifyContent: 'center',
  },
  menuItem: {
    width: 300,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  itemContent: {
    padding: 16,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    minHeight: 40,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  ctaSection: {
    backgroundColor: colors.primary,
    padding: 60,
    alignItems: 'center',
    marginTop: 40,
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  ctaDescription: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 600,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
});
