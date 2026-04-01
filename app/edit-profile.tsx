import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import Dialog from '@/components/Dialog';
import { userService } from '@/services/supabaseService';
import ImagePickerComponent from '@/components/ImagePicker';
import { LinearGradient } from 'expo-linear-gradient';
import { SUPABASE_URL, supabase } from './integrations/supabase/client';
import { blackGoldLight } from '@/styles/commonStyles';

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

const COUNTRY_CODES = [
  { flag: '🇺🇸', name: 'United States', code: '+1' },
  { flag: '🇨🇦', name: 'Canada', code: '+1' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '+44' },
  { flag: '🇦🇺', name: 'Australia', code: '+61' },
  { flag: '🇳🇿', name: 'New Zealand', code: '+64' },
  { flag: '🇮🇪', name: 'Ireland', code: '+353' },
  { flag: '🇿🇦', name: 'South Africa', code: '+27' },
  { flag: '🇳🇬', name: 'Nigeria', code: '+234' },
  { flag: '🇬🇭', name: 'Ghana', code: '+233' },
  { flag: '🇰🇪', name: 'Kenya', code: '+254' },
  { flag: '🇹🇿', name: 'Tanzania', code: '+255' },
  { flag: '🇺🇬', name: 'Uganda', code: '+256' },
  { flag: '🇪🇹', name: 'Ethiopia', code: '+251' },
  { flag: '🇸🇳', name: 'Senegal', code: '+221' },
  { flag: '🇨🇮', name: "Côte d'Ivoire", code: '+225' },
  { flag: '🇮🇳', name: 'India', code: '+91' },
  { flag: '🇵🇰', name: 'Pakistan', code: '+92' },
  { flag: '🇧🇩', name: 'Bangladesh', code: '+880' },
  { flag: '🇵🇭', name: 'Philippines', code: '+63' },
  { flag: '🇨🇳', name: 'China', code: '+86' },
  { flag: '🇯🇵', name: 'Japan', code: '+81' },
  { flag: '🇰🇷', name: 'South Korea', code: '+82' },
  { flag: '🇩🇪', name: 'Germany', code: '+49' },
  { flag: '🇫🇷', name: 'France', code: '+33' },
  { flag: '🇮🇹', name: 'Italy', code: '+39' },
  { flag: '🇪🇸', name: 'Spain', code: '+34' },
  { flag: '🇵🇹', name: 'Portugal', code: '+351' },
  { flag: '🇳🇱', name: 'Netherlands', code: '+31' },
  { flag: '🇧🇷', name: 'Brazil', code: '+55' },
  { flag: '🇲🇽', name: 'Mexico', code: '+52' },
  { flag: '🇨🇴', name: 'Colombia', code: '+57' },
  { flag: '🇦🇷', name: 'Argentina', code: '+54' },
  { flag: '🇯🇲', name: 'Jamaica', code: '+1' },
  { flag: '🇹🇹', name: 'Trinidad & Tobago', code: '+1' },
  { flag: '🇧🇧', name: 'Barbados', code: '+1' },
] as const;

type CountryEntry = { flag: string; name: string; code: string };

interface AddressValidationResult {
  success: boolean;
  isValid: boolean;
  formattedAddress?: string;
  confidence?: 'high' | 'medium' | 'low';
  error?: string;
}

interface PlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { userProfile, currentColors, loadUserProfile } = useApp();
  const { user } = useAuth();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [countryCode, setCountryCode] = useState<CountryEntry>({ flag: '🇺🇸', name: 'United States', code: '+1' });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [address, setAddress] = useState(userProfile?.address || '');
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<PlacesPrediction[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const placesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [profileImagePath, setProfileImagePath] = useState<string | null>(
  userProfile?.profileImage && !userProfile.profileImage.startsWith('http')
    ? userProfile.profileImage
    : null
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  // Load signed URL on mount if profile image exists
  useEffect(() => {
    if (userProfile?.profileImage) {
      handleGetImageUrl(userProfile.profileImage);
    }
  }, []);

  // Parse phone number and extract country code on mount/profile change
  useEffect(() => {
    if (userProfile?.phone) {
      const fullPhone = userProfile.phone;
      // Try to find matching country code
      for (const country of COUNTRY_CODES) {
        if (fullPhone.startsWith(country.code)) {
          setCountryCode(country);
          // Extract phone number without country code
          const phoneNumber = fullPhone.slice(country.code.length);
          setPhone(phoneNumber);
          return;
        }
      }
      // If no country code found, just use the full phone number
      setPhone(fullPhone);
    }
  }, [userProfile?.phone]);

  const handleGetImageUrl = async (path: string) => {
    const { data: urlData } = await supabase.storage
      .from("profile")
      .createSignedUrl(path, 60 * 60);

    setProfileImageUrl(urlData?.signedUrl || null);
    return urlData?.signedUrl || null;
  };

  const handleImageSelected = (path: string) => {
    // ImagePickerComponent now passes the storage path (not a URL).
    // Store the path and generate a signed URL for display.
    setProfileImagePath(path);
    handleGetImageUrl(path);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  // ── Email / Phone validation ───────────────────────────────────────
  const validateEmail = useCallback((value: string): string => {
    if (!value.trim()) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value.trim())) return 'Enter a valid email address';
    return '';
  }, []);

  const validatePhone = useCallback((value: string): string => {
    if (!value.trim()) return '';
    const digits = value.replace(/\D/g, '');
    if (countryCode.code === '+1') {
      if (digits.length !== 10) return 'Enter a valid 10-digit phone number';
    } else {
      if (digits.length < 6 || digits.length > 15) return 'Enter a valid phone number';
    }
    return '';
  }, [countryCode]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailTouched) setEmailError(validateEmail(text));
  }, [emailTouched, validateEmail]);

  const handlePhoneChange = useCallback((text: string) => {
    setPhone(text);
    if (phoneTouched) setPhoneError(validatePhone(text));
  }, [phoneTouched, validatePhone]);

  // Re-validate phone when country code changes
  useEffect(() => {
    if (phoneTouched && phone) setPhoneError(validatePhone(phone));
  }, [countryCode, phone, phoneTouched, validatePhone]);

  // ── Address helpers ────────────────────────────────────────────────
  const getAddressValidationColor = useCallback(() => {
    if (!addressValidation) return currentColors.border;
    if (!addressValidation.isValid) return '#C0392B';
    if (addressValidation.confidence === 'high') return '#2E7D52';
    if (addressValidation.confidence === 'medium') return '#C07A10';
    return '#C0392B';
  }, [addressValidation, currentColors.border]);

  const getAddressValidationMessage = useCallback(() => {
    if (isValidatingAddress) return 'Validating address...';
    if (!addressValidation) return '';
    if (!addressValidation.isValid) return 'Address could not be verified. Please check for errors.';
    if (addressValidation.confidence === 'high') return 'Address verified ✓';
    if (addressValidation.confidence === 'medium') return 'Address partially verified. Please review.';
    return 'Address verification failed.';
  }, [isValidatingAddress, addressValidation]);

  const validateAddress = useCallback(async (addr: string) => {
    if (!addr || addr.trim().length < 5) { setAddressValidation(null); return; }
    setIsValidatingAddress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ address: addr }),
      });
      const result: AddressValidationResult = await response.json();
      setAddressValidation(result);
      if (result.isValid && result.formattedAddress) setValidatedAddress(result.formattedAddress);
    } catch {
      setAddressValidation({ success: false, isValid: false, error: 'Failed to validate address' });
    } finally {
      setIsValidatingAddress(false);
    }
  }, []);

  const fetchPlaceSuggestions = useCallback(async (input: string) => {
    if (!input || input.trim().length < 3) { setPlaceSuggestions([]); setShowSuggestions(false); return; }
    setIsFetchingSuggestions(true);
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', input);
      url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
      url.searchParams.set('types', 'address');
      url.searchParams.set('components', 'country:us');
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.status === 'OK' && data.predictions?.length > 0) {
        setPlaceSuggestions(data.predictions.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setPlaceSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  const handleSelectSuggestion = useCallback(async (prediction: PlacesPrediction) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSuggestions(false);
    setPlaceSuggestions([]);
    setSuggestionSelected(true);
    Keyboard.dismiss();
    let chosen = prediction.description;
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.set('place_id', prediction.place_id);
      url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
      url.searchParams.set('fields', 'formatted_address');
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.status === 'OK' && data.result?.formatted_address) chosen = data.result.formatted_address;
    } catch { /* fall back to description */ }
    setAddress(chosen);
    setValidatedAddress(chosen);
    setAddressTouched(true);
    setAddressValidation(null);
    validateAddress(chosen);
  }, [validateAddress]);

  const handleAddressChange = useCallback((text: string) => {
    setAddress(text);
    setAddressTouched(true);
    setSuggestionSelected(false);
    setAddressValidation(null);
    if (placesDebounceRef.current) clearTimeout(placesDebounceRef.current);
    if (text.trim().length >= 3) {
      placesDebounceRef.current = setTimeout(() => fetchPlaceSuggestions(text), 350);
    } else {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
    }
  }, [fetchPlaceSuggestions]);

  const useFormattedAddress = useCallback(() => {
    if (addressValidation?.formattedAddress) {
      setAddress(addressValidation.formattedAddress);
      setValidatedAddress(addressValidation.formattedAddress);
      setAddressTouched(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [addressValidation]);

  // Debounced validation on manual typing
  useEffect(() => {
    if (!addressTouched || !address.trim() || suggestionSelected) return;
    const id = setTimeout(() => validateAddress(address), 1000);
    return () => clearTimeout(id);
  }, [address, addressTouched, suggestionSelected, validateAddress]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (placesDebounceRef.current) clearTimeout(placesDebounceRef.current); };
  }, []);

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!name || !email) {
      showToast('error', 'Please fill in required fields');
      return;
    }

    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    if (emailErr || phoneErr) {
      setEmailTouched(true);
      setEmailError(emailErr);
      setPhoneTouched(true);
      setPhoneError(phoneErr);
      showToast('error', emailErr || phoneErr);
      return;
    }

    if (!user?.id) {
      showToast('error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      // Update profile in backend - save the path, not the signed URL
      const rawPath = userProfile?.profileImage;
      const existingPath = rawPath && !rawPath.startsWith('http') ? rawPath : null;
      const imagePathToSave = profileImagePath || existingPath;
      
      // Combine country code with phone number
      const phoneWithCountryCode = phone ? `${countryCode.code}${phone}` : undefined;
      
      // Update profile in backend - save the path, not the signed URL
      const { data, error } = await userService.updateUserProfile(user.id, {
        name,
        email,
        phone: phoneWithCountryCode,
        address: validatedAddress || address || undefined,
        profileImage: imagePathToSave || undefined,
      });

      if (error) {
        console.error('Update error:', error);
        showToast('error', 'Failed to update profile');
        return;
      }

      // Reload user profile to get fresh data
      await loadUserProfile();
      
      showToast('success', 'Profile updated successfully!');
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Save error:', error);
      showToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };


  return (
    <LinearGradient
      colors={[blackGoldLight.BODY_BG|| blackGoldLight.HEADER_TOP, blackGoldLight.BODY_BG || blackGoldLight.HEADER_MID, blackGoldLight.BODY_BG || blackGoldLight.HEADER_BOT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={[blackGoldLight.GOLD, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: blackGoldLight.BORDER_GOLD }]}
          >
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
              style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
            >
              <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.primary }]}>Edit Profile</Text>
            <Pressable 
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: currentColors.background, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 0.5, borderColor: currentColors.border }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={currentColors.secondary} />
              ) : (
                <Text style={[styles.saveButton, { color: currentColors.secondary }]}>Save</Text>
              )}
            </Pressable>
          </LinearGradient>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Image Section */}
            <ImagePickerComponent
              currentImageUrl={profileImageUrl || undefined}
              onImageSelected={handleImageSelected}
              bucket="profile"
              folder={user?.id || ''}
              label="Profile Photo"
              disabled={saving}
              aspect={[1,1]}
            />

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: currentColors.card, 
                    color: currentColors.textSecondary, 
                    borderColor: currentColors.border
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={currentColors.textSecondary}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentColors.card,
                    color: currentColors.textSecondary,
                    borderColor: emailTouched && emailError ? '#C0392B' : currentColors.border
                  }
                ]}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email)); }}
                placeholder="Enter your email"
                placeholderTextColor={currentColors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
              {emailTouched && emailError ? (
                <Text style={[styles.fieldValidationMessage, { color: '#C0392B' }]}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>Phone</Text>
              <View style={styles.phoneRow}>
                <Pressable
                  style={[styles.countryCodeButton, {
                    backgroundColor: currentColors.card,
                    borderColor: phoneTouched && phoneError ? '#C0392B' : currentColors.border,
                  }]}
                  onPress={() => { setCountrySearch(''); setShowCountryPicker(true); }}
                  disabled={saving}
                >
                  <Text style={[styles.countryCodeText, { color: currentColors.textSecondary }]}>
                    {countryCode.flag} {countryCode.code}
                  </Text>
                  <IconSymbol name="chevron.down" size={12} color={currentColors.textSecondary} />
                </Pressable>
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    {
                      backgroundColor: currentColors.card,
                      color: currentColors.textSecondary,
                      borderColor: phoneTouched && phoneError ? '#C0392B' : currentColors.border,
                    }
                  ]}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onBlur={() => { setPhoneTouched(true); setPhoneError(validatePhone(phone)); }}
                  placeholder="Phone number"
                  placeholderTextColor={currentColors.textSecondary}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>
              {phoneTouched && phoneError ? (
                <Text style={[styles.fieldValidationMessage, { color: '#C0392B' }]}>{phoneError}</Text>
              ) : null}
            </View>

            <View style={[styles.inputGroup, { zIndex: 100 }]}>
              <Text style={[styles.inputLabel, { color: currentColors.textSecondary }]}>
                Address <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>(optional)</Text>
              </Text>
              <View style={styles.addressInputContainer}>
                <TextInput
                  ref={addressInputRef}
                  style={[
                    styles.input,
                    styles.addressInput,
                    {
                      backgroundColor: currentColors.card,
                      color: currentColors.textSecondary,
                      borderColor: addressTouched && addressValidation
                        ? getAddressValidationColor()
                        : currentColors.border,
                    },
                  ]}
                  value={address}
                  onChangeText={handleAddressChange}
                  onFocus={() => {
                    if (address.trim().length >= 3 && placeSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Start typing your address..."
                  placeholderTextColor={currentColors.textSecondary}
                  editable={!saving}
                  returnKeyType="done"
                  onSubmitEditing={() => { setShowSuggestions(false); validateAddress(address); }}
                />
                <View style={styles.addressValidationIcon}>
                  {isValidatingAddress || isFetchingSuggestions ? (
                    <ActivityIndicator size="small" color={currentColors.secondary} />
                  ) : addressTouched && addressValidation ? (
                    <IconSymbol
                      name={addressValidation.isValid
                        ? (addressValidation.confidence === 'high' ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill')
                        : 'xmark.circle.fill'}
                      size={20}
                      color={getAddressValidationColor()}
                    />
                  ) : null}
                </View>
              </View>

              {/* Google Places dropdown */}
              {showSuggestions && (
                <View style={[styles.suggestionsDropdown, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                  {isFetchingSuggestions && placeSuggestions.length === 0 ? (
                    <View style={styles.suggestionsLoadingRow}>
                      <ActivityIndicator size="small" color={currentColors.secondary} />
                      <Text style={[styles.suggestionsLoadingText, { color: currentColors.textSecondary }]}>Finding addresses...</Text>
                    </View>
                  ) : placeSuggestions.map((prediction, index) => (
                    <Pressable
                      key={prediction.place_id}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        index < placeSuggestions.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: currentColors.border },
                        pressed && { backgroundColor: currentColors.secondary + '15' },
                      ]}
                      onPress={() => handleSelectSuggestion(prediction)}
                    >
                      <IconSymbol name="location" size={14} color={currentColors.secondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.suggestionMainText, { color: currentColors.text }]} numberOfLines={1}>
                          {prediction.structured_formatting.main_text}
                        </Text>
                        <Text style={[styles.suggestionSecondaryText, { color: currentColors.textSecondary }]} numberOfLines={1}>
                          {prediction.structured_formatting.secondary_text}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Validation message */}
              {addressTouched && addressValidation && !showSuggestions && (
                <Text style={[styles.addressValidationMessage, { color: getAddressValidationColor() }]}>
                  {getAddressValidationMessage()}
                </Text>
              )}

              {/* Formatted address suggestion */}
              {!showSuggestions && addressValidation?.isValid && addressValidation.formattedAddress && addressValidation.formattedAddress !== address && (
                <View style={[styles.formattedAddressSuggestion, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                  <View style={styles.suggestionHeader}>
                    <IconSymbol name="lightbulb" size={14} color={currentColors.secondary} />
                    <Text style={[styles.suggestionHeaderText, { color: currentColors.textSecondary }]}>Suggested Address</Text>
                  </View>
                  <Text style={[styles.suggestionAddressText, { color: currentColors.text }]}>{addressValidation.formattedAddress}</Text>
                  <LinearGradient
                    colors={[currentColors.secondary, currentColors.highlight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.useSuggestionButton}
                  >
                    <Pressable style={styles.useSuggestionButtonInner} onPress={useFormattedAddress}>
                      <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                      <Text style={styles.useSuggestionButtonText}>Use This Address</Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Info note about saving */}
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.infoBox, { borderColor: currentColors.border }]}
            >
              <IconSymbol name="info.circle.fill" size={20} color={currentColors.secondary} />
              <Text style={[styles.infoText, { color: currentColors.textSecondary }]}>
                Changes will be saved to your profile when you tap Save
              </Text>
            </LinearGradient>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
        
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={currentColors}
        />
        <Dialog
          visible={dialogVisible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          buttons={dialogConfig.buttons}
          onHide={() => setDialogVisible(false)}
          currentColors={currentColors}
        />

        {/* Country Code Picker Modal */}
        <Modal
          visible={showCountryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <Pressable style={styles.pickerOverlay} onPress={() => setShowCountryPicker(false)} />
          <View style={[styles.pickerSheet, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
            <View style={[styles.pickerHandle, { backgroundColor: currentColors.border }]} />
            <Text style={[styles.pickerTitle, { color: currentColors.text }]}>Select Country Code</Text>
            <TextInput
              style={[styles.pickerSearch, { backgroundColor: currentColors.background, color: currentColors.text, borderColor: currentColors.border }]}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search country..."
              placeholderTextColor={currentColors.textSecondary}
              autoCorrect={false}
            />
            <FlatList
              data={COUNTRY_CODES.filter(c =>
                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                c.code.includes(countrySearch)
              )}
              keyExtractor={(item, index) => `${item.code}-${item.name}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.pickerItem,
                    { borderBottomColor: currentColors.border },
                    pressed && { backgroundColor: currentColors.secondary + '15' },
                    item.name === countryCode.name && { backgroundColor: currentColors.secondary + '20' },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCountryCode(item);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemFlag}>{item.flag}</Text>
                  <Text style={[styles.pickerItemName, { color: currentColors.text }]}>{item.name}</Text>
                  <Text style={[styles.pickerItemCode, { color: currentColors.textSecondary }]}>{item.code}</Text>
                  {item.name === countryCode.name && (
                    <IconSymbol name="checkmark" size={14} color={currentColors.secondary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
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
    paddingVertical: 24,
    borderBottomWidth: 2,
    // boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    // boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'LibertinusSans_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  saveButton: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 36,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    borderWidth: 0.2,
    // boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 64,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    borderRadius: 24,
    // boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.4)',
    elevation: 8,
  },
  imageButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  addressInputContainer: {
    position: 'relative',
  },
  addressInput: {
    paddingRight: 48,
  },
  addressValidationIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  addressValidationMessage: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    marginLeft: 16,
  },
  fieldValidationMessage: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    marginLeft: 16,
  },
  suggestionsDropdown: {
    borderRadius: 16,
    borderWidth: 0.5,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 6,
  },
  suggestionsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  suggestionsLoadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionMainText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  suggestionSecondaryText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  formattedAddressSuggestion: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 14,
    marginTop: 8,
    gap: 6,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionHeaderText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  suggestionAddressText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  useSuggestionButton: {
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 4,
    elevation: 4,
  },
  useSuggestionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  useSuggestionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 12,
    marginTop: 8,
    borderWidth: 0.2,
    // boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopLeftRadius: 36,
    borderBottomLeftRadius: 36,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 0.2,
    elevation: 4,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  phoneInput: {
    flex: 1,
    borderTopRightRadius: 36,
    borderBottomRightRadius: 36,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    maxHeight: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: 'LibertinusSans_700Bold',
    marginBottom: 12,
  },
  pickerSearch: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderWidth: 0.5,
    marginBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  pickerItemFlag: {
    fontSize: 22,
  },
  pickerItemName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  pickerItemCode: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});