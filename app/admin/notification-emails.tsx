import React, { useState, useEffect } from 'react';
import Toast from '@/components/Toast';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { adminNotificationEmailService } from '@/services/supabaseService';
import Dialog from '@/components/Dialog';
import { AdminNotificationEmail } from '@/types';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';

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
  successFaint: "#2ECC7118",
  radius: 4,
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminNotificationEmails() {
  const router = useRouter();
  const [emails, setEmails] = useState<AdminNotificationEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean; title: string; message: string;
    buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showToast = (type: 'success' | 'error' | 'info', message: string) =>
    setToast({ visible: true, message, type });

  const showDialog = (title: string, message: string, buttons: typeof dialogConfig.buttons) =>
    setDialogConfig({ visible: true, title, message, buttons });

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await adminNotificationEmailService.getAdminNotificationEmails();
      if (error) { showToast('error', 'Failed to load emails'); return; }
      if (data) {
        setEmails(data.map((e: any) => ({
          id: e.id, email: e.email, isActive: e.is_active,
          createdAt: e.created_at, updatedAt: e.updated_at, createdBy: e.created_by,
        })));
      }
    } catch { showToast('error', 'Failed to load emails'); }
    finally { setLoading(false); }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) { showToast('error', 'Enter an email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { showToast('error', 'Invalid email address'); return; }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { error } = await adminNotificationEmailService.addAdminNotificationEmail(newEmail.trim());
      if (error) { showToast('error', 'Failed to add email'); return; }
      showToast('success', 'Email added');
      setNewEmail(''); setShowModal(false); fetchEmails();
    } catch { showToast('error', 'Failed to add email'); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { error } = await adminNotificationEmailService.toggleAdminNotificationEmail(id, !current);
      if (error) { showToast('error', 'Failed to update status'); return; }
      showToast('success', !current ? 'Email activated' : 'Email deactivated');
      fetchEmails();
    } catch { showToast('error', 'Failed to update status'); }
  };

  const handleDelete = (id: string, email: string) => {
    showDialog('Delete Email', `Remove ${email}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel', onPress: () => setDialogConfig((p) => ({ ...p, visible: false })) },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDialogConfig((p) => ({ ...p, visible: false }));
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const { error } = await adminNotificationEmailService.deleteAdminNotificationEmail(id);
          if (error) { showToast('error', 'Failed to delete'); return; }
          showToast('success', 'Email deleted'); fetchEmails();
        } catch { showToast('error', 'Failed to delete'); }
      }},
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
            <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
            <Text style={styles.headerTitle}>Notification Emails</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={D.gold} />
          <Text style={styles.loadingText}>LOADING</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Notification Emails</Text>
        </View>
        {/* Add button */}
        <Pressable style={styles.addIconBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}>
          <IconSymbol name="plus" size={18} color={D.gold} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Info strip */}
        <View style={styles.infoStrip}>
          <IconSymbol name="info.circle" size={14} color={D.textMuted} />
          <Text style={styles.infoStripText}>
            Active emails receive order confirmation notifications when customers place orders.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{emails.length} CONFIGURED</Text>

        {emails.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="envelope" size={36} color={D.textMuted} />
            <Text style={styles.emptyText}>NO EMAILS CONFIGURED</Text>
            <Pressable style={styles.emptyAddBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}>
              <Text style={styles.emptyAddBtnText}>ADD EMAIL</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emailList}>
            {emails.map((email) => (
              <View key={email.id} style={[styles.emailCard, !email.isActive && styles.emailCardInactive]}>
                {/* Status accent */}
                <View style={[styles.cardAccent, { backgroundColor: email.isActive ? D.success : D.textMuted }]} />

                <View style={styles.cardInner}>
                  <View style={styles.emailHeader}>
                    <Text style={[styles.emailAddress, !email.isActive && styles.emailAddressDim]} numberOfLines={1}>
                      {email.email}
                    </Text>
                    <View style={[styles.statusBadge, email.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                      <Text style={[styles.statusText, { color: email.isActive ? D.success : D.textMuted }]}>
                        {email.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.emailMeta}>Added {formatDate(email.createdAt)}</Text>

                  <View style={styles.emailActions}>
                    <Pressable
                      style={[styles.actionBtn, email.isActive ? styles.actionBtnDeactivate : styles.actionBtnActivate]}
                      onPress={() => handleToggle(email.id, email.isActive)}
                    >
                      <IconSymbol
                        name={email.isActive ? 'pause.circle' : 'play.circle'}
                        size={13}
                        color={email.isActive ? D.textSecondary : D.success}
                      />
                      <Text style={[styles.actionBtnText, { color: email.isActive ? D.textSecondary : D.success }]}>
                        {email.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                      </Text>
                    </Pressable>

                    <Pressable style={styles.deleteBtn} onPress={() => handleDelete(email.id, email.email)}>
                      <IconSymbol name="trash.fill" size={13} color={D.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Add Email Modal ── */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>ADD EMAIL</Text>
              <Text style={styles.modalSubtitle}>Enter the address to receive order notifications.</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="admin@example.com"
                placeholderTextColor={D.textMuted}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancelBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(false); setNewEmail(''); }}>
                  <Text style={styles.modalCancelText}>CANCEL</Text>
                </Pressable>
                <Pressable style={styles.modalConfirmBtn} onPress={handleAddEmail}>
                  <Text style={styles.modalConfirmText}>ADD</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }} />
      <Dialog visible={dialogConfig.visible} title={dialogConfig.title} message={dialogConfig.message}
        buttons={dialogConfig.buttons} onDismiss={() => setDialogConfig((p) => ({ ...p, visible: false }))}
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
  addIconBtn: { padding: 4 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },

  infoStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: D.radius,
    backgroundColor: D.surfaceRaised,
    borderWidth: 1,
    borderColor: D.divider,
  },
  infoStripText: { flex: 1, fontSize: 12, color: D.textMuted, lineHeight: 17 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textMuted },
  emptyAddBtn: {
    marginTop: 4,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: D.radius, borderWidth: 1, borderColor: D.goldDim, backgroundColor: D.goldFaint,
  },
  emptyAddBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.gold },

  emailList: { paddingHorizontal: 20, gap: 10 },

  emailCard: {
    flexDirection: 'row',
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: D.divider,
  },
  emailCardInactive: { opacity: 0.55 },
  cardAccent: { width: 2 },
  cardInner: { flex: 1, padding: 14 },

  emailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  emailAddress: { flex: 1, fontSize: 14, fontWeight: '500', color: D.textPrimary, letterSpacing: 0.2 },
  emailAddressDim: { color: D.textSecondary },

  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: D.radius, borderWidth: 1,
    borderColor: D.dividerStrong,
  },
  statusBadgeActive: { borderColor: D.success + '55', backgroundColor: D.successFaint },
  statusBadgeInactive: { borderColor: D.dividerStrong },
  statusText: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },

  emailMeta: { fontSize: 11, color: D.textMuted, marginBottom: 12 },

  emailActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: D.radius,
    borderWidth: 1,
  },
  actionBtnActivate: { borderColor: D.success + '55', backgroundColor: D.successFaint },
  actionBtnDeactivate: { borderColor: D.dividerStrong },
  actionBtnText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  deleteBtn: {
    width: 36, height: 36,
    borderRadius: D.radius,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: D.dangerFaint,
    borderWidth: 1, borderColor: D.danger + '55',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    padding: 24,
    width: '88%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: D.dividerStrong,
  },
  modalTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: D.gold, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: D.textSecondary, lineHeight: 18, marginBottom: 20 },
  modalInput: {
    backgroundColor: D.surface,
    borderRadius: D.radius,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, letterSpacing: 0.2, color: D.textPrimary,
    marginBottom: 20,
    borderWidth: 1, borderColor: D.dividerStrong,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: D.radius, alignItems: 'center',
    borderWidth: 1, borderColor: D.dividerStrong,
  },
  modalCancelText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.textSecondary },
  modalConfirmBtn: {
    flex: 2, paddingVertical: 13,
    borderRadius: D.radius, alignItems: 'center',
    backgroundColor: D.gold,
  },
  modalConfirmText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: D.surface },
});