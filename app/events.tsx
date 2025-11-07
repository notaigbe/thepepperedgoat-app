
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types';

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'West African Food Festival',
    description: 'Join us for an exclusive tasting event featuring our signature dishes and new menu items. Limited spots available!',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Jagabans LA Main Location',
    capacity: 50,
    attendees: [],
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    isPrivate: true,
  },
  {
    id: '2',
    title: 'Cooking Class: Jollof Rice Masterclass',
    description: 'Learn the secrets of making perfect Jollof rice from our head chef. Includes a full meal and recipe booklet.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Jagabans LA Kitchen',
    capacity: 20,
    attendees: [],
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800',
    isPrivate: false,
  },
  {
    id: '3',
    title: 'VIP Dinner Experience',
    description: 'An intimate 5-course dinner experience with wine pairings. App users only!',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Jagabans LA Private Dining',
    capacity: 30,
    attendees: [],
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    isPrivate: true,
  },
];

export default function EventsScreen() {
  const router = useRouter();
  const { userProfile, addNotification } = useApp();

  const handleRSVP = (event: Event) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isAlreadyRSVPd = userProfile.rsvpEvents.includes(event.id);
    
    if (isAlreadyRSVPd) {
      Alert.alert('Already RSVP&apos;d', 'You have already secured your spot for this event!');
      return;
    }

    const spotsLeft = event.capacity - event.attendees.length;
    
    if (spotsLeft <= 0) {
      Alert.alert('Event Full', 'Sorry, this event is at full capacity.');
      return;
    }

    Alert.alert(
      'Confirm RSVP',
      `Would you like to secure your spot for ${event.title}?\n\nSpots remaining: ${spotsLeft}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            const notification = {
              id: Date.now().toString(),
              title: 'RSVP Confirmed!',
              message: `Your spot for "${event.title}" has been secured. We'll send you a reminder closer to the date.`,
              type: 'event' as const,
              date: new Date().toISOString(),
              read: false,
              actionUrl: '/events',
            };
            addNotification(notification);
            Alert.alert('Success!', 'Your RSVP has been confirmed. Check your notifications for details.');
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Private Events</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <IconSymbol name="star.fill" size={24} color={colors.highlight} />
            <Text style={styles.infoText}>
              Exclusive events for app users! RSVP to secure your spot and receive notifications.
            </Text>
          </View>

          {mockEvents.map((event) => {
            const spotsLeft = event.capacity - event.attendees.length;
            const isRSVPd = userProfile.rsvpEvents.includes(event.id);

            return (
              <View key={event.id} style={styles.eventCard}>
                <Image source={{ uri: event.image }} style={styles.eventImage} />
                {event.isPrivate && (
                  <View style={styles.privateBadge}>
                    <IconSymbol name="lock.fill" size={12} color={colors.card} />
                    <Text style={styles.privateBadgeText}>Private</Text>
                  </View>
                )}
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetail}>
                      <IconSymbol name="calendar" size={16} color={colors.primary} />
                      <Text style={styles.eventDetailText}>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <IconSymbol name="location.fill" size={16} color={colors.primary} />
                      <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <IconSymbol name="person.2.fill" size={16} color={colors.primary} />
                      <Text style={styles.eventDetailText}>
                        {spotsLeft} spots left
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.rsvpButton,
                      isRSVPd && styles.rsvpButtonConfirmed,
                      spotsLeft <= 0 && styles.rsvpButtonDisabled,
                    ]}
                    onPress={() => handleRSVP(event)}
                    disabled={spotsLeft <= 0}
                  >
                    <Text style={styles.rsvpButtonText}>
                      {isRSVPd ? 'RSVP Confirmed' : spotsLeft <= 0 ? 'Event Full' : 'RSVP Now'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
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
  infoCard: {
    backgroundColor: colors.highlight + '20',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.textSecondary + '20',
  },
  privateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  privateBadgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    gap: 12,
    marginBottom: 20,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.text,
  },
  rsvpButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  rsvpButtonConfirmed: {
    backgroundColor: colors.accent,
  },
  rsvpButtonDisabled: {
    backgroundColor: colors.textSecondary + '40',
  },
  rsvpButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});
