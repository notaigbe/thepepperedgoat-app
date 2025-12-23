
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { socialService } from '@/services/socialService';
import Toast from '@/components/Toast';
import * as Haptics from 'expo-haptics';

export default function InviteFriendScreen() {
  const router = useRouter();
  const { currentColors, userProfile } = useApp();
  const { isAuthenticated } = useAuth();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    if (isAuthenticated) {
      loadReferralCode();
      loadReferrals();
    }
  }, [isAuthenticated]);

  const loadReferralCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await socialService.getUserReferralCode();
      if (error) {
        console.error('Error loading referral code:', error);
        showLocalToast('error', 'Failed to load referral code');
      } else {
        setReferralCode(data);
      }
    } catch (error) {
      console.error('Error loading referral code:', error);
      showLocalToast('error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const { data, error } = await socialService.getUserReferrals();
      if (error) {
        console.error('Error loading referrals:', error);
      } else {
        setReferrals(data || []);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const showLocalToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleCopyCode = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (referralCode) {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(referralCode);
      } else {
        Clipboard.setString(referralCode);
      }
      showLocalToast('success', 'Referral code copied to clipboard!');
    }
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!referralCode) return;

    const message = `Join me on Jagabans L.A. and earn rewards! Use my referral code: ${referralCode}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Join Jagabans L.A.',
            text: message,
          });
        } else {
          // Fallback for web browsers that don't support share
          navigator.clipboard.writeText(message);
          showLocalToast('success', 'Referral message copied to clipboard!');
        }
      } else {
        await Share.share({
          message,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed_first_order':
        return '#4CAF50';
      case 'signed_up':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed_first_order':
        return 'Completed';
      case 'signed_up':
        return 'Signed Up';
      default:
        return 'Pending';
    }
  };

  if (!isAuthenticated) {
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
              <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>
              Invite a Friend
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.notAuthContainer}>
            <IconSymbol name="person.2" size={80} color={currentColors.textSecondary} />
            <Text style={[styles.notAuthText, { color: currentColors.text }]}>
              Sign in to invite friends
            </Text>
            <Text style={[styles.notAuthSubtext, { color: currentColors.textSecondary }]}>
              Create an account to get your referral code and start earning rewards
            </Text>
            <LinearGradient
              colors={[currentColors.primary, currentColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInButton}
            >
              <Pressable
                style={styles.signInButtonInner}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  router.push('/(tabs)/profile');
                }}
              >
                <Text style={[styles.signInButtonText, { color: currentColors.card }]}>
                  Sign In
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
        {/* Header */}
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
            <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>
            Invite a Friend
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Referral Code Card */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.codeCard}
          >
            <View style={styles.codeHeader}>
              <IconSymbol name="gift.fill" size={48} color={currentColors.primary} />
              <Text style={[styles.codeTitle, { color: currentColors.text }]}>
                Your Referral Code
              </Text>
              <Text style={[styles.codeSubtitle, { color: currentColors.textSecondary }]}>
                Share this code with friends to earn rewards
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.primary} />
              </View>
            ) : (
              <>
                <View style={[styles.codeDisplay, { backgroundColor: currentColors.primary + '20' }]}>
                  <Text style={[styles.codeText, { color: currentColors.primary }]}>
                    {referralCode}
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <LinearGradient
                    colors={[currentColors.primary, currentColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    <Pressable style={styles.actionButtonInner} onPress={handleCopyCode}>
                      <IconSymbol name="doc.on.doc" size={20} color={currentColors.card} />
                      <Text style={[styles.actionButtonText, { color: currentColors.card }]}>
                        Copy Code
                      </Text>
                    </Pressable>
                  </LinearGradient>

                  <LinearGradient
                    colors={[currentColors.primary, currentColors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    <Pressable style={styles.actionButtonInner} onPress={handleShare}>
                      <IconSymbol name="square.and.arrow.up" size={20} color={currentColors.card} />
                      <Text style={[styles.actionButtonText, { color: currentColors.card }]}>
                        Share
                      </Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              </>
            )}
          </LinearGradient>

          {/* How It Works */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCard}
          >
            <Text style={[styles.infoTitle, { color: currentColors.text }]}>
              How It Works
            </Text>

            <View style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: currentColors.primary }]}>
                <Text style={[styles.stepNumberText, { color: currentColors.card }]}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: currentColors.text }]}>
                  Share Your Code
                </Text>
                <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                  Send your referral code to friends via text, email, or social media
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: currentColors.primary }]}>
                <Text style={[styles.stepNumberText, { color: currentColors.card }]}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: currentColors.text }]}>
                  Friend Signs Up
                </Text>
                <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                  Your friend creates an account using your referral code
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: currentColors.primary }]}>
                <Text style={[styles.stepNumberText, { color: currentColors.card }]}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: currentColors.text }]}>
                  Earn Rewards
                </Text>
                <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                  Get bonus points when they sign up and complete their first order
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Referral Stats */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <Text style={[styles.statsTitle, { color: currentColors.text }]}>
              Your Referrals
            </Text>

            {loadingReferrals ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.primary} />
              </View>
            ) : referrals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.2" size={48} color={currentColors.textSecondary} />
                <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
                  No referrals yet
                </Text>
                <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
                  Start inviting friends to earn rewards!
                </Text>
              </View>
            ) : (
              <View style={styles.referralsList}>
                {referrals.map((referral, index) => (
                  <View key={index} style={styles.referralItem}>
                    <View style={styles.referralInfo}>
                      <Text style={[styles.referralEmail, { color: currentColors.text }]}>
                        {referral.referred_user?.name || referral.referred_email || 'Pending'}
                      </Text>
                      <Text style={[styles.referralDate, { color: currentColors.textSecondary }]}>
                        {new Date(referral.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.referralStatus,
                        { backgroundColor: getStatusColor(referral.status) },
                      ]}
                    >
                      <Text style={styles.referralStatusText}>
                        {getStatusText(referral.status)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </ScrollView>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notAuthText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  notAuthSubtext: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 0,
    marginTop: 32,
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.4)',
    elevation: 8,
  },
  signInButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  codeCard: {
    borderRadius: 0,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.25)',
    elevation: 6,
  },
  codeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  codeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  codeSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  codeDisplay: {
    padding: 20,
    borderRadius: 0,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 0,
    boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 6,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 0,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.25)',
    elevation: 6,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    borderRadius: 0,
    padding: 24,
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.25)',
    elevation: 6,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  referralInfo: {
    flex: 1,
  },
  referralEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
  },
  referralStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  referralStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
