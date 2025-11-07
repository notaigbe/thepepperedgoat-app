
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import { PaymentMethod } from '@/types';
import * as Haptics from 'expo-haptics';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { userProfile, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = useApp();
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleAddCard = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length !== 16) {
      Alert.alert('Error', 'Please enter a valid 16-digit card number');
      return;
    }

    if (expiryDate.length !== 5) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
      return;
    }

    if (cvv.length !== 3) {
      Alert.alert('Error', 'Please enter a valid 3-digit CVV');
      return;
    }

    const newPaymentMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'credit',
      cardNumber: `**** **** **** ${cleanedCardNumber.slice(-4)}`,
      cardholderName,
      expiryDate,
      isDefault: false,
    };

    addPaymentMethod(newPaymentMethod);
    setShowAddCard(false);
    setCardNumber('');
    setCardholderName('');
    setExpiryDate('');
    setCvv('');
    Alert.alert('Success', 'Payment method added successfully!');
  };

  const handleRemoveCard = (paymentMethodId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removePaymentMethod(paymentMethodId),
        },
      ]
    );
  };

  const handleSetDefault = (paymentMethodId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDefaultPaymentMethod(paymentMethodId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {userProfile.paymentMethods.length === 0 && !showAddCard ? (
            <View style={styles.emptyState}>
              <IconSymbol name="creditcard" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
              <Text style={styles.emptyStateText}>
                Add a payment method to make checkout faster and easier
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {userProfile.paymentMethods.map((method) => (
                <View key={method.id} style={styles.cardItem}>
                  <View style={styles.cardInfo}>
                    <IconSymbol name="creditcard.fill" size={32} color={colors.primary} />
                    <View style={styles.cardDetails}>
                      <Text style={styles.cardNumber}>{method.cardNumber}</Text>
                      <Text style={styles.cardHolder}>{method.cardholderName}</Text>
                      <Text style={styles.cardExpiry}>Expires {method.expiryDate}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    {method.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleSetDefault(method.id)}
                        style={styles.setDefaultButton}
                      >
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleRemoveCard(method.id)}
                      style={styles.removeButton}
                    >
                      <IconSymbol name="trash" size={20} color={colors.accent} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {showAddCard && (
            <View style={styles.addCardForm}>
              <Text style={styles.formTitle}>Add New Card</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.textSecondary}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textSecondary}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.textSecondary}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={colors.textSecondary}
                    value={cvv}
                    onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formActions}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAddCard(false);
                    setCardNumber('');
                    setCardholderName('');
                    setExpiryDate('');
                    setCvv('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.addButton]}
                  onPress={handleAddCard}
                >
                  <Text style={styles.addButtonText}>Add Card</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!showAddCard && (
            <Pressable
              style={styles.addNewButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowAddCard(true);
              }}
            >
              <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
              <Text style={styles.addNewButtonText}>Add New Payment Method</Text>
            </Pressable>
          )}

          <View style={styles.securityNote}>
            <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
            <Text style={styles.securityNoteText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  cardItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 16,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  setDefaultButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  setDefaultText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  addCardForm: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  row: {
    flexDirection: 'row',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  addNewButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  addNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  securityNoteText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
