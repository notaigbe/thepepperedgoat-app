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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import Toast from "@/components/Toast";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { cateringService } from "@/services/cateringService";
import DateTimePicker from '@react-native-community/datetimepicker';

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
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    event_date: "",
    guest_count: "",
    details: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast("error", "Please enter your name");
      return false;
    }
    if (!formData.email.trim()) {
      showToast("error", "Please enter your email");
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("error", "Please enter a valid email address");
      return false;
    }
    // Phone, event_date, guest_count, and details are optional
    if (formData.guest_count && isNaN(parseInt(formData.guest_count))) {
      showToast("error", "Please enter a valid number of guests");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setLoading(true);

    try {
      console.log("Submitting catering inquiry");
      
      // Convert event_date to YYYY-MM-DD format for database if it exists
      let formattedDate: string | undefined = undefined;
      if (formData.event_date.trim()) {
        // event_date is already in YYYY-MM-DD format from date picker
        formattedDate = formData.event_date;
      }
      
      const { data, error } = await cateringService.submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.trim() || undefined,
        event_date: formattedDate,
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : undefined,
        details: formData.details.trim() || undefined,
      });

      if (error) {
        console.error("Error submitting inquiry:", error);
        showToast("error", "Failed to submit booking request. Please try again.");
        return;
      }

      showToast("success", "Your catering booking request has been submitted!");
      
      // Reset form
      setFormData({
        name: userProfile?.name || "",
        email: userProfile?.email || "",
        phone: userProfile?.phone || "",
        event_date: "",
        guest_count: "",
        details: "",
      });
      setSelectedDate(new Date());
    } catch (error) {
      console.error("Exception submitting inquiry:", error);
      showToast("error", "Failed to submit booking request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: keyof EnquiryForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD for database
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData((prev) => ({ ...prev, event_date: formattedDate }));
    }
  };

  const handleDatePress = () => {
    if (loading) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDatePicker(true);
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <LinearGradient
      colors={[
        currentColors.gradientStart || currentColors.background,
        currentColors.gradientMid || currentColors.background,
        currentColors.gradientEnd || currentColors.background,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={[
              currentColors.headerGradientStart || currentColors.card,
              currentColors.headerGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Text style={[styles.title, { color: currentColors.text }]}>
              Catering Bookings
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: currentColors.textSecondary }]}
            >
              Book The Peppered Goat for your event
            </Text>
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={[styles.subtitle, { color: currentColors.textSecondary }]}
            >
              Planning a party, corporate event, or special celebration? Let
              The Peppered Goat bring authentic Nigerian cuisine to your event.
            </Text>

            <LinearGradient
              colors={[
                currentColors.cardGradientStart || currentColors.card,
                currentColors.cardGradientEnd || currentColors.card,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.formCard, { borderColor: currentColors.border }]}
            >
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Name <Text style={{ color: currentColors.secondary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: currentColors.text,
                      borderColor: currentColors.border,
                      backgroundColor: currentColors.background,
                    },
                  ]}
                  value={formData.name}
                  onChangeText={(text) => updateFormField("name", text)}
                  placeholder="Enter your full name"
                  placeholderTextColor={currentColors.textSecondary}
                  editable={!loading}
                />
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Email <Text style={{ color: currentColors.secondary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: currentColors.text,
                      borderColor: currentColors.border,
                      backgroundColor: currentColors.background,
                    },
                  ]}
                  value={formData.email}
                  onChangeText={(text) => updateFormField("email", text)}
                  placeholder="your.email@example.com"
                  placeholderTextColor={currentColors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Phone Number
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: currentColors.text,
                      borderColor: currentColors.border,
                      backgroundColor: currentColors.background,
                    },
                  ]}
                  value={formData.phone}
                  onChangeText={(text) => updateFormField("phone", text)}
                  placeholder="Enter your phone number (optional)"
                  placeholderTextColor={currentColors.textSecondary}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Event Date Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Event Date
                </Text>
                <Pressable
                  style={[
                    styles.datePickerButton,
                    {
                      borderColor: currentColors.border,
                      backgroundColor: currentColors.background,
                    },
                  ]}
                  onPress={handleDatePress}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.datePickerText,
                      {
                        color: formData.event_date
                          ? currentColors.text
                          : currentColors.textSecondary,
                      },
                    ]}
                  >
                    {formData.event_date
                      ? formatDisplayDate(formData.event_date)
                      : "Select event date (optional)"}
                  </Text>
                  <IconSymbol
                    name="calendar"
                    size={20}
                    color={currentColors.textSecondary}
                  />
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

              {/* Guest Count Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Number of Guests
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: currentColors.text,
                      borderColor: currentColors.border,
                      backgroundColor: currentColors.background,
                    },
                  ]}
                  value={formData.guest_count}
                  onChangeText={(text) => updateFormField("guest_count", text)}
                  placeholder="Approximate number of guests (optional)"
                  placeholderTextColor={currentColors.textSecondary}
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>

              {/* Details Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Event Details
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      color: currentColors.text,
                      borderColor: currentColors.border,
                      backgroundColor: currentColors.background,
                    },
                  ]}
                  value={formData.details}
                  onChangeText={(text) => updateFormField("details", text)}
                  placeholder="Tell us about your event, event type, dietary requirements, menu preferences, budget, etc. (optional)"
                  placeholderTextColor={currentColors.textSecondary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>

              {/* Submit Button */}
              <LinearGradient
                colors={[currentColors.primary, currentColors.highlight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                <Pressable
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={currentColors.background}
                    />
                  ) : (
                    <>
                      <IconSymbol
                        name="paperplane.fill"
                        size={18}
                        color={currentColors.background}
                      />
                      <Text
                        style={[
                          styles.submitButtonText,
                          { color: currentColors.background },
                        ]}
                      >
                        Submit Booking Request
                      </Text>
                    </>
                  )}
                </Pressable>
              </LinearGradient>
            </LinearGradient>

            {/* Contact Info Section */}
            <View style={styles.contactInfoSection}>
              <Text
                style={[
                  styles.contactInfoTitle,
                  { color: currentColors.text },
                ]}
              >
                Questions About Catering?
              </Text>
              
              <LinearGradient
                colors={[
                  currentColors.cardGradientStart || currentColors.card,
                  currentColors.cardGradientEnd || currentColors.card,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.contactInfoCard,
                  { borderColor: currentColors.border },
                ]}
              >
                <View style={styles.contactInfoItem}>
                  <IconSymbol
                    name="envelope.fill"
                    size={20}
                    color={currentColors.secondary}
                  />
                  <View style={styles.contactInfoText}>
                    <Text
                      style={[
                        styles.contactInfoLabel,
                        { color: currentColors.textSecondary },
                      ]}
                    >
                      Email
                    </Text>
                    <Text
                      style={[
                        styles.contactInfoValue,
                        { color: currentColors.text },
                      ]}
                    >
                      info@thepepperedgoat.com
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.contactInfoDivider,
                    { backgroundColor: currentColors.border },
                  ]}
                />

                <View style={styles.contactInfoItem}>
                  <IconSymbol
                    name="phone.fill"
                    size={20}
                    color={currentColors.secondary}
                  />
                  <View style={styles.contactInfoText}>
                    <Text
                      style={[
                        styles.contactInfoLabel,
                        { color: currentColors.textSecondary },
                      ]}
                    >
                      Phone
                    </Text>
                    <Text
                      style={[
                        styles.contactInfoValue,
                        { color: currentColors.text },
                      ]}
                    >
                      +1 (818) 210-6659
                    </Text>
                  </View>
                </View>
              </LinearGradient>
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
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.2,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 0,
    padding: 20,
    borderWidth: 0.2,
    elevation: 8,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 0.2,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  datePickerButton: {
    borderWidth: 0.2,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButtonGradient: {
    borderRadius: 0,
    marginTop: 8,
    elevation: 6,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  contactInfoSection: {
    marginTop: 8,
  },
  contactInfoTitle: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 16,
  },
  contactInfoCard: {
    borderRadius: 0,
    padding: 20,
    borderWidth: 0.2,
    elevation: 4,
  },
  contactInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  contactInfoText: {
    flex: 1,
  },
  contactInfoLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  contactInfoValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  contactInfoDivider: {
    height: 0.2,
    marginVertical: 16,
  },
});