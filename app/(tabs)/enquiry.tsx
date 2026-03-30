import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import Toast from "@/components/Toast";
import * as Haptics from "expo-haptics";
import { cateringService } from "@/services/cateringService";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { blackGoldLight } from "@/styles/commonStyles";

interface EnquiryForm {
  name: string;
  email: string;
  phone: string;
  event_date: string;
  guest_count: string;
  details: string;
}

export default function EnquiriesScreen() {
  const router = useRouter();
  const { currentColors, userProfile } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EnquiryForm>({
    name: userProfile ? userProfile.name : "",
    email: userProfile ? userProfile.email : "",
    phone: userProfile ? userProfile.phone : "",
    event_date: "",
    guest_count: "",
    details: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) { showToast("error", "Please enter your name"); return false; }
    if (!formData.email.trim()) { showToast("error", "Please enter your email"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast("error", "Please enter a valid email address"); return false;
    }
    if (formData.guest_count && isNaN(parseInt(formData.guest_count))) {
      showToast("error", "Please enter a valid number of guests"); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      let formattedDate: string | undefined;
      if (formData.event_date.trim()) formattedDate = formData.event_date;
      const { data, error } = await cateringService.submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.trim() || undefined,
        event_date: formattedDate,
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : undefined,
        details: formData.details.trim() || undefined,
      });
      if (error) { showToast("error", "Failed to submit booking request. Please try again."); return; }
      showToast("success", "Your catering booking request has been submitted!");
      setFormData({
        name: userProfile ? userProfile.name : "",
        email: userProfile ? userProfile.email : "",
        phone: userProfile ? userProfile.phone : "",
        event_date: "", guest_count: "", details: "",
      });
      setSelectedDate(new Date());
    } catch (error) {
      showToast("error", "Failed to submit booking request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: keyof EnquiryForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setFormData((prev) => ({ ...prev, event_date: `${y}-${m}-${d}` }));
    }
  };

  const handleDatePress = () => {
    if (loading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(true);
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={blackGoldLight.HEADER_TOP} />

      {/* Dark header — gold bloom from top-left, near-black base */}
      <LinearGradient
        colors={[blackGoldLight.GOLD, blackGoldLight.HEADER_MID, blackGoldLight.HEADER_BOT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        {/* Radial gold bloom overlay — mirrors WelcomeHeader */}
        <LinearGradient
          colors={["rgba(212,168,58,0.18)", "rgba(184,146,42,0.06)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBloom}
          pointerEvents="none"
        />
        <SafeAreaView style={{ backgroundColor: 'transparent' }} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.title}>Catering Bookings</Text>
            <Text style={styles.headerSubtitle}>Book The Peppered Goat for your event</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Planning a party, corporate event, or special celebration? Let The Peppered Goat
            bring authentic Nigerian cuisine to your event.
          </Text>

          {/* Form card */}
          <View style={styles.formCard}>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(t) => updateFormField("name", t)}
                placeholder="Enter your full name"
                placeholderTextColor={blackGoldLight.INK_SOFT}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(t) => updateFormField("email", t)}
                placeholder="your.email@example.com"
                placeholderTextColor={blackGoldLight.INK_SOFT}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(t) => updateFormField("phone", t)}
                placeholder="Phone number (optional)"
                placeholderTextColor={blackGoldLight.INK_SOFT}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Date</Text>
              <Pressable style={styles.datePickerButton} onPress={handleDatePress} disabled={loading}>
                <Text style={[styles.datePickerText, !formData.event_date && styles.placeholder]}>
                  {formData.event_date ? formatDisplayDate(formData.event_date) : "Select event date (optional)"}
                </Text>
                <IconSymbol name="calendar" size={20} color={blackGoldLight.INK_MID} />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Guests</Text>
              <TextInput
                style={styles.input}
                value={formData.guest_count}
                onChangeText={(t) => updateFormField("guest_count", t)}
                placeholder="Number of guests (optional)"
                placeholderTextColor={blackGoldLight.INK_SOFT}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.details}
                onChangeText={(t) => updateFormField("details", t)}
                placeholder="Event type, dietary requirements, menu preferences, budget, etc. (optional)"
                placeholderTextColor={blackGoldLight.INK_SOFT}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Submit — gold gradient pill button */}
            <LinearGradient
              colors={[blackGoldLight.GOLD_BRIGHT, blackGoldLight.GOLD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
              <Pressable
                style={styles.submitButtonInner}
                onPress={handleSubmit}
                disabled={loading}
                android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: false }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={blackGoldLight.INK_WHITE} />
                ) : (
                  <>
                    <IconSymbol name="paperplane.fill" size={18} color={blackGoldLight.INK_WHITE} />
                    <Text style={styles.submitButtonText}>Submit Booking Request</Text>
                  </>
                )}
              </Pressable>
            </LinearGradient>
          </View>

          {/* Contact info */}
          <View style={styles.contactInfoSection}>
            <Text style={styles.contactInfoTitle}>Questions About Catering?</Text>
            <View style={styles.contactInfoCard}>

              <View style={styles.contactInfoItem}>
                <View style={styles.contactIconWrapper}>
                  <IconSymbol name="envelope.fill" size={18} color={blackGoldLight.GOLD} />
                </View>
                <View style={styles.contactInfoText}>
                  <Text style={styles.contactInfoLabel}>Email</Text>
                  <Text style={styles.contactInfoValue}>info@thepepperedgoat.com</Text>
                </View>
              </View>

              <View style={styles.contactInfoDivider} />

              <View style={styles.contactInfoItem}>
                <View style={styles.contactIconWrapper}>
                  <IconSymbol name="phone.fill" size={18} color={blackGoldLight.GOLD} />
                </View>
                <View style={styles.contactInfoText}>
                  <Text style={styles.contactInfoLabel}>Phone</Text>
                  <Text style={styles.contactInfoValue}>+1 (818) 210-6659</Text>
                </View>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type={toastType}
        currentColors={currentColors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: blackGoldLight.BODY_BG },
  flex:       { flex: 1 },

  // ── Dark header ─────────────────────────────────────────────────────
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
    overflow: 'hidden',   // clips the bloom gradient
    position: 'relative',
  },
  // Radial gold bloom — absolute overlay inside the header
  headerBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '65%',
    height: '100%',
    zIndex: 0,
  } as any,
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SILVER,
    marginTop: 4,
  },

  // ── Body ────────────────────────────────────────────────────────────
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  subtitle: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
    marginBottom: 20,
    lineHeight: 21,
  },

  // ── Form card ───────────────────────────────────────────────────────
  formCard: {
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
    marginBottom: 8,
  },
  required: {
    // Gold asterisk on required fields
    color: blackGoldLight.GOLD,
  },

  // Inputs — white surface, gold border, warm ink text
  input: {
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK,
    backgroundColor: blackGoldLight.CARD_BG,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: blackGoldLight.CARD_BG,
  },
  datePickerText: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK,
  },
  placeholder: {
    color: blackGoldLight.INK_SOFT,
  },
  textArea: { minHeight: 120, paddingTop: 12 },

  // Submit button — gold gradient pill with overflow:hidden for gradient clip
  submitButton: {
    borderRadius: 36,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    letterSpacing: 0.3,
  },

  // ── Contact info ────────────────────────────────────────────────────
  contactInfoSection: { marginTop: 4 },
  contactInfoTitle: {
    fontSize: 17,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
    marginBottom: 14,
  },
  contactInfoCard: {
    backgroundColor: blackGoldLight.CARD_BG,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  contactInfoItem:    { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // Icon pill — gold-tinted background, gold icon
  contactIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfoText:  { flex: 1 },
  contactInfoLabel: {
    fontSize: 11,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SOFT,
    marginBottom: 2,
  },
  contactInfoValue: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK,
  },
  contactInfoDivider: {
    height: 1,
    backgroundColor: blackGoldLight.BORDER_LIGHT,
    marginVertical: 14,
  },
});