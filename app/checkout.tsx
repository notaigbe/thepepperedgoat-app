
import React, { useState, useEffect, useCallback } from 'react';
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
import { SUPABASE_URL, supabase } from '@/app/integrations/supabase/client';
import { WebView } from 'react-native-webview';

// Types
interface AddressValidationResult {
  success: boolean;
  isValid: boolean;
  formattedAddress?: string;
  addressComponents?: {
    streetNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  confidence?: 'high' | 'medium' | 'low';
  suggestions?: string[];
  error?: string;
}

interface PaymentResult {
  success: boolean;
  orderId?: string;
  orderNumber?: number;
  paymentId?: string;
  pointsEarned?: number;
  error?: any;
}

interface StoredCard {
  id: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName?: string;
  isDefault: boolean;
}

type OrderType = 'delivery' | 'pickup';
type PaymentMethodType = 'new-card' | 'stored-card';

export default function CheckoutScreen() {
  const router = useRouter();
  const { 
    cart, 
    userProfile, 
    currentColors, 
    setTabBarVisible,
    clearCart,
    loadUserProfile
  } = useApp();

  // State
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('new-card');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [storedCards, setStoredCards] = useState<StoredCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardToken, setCardToken] = useState<string>('');
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<string>('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Computed values
  const availablePoints = userProfile?.points || 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const pointsDiscount = usePoints ? Math.min(availablePoints * 0.01, subtotal * 0.2) : 0;
  const total = subtotal + tax - pointsDiscount;
  const pointsToEarn = Math.floor(total);

  // Effects
  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (userProfile) {
      loadStoredCards();
    }
  }, [userProfile]);

  useEffect(() => {
    // Only validate address if delivery is selected
    if (orderType !== 'delivery' || !addressTouched) return;
    const timeoutId = setTimeout(() => validateAddress(deliveryAddress), 1000);
    return () => clearTimeout(timeoutId);
  }, [deliveryAddress, addressTouched, orderType]);

  // Load stored cards from database
  const loadStoredCards = async () => {
    if (!userProfile) return;
    
    setLoadingCards(true);
    try {
      const { data, error } = await supabase
        .from('square_cards')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const cards: StoredCard[] = data.map((card: any) => ({
          id: card.id,
          cardBrand: card.card_brand,
          last4: card.last_4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
          cardholderName: card.cardholder_name,
          isDefault: card.is_default,
        }));
        setStoredCards(cards);
        
        // Auto-select default card if available
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
          setPaymentMethod('stored-card');
        }
      }
    } catch (error) {
      console.error('Error loading stored cards:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  // Helper functions
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const parseAddress = (address: string) => {
    if (addressValidation?.addressComponents) {
      return {
        address: `${addressValidation.addressComponents.streetNumber || ''} ${addressValidation.addressComponents.street || ''}`.trim(),
        city: addressValidation.addressComponents.city || '',
        state: addressValidation.addressComponents.state || '',
        zip: addressValidation.addressComponents.postalCode || '',
      };
    }
    
    const parts = address.split(',').map(p => p.trim());
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2]?.split(' ')[0] || '',
      zip: parts[2]?.split(' ')[1] || '',
    };
  };

  const getAddressValidationColor = () => {
    if (!addressValidation) return currentColors.textSecondary;
    if (!addressValidation.isValid) return '#EF4444';
    if (addressValidation.confidence === 'high') return '#10B981';
    if (addressValidation.confidence === 'medium') return '#F59E0B';
    return '#EF4444';
  };

  const getAddressValidationIcon = () => {
    if (isValidatingAddress) return 'hourglass';
    if (!addressValidation) return 'location-pin';
    if (!addressValidation.isValid) return 'xmark.circle.fill';
    if (addressValidation.confidence === 'high') return 'checkmark.circle.fill';
    if (addressValidation.confidence === 'medium') return 'exclamationmark.triangle.fill';
    return 'xmark.circle.fill';
  };

  const getAddressValidationMessage = () => {
    if (isValidatingAddress) return 'Validating address...';
    if (!addressValidation) return '';
    if (!addressValidation.isValid) return 'Address could not be verified. Please check for errors.';
    if (addressValidation.confidence === 'high') return 'Address verified ✓';
    if (addressValidation.confidence === 'medium') return 'Address partially verified. Please review.';
    return 'Address verification failed.';
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'creditcard.fill';
    if (brandLower.includes('mastercard')) return 'creditcard.fill';
    if (brandLower.includes('amex') || brandLower.includes('american')) return 'creditcard.fill';
    if (brandLower.includes('discover')) return 'creditcard.fill';
    return 'creditcard';
  };

  // Address validation
  const validateAddress = useCallback(async (address: string) => {
    if (!address || address.trim().length < 5) {
      setAddressValidation(null);
      return;
    }

    setIsValidatingAddress(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ address }),
      });

      const result: AddressValidationResult = await response.json();
      console.log('Address validation result:', result);
      
      setAddressValidation(result);
      
      if (result.isValid && result.formattedAddress && result.confidence === 'high') {
        setValidatedAddress(result.formattedAddress);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressValidation({
        success: false,
        isValid: false,
        error: 'Failed to validate address',
      });
    } finally {
      setIsValidatingAddress(false);
    }
  }, []);

  const useFormattedAddress = () => {
    if (addressValidation?.formattedAddress) {
      setDeliveryAddress(addressValidation.formattedAddress);
      setValidatedAddress(addressValidation.formattedAddress);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Handle card form message from WebView
  const handleCardFormMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Card form message:', data);

      if (data.type === 'TOKEN_CREATED') {
        setCardToken(data.token);
        setShowCardForm(false);
        showToast('success', 'Card added successfully!');
      } else if (data.type === 'ERROR') {
        showToast('error', data.message || 'Failed to process card');
      }
    } catch (error) {
      console.error('Error handling card form message:', error);
    }
  };

  // Payment processing using Square Payments API
  const processSquarePayment = async (): Promise<PaymentResult> => {
    try {
      console.log('Starting Square payment process...');
      
      if (!userProfile) throw new Error('User profile not found');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get authentication session. Please try logging in again.');
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('You are not logged in. Please log in and try again.');
      }

      console.log('Session obtained, calling process-square-payment Edge Function...');

      const addressParts = orderType === 'delivery' 
        ? parseAddress(validatedAddress || deliveryAddress)
        : { address: '', city: '', state: '', zip: '' };
      
      // Determine source ID based on payment method
      let sourceId: string;
      let saveCard = false;
      
      if (paymentMethod === 'stored-card' && selectedCardId) {
        // Use stored card
        const selectedCard = storedCards.find(c => c.id === selectedCardId);
        if (!selectedCard) throw new Error('Selected card not found');
        sourceId = selectedCardId; // The card ID from our database
      } else if (paymentMethod === 'new-card' && cardToken) {
        // Use new card token from Square Web Payments SDK
        sourceId = cardToken;
        saveCard = true;
      } else {
        // Fallback to test nonce for development
        sourceId = 'cnon:card-nonce-ok';
      }

      const amountInCents = Math.round(total * 100);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-square-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourceId,
          amount: amountInCents,
          currency: 'USD',
          saveCard,
          customer: {
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            address: addressParts.address,
            city: addressParts.city,
            state: addressParts.state,
            zip: addressParts.zip,
          },
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          orderType,
          deliveryAddress: orderType === 'delivery' ? (validatedAddress || deliveryAddress) : undefined,
          pickupNotes: orderType === 'pickup' ? pickupNotes : undefined,
        }),
      });

      console.log('Edge Function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Payment processing failed');
        } catch (parseError) {
          throw new Error(`Payment failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Payment result:', result);

      if (!result.success) throw new Error(result.error || 'Payment failed');

      // Reload stored cards if a new card was saved
      if (saveCard) {
        await loadStoredCards();
      }

      return { 
        success: true, 
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        paymentId: result.paymentId,
        pointsEarned: result.pointsEarned,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error };
    }
  };

  // Order handling
  const handlePlaceOrder = async () => {
    console.log('Placing order with Square Payments API');
    
    // Validate based on order type
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        showToast('error', 'Please enter a delivery address.');
        return;
      }

      if (addressTouched && addressValidation) {
        if (!addressValidation.isValid) {
          Alert.alert(
            'Address Verification',
            'The address you entered could not be verified. Please check and correct your address before continuing.',
            [{ text: 'OK' }]
          );
          return;
        }

        if (addressValidation.confidence === 'low') {
          Alert.alert(
            'Address Verification',
            'The address you entered has low confidence. We recommend reviewing it for accuracy.',
            [
              { text: 'Review Address', style: 'cancel' },
              { 
                text: 'Continue Anyway', 
                onPress: () => proceedWithOrder(),
                style: 'destructive'
              }
            ]
          );
          return;
        }
      }
    }

    // Validate payment method
    if (paymentMethod === 'stored-card' && !selectedCardId) {
      showToast('error', 'Please select a payment method.');
      return;
    }

    if (paymentMethod === 'new-card' && !cardToken) {
      showToast('error', 'Please add your card information.');
      return;
    }

    await proceedWithOrder();
  };

  const proceedWithOrder = async () => {
    setProcessing(true);

    try {
      const paymentResult = await processSquarePayment();

      if (!paymentResult.success) {
        const errorMessage = paymentResult.error instanceof Error 
          ? paymentResult.error.message 
          : 'There was an issue processing your payment. Please try again.';
        showToast('error', errorMessage);
        setProcessing(false);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      await loadUserProfile();
      
      const orderTypeText = orderType === 'delivery' ? 'delivery' : 'pickup';
      Alert.alert(
        'Order Placed!',
        `Your ${orderTypeText} order has been placed successfully!\n\nOrder #${paymentResult.orderNumber || 'N/A'}\nPayment ID: ${paymentResult.paymentId || 'N/A'}\n\nYou earned ${paymentResult.pointsEarned || 0} points!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to place order. Please try again.';
      showToast('error', errorMessage);
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
    orderTypeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    orderTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 8,
    },
    orderTypeText: {
      fontSize: 16,
      fontWeight: '600',
    },
    inputContainer: {
      position: 'relative',
    },
    input: {
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 80,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
      paddingRight: 48,
    },
    inputWithValidation: {
      borderWidth: 2,
    },
    validationIconContainer: {
      position: 'absolute',
      right: 16,
      top: 16,
    },
    validationMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
      paddingHorizontal: 4,
    },
    validationMessageText: {
      fontSize: 13,
      flex: 1,
    },
    formattedAddressSuggestion: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    suggestionAddress: {
      fontSize: 14,
      marginBottom: 8,
      lineHeight: 20,
    },
    useSuggestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 6,
      gap: 6,
    },
    useSuggestionButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    paymentMethodSelector: {
      gap: 12,
    },
    paymentMethodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    paymentMethodInfo: {
      flex: 1,
    },
    paymentMethodTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    paymentMethodSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    storedCardsList: {
      gap: 12,
      marginTop: 12,
    },
    storedCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    storedCardInfo: {
      flex: 1,
    },
    storedCardBrand: {
      fontSize: 16,
      fontWeight: '600',
    },
    storedCardDetails: {
      fontSize: 14,
      marginTop: 2,
    },
    defaultBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 4,
    },
    defaultBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    addCardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      gap: 8,
      marginTop: 12,
    },
    addCardButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cardFormContainer: {
      height: 400,
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 12,
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

  // Square Web Payments SDK HTML
  const cardFormHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script type="text/javascript" src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: ${currentColors.background};
        }
        #card-container {
          margin-bottom: 20px;
        }
        #card-button {
          background-color: ${currentColors.primary};
          color: ${currentColors.card};
          border: none;
          border-radius: 8px;
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
        }
        #card-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error {
          color: #EF4444;
          margin-top: 10px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div id="card-container"></div>
      <button id="card-button" type="button">Add Card</button>
      <div id="error-message" class="error"></div>
      
      <script>
        async function initializeCard(payments) {
          const card = await payments.card();
          await card.attach('#card-container');
          return card;
        }

        async function tokenize(paymentMethod) {
          const tokenResult = await paymentMethod.tokenize();
          if (tokenResult.status === 'OK') {
            return tokenResult.token;
          } else {
            let errorMessage = 'Tokenization failed';
            if (tokenResult.errors) {
              errorMessage = tokenResult.errors.map(error => error.message).join(', ');
            }
            throw new Error(errorMessage);
          }
        }

        document.addEventListener('DOMContentLoaded', async function () {
          // Initialize Square Payments
          // Note: In production, you'll need to pass the application ID from your backend
          const appId = 'sandbox-sq0idb-YOUR_APP_ID'; // Replace with actual app ID
          const locationId = 'YOUR_LOCATION_ID'; // Replace with actual location ID
          
          try {
            const payments = Square.payments(appId, locationId);
            const card = await initializeCard(payments);

            const cardButton = document.getElementById('card-button');
            cardButton.addEventListener('click', async function (event) {
              event.preventDefault();
              cardButton.disabled = true;
              
              try {
                const token = await tokenize(card);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TOKEN_CREATED',
                  token: token
                }));
              } catch (e) {
                document.getElementById('error-message').textContent = e.message;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: e.message
                }));
                cardButton.disabled = false;
              }
            });
          } catch (e) {
            document.getElementById('error-message').textContent = 'Failed to initialize payment form: ' + e.message;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              message: 'Failed to initialize payment form'
            }));
          }
        });
      </script>
    </body>
    </html>
  `;

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
          <IconSymbol name="chevron-left" size={24} color={currentColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.infoBanner, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Secure checkout powered by Square. Your payment information is encrypted and protected.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Order Type</Text>
            <View style={styles.orderTypeSelector}>
              <Pressable
                style={[
                  styles.orderTypeButton,
                  {
                    backgroundColor: orderType === 'delivery' ? currentColors.primary : currentColors.card,
                    borderColor: orderType === 'delivery' ? currentColors.primary : currentColors.border,
                  }
                ]}
                onPress={() => {
                  if (!processing) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrderType('delivery');
                  }
                }}
                disabled={processing}
              >
                <IconSymbol 
                  name="deliver-dining" 
                  size={20} 
                  color={orderType === 'delivery' ? currentColors.card : currentColors.text} 
                />
                <Text style={[
                  styles.orderTypeText, 
                  { color: orderType === 'delivery' ? currentColors.card : currentColors.text }
                ]}>
                  Delivery
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.orderTypeButton,
                  {
                    backgroundColor: orderType === 'pickup' ? currentColors.primary : currentColors.card,
                    borderColor: orderType === 'pickup' ? currentColors.primary : currentColors.border,
                  }
                ]}
                onPress={() => {
                  if (!processing) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrderType('pickup');
                  }
                }}
                disabled={processing}
              >
                <IconSymbol 
                  name="shopping-bag" 
                  size={20} 
                  color={orderType === 'pickup' ? currentColors.card : currentColors.text} 
                />
                <Text style={[
                  styles.orderTypeText, 
                  { color: orderType === 'pickup' ? currentColors.card : currentColors.text }
                ]}>
                  Pickup
                </Text>
              </Pressable>
            </View>
          </View>

          {orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Delivery Address *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithValidation,
                    { 
                      backgroundColor: currentColors.card, 
                      color: currentColors.text,
                      borderColor: addressTouched && addressValidation 
                        ? getAddressValidationColor()
                        : currentColors.border,
                    }
                  ]}
                  placeholder="Enter your full delivery address (street, city, state, ZIP)"
                  placeholderTextColor={currentColors.textSecondary}
                  value={deliveryAddress}
                  onChangeText={(text) => {
                    setDeliveryAddress(text);
                    setAddressTouched(true);
                  }}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!processing}
                />
                {addressTouched && (
                  <View style={styles.validationIconContainer}>
                    {isValidatingAddress ? (
                      <ActivityIndicator size="small" color={currentColors.primary} />
                    ) : (
                      <IconSymbol 
                        name={getAddressValidationIcon()} 
                        size={24} 
                        color={getAddressValidationColor()} 
                      />
                    )}
                  </View>
                )}
              </View>
              
              {addressTouched && addressValidation && (
                <View style={styles.validationMessage}>
                  <Text style={[
                    styles.validationMessageText, 
                    { color: getAddressValidationColor() }
                  ]}>
                    {getAddressValidationMessage()}
                  </Text>
                </View>
              )}

              {addressValidation?.isValid && 
               addressValidation.formattedAddress && 
               addressValidation.formattedAddress !== deliveryAddress && (
                <View style={[
                  styles.formattedAddressSuggestion,
                  { 
                    backgroundColor: currentColors.card,
                    borderColor: currentColors.primary + '40',
                  }
                ]}>
                  <View style={styles.suggestionHeader}>
                    <IconSymbol name="lightbulb.fill" size={16} color={currentColors.primary} />
                    <Text style={[styles.suggestionTitle, { color: currentColors.text }]}>
                      Suggested Address
                    </Text>
                  </View>
                  <Text style={[styles.suggestionAddress, { color: currentColors.textSecondary }]}>
                    {addressValidation.formattedAddress}
                  </Text>
                  <Pressable
                    style={[
                      styles.useSuggestionButton,
                      { backgroundColor: currentColors.primary }
                    ]}
                    onPress={useFormattedAddress}
                  >
                    <IconSymbol name="checkmark" size={14} color={currentColors.card} />
                    <Text style={[styles.useSuggestionButtonText, { color: currentColors.card }]}>
                      Use This Address
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
              {orderType === 'pickup' ? 'Pickup Notes (Optional)' : 'Delivery Notes (Optional)'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder={orderType === 'pickup' 
                ? 'Add any special instructions for pickup...' 
                : 'Add any special instructions for delivery...'}
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
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Payment Method *</Text>
            
            {loadingCards ? (
              <ActivityIndicator size="large" color={currentColors.primary} />
            ) : (
              <View style={styles.paymentMethodSelector}>
                {storedCards.length > 0 && (
                  <>
                    <Pressable
                      style={[
                        styles.paymentMethodButton,
                        {
                          backgroundColor: paymentMethod === 'stored-card' ? currentColors.primary + '20' : currentColors.card,
                          borderColor: paymentMethod === 'stored-card' ? currentColors.primary : currentColors.border,
                        }
                      ]}
                      onPress={() => {
                        if (!processing) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPaymentMethod('stored-card');
                          setShowCardForm(false);
                        }
                      }}
                      disabled={processing}
                    >
                      <IconSymbol 
                        name="creditcard.fill" 
                        size={24} 
                        color={paymentMethod === 'stored-card' ? currentColors.primary : currentColors.text} 
                      />
                      <View style={styles.paymentMethodInfo}>
                        <Text style={[
                          styles.paymentMethodTitle, 
                          { color: paymentMethod === 'stored-card' ? currentColors.primary : currentColors.text }
                        ]}>
                          Saved Card
                        </Text>
                        <Text style={[
                          styles.paymentMethodSubtitle, 
                          { color: currentColors.textSecondary }
                        ]}>
                          Use a saved payment method
                        </Text>
                      </View>
                      <View style={[
                        styles.radioButton,
                        { borderColor: paymentMethod === 'stored-card' ? currentColors.primary : currentColors.textSecondary }
                      ]}>
                        {paymentMethod === 'stored-card' && (
                          <View style={[styles.radioButtonInner, { backgroundColor: currentColors.primary }]} />
                        )}
                      </View>
                    </Pressable>

                    {paymentMethod === 'stored-card' && (
                      <View style={styles.storedCardsList}>
                        {storedCards.map((card) => (
                          <Pressable
                            key={card.id}
                            style={[
                              styles.storedCardItem,
                              {
                                backgroundColor: selectedCardId === card.id ? currentColors.primary + '10' : currentColors.card,
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
                              name={getCardBrandIcon(card.cardBrand)} 
                              size={32} 
                              color={selectedCardId === card.id ? currentColors.primary : currentColors.text} 
                            />
                            <View style={styles.storedCardInfo}>
                              <Text style={[
                                styles.storedCardBrand, 
                                { color: selectedCardId === card.id ? currentColors.primary : currentColors.text }
                              ]}>
                                {card.cardBrand} •••• {card.last4}
                              </Text>
                              <Text style={[styles.storedCardDetails, { color: currentColors.textSecondary }]}>
                                Expires {card.expMonth}/{card.expYear}
                              </Text>
                              {card.isDefault && (
                                <View style={[styles.defaultBadge, { backgroundColor: currentColors.primary }]}>
                                  <Text style={[styles.defaultBadgeText, { color: currentColors.card }]}>
                                    Default
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={[
                              styles.radioButton,
                              { borderColor: selectedCardId === card.id ? currentColors.primary : currentColors.textSecondary }
                            ]}>
                              {selectedCardId === card.id && (
                                <View style={[styles.radioButtonInner, { backgroundColor: currentColors.primary }]} />
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}

                <Pressable
                  style={[
                    styles.paymentMethodButton,
                    {
                      backgroundColor: paymentMethod === 'new-card' ? currentColors.primary + '20' : currentColors.card,
                      borderColor: paymentMethod === 'new-card' ? currentColors.primary : currentColors.border,
                    }
                  ]}
                  onPress={() => {
                    if (!processing) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPaymentMethod('new-card');
                      setShowCardForm(true);
                    }
                  }}
                  disabled={processing}
                >
                  <IconSymbol 
                    name="plus.circle.fill" 
                    size={24} 
                    color={paymentMethod === 'new-card' ? currentColors.primary : currentColors.text} 
                  />
                  <View style={styles.paymentMethodInfo}>
                    <Text style={[
                      styles.paymentMethodTitle, 
                      { color: paymentMethod === 'new-card' ? currentColors.primary : currentColors.text }
                    ]}>
                      New Card
                    </Text>
                    <Text style={[
                      styles.paymentMethodSubtitle, 
                      { color: currentColors.textSecondary }
                    ]}>
                      Add a new payment method
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    { borderColor: paymentMethod === 'new-card' ? currentColors.primary : currentColors.textSecondary }
                  ]}>
                    {paymentMethod === 'new-card' && (
                      <View style={[styles.radioButtonInner, { backgroundColor: currentColors.primary }]} />
                    )}
                  </View>
                </Pressable>

                {showCardForm && paymentMethod === 'new-card' && (
                  <View style={styles.cardFormContainer}>
                    <WebView
                      source={{ html: cardFormHTML }}
                      onMessage={handleCardFormMessage}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      startInLoadingState={true}
                      renderLoading={() => (
                        <ActivityIndicator size="large" color={currentColors.primary} />
                      )}
                    />
                  </View>
                )}
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
                {usePoints && <IconSymbol name="check-circle" size={16} color={currentColors.card} />}
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
              <IconSymbol name="lock" size={20} color={currentColors.card} />
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
