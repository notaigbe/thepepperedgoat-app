
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DELIVERY_SETTINGS_KEY = 'delivery_settings';

interface DeliverySettings {
  autoTriggerDelivery: boolean;
  restaurantName: string;
  restaurantPhone: string;
  restaurantStreet: string;
  restaurantCity: string;
  restaurantState: string;
  restaurantZipCode: string;
  pickupNotes: string;
}

export default function DeliverySettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<DeliverySettings>({
    autoTriggerDelivery: false,
    restaurantName: 'Jagabans LA',
    restaurantPhone: '+1234567890',
    restaurantStreet: '123 Restaurant Street',
    restaurantCity: 'Los Angeles',
    restaurantState: 'CA',
    restaurantZipCode: '90001',
    pickupNotes: 'Please call upon arrival',
  });
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(DELIVERY_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load delivery settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(DELIVERY_SETTINGS_KEY, JSON.stringify(settings));
      showToast('success', 'Delivery settings saved successfully');
    } catch (error) {
      console.error('Failed to save delivery settings:', error);
      showToast('error', 'Failed to save settings');
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const updateSetting = (key: keyof DeliverySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
          <IconSymbol name="arrow.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Delivery Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uber Direct Configuration</Text>
            <Text style={styles.sectionDescription}>
              Configure your Uber Direct delivery settings. Make sure to set up API credentials in Supabase Edge Functions.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-trigger Delivery</Text>
                <Text style={styles.settingDescription}>
                  Automatically trigger Uber Direct delivery when order status changes to "Ready"
                </Text>
              </View>
              <Switch
                value={settings.autoTriggerDelivery}
                onValueChange={(value) => updateSetting('autoTriggerDelivery', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restaurant Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restaurant Name</Text>
              <TextInput
                style={styles.input}
                value={settings.restaurantName}
                onChangeText={(value) => updateSetting('restaurantName', value)}
                placeholder="Enter restaurant name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={settings.restaurantPhone}
                onChangeText={(value) => updateSetting('restaurantPhone', value)}
                placeholder="+1234567890"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={settings.restaurantStreet}
                onChangeText={(value) => updateSetting('restaurantStreet', value)}
                placeholder="123 Main Street"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={settings.restaurantCity}
                  onChangeText={(value) => updateSetting('restaurantCity', value)}
                  placeholder="Los Angeles"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={settings.restaurantState}
                  onChangeText={(value) => updateSetting('restaurantState', value)}
                  placeholder="CA"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                value={settings.restaurantZipCode}
                onChangeText={(value) => updateSetting('restaurantZipCode', value)}
                placeholder="90001"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.pickupNotes}
                onChangeText={(value) => updateSetting('pickupNotes', value)}
                placeholder="Special instructions for drivers"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <Pressable
            style={styles.saveButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              saveSettings();
            }}
          >
            <IconSymbol name="square.and.arrow.down" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </Pressable>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              To complete the Uber Direct setup, you need to configure API credentials in Supabase Edge Functions. 
              See the documentation for detailed instructions.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
