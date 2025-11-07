
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

export default function AdminNotifications() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState<'special' | 'event' | 'general'>('general');

  const notificationTypes = [
    { value: 'general' as const, label: 'General', icon: 'notifications' as const, color: colors.primary },
    { value: 'special' as const, label: 'Special Offer', icon: 'local-offer' as const, color: '#FF6B35' },
    { value: 'event' as const, label: 'Event', icon: 'event' as const, color: '#4ECDC4' },
  ];

  const handleSendNotification = () => {
    console.log('Sending notification');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!title || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Alert.alert(
      'Send Notification',
      `Send "${title}" to all app users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            console.log('Notification sent:', { title, message, type: selectedType });
            Alert.alert('Success', 'Notification sent to all users!');
            setTitle('');
            setMessage('');
          },
        },
      ]
    );
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
        <Text style={styles.title}>Send Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Notification Type</Text>
          <View style={styles.typeSelector}>
            {notificationTypes.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardActive,
                  { borderColor: type.color },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedType(type.value);
                }}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <IconSymbol name={type.icon} size={24} color={type.color} />
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.value && { color: type.color },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Notification Content</Text>
          <TextInput
            style={styles.input}
            placeholder="Notification Title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notification Message"
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <IconSymbol
                  name={notificationTypes.find((t) => t.value === selectedType)?.icon || 'notifications'}
                  size={24}
                  color={notificationTypes.find((t) => t.value === selectedType)?.color || colors.primary}
                />
                <Text style={styles.previewAppName}>Jagabans LA</Text>
              </View>
              <Text style={styles.previewNotificationTitle}>
                {title || 'Notification Title'}
              </Text>
              <Text style={styles.previewNotificationMessage}>
                {message || 'Notification message will appear here...'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.sendButton, (!title || !message) && styles.sendButtonDisabled]}
            onPress={handleSendNotification}
            disabled={!title || !message}
          >
            <IconSymbol name="send" size={20} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Send to All Users</Text>
          </Pressable>
        </View>

        <View style={styles.infoContainer}>
          <IconSymbol name="info" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Push Notifications</Text>
            <Text style={styles.infoText}>
              Notifications will be sent to all users who have the mobile app installed and have enabled push notifications.
            </Text>
            <Text style={styles.infoText}>
              💡 Enable Supabase to send real-time push notifications to your users.
            </Text>
          </View>
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
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeCardActive: {
    borderWidth: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  previewContainer: {
    marginVertical: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  previewAppName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewNotificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  previewNotificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
});
