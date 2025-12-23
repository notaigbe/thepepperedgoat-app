
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { reservationService, ReservationInput } from '@/services/reservationService';
import Toast from '@/components/Toast';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ReservationsScreen() {
  const router = useRouter();
  const { currentColors, userProfile, showToast } = useApp();
  const { isAuthenticated } = useAuth();

  // Form state
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [guests, setGuests] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // User reservations
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserReservations();
    }
  }, [isAuthenticated]);

  const loadUserReservations = async () => {
    setLoadingReservations(true);
    try {
      const { data, error } = await reservationService.getUserReservations();
      if (error) {
        console.error('Error loading reservations:', error);
      } else {
        setUserReservations(data || []);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleSubmit = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Validation
    if (!name || !email || !phone || !guests) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const guestsNum = parseInt(guests);
    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 20) {
      showToast('Please enter a valid number of guests (1-20)', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const reservationData: ReservationInput = {
        name,
        email,
        phone,
        date: date.toISOString().split('T')[0],
        time: time.toTimeString().split(' ')[0].substring(0, 5),
        guests: guestsNum,
        specialRequests: specialRequests || undefined,
      };

      const { data, error } = await reservationService.createReservation(reservationData);

      if (error) {
        console.error('Reservation error:', error);
        showToast('Failed to create reservation. Please try again.', 'error');
      } else {
        showToast('Reservation created successfully! We will contact you to confirm.', 'success');
        // Reset form
        setGuests('2');
        setSpecialRequests('');
        // Reload reservations
        if (isAuthenticated) {
          loadUserReservations();
        }
      }
    } catch (error) {
      console.error('Reservation error:', error);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const { error } = await reservationService.cancelReservation(reservationId);
      if (error) {
        console.error('Cancel reservation error:', error);
        showToast('Failed to cancel reservation. Please try again.', 'error');
      } else {
        showToast('Reservation cancelled successfully', 'success');
        loadUserReservations();
      }
    } catch (error) {
      console.error('Cancel reservation error:', error);
      showToast('An unexpected error occurred. Please try again.', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Gradient - matching Events screen */}
        <LinearGradient
          colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { borderBottomColor: currentColors.border }]}
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
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Reservations</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Reservation Form */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.formCard, { borderColor: currentColors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
              Reservation Details
            </Text>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Name *
              </Text>
              <View style={[styles.inputContainer, { borderColor: currentColors.border }]}>
                <IconSymbol name="person" size={20} color={currentColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: currentColors.text }]}
                  placeholder="Your name"
                  placeholderTextColor={currentColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Email *
              </Text>
              <View style={[styles.inputContainer, { borderColor: currentColors.border }]}>
                <IconSymbol name="envelope" size={20} color={currentColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: currentColors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={currentColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Phone *
              </Text>
              <View style={[styles.inputContainer, { borderColor: currentColors.border }]}>
                <IconSymbol name="phone.fill" size={20} color={currentColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: currentColors.text }]}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={currentColors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Date *
              </Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowDatePicker(true);
                }}
                disabled={loading}
              >
                <View style={[styles.inputContainer, { borderColor: currentColors.border }]}>
                  <IconSymbol name="calendar" size={20} color={currentColors.textSecondary} />
                  <Text style={[styles.input, { color: currentColors.text }]}>
                    {date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}

            {/* Time */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Time *
              </Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowTimePicker(true);
                }}
                disabled={loading}
              >
                <View style={[styles.inputContainer, { borderColor: currentColors.border }]}>
                  <IconSymbol name="clock" size={20} color={currentColors.textSecondary} />
                  <Text style={[styles.input, { color: currentColors.text }]}>
                    {time.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                </View>
              </Pressable>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) {
                    setTime(selectedTime);
                  }
                }}
              />
            )}

            {/* Guests */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Number of Guests *
              </Text>
              <View style={[styles.inputContainer, { borderColor: currentColors.border }]}>
                <IconSymbol name="person.2" size={20} color={currentColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: currentColors.text }]}
                  placeholder="2"
                  placeholderTextColor={currentColors.textSecondary}
                  value={guests}
                  onChangeText={setGuests}
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Special Requests */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentColors.textSecondary }]}>
                Special Requests (Optional)
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.textAreaContainer,
                  { borderColor: currentColors.border },
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea, { color: currentColors.text }]}
                  placeholder="Any dietary restrictions, seating preferences, etc."
                  placeholderTextColor={currentColors.textSecondary}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Submit Button */}
            <LinearGradient
              colors={[currentColors.secondary, currentColors.highlight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              <Pressable
                style={styles.submitButtonInner}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={currentColors.background} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: currentColors.background }]}>
                    Make Reservation
                  </Text>
                )}
              </Pressable>
            </LinearGradient>
          </LinearGradient>

          {/* User's Reservations */}
          {isAuthenticated && (
            <View style={styles.reservationsSection}>
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                Your Reservations
              </Text>

              {loadingReservations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={currentColors.secondary} />
                </View>
              ) : userReservations.length === 0 ? (
                <LinearGradient
                  colors={[
                    currentColors.cardGradientStart || currentColors.card,
                    currentColors.cardGradientEnd || currentColors.card,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.emptyCard, { borderColor: currentColors.border }]}
                >
                  <IconSymbol name="calendar" size={48} color={currentColors.textSecondary} />
                  <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
                    No reservations yet
                  </Text>
                </LinearGradient>
              ) : (
                userReservations.map((reservation, index) => (
                  <LinearGradient
                    key={index}
                    colors={[
                      currentColors.cardGradientStart || currentColors.card,
                      currentColors.cardGradientEnd || currentColors.card,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.reservationCard, { borderColor: currentColors.border }]}
                  >
                    <View style={styles.reservationHeader}>
                      <View style={styles.reservationInfo}>
                        <Text style={[styles.reservationDate, { color: currentColors.text }]}>
                          {formatDate(reservation.date)}
                        </Text>
                        <Text style={[styles.reservationTime, { color: currentColors.textSecondary }]}>
                          {formatTime(reservation.time)} • {reservation.guests} guests
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              reservation.status === 'confirmed'
                                ? '#4CAF50'
                                : reservation.status === 'cancelled'
                                ? '#F44336'
                                : '#FF9800',
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {reservation.status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    {reservation.special_requests && (
                      <Text style={[styles.specialRequests, { color: currentColors.textSecondary }]}>
                        {reservation.special_requests}
                      </Text>
                    )}

                    {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                      <Pressable
                        style={[styles.cancelButton, { borderColor: '#F44336' }]}
                        onPress={() => handleCancelReservation(reservation.id)}
                      >
                        <Text style={[styles.cancelButtonText, { color: '#F44336' }]}>
                          Cancel Reservation
                        </Text>
                      </Pressable>
                    )}
                  </LinearGradient>
                ))
              )}
            </View>
          )}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 2,
    boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  formCard: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    marginLeft: 0,
    paddingTop: 8,
  },
  submitButton: {
    borderRadius: 0,
    marginTop: 8,
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.4)',
    elevation: 8,
  },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    minHeight: 52,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  reservationsSection: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 0,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
  },
  reservationCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationDate: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  reservationTime: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 0,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  specialRequests: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cancelButton: {
    borderWidth: 2,
    borderRadius: 0,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
