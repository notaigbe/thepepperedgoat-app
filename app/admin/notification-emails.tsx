
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emailCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emailCardInactive: {
    opacity: 0.6,
  },
  emailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeActive: {
    backgroundColor: '#10b981',
  },
  statusBadgeInactive: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  toggleButtonText: {
    color: '#fff',
  },
  deleteButtonText: {
    color: '#fff',
  },
  emailMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text,
  },
  confirmButtonText: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default function AdminNotificationEmails() {
  const router = useRouter();
  const [emails, setEmails] = useState<AdminNotificationEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    fetchEmails();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ visible: true, message, type });
  };

  const showDialog = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  ) => {
    setDialogConfig({ visible: true, title, message, buttons });
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await adminNotificationEmailService.getAdminNotificationEmails();
      
      if (error) {
        console.error('Error fetching admin notification emails:', error);
        showToast('error', 'Failed to load admin emails');
        return;
      }

      if (data) {
        setEmails(data.map((email: any) => ({
          id: email.id,
          email: email.email,
          isActive: email.is_active,
          createdAt: email.created_at,
          updatedAt: email.updated_at,
          createdBy: email.created_by,
        })));
      }
    } catch (error) {
      console.error('Error fetching admin notification emails:', error);
      showToast('error', 'Failed to load admin emails');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      showToast('error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      showToast('error', 'Please enter a valid email address');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { data, error } = await adminNotificationEmailService.addAdminNotificationEmail(newEmail.trim());

      if (error) {
        console.error('Error adding admin notification email:', error);
        showToast('error', 'Failed to add email. It may already exist.');
        return;
      }

      showToast('success', 'Email added successfully');
      setNewEmail('');
      setShowAddModal(false);
      fetchEmails();
    } catch (error) {
      console.error('Error adding admin notification email:', error);
      showToast('error', 'Failed to add email');
    }
  };

  const handleToggleEmail = async (emailId: string, currentStatus: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { error } = await adminNotificationEmailService.toggleAdminNotificationEmail(emailId, !currentStatus);

      if (error) {
        console.error('Error toggling admin notification email:', error);
        showToast('error', 'Failed to update email status');
        return;
      }

      showToast('success', `Email ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchEmails();
    } catch (error) {
      console.error('Error toggling admin notification email:', error);
      showToast('error', 'Failed to update email status');
    }
  };

  const handleDeleteEmail = (emailId: string, email: string) => {
    showDialog(
      'Delete Email',
      `Are you sure you want to delete ${email}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setDialogConfig({ ...dialogConfig, visible: false }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDialogConfig({ ...dialogConfig, visible: false });
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const { error } = await adminNotificationEmailService.deleteAdminNotificationEmail(emailId);

              if (error) {
                console.error('Error deleting admin notification email:', error);
                showToast('error', 'Failed to delete email');
                return;
              }

              showToast('success', 'Email deleted successfully');
              fetchEmails();
            } catch (error) {
              console.error('Error deleting admin notification email:', error);
              showToast('error', 'Failed to delete email');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Notification Emails</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Emails</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Manage email addresses that receive order confirmation notifications. Active emails will receive notifications when customers place orders.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddModal(true);
          }}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={24}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Add Email Address</Text>
        </Pressable>

        {emails.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="envelope"
              android_material_icon_name="email"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              No admin notification emails configured.{'\n'}
              Add an email address to start receiving order notifications.
            </Text>
          </View>
        ) : (
          emails.map((email) => (
            <View
              key={email.id}
              style={[styles.emailCard, !email.isActive && styles.emailCardInactive]}
            >
              <View style={styles.emailHeader}>
                <Text style={styles.emailText}>{email.email}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    email.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {email.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <Text style={styles.emailMeta}>
                Added on {formatDate(email.createdAt)}
              </Text>

              <View style={styles.emailActions}>
                <Pressable
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={() => handleToggleEmail(email.id, email.isActive)}
                >
                  <IconSymbol
                    ios_icon_name={email.isActive ? 'pause.circle' : 'play.circle'}
                    android_material_icon_name={email.isActive ? 'pause' : 'play-arrow'}
                    size={18}
                    color="#fff"
                  />
                  <Text style={[styles.actionButtonText, styles.toggleButtonText]}>
                    {email.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteEmail(email.id, email.email)}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={18}
                    color="#fff"
                  />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Email Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowAddModal(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Add Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@example.com"
                placeholderTextColor={colors.textSecondary}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddModal(false);
                    setNewEmail('');
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddEmail}
                >
                  <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                    Add Email
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <Dialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        buttons={dialogConfig.buttons}
        onDismiss={() => setDialogConfig({ ...dialogConfig, visible: false })}
      />
    </SafeAreaView>
  );
}
