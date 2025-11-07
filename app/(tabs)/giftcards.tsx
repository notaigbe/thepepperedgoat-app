
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

const giftCardAmounts = [25, 50, 75, 100];

export default function GiftCardsScreen() {
  const { purchaseGiftCard } = useApp();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleAmountSelect = (amount: number) => {
    console.log('Amount selected:', amount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(amount);
  };

  const handlePurchase = () => {
    console.log('Purchasing gift card');
    
    if (!recipientName.trim() || !recipientEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter recipient name and email.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    purchaseGiftCard({
      id: Date.now().toString(),
      amount: selectedAmount,
      recipientName,
      recipientEmail,
      message: message.trim() || undefined,
    });

    Alert.alert(
      'Gift Card Sent!',
      `A $${selectedAmount} gift card has been sent to ${recipientName} at ${recipientEmail}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setRecipientName('');
            setRecipientEmail('');
            setMessage('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Gift Cards</Text>
            <Text style={styles.headerSubtitle}>Share the love of great food</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.giftCardPreview}>
            <View style={styles.giftCardDesign}>
              <Text style={styles.giftCardBrand}>Jagabans LA</Text>
              <Text style={styles.giftCardAmount}>${selectedAmount}</Text>
              <Text style={styles.giftCardSubtext}>Gift Card</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            <View style={styles.amountGrid}>
              {giftCardAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  style={[
                    styles.amountButton,
                    selectedAmount === amount && styles.amountButtonActive,
                  ]}
                  onPress={() => handleAmountSelect(amount)}
                >
                  <Text
                    style={[
                      styles.amountText,
                      selectedAmount === amount && styles.amountTextActive,
                    ]}
                  >
                    ${amount}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipient Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Recipient Name"
              placeholderTextColor={colors.textSecondary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Recipient Email"
              placeholderTextColor={colors.textSecondary}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Personal Message (Optional)"
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.infoText}>
              Gift cards are delivered instantly via email and can be used for any menu items or merch.
            </Text>
          </View>

          <Pressable style={styles.purchaseButton} onPress={handlePurchase}>
            <Text style={styles.purchaseButtonText}>
              Purchase Gift Card - ${selectedAmount}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  giftCardPreview: {
    marginBottom: 24,
  },
  giftCardDesign: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  giftCardBrand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.card,
    marginBottom: 16,
  },
  giftCardAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.card,
  },
  giftCardSubtext: {
    fontSize: 16,
    color: colors.card,
    marginTop: 8,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  amountButtonActive: {
    backgroundColor: colors.primary,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  amountTextActive: {
    color: colors.card,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  messageInput: {
    minHeight: 100,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
});
