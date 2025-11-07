
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

export default function AdminGiftCardManagement() {
  const router = useRouter();

  const giftCards = [
    {
      id: '1',
      amount: 50,
      purchaser: 'John Doe',
      recipient: 'Jane Smith',
      purchaseDate: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      amount: 100,
      purchaser: 'Mike Johnson',
      recipient: 'Sarah Williams',
      purchaseDate: '2024-01-20',
      status: 'redeemed',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
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
            <Text style={styles.statValue}>$450</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Active Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          {giftCards.map((card) => (
            <View key={card.id} style={styles.cardItem}>
              <View style={styles.cardIcon}>
                <IconSymbol name="card-giftcard" size={32} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardAmount}>${card.amount}</Text>
                <Text style={styles.cardDetail}>From: {card.purchaser}</Text>
                <Text style={styles.cardDetail}>To: {card.recipient}</Text>
                <Text style={styles.cardDate}>
                  {new Date(card.purchaseDate).toLocaleDateString()}
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
          ))}
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
});
