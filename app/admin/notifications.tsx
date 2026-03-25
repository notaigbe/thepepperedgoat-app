import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';

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
  success: "#2ECC71",
  orange: "#E67E22",
  orangeFaint: "#E67E2218",
  teal: "#4ECDC4",
  tealFaint: "#4ECDC418",
  radius: 4,
};

type NotifType = 'general' | 'special' | 'event';
type Audience = 'all' | 'recent' | 'vip';

const TYPE_CONFIG: Record<NotifType, { label: string; icon: string; color: string; faint: string }> = {
  general: { label: 'GENERAL',       icon: 'bell.fill',    color: D.gold,    faint: D.goldFaint },
  special: { label: 'SPECIAL OFFER', icon: 'tag.fill',     color: D.orange,  faint: D.orangeFaint },
  event:   { label: 'EVENT',         icon: 'calendar',     color: D.teal,    faint: D.tealFaint },
};

const AUDIENCE_CONFIG: Record<Audience, { label: string; desc: string }> = {
  all:    { label: 'ALL USERS',   desc: 'Everyone with the app' },
  recent: { label: 'RECENT',      desc: 'Ordered in last 30 days' },
  vip:    { label: 'VIP',         desc: '500+ points' },
};

export default function AdminNotifications() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState<NotifType>('general');
  const [targetAudience, setTargetAudience] = useState<Audience>('all');
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '', message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: typeof dialogConfig.buttons) => {
    setDialogConfig({ title, message, buttons }); setDialogVisible(true);
  };
  const showToast = (type: typeof toastType, message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };

  const getTargetedUsers = async (): Promise<string[]> => {
    try {
      if (targetAudience === 'recent') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const { data } = await supabase.from('orders').select('user_id').gte('created_at', cutoff.toISOString());
        return [...new Set((data || []).map((o: any) => o.user_id))];
      }
      if (targetAudience === 'vip') {
        const { data } = await supabase.from('user_profiles').select('id').gte('points', 500);
        return (data || []).map((u: any) => u.id);
      }
      return allUsers;
    } catch {
      return allUsers;
    }
  };

  const loadRecentNotifications = async () => {
    try {
      const { data } = await supabase.from('notifications').select('title, message, type, created_at')
        .order('created_at', { ascending: false }).limit(5);
      setRecentNotifications(data || []);
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('user_profiles').select('id');
      setAllUsers((data || []).map((u: any) => u.id));
    } catch {}
  };

  React.useEffect(() => { loadUsers(); loadRecentNotifications(); }, []);

  const handleSend = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!title || !message) { showToast('error', 'Title and message are required'); return; }
    if (allUsers.length === 0) { showToast('error', 'No users found'); return; }

    showDialog(
      'Send Notification',
      `Send "${title}" to ${AUDIENCE_CONFIG[targetAudience].label.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        { text: 'Send', onPress: async () => {
          try {
            setSending(true);
            const ids = await getTargetedUsers();
            const { error } = await supabase.from('notifications').insert(
              ids.map((userId) => ({ user_id: userId, title, message, type: selectedType, read: false })) as any
            );
            if (error) throw error;
            showToast('success', `Sent to ${ids.length} user${ids.length !== 1 ? 's' : ''}`);
            setTitle(''); setMessage(''); setSelectedType('general');
            loadRecentNotifications();
          } catch { showToast('error', 'Failed to send notifications'); }
          finally { setSending(false); }
        }},
      ]
    );
  };

  const typeCfg = TYPE_CONFIG[selectedType];

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
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.userCount}>
          <Text style={styles.userCountNum}>{allUsers.length}</Text>
          <Text style={styles.userCountLabel}>USERS</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Type selector ── */}
        <Text style={styles.sectionLabel}>TYPE</Text>
        <View style={styles.typeRow}>
          {(Object.entries(TYPE_CONFIG) as [NotifType, typeof TYPE_CONFIG[NotifType]][]).map(([key, cfg]) => {
            const active = selectedType === key;
            return (
              <Pressable
                key={key}
                style={[styles.typeCard, active && { borderColor: cfg.color, backgroundColor: cfg.faint }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedType(key);
                }}
              >
                <IconSymbol name={cfg.icon as any} size={18} color={active ? cfg.color : D.textMuted} />
                <Text style={[styles.typeLabel, active && { color: cfg.color }]}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Audience selector ── */}
        <Text style={styles.sectionLabel}>AUDIENCE</Text>
        <View style={styles.audienceRow}>
          {(Object.entries(AUDIENCE_CONFIG) as [Audience, typeof AUDIENCE_CONFIG[Audience]][]).map(([key, cfg]) => {
            const active = targetAudience === key;
            return (
              <Pressable
                key={key}
                style={[styles.audienceCard, active && styles.audienceCardActive]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTargetAudience(key);
                }}
              >
                <Text style={[styles.audienceLabel, active && styles.audienceLabelActive]}>{cfg.label}</Text>
                <Text style={styles.audienceDesc}>{cfg.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Content ── */}
        <Text style={styles.sectionLabel}>CONTENT</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="Notification title"
            placeholderTextColor={D.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.fieldLabel}>MESSAGE</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notification message"
            placeholderTextColor={D.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* ── Preview ── */}
        <Text style={styles.sectionLabel}>PREVIEW</Text>
        <View style={styles.previewCard}>
          <View style={[styles.previewAccent, { backgroundColor: typeCfg.color }]} />
          <View style={styles.previewInner}>
            <View style={styles.previewHeader}>
              <IconSymbol name={typeCfg.icon as any} size={14} color={typeCfg.color} />
              <Text style={styles.previewApp}>THE PEPPERED GOAT</Text>
            </View>
            <Text style={styles.previewTitle}>{title || 'Notification Title'}</Text>
            <Text style={styles.previewMessage} numberOfLines={3}>
              {message || 'Your message will appear here…'}
            </Text>
          </View>
        </View>

        {/* ── Recent ── */}
        {recentNotifications.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RECENT SENDS</Text>
            <View style={styles.historyContainer}>
              {recentNotifications.map((n, i) => {
                const cfg = TYPE_CONFIG[n.type as NotifType] ?? TYPE_CONFIG.general;
                return (
                  <View key={i} style={[styles.historyRow, i === recentNotifications.length - 1 && styles.historyRowLast]}>
                    <View style={[styles.historyDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle}>{n.title}</Text>
                      <Text style={styles.historyMessage} numberOfLines={1}>{n.message}</Text>
                    </View>
                    <Text style={styles.historyDate}>
                      {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Send button ── */}
        <Pressable
          style={[styles.sendButton, (!title || !message || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!title || !message || sending}
        >
          {sending ? (
            <ActivityIndicator color={D.surface} size="small" />
          ) : (
            <IconSymbol name="paperplane.fill" size={16} color={D.surface} />
          )}
          <Text style={styles.sendButtonText}>
            {sending ? 'SENDING…' : `SEND TO ${AUDIENCE_CONFIG[targetAudience].label}`}
          </Text>
        </Pressable>

        <View style={{ height: 48 }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />
      <Dialog visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message}
        buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)}
        currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }} />
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
  userCount: { alignItems: 'flex-end' },
  userCountNum: { fontSize: 18, fontWeight: '300', color: D.textPrimary },
  userCountLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 2, color: D.textMuted },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10,
  },

  // Type selector
  typeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.dividerStrong,
    backgroundColor: D.surfaceRaised,
  },
  typeLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: D.textMuted, textAlign: 'center' },

  // Audience
  audienceRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  audienceCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.dividerStrong,
    backgroundColor: D.surfaceRaised,
  },
  audienceCardActive: { borderColor: D.goldDim, backgroundColor: D.goldFaint },
  audienceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: D.textMuted, marginBottom: 3 },
  audienceLabelActive: { color: D.gold },
  audienceDesc: { fontSize: 10, color: D.textMuted, lineHeight: 14 },

  // Fields
  fieldGroup: {
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: D.divider,
  },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textSecondary, marginBottom: 8 },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  // Preview
  previewCard: {
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: D.divider,
  },
  previewAccent: { width: 2 },
  previewInner: { flex: 1, padding: 14 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  previewApp: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  previewTitle: { fontSize: 14, fontWeight: '600', color: D.textPrimary, letterSpacing: 0.2, marginBottom: 4 },
  previewMessage: { fontSize: 12, color: D.textSecondary, lineHeight: 18 },

  // History
  historyContainer: {
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: D.divider,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
    gap: 10,
  },
  historyRowLast: { borderBottomWidth: 0 },
  historyDot: { width: 6, height: 6, borderRadius: 3 },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 13, fontWeight: '500', color: D.textPrimary, marginBottom: 2 },
  historyMessage: { fontSize: 11, color: D.textMuted },
  historyDate: { fontSize: 10, color: D.textMuted, fontWeight: '500' },

  // Send button
  sendButton: {
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
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: D.surface },
});