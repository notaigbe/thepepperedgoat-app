import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import { SUPABASE_URL, supabase } from '@/app/integrations/supabase/client';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import Dialog from '@/components/Dialog';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';

// ─── Black · Gold · Silver tokens ────────────────────────────────────
// Defined locally so this screen is self-contained. These mirror the
// values in colors.ts / getCurrentColors so currentColors references
// automatically resolve to gold/silver/ink across the whole screen.
const GOLD        = "#B8922A";
const GOLD_BRIGHT = "#D4A83A";
const GOLD_DIM    = "rgba(184,146,42,0.12)";
const SILVER      = "#C0C0C8";
const INK         = "#1A1612";
const INK_MID     = "#6B6055";
const INK_SOFT    = "rgba(26,22,18,0.38)";
const INK_WHITE   = "#F5F5F0";
const BODY_BG     = "#F8F6F1";
const CARD_BG     = "#FFFFFF";
const CARD_FOOTER = "#FAFAF7";
const HEADER_TOP  = "#0A0A0A";
const HEADER_MID  = "#111108";
const BORDER_GOLD = "rgba(184,146,42,0.22)";
const BORDER_STRONG = "rgba(184,146,42,0.40)";
const BORDER_LIGHT  = "rgba(26,22,18,0.08)";
const SUCCESS_GREEN = "#2E7D52";
const WARN_AMBER    = "#C07A10";
const ERROR_RED     = "#C0392B";

// ============================================================================
// TYPES
// ============================================================================

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

type OrderType = 'delivery' | 'pickup';

interface Order {
  id: string;
  user_id: string | null;
  total: number;
  points_earned: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: 'pickup' | 'delivery';
  payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | null;
  payment_id: string | null;
  order_number: number;
  full_name: string | null;
  delivery_address: string | null;
  pickup_notes: string | null;
  delivery_provider: string | null;
  delivery_triggered_at: string | null;
  cancellation_deadline: string | null;
  uber_delivery_id: string | null;
  uber_delivery_status: string | null;
  uber_tracking_url: string | null;
  uber_courier_name: string | null;
  uber_courier_phone: string | null;
  uber_courier_location: Record<string, unknown> | null;
  uber_delivery_eta: string | null;
  uber_proof_of_delivery: Record<string, unknown> | null;
  doordash_delivery_id: string | null;
  doordash_delivery_status: string | null;
  doordash_tracking_url: string | null;
  doordash_dasher_name: string | null;
  doordash_dasher_phone: string | null;
  doordash_dasher_location: Record<string, unknown> | null;
  doordash_delivery_eta: string | null;
  doordash_proof_of_delivery: Record<string, unknown> | null;
  read: boolean | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StripePayment {
  id: string;
  user_id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  receipt_url?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface StoredCard {
  id: string;
  stripePaymentMethodId: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// ============================================================================
// STRIPE PUBLISHABLE KEY
// ============================================================================
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SaVNBEpxgw216dfngaO9r3erOFV7XFC4zvvwMd97HuPpWpvCy26sCwWITZHhmtAv6iZLT35RGITrIxBoTF1v9AI007NGoktyP';

// ============================================================================
// POINTS SYSTEM CONSTANTS
// ============================================================================
const POINTS_TO_DOLLAR_RATE    = 0.01;
const DISCOUNT_PERCENTAGE      = 0.15;
const POINTS_REWARD_PERCENTAGE = 0.05;

// ============================================================================
// CHECKOUT CONTENT
// ============================================================================

function CheckoutContent() {
  const router = useRouter();
  const {
    cart,
    userProfile,
    currentColors,
    setTabBarVisible,
    clearCart,
    loadUserProfile
  } = useApp();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // ── State ──────────────────────────────────────────────────────────
  const [orderType, setOrderType]           = useState<OrderType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes]       = useState('');
  const [usePoints, setUsePoints]           = useState(false);
  const [processing, setProcessing]         = useState(false);

  const [addressValidation, setAddressValidation]     = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressTouched, setAddressTouched]           = useState(false);
  const [validatedAddress, setValidatedAddress]       = useState<string>('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType]       = useState<'success' | 'error' | 'info'>('success');

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType]       = useState<'remove' | 'empty'>('remove');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

  // ── Computed values ────────────────────────────────────────────────
  const availablePoints       = userProfile?.points || 0;
  const subtotal              = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount              = subtotal * DISCOUNT_PERCENTAGE;
  const subtotalAfterDiscount = subtotal - discount;
  const tax                   = subtotalAfterDiscount * 0.0975;
  const pointsValueInDollars  = availablePoints * POINTS_TO_DOLLAR_RATE;
  const maxPointsDiscount     = subtotalAfterDiscount * 0.2;
  const pointsDiscount        = usePoints ? Math.min(pointsValueInDollars, maxPointsDiscount) : 0;
  const total                 = subtotalAfterDiscount + tax - pointsDiscount;
  const pointsToEarn          = Math.floor((subtotalAfterDiscount * POINTS_REWARD_PERCENTAGE) / POINTS_TO_DOLLAR_RATE);

  // ── Helpers ────────────────────────────────────────────────────────
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const getAddressValidationColor = useCallback(() => {
    if (!addressValidation) return INK_MID;
    if (!addressValidation.isValid) return ERROR_RED;
    if (addressValidation.confidence === 'high')   return SUCCESS_GREEN;
    if (addressValidation.confidence === 'medium') return WARN_AMBER;
    return ERROR_RED;
  }, [addressValidation]);

  const getAddressValidationIcon = useCallback((): string => {
    if (isValidatingAddress)              return 'hourglass-empty';
    if (!addressValidation)               return 'location-on';
    if (!addressValidation.isValid)       return 'cancel';
    if (addressValidation.confidence === 'high')   return 'check-circle';
    if (addressValidation.confidence === 'medium') return 'warning';
    return 'cancel';
  }, [isValidatingAddress, addressValidation]);

  const getAddressValidationMessage = useCallback(() => {
    if (isValidatingAddress)              return 'Validating address...';
    if (!addressValidation)               return '';
    if (!addressValidation.isValid)       return 'Address could not be verified. Please check for errors.';
    if (addressValidation.confidence === 'high')   return 'Address verified ✓';
    if (addressValidation.confidence === 'medium') return 'Address partially verified. Please review.';
    return 'Address verification failed.';
  }, [isValidatingAddress, addressValidation]);

  // ── Address validation ─────────────────────────────────────────────
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ address }),
      });
      const result: AddressValidationResult = await response.json();
      setAddressValidation(result);
      if (result.isValid && result.formattedAddress && result.confidence === 'high') {
        setValidatedAddress(result.formattedAddress);
      }
    } catch (error) {
      setAddressValidation({ success: false, isValid: false, error: 'Failed to validate address' });
    } finally {
      setIsValidatingAddress(false);
    }
  }, []);

  const useFormattedAddress = useCallback(() => {
    if (addressValidation?.formattedAddress) {
      setDeliveryAddress(addressValidation.formattedAddress);
      setValidatedAddress(addressValidation.formattedAddress);
      setAddressTouched(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [addressValidation]);

  // ── Payment sheet ─────────────────────────────────────────────────
  const initializePaymentSheet = useCallback(async () => {
    try {
      if (!userProfile) throw new Error('User profile not found');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: customerData } = await supabase
        .from('user_profiles').select('stripe_customer_id').eq('user_id', user.id).single();
      let customerId = customerData?.stripe_customer_id;

      if (!customerId) {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/create-stripe-customer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ email: userProfile?.email || user.email, name: userProfile?.name }),
        });
        if (!r.ok) throw new Error('Failed to create Stripe customer');
        const { customerId: newId } = await r.json();
        customerId = newId;
      }

      const pointsUsed  = usePoints ? Math.floor(pointsDiscount / POINTS_TO_DOLLAR_RATE) : 0;
      const orderItems  = cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: 'usd',
          customerId,
          setupFutureUsage: 'off_session',
          metadata: {
            user_id: user.id,
            order_type: orderType,
            delivery_address: orderType === 'delivery' ? (validatedAddress || deliveryAddress) : '',
            pickup_notes: pickupNotes || '',
            items: JSON.stringify(orderItems),
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            discount: discount.toFixed(2),
            points_earned: pointsToEarn.toString(),
            points_used: pointsUsed.toString(),
            points_discount: pointsDiscount.toFixed(2),
            item_count: cart.length.toString(),
            customer_name: userProfile?.name || '',
            customer_email: userProfile?.email || user.email || '',
            customer_phone: userProfile?.phone || '',
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to create payment intent');
      const { clientSecret, ephemeralKey, paymentIntentId, customerId: returnedCustomerId } = await response.json();
      return { clientSecret, ephemeralKey, paymentIntentId, customerId: returnedCustomerId };
    } catch (error) {
      throw error;
    }
  }, [total, orderType, cart, userProfile, validatedAddress, deliveryAddress, pickupNotes,
      subtotal, tax, discount, pointsToEarn, usePoints, pointsDiscount]);

  // ── Order polling ──────────────────────────────────────────────────
  const waitForOrderCreation = useCallback(async (paymentIntentId: string): Promise<string> => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const { data: order } = await supabase
        .from('orders').select('id, order_type').eq('payment_id', paymentIntentId).maybeSingle<Order>();
      if (order?.id) return order.id;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Order creation timed out. Your payment was successful. Please contact support with payment ID: ' + paymentIntentId);
  }, []);

  // ── Payment flow ───────────────────────────────────────────────────
  const proceedWithPayment = useCallback(async () => {
    setProcessing(true);
    try {
      const paymentData = await initializePaymentSheet();
      if (!paymentData) throw new Error('Failed to initialize payment');

      const { clientSecret, ephemeralKey, paymentIntentId, customerId } = paymentData;
      const returnURL = Linking.createURL('checkout');

      const initConfig: any = {
        merchantDisplayName: 'The Peppered Goat',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        returnURL,
        defaultBillingDetails: { name: userProfile?.name, email: userProfile?.email },
        googlePay: { merchantCountryCode: 'US', testEnv: false, currencyCode: 'usd' },
      };
      if (customerId && ephemeralKey) {
        initConfig.customerId = customerId;
        initConfig.customerEphemeralKeySecret = ephemeralKey;
      }

      const { error: initError } = await initPaymentSheet(initConfig);
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === 'Canceled') { showToast('info', 'Payment cancelled'); setProcessing(false); return; }
        throw new Error(presentError.message);
      }

      showToast('success', 'Payment successful! Creating your order...');
      const orderId = await waitForOrderCreation(paymentIntentId);
      clearCart();
      await loadUserProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setProcessing(false);
        router.push({ pathname: '/order-confirmation', params: { orderId } });
      }, 100);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      showToast('error', msg);
      setProcessing(false);
    }
  }, [initializePaymentSheet, initPaymentSheet, presentPaymentSheet, waitForOrderCreation,
      clearCart, loadUserProfile, router, showToast, userProfile]);

  const handlePlaceOrder = useCallback(async () => {
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) { showToast('error', 'Please enter a delivery address.'); return; }
      if (addressTouched && addressValidation) {
        if (!addressValidation.isValid) {
          Alert.alert('Address Verification', 'The address you entered could not be verified. Please check and correct it before continuing.', [{ text: 'OK' }]);
          return;
        }
        if (addressValidation.confidence === 'low') {
          Alert.alert('Address Verification', 'The address has low confidence. We recommend reviewing it.', [
            { text: 'Review Address', style: 'cancel' },
            { text: 'Continue Anyway', onPress: async () => await proceedWithPayment(), style: 'destructive' },
          ]);
          return;
        }
      }
    }
    await proceedWithPayment();
  }, [orderType, deliveryAddress, addressTouched, addressValidation, showToast, proceedWithPayment]);

  // ── Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (orderType !== 'delivery' || !addressTouched || !deliveryAddress.trim()) return;
    const id = setTimeout(() => validateAddress(deliveryAddress), 1000);
    return () => clearTimeout(id);
  }, [deliveryAddress, addressTouched, orderType, validateAddress]);

  // ============================================================================
  // STYLES — Black · Gold · Silver
  // ============================================================================
  const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    safeArea: { flex: 1 },
    container: { flex: 1 },
    content: { padding: 20 },

    // ── Header ──────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: BORDER_GOLD,    // gold hairline matches WelcomeHeader
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: BORDER_GOLD,
      elevation: 3,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },

    // ── Info banner ──────────────────────────────────────────────────
    infoBanner: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 14,
      marginBottom: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: BORDER_GOLD,
      elevation: 3,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'LibertinusSans_400Regular',
      lineHeight: 20,
      color: INK_MID,
    },

    // ── Section ──────────────────────────────────────────────────────
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 17,
      fontFamily: 'LibertinusSans_700Bold',
      marginBottom: 12,
      color: INK,
      letterSpacing: 0.3,
    },

    // ── Order type selector ──────────────────────────────────────────
    orderTypeSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    orderTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 36,
      borderWidth: 1,
      gap: 8,
      elevation: 3,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    orderTypeText: {
      fontSize: 15,
      fontFamily: 'LibertinusSans_700Bold',
    },

    // ── Inputs ──────────────────────────────────────────────────────
    inputContainer: { position: 'relative' },
    input: {
      borderRadius: 14,
      padding: 16,
      fontSize: 15,
      fontFamily: 'LibertinusSans_400Regular',
      minHeight: 80,
      elevation: 2,
      paddingRight: 48,
      backgroundColor: CARD_BG,
      color: INK,
      borderWidth: 1,
      borderColor: BORDER_GOLD,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    inputWithValidation: { borderWidth: 1 },
    validationIconContainer: { position: 'absolute', right: 16, top: 16 },
    validationMessage: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, paddingHorizontal: 4 },
    validationMessageText: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', flex: 1 },

    // ── Address suggestion ───────────────────────────────────────────
    formattedAddressSuggestion: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: CARD_BG,
      borderColor: BORDER_GOLD,
      elevation: 2,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    suggestionTitle: { fontSize: 14, fontFamily: 'LibertinusSans_700Bold', color: INK },
    suggestionAddress: {
      fontSize: 14,
      fontFamily: 'LibertinusSans_400Regular',
      marginBottom: 10,
      lineHeight: 20,
      color: INK_MID,
    },
    useSuggestionButton: {
      borderRadius: 36,
      overflow: 'hidden',
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    useSuggestionButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6 },
    useSuggestionButtonText: { fontSize: 13, fontFamily: 'LibertinusSans_700Bold', color: '#FFFFFF' },

    // ── Points toggle ────────────────────────────────────────────────
    pointsToggle: {
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 3,
      borderWidth: 1,
      borderColor: BORDER_GOLD,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    pointsToggleLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    pointsToggleInfo:     { flex: 1 },
    pointsToggleTitle:    { fontSize: 15, fontFamily: 'LibertinusSans_700Bold', color: INK },
    pointsToggleSubtitle: { fontSize: 13, fontFamily: 'LibertinusSans_400Regular', marginTop: 2, color: INK_MID },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: BORDER_GOLD,
    },

    // ── Summary card ─────────────────────────────────────────────────
    summaryCard: {
      borderRadius: 16,
      padding: 20,
      elevation: 6,
      borderWidth: 1,
      borderColor: BORDER_GOLD,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
    },
    summaryTitle: {
      fontSize: 18,
      fontFamily: 'LibertinusSans_700Bold',
      marginBottom: 16,
      color: INK,
      letterSpacing: 0.3,
    },
    summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 15, fontFamily: 'LibertinusSans_400Regular', color: INK_MID },
    summaryValue: { fontSize: 15, fontFamily: 'LibertinusSans_700Bold',    color: INK_MID },
    summaryRowTotal: { borderTopWidth: 1, paddingTop: 12, marginTop: 4, borderTopColor: BORDER_GOLD },
    summaryLabelTotal: { fontSize: 17, fontFamily: 'LibertinusSans_700Bold', color: INK },
    summaryValueTotal: { fontSize: 20, fontFamily: 'LibertinusSans_700Bold', color: GOLD }, // gold total

    // ── Points earn ──────────────────────────────────────────────────
    pointsEarnCard: {
      flexDirection: 'row', alignItems: 'center', padding: 12,
      borderRadius: 12, marginTop: 16, gap: 8,
      backgroundColor: GOLD_DIM,
      borderWidth: 1, borderColor: BORDER_GOLD,
    },
    pointsEarnText: { flex: 1, fontSize: 13, fontFamily: 'LibertinusSans_400Regular', color: INK_MID },

    // ── Footer ──────────────────────────────────────────────────────
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: BORDER_GOLD,
      elevation: 10,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    placeOrderButton: {
      borderRadius: 36,
      overflow: 'hidden',
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
    placeOrderButtonInner: {
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    placeOrderButtonText: {
      fontSize: 17,
      fontFamily: 'LibertinusSans_700Bold',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },

    // ── Payment info ─────────────────────────────────────────────────
    paymentMethodsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: BORDER_GOLD,
      backgroundColor: CARD_BG,
      gap: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    paymentMethodsInfoText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'LibertinusSans_400Regular',
      lineHeight: 20,
      color: INK_MID,
    },
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    // Body background: warm parchment gradient
    <LinearGradient
      colors={[BODY_BG, BODY_BG, "#F5F0E8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>

        {/* ── Header: dark near-black strip with radial gold bloom ── */}
        <LinearGradient
          colors={[HEADER_TOP, HEADER_MID]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Back button: gold-bordered dark pill */}
          <LinearGradient
            colors={["rgba(184,146,42,0.15)", "rgba(184,146,42,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backButton}
          >
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              style={{ padding: 8 }}
            >
              <IconSymbol name="chevron.left" size={24} color={INK_WHITE} />
            </Pressable>
          </LinearGradient>
        </LinearGradient>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            {/* ── Info banner ── */}
            <LinearGradient
              colors={[CARD_BG, CARD_FOOTER]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoBanner}
            >
              <IconSymbol name="info" size={20} color={GOLD} />
              <Text style={styles.infoText}>
                Secure checkout powered by Stripe. Your payment information is encrypted and protected. Enjoy 15% off your order!
              </Text>
            </LinearGradient>

            {/* ── Order type ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Type</Text>
              <View style={styles.orderTypeSelector}>

                {/* Delivery button */}
                <LinearGradient
                  colors={orderType === 'delivery'
                    ? [GOLD_BRIGHT, GOLD]           // active: gold gradient
                    : [CARD_BG, CARD_FOOTER]        // inactive: white card
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.orderTypeButton, {
                    borderColor: orderType === 'delivery' ? GOLD : BORDER_GOLD,
                  }]}
                >
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 }}
                    onPress={() => { if (!processing) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOrderType('delivery'); } }}
                    disabled={processing}
                  >
                    <IconSymbol
                      name="scooter"
                      size={20}
                      color={orderType === 'delivery' ? '#FFFFFF' : INK_MID}
                    />
                    <Text style={[styles.orderTypeText, {
                      color: orderType === 'delivery' ? '#FFFFFF' : INK_MID,
                    }]}>
                      Delivery
                    </Text>
                  </Pressable>
                </LinearGradient>

                {/* Pickup button */}
                <LinearGradient
                  colors={orderType === 'pickup'
                    ? [GOLD, GOLD_BRIGHT]
                    : [CARD_BG, CARD_FOOTER]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.orderTypeButton, {
                    borderColor: orderType === 'pickup' ? GOLD : BORDER_GOLD,
                  }]}
                >
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 }}
                    onPress={() => { if (!processing) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOrderType('pickup'); } }}
                    disabled={processing}
                  >
                    <IconSymbol
                      name="bag.fill"
                      size={20}
                      color={orderType === 'pickup' ? '#FFFFFF' : INK_MID}
                    />
                    <Text style={[styles.orderTypeText, {
                      color: orderType === 'pickup' ? '#FFFFFF' : INK_MID,
                    }]}>
                      Pickup
                    </Text>
                  </Pressable>
                </LinearGradient>
              </View>
            </View>

            {/* ── Delivery address ── */}
            {orderType === 'delivery' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.inputWithValidation, {
                      borderColor: addressTouched && addressValidation
                        ? getAddressValidationColor()
                        : BORDER_GOLD,
                    }]}
                    placeholder="Enter your full delivery address (street, city, state, ZIP)"
                    placeholderTextColor={INK_SOFT}
                    value={deliveryAddress}
                    onChangeText={(text) => { setDeliveryAddress(text); setAddressTouched(true); }}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!processing}
                  />
                  {addressTouched && (
                    <View style={styles.validationIconContainer}>
                      {isValidatingAddress
                        ? <ActivityIndicator size="small" color={GOLD} />
                        : <IconSymbol name={getAddressValidationIcon()} size={24} color={getAddressValidationColor()} />
                      }
                    </View>
                  )}
                </View>

                {addressTouched && addressValidation && (
                  <View style={styles.validationMessage}>
                    <Text style={[styles.validationMessageText, { color: getAddressValidationColor() }]}>
                      {getAddressValidationMessage()}
                    </Text>
                  </View>
                )}

                {addressValidation?.isValid &&
                  addressValidation.formattedAddress &&
                  addressValidation.formattedAddress !== deliveryAddress && (
                  <View style={styles.formattedAddressSuggestion}>
                    <View style={styles.suggestionHeader}>
                      <IconSymbol name="lightbulb" size={16} color={GOLD} />
                      <Text style={styles.suggestionTitle}>Suggested Address</Text>
                    </View>
                    <Text style={styles.suggestionAddress}>{addressValidation.formattedAddress}</Text>
                    <LinearGradient
                      colors={[GOLD_BRIGHT, GOLD]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.useSuggestionButton}
                    >
                      <Pressable style={styles.useSuggestionButtonInner} onPress={useFormattedAddress}>
                        <IconSymbol name="check" size={14} color="#FFFFFF" />
                        <Text style={styles.useSuggestionButtonText}>Use This Address</Text>
                      </Pressable>
                    </LinearGradient>
                  </View>
                )}
              </View>
            )}

            {/* ── Notes ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {orderType === 'pickup' ? 'Pickup Notes (Optional)' : 'Delivery Notes (Optional)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={orderType === 'pickup'
                  ? 'Add any special instructions for pickup...'
                  : 'Add any special instructions for delivery...'}
                placeholderTextColor={INK_SOFT}
                value={pickupNotes}
                onChangeText={setPickupNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!processing}
              />
            </View>

            {/* ── Payment method info ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethodsInfo}>
                <IconSymbol name="payment" size={24} color={GOLD} />
                <Text style={styles.paymentMethodsInfoText}>
                  Choose from multiple payment options including saved cards, Google Pay, and more when you proceed to checkout.
                </Text>
              </View>
            </View>

            {/* ── Order summary ── */}
            <LinearGradient
              colors={[CARD_BG, CARD_FOOTER]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: SUCCESS_GREEN }]}>Discount (15%)</Text>
                <Text style={[styles.summaryValue, { color: SUCCESS_GREEN }]}>-${discount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (9.75%)</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>

              {/* Fading gold divider above total */}
              <LinearGradient
                colors={['transparent', BORDER_GOLD, BORDER_GOLD, 'transparent']}
                locations={[0, 0.15, 0.85, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 1, marginBottom: 12 }}
              />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelTotal}>Total</Text>
                <Text style={styles.summaryValueTotal}>${total.toFixed(2)}</Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* ── Footer / Pay button ── */}
        <LinearGradient
          colors={[CARD_BG, CARD_FOOTER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.footer}
        >
          <LinearGradient
            colors={processing
              ? [INK_MID, INK_MID]
              : [GOLD_BRIGHT, GOLD]   // gold gradient button
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.placeOrderButton, { opacity: processing ? 0.7 : 1 }]}
          >
            <Pressable
              style={styles.placeOrderButtonInner}
              onPress={handlePlaceOrder}
              disabled={processing}
            >
              {processing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.placeOrderButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="lock" size={20} color="#FFFFFF" />
                  <Text style={styles.placeOrderButtonText}>Pay ${total.toFixed(2)}</Text>
                </>
              )}
            </Pressable>
          </LinearGradient>
        </LinearGradient>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={currentColors}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================================
// MAIN COMPONENT WITH STRIPE PROVIDER
// ============================================================================

export default function CheckoutScreen() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <CheckoutContent />
    </StripeProvider>
  );
}