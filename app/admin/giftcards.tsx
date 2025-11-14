
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { giftCardService } from '@/services/supabaseService';
import { supabase } from '@/app/integrations/supabase/client';
import * as Haptics from 'expo-haptics';

interface GiftCardData {
  id: string;
  amount?: number;
  points?: number;
  sender_name?: string;
  recipient_name?: string;
  created_at: string;
  status: string;
}

export default function AdminGiftCardManagement() {
  const router = useRouter();
  const [giftCards, setGiftCards] = React.useState<GiftCardData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalValue: 0,
    activeCards: 0,
    redeemedCards: 0,
  });

  React.useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      // Fetch all gift cards
      const { data, error } = await (supabase as any)
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cards = (data || []) as GiftCardData[];
      setGiftCards(cards);

      // Calculate stats
      const totalValue = cards.reduce((sum: number, card: GiftCardData) => sum + (card.amount || card.points || 0), 0);
      const activeCards = cards.filter((c: GiftCardData) => c.status === 'active').length;
      const redeemedCards = cards.filter((c: GiftCardData) => c.status === 'redeemed').length;

      setStats({
        totalValue,
        activeCards,
        redeemedCards,
      });
    } catch (err) {
      console.error('Failed to load gift cards', err);
      setGiftCards([]);
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
        <Text style={styles.title}>Gift Cards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.totalValue}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeCards}</Text>
            <Text style={styles.statLabel}>Active Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.redeemedCards}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading gift cards...</Text>
            </View>
          ) : giftCards.length > 0 ? (
            giftCards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardIcon}>
                  <IconSymbol name="card-giftcard" size={32} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardAmount}>
                    ${card.amount || card.points || 0}
                  </Text>
                  {card.sender_name && (
                    <Text style={styles.cardDetail}>From: {card.sender_name}</Text>
                  )}
                  {card.recipient_name && (
                    <Text style={styles.cardDetail}>To: {card.recipient_name}</Text>
                  )}
                  <Text style={styles.cardDate}>
                    {new Date(card.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        card.status === 'active' ? '#4CAF5020' : '#95E1D320',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: card.status === 'active' ? '#4CAF50' : '#95E1D3' },
                    ]}
                  >
                    {card.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="card-giftcard" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No gift cards found</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Connect Supabase to track gift card purchases and redemptions in real-time
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
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
