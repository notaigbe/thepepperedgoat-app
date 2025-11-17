
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51STbimI3aFjO0eWAYAQOsC9VOOwPohmmUuf22E4IXERJHBVPOidW8Q6MnKnB1HyxDYxFoZlB1v4bKkODbYTarNdM00xuyfZg2l'; // Replace with your key
const STRIPE_API_URL = 'https://api.stripe.com/v1';

export default function CheckoutScreen() {
  const router = useRouter();
  const { 
    cart, 
    placeOrder, 
    userProfile, 
    currentColors, 
    setTabBarVisible
  } = useApp();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
    const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
      setToastType(type);
      setToastMessage(message);
      setToastVisible(true);
    }, []);

  React.useEffect(() => {
    setTabBarVisible(false);
    return () => {
      setTabBarVisible(true);
    };
  }, [setTabBarVisible]);

  // Set default payment method on load
  React.useEffect(() => {
    if (userProfile?.paymentMethods && userProfile.paymentMethods.length > 0) {
      const defaultCard = userProfile.paymentMethods.find(pm => pm.isDefault);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      } else {
        setSelectedCardId(userProfile.paymentMethods[0].id);
      }
    }
  }, [userProfile?.paymentMethods]);

  const availablePoints = userProfile?.points || 0;
  const hasSavedCards = userProfile?.paymentMethods && userProfile.paymentMethods.length > 0;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const pointsDiscount = usePoints ? Math.min(availablePoints * 0.01, subtotal * 0.2) : 0;
  const total = subtotal + tax - pointsDiscount;
  const pointsToEarn = Math.floor(total);

  // Create Stripe payment intent
  const createPaymentIntent = async () => {
    try {
      // This should be done on your backend for security
      // For demo purposes, showing the structure
      const response = await fetch(`${STRIPE_API_URL}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `amount=${Math.round(total * 100)}&currency=usd`,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  // Process Stripe payment
  const processStripePayment = async () => {
    try {
      const savedCard = userProfile?.paymentMethods.find(pm => pm.id === selectedCardId);
      if (!savedCard) {
        throw new Error('Selected card not found');
      }
      
      // In production, send card ID to backend to process with Stripe
      const paymentIntent = await createPaymentIntent();
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true, paymentIntentId: paymentIntent.id };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error };
    }
  };

  const handlePlaceOrder = async () => {
    console.log('Placing order');
    
    if (!deliveryAddress.trim()) {
      showToast('error', 'Please enter a delivery address.');
      return;
    }

    if (!hasSavedCards) {
      showToast('error', 'Please add a payment method before placing an order.');
      return;
    }

    if (!selectedCardId) {
      showToast('error', 'Please select a payment method.');
      return;
    }

    setProcessing(true);

    try {
      // Process payment with Stripe
      const paymentResult = await processStripePayment();

      if (!paymentResult.success) {
        showToast('info', 'There was an issue processing your payment. Please try again.');
        return;
      }

      // Place order after successful payment
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await placeOrder(deliveryAddress, pickupNotes || undefined);
      
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully! You earned ${pointsToEarn} points.\n\nPayment ID: ${paymentResult.paymentIntentId}`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/(home)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      showToast('error', 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    infoBanner: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      gap: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    input: {
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 80,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    cardInput: {
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      marginBottom: 12,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    cardRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cardInputHalf: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    paymentMethodSection: {
      gap: 12,
    },
    savedCardsContainer: {
      gap: 12,
    },
    savedCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    savedCardInfo: {
      flex: 1,
    },
    savedCardNumber: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    savedCardExpiry: {
      fontSize: 14,
      opacity: 0.7,
    },
    savedCardDefault: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    manageCardsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    manageCardsText: {
      fontSize: 14,
      fontWeight: '600',
    },
    noCardsContainer: {
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      gap: 12,
    },
    noCardsText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 4,
    },
    noCardsSubtext: {
      fontSize: 14,
      textAlign: 'center',
      opacity: 0.7,
      marginBottom: 8,
    },
    addCardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    addCardButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    secureLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingLeft: 4,
    },
    secureLabelText: {
      fontSize: 12,
      opacity: 0.7,
    },
    pointsToggle: {
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    pointsToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    pointsToggleInfo: {
      flex: 1,
    },
    pointsToggleTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    pointsToggleSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryCard: {
      borderRadius: 12,
      padding: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
    },
    summaryValue: {
      fontSize: 16,
    },
    summaryRowTotal: {
      borderTopWidth: 1,
      paddingTop: 12,
      marginTop: 4,
    },
    summaryLabelTotal: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    summaryValueTotal: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    pointsEarnCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
    },
    pointsEarnText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
    },
    placeOrderButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      elevation: 4,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    placeOrderButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['bottom']}>
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
          <IconSymbol name="chevron.left" size={24} color={currentColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.infoBanner, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Customers primarily pick up orders. Please provide your address and any pickup notes below.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Delivery Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Enter your delivery address"
              placeholderTextColor={currentColors.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!processing}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Pickup Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Add any special instructions for pickup..."
              placeholderTextColor={currentColors.textSecondary}
              value={pickupNotes}
              onChangeText={setPickupNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!processing}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Payment Method</Text>
            
            {hasSavedCards ? (
              <View style={styles.paymentMethodSection}>
                <View style={styles.savedCardsContainer}>
                  {userProfile?.paymentMethods.map((card) => (
                    <Pressable
                      key={card.id}
                      style={[
                        styles.savedCardItem,
                        {
                          backgroundColor: currentColors.card,
                          borderColor: selectedCardId === card.id ? currentColors.primary : currentColors.border,
                        }
                      ]}
                      onPress={() => {
                        if (!processing) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCardId(card.id);
                        }
                      }}
                      disabled={processing}
                    >
                      <IconSymbol 
                        name={card.type === 'credit' ? 'creditcard.fill' : 'banknote.fill'} 
                        size={24} 
                        color={selectedCardId === card.id ? currentColors.primary : currentColors.textSecondary} 
                      />
                      <View style={styles.savedCardInfo}>
                        <Text style={[styles.savedCardNumber, { color: currentColors.text }]}>
                          •••• •••• •••• {card.cardNumber.slice(-4)}
                        </Text>
                        <Text style={[styles.savedCardExpiry, { color: currentColors.textSecondary }]}>
                          {card.cardholderName} • Expires {card.expiryDate}
                        </Text>
                        {card.isDefault && (
                          <Text style={[styles.savedCardDefault, { color: currentColors.primary }]}>
                            DEFAULT
                          </Text>
                        )}
                      </View>
                      {selectedCardId === card.id && (
                        <IconSymbol name="checkmark.circle.fill" size={24} color={currentColors.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
                
                <Pressable
                  style={[
                    styles.manageCardsButton,
                    { backgroundColor: currentColors.card }
                  ]}
                  onPress={() => {
                    if (!processing) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/payment-methods');
                    }
                  }}
                  disabled={processing}
                >
                  <IconSymbol name="creditcard" size={20} color={currentColors.primary} />
                  <Text style={[styles.manageCardsText, { color: currentColors.primary }]}>
                    Manage Payment Methods
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color={currentColors.textSecondary} />
                </Pressable>

                <View style={styles.secureLabel}>
                  <IconSymbol name="lock.fill" size={14} color={currentColors.primary} />
                  <Text style={[styles.secureLabelText, { color: currentColors.textSecondary }]}>
                    Secured by Stripe • Your payment info is encrypted
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.noCardsContainer, { backgroundColor: currentColors.card }]}>
                <IconSymbol name="creditcard" size={48} color={currentColors.textSecondary} />
                <Text style={[styles.noCardsText, { color: currentColors.text }]}>
                  No Payment Methods Saved
                </Text>
                <Text style={[styles.noCardsSubtext, { color: currentColors.textSecondary }]}>
                  Add a payment method to complete your purchase
                </Text>
                <Pressable
                  style={[
                    styles.addCardButton,
                    { backgroundColor: currentColors.primary }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/payment-methods');
                  }}
                >
                  <IconSymbol name="plus.circle.fill" size={20} color={currentColors.card} />
                  <Text style={[styles.addCardButtonText, { color: currentColors.card }]}>
                    Add Payment Method
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Pressable
              style={[styles.pointsToggle, { backgroundColor: currentColors.card }]}
              onPress={() => {
                if (!processing) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUsePoints(!usePoints);
                }
              }}
              disabled={processing}
            >
              <View style={styles.pointsToggleLeft}>
                <IconSymbol name="star.fill" size={24} color={currentColors.highlight} />
                <View style={styles.pointsToggleInfo}>
                  <Text style={[styles.pointsToggleTitle, { color: currentColors.text }]}>Use Reward Points</Text>
                  <Text style={[styles.pointsToggleSubtitle, { color: currentColors.textSecondary }]}>
                    You have {availablePoints} points available
                  </Text>
                </View>
              </View>
              <View style={[styles.checkbox, { borderColor: currentColors.textSecondary }, usePoints && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }]}>
                {usePoints && <IconSymbol name="checkmark" size={16} color={currentColors.card} />}
              </View>
            </Pressable>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: currentColors.card }]}>
            <Text style={[styles.summaryTitle, { color: currentColors.text }]}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Tax (8.75%)</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${tax.toFixed(2)}</Text>
            </View>
            {usePoints && pointsDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: currentColors.primary }]}>
                  Points Discount
                </Text>
                <Text style={[styles.summaryValue, { color: currentColors.primary }]}>
                  -${pointsDiscount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowTotal, { borderTopColor: currentColors.background }]}>
              <Text style={[styles.summaryLabelTotal, { color: currentColors.text }]}>Total</Text>
              <Text style={[styles.summaryValueTotal, { color: currentColors.primary }]}>${total.toFixed(2)}</Text>
            </View>
            <View style={[styles.pointsEarnCard, { backgroundColor: currentColors.background }]}>
              <IconSymbol name="star.fill" size={20} color={currentColors.highlight} />
              <Text style={[styles.pointsEarnText, { color: currentColors.text }]}>
                You&apos;ll earn {pointsToEarn} points with this order!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: currentColors.card, borderTopColor: currentColors.background }]}>
        <Pressable 
          style={[
            styles.placeOrderButton, 
            { 
              backgroundColor: processing ? currentColors.textSecondary : currentColors.primary,
              opacity: processing ? 0.7 : 1
            }
          ]} 
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <>
              <ActivityIndicator color={currentColors.card} />
              <Text style={[styles.placeOrderButtonText, { color: currentColors.card }]}>
                Processing...
              </Text>
            </>
          ) : (
            <>
              <IconSymbol name="lock.fill" size={20} color={currentColors.card} />
              <Text style={[styles.placeOrderButtonText, { color: currentColors.card }]}>
                Pay ${total.toFixed(2)}
              </Text>
            </>
          )}
        </Pressable>
      </View>
            <Toast
              visible={toastVisible}
              message={toastMessage}
              type={toastType}
              onHide={() => setToastVisible(false)}
              currentColors={currentColors}
            />
    </SafeAreaView>
  );
}
