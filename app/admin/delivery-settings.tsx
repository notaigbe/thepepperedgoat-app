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
import { DeliveryProvider, DELIVERY_PROVIDERS } from '@/constants/DeliveryConfig';

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  gold: "#C9A84C",
  goldDim: "#C9A84C55",
  goldFaint: "#C9A84C18",
  surface: "#111613",
  surfaceRaised: "#181C19",
  divider: "#FFFFFF0D",
  dividerStrong: "#FFFFFF18",
  textPrimary: "#F0EDE6",
  textSecondary: "#7A8A7E",
  textMuted: "#3D4D41",
  danger: "#C0392B",
  dangerFaint: "#C0392B18",
  info: "#3B82F6",
  infoFaint: "#3B82F610",
  radius: 4,
};

const DELIVERY_SETTINGS_KEY = 'delivery_settings';

interface DeliverySettings {
  autoTriggerDelivery: boolean;
  defaultProvider: DeliveryProvider;
  restaurantName: string;
  restaurantPhone: string;
  restaurantStreet: string;
  restaurantCity: string;
  restaurantState: string;
  restaurantZipCode: string;
  pickupNotes: string;
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={fieldLabelStyle}>{children}</Text>;
}
const fieldLabelStyle: import('react-native').TextStyle = {
  fontSize: 10, fontWeight: '700', letterSpacing: 2,
  color: D.textSecondary, marginBottom: 8, marginTop: 4,
};

export default function DeliverySettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<DeliverySettings>({
    autoTriggerDelivery: false,
    defaultProvider: 'uber_direct',
    restaurantName: 'The Peppered Goat',
    restaurantPhone: '+18182106659',
    restaurantStreet: '123 Restaurant Street',
    restaurantCity: 'Los Angeles',
    restaurantState: 'CA',
    restaurantZipCode: '90001',
    pickupNotes: 'Please call upon arrival',
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(DELIVERY_SETTINGS_KEY);
        if (saved) setSettings(JSON.parse(saved));
      } catch {}
    })();
  }, []);

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(DELIVERY_SETTINGS_KEY, JSON.stringify(settings));
      showToast('success', 'Settings saved');
    } catch {
      showToast('error', 'Failed to save settings');
    }
  };

  const showToast = (type: typeof toastType, message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  const update = (key: keyof DeliverySettings, value: any) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Delivery Settings</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Provider selection ── */}
        <Text style={styles.sectionLabel}>DEFAULT PROVIDER</Text>
        <View style={styles.providerRow}>
          {(Object.keys(DELIVERY_PROVIDERS) as DeliveryProvider[]).map((provider) => {
            const active = settings.defaultProvider === provider;
            return (
              <Pressable
                key={provider}
                style={[styles.providerCard, active && styles.providerCardActive]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  update('defaultProvider', provider);
                }}
              >
                <IconSymbol
                  name={DELIVERY_PROVIDERS[provider].icon}
                  size={20}
                  color={active ? D.gold : D.textSecondary}
                />
                <Text style={[styles.providerLabel, active && styles.providerLabelActive]}>
                  {DELIVERY_PROVIDERS[provider].name.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Auto trigger ── */}
        <Text style={styles.sectionLabel}>AUTOMATION</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-trigger Delivery</Text>
            <Text style={styles.settingDesc}>
              Dispatch automatically when order status changes to Ready
            </Text>
          </View>
          <Switch
            value={settings.autoTriggerDelivery}
            onValueChange={(v) => update('autoTriggerDelivery', v)}
            trackColor={{ false: D.dividerStrong, true: D.goldDim }}
            thumbColor={settings.autoTriggerDelivery ? D.gold : D.textMuted}
          />
        </View>

        {/* ── Restaurant info ── */}
        <Text style={styles.sectionLabel}>RESTAURANT</Text>
        <View style={styles.fieldGroup}>
          <FieldLabel>NAME</FieldLabel>
          <TextInput style={styles.input} value={settings.restaurantName}
            onChangeText={(v) => update('restaurantName', v)}
            placeholder="Restaurant name" placeholderTextColor={D.textMuted} />

          <FieldLabel>PHONE</FieldLabel>
          <TextInput style={styles.input} value={settings.restaurantPhone}
            onChangeText={(v) => update('restaurantPhone', v)}
            placeholder="+1234567890" placeholderTextColor={D.textMuted} keyboardType="phone-pad" />
        </View>

        {/* ── Address ── */}
        <Text style={styles.sectionLabel}>PICKUP ADDRESS</Text>
        <View style={styles.fieldGroup}>
          <FieldLabel>STREET</FieldLabel>
          <TextInput style={styles.input} value={settings.restaurantStreet}
            onChangeText={(v) => update('restaurantStreet', v)}
            placeholder="123 Main Street" placeholderTextColor={D.textMuted} />

          <View style={styles.inlineRow}>
            <View style={{ flex: 2 }}>
              <FieldLabel>CITY</FieldLabel>
              <TextInput style={styles.input} value={settings.restaurantCity}
                onChangeText={(v) => update('restaurantCity', v)}
                placeholder="Los Angeles" placeholderTextColor={D.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <FieldLabel>STATE</FieldLabel>
              <TextInput style={styles.input} value={settings.restaurantState}
                onChangeText={(v) => update('restaurantState', v)}
                placeholder="CA" placeholderTextColor={D.textMuted} maxLength={2} />
            </View>
          </View>

          <FieldLabel>ZIP CODE</FieldLabel>
          <TextInput style={styles.input} value={settings.restaurantZipCode}
            onChangeText={(v) => update('restaurantZipCode', v)}
            placeholder="90001" placeholderTextColor={D.textMuted} keyboardType="number-pad" maxLength={5} />

          <FieldLabel>PICKUP NOTES</FieldLabel>
          <TextInput style={[styles.input, styles.textArea]} value={settings.pickupNotes}
            onChangeText={(v) => update('pickupNotes', v)}
            placeholder="Special instructions for drivers"
            placeholderTextColor={D.textMuted} multiline numberOfLines={3} />
        </View>

        {/* ── Save ── */}
        <Pressable
          style={styles.saveButton}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            saveSettings();
          }}
        >
          <IconSymbol name="square.and.arrow.down" size={16} color={D.surface} />
          <Text style={styles.saveButtonText}>SAVE SETTINGS</Text>
        </Pressable>

        {/* ── Info boxes ── */}
        <View style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={16} color={D.info} />
          <Text style={styles.infoText}>
            API credentials must be configured in Supabase Edge Functions for your chosen provider.
          </Text>
        </View>

        <View style={[styles.infoBox, { marginTop: 10, borderColor: D.goldDim }]}>
          <IconSymbol name="lightbulb.fill" size={16} color={D.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoText}>
              <Text style={{ color: D.gold, fontWeight: '700' }}>Uber Direct: </Text>
              Requires UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_CUSTOMER_ID.
            </Text>
            <Text style={[styles.infoText, { marginTop: 8 }]}>
              <Text style={{ color: D.gold, fontWeight: '700' }}>DoorDash: </Text>
              Requires DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, DOORDASH_SIGNING_SECRET.
            </Text>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.surface },
  scrollView: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  backButton: { padding: 4, marginRight: 14 },
  headerCenter: { flex: 1 },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 3, color: D.gold, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '300', letterSpacing: 0.5, color: D.textPrimary },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10,
  },

  providerRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  providerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.dividerStrong,
    backgroundColor: D.surfaceRaised,
  },
  providerCardActive: { borderColor: D.goldDim, backgroundColor: D.goldFaint },
  providerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: D.textMuted },
  providerLabelActive: { color: D.gold },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: D.divider,
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: D.textPrimary, letterSpacing: 0.2, marginBottom: 3 },
  settingDesc: { fontSize: 12, color: D.textSecondary, lineHeight: 17 },

  fieldGroup: {
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: D.divider,
  },
  inlineRow: { flexDirection: 'row' },

  input: {
    backgroundColor: D.surface,
    borderRadius: D.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    letterSpacing: 0.2,
    color: D.textPrimary,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: D.divider,
  },
  textArea: { minHeight: 76, textAlignVertical: 'top' },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: D.gold,
    borderRadius: D.radius,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 24,
  },
  saveButtonText: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: D.surface },

  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.info + '40',
    backgroundColor: D.infoFaint,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: D.textSecondary, lineHeight: 18 },
});