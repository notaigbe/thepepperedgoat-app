
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Event } from '@/types';
import * as Haptics from 'expo-haptics';

export default function AdminEventManagement() {
  const router = useRouter();
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'West African Cooking Class',
      description: 'Learn to make authentic Jollof Rice',
      date: '2024-03-15T18:00:00',
      location: 'Jagabans LA Kitchen',
      capacity: 20,
      attendees: ['user1', 'user2', 'user3'],
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
      isPrivate: false,
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    image: '',
    isPrivate: false,
  });

  const handleAddEvent = () => {
    console.log('Adding new event');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!formData.title || !formData.date || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      location: formData.location,
      capacity: parseInt(formData.capacity) || 50,
      attendees: [],
      image: formData.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      isPrivate: formData.isPrivate,
    };

    setEvents([...events, newEvent]);
    setIsAddingEvent(false);
    resetForm();
    Alert.alert('Success', 'Event created successfully');
  };

  const handleDeleteEvent = (eventId: string) => {
    console.log('Deleting event:', eventId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setEvents(events.filter((event) => event.id !== eventId));
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      capacity: '',
      image: '',
      isPrivate: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Event Management</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setIsAddingEvent(!isAddingEvent);
            resetForm();
          }}
        >
          <IconSymbol
            name={isAddingEvent ? 'close' : 'add'}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isAddingEvent && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create New Event</Text>

            <TextInput
              style={styles.input}
              placeholder="Event Title *"
              placeholderTextColor={colors.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Date & Time (YYYY-MM-DDTHH:MM:SS) *"
              placeholderTextColor={colors.textSecondary}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Location *"
              placeholderTextColor={colors.textSecondary}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Capacity"
              placeholderTextColor={colors.textSecondary}
              value={formData.capacity}
              onChangeText={(text) => setFormData({ ...formData, capacity: text })}
              keyboardType="number-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Image URL (optional)"
              placeholderTextColor={colors.textSecondary}
              value={formData.image}
              onChangeText={(text) => setFormData({ ...formData, image: text })}
            />

            <Pressable
              style={styles.checkboxContainer}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setFormData({ ...formData, isPrivate: !formData.isPrivate });
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.isPrivate && styles.checkboxChecked,
                ]}
              >
                {formData.isPrivate && (
                  <IconSymbol name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Private Event</Text>
            </Pressable>

            <View style={styles.formButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setIsAddingEvent(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton]}
                onPress={handleAddEvent}
              >
                <Text style={styles.saveButtonText}>Create Event</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.eventsContainer}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Image source={{ uri: event.image }} style={styles.eventImage} />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.isPrivate && (
                    <View style={styles.privateBadge}>
                      <IconSymbol name="lock" size={12} color="#FFFFFF" />
                      <Text style={styles.privateBadgeText}>Private</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetail}>
                    <IconSymbol name="event" size={16} color={colors.textSecondary} />
                    <Text style={styles.eventDetailText}>
                      {new Date(event.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <IconSymbol name="location-on" size={16} color={colors.textSecondary} />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <IconSymbol name="people" size={16} color={colors.textSecondary} />
                    <Text style={styles.eventDetailText}>
                      {event.attendees.length} / {event.capacity}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteEvent(event.id)}
                >
                  <IconSymbol name="delete" size={20} color="#FF6B6B" />
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  formContainer: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventsContainer: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FF6B6B20',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});
