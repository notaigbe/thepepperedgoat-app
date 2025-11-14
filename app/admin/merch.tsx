
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { merchItems as staticMerchItems } from '@/data/merchData';
import { MerchItem } from '@/types';
import { merchService } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';

export default function AdminMerchManagement() {
  const router = useRouter();
  const [items, setItems] = React.useState<MerchItem[]>(staticMerchItems);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchMerchItems();
  }, []);

  const fetchMerchItems = async () => {
    try {
      setLoading(true);
      const res = await merchService.getMerchItems();
      if (res.error) throw res.error;
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load merch items', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(admin)' as any);
            }
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Merchandise</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.merchContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading merchandise...</Text>
            </View>
          ) : items.length > 0 ? (
            items.map((item) => (
              <View key={item.id} style={styles.merchCard}>
                <Image source={{ uri: item.image }} style={styles.merchImage} />
                <View style={styles.merchContent}>
                  <Text style={styles.merchName}>{item.name}</Text>
                  <Text style={styles.merchDescription}>{item.description}</Text>
                  <View style={styles.merchFooter}>
                    <View style={styles.pointsCost}>
                      <IconSymbol name="stars" size={16} color={colors.primary} />
                      <Text style={styles.pointsText}>{item.pointsCost} points</Text>
                    </View>
                    <View
                      style={[
                        styles.stockBadge,
                        { backgroundColor: item.inStock ? '#4CAF5020' : '#FF6B6B20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockText,
                          { color: item.inStock ? '#4CAF50' : '#FF6B6B' },
                        ]}
                      >
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="shopping-bag" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No merchandise available</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Connect Supabase to manage merchandise inventory in real-time
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  merchContainer: {
    padding: 16,
    gap: 16,
  },
  merchCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  merchContent: {
    flex: 1,
    marginLeft: 12,
  },
  merchName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  merchDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  merchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
