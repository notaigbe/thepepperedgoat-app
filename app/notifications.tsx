import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { blackGoldLight } from '@/styles/commonStyles';

// ─── Notification type colours ────────────────────────────────────────
// Each type gets a colour that:
//   - reads on white card surfaces (light variant)
//   - has semantic meaning (gold = order/value, silver = system, etc.)
//   - coheres with the overall black/gold/silver palette

const NOTIFICATION_COLORS: Record<string, {
  iconColor: string;
  iconBg:    string;
  border:    string;
}> = {
  special: {
    // Gold — promotions and special offers are the brand's primary value signal
    iconColor: blackGoldLight.GOLD_BRIGHT,
    iconBg:    blackGoldLight.GOLD_DIM,
    border:    blackGoldLight.BORDER_GOLD,
  },
  event: {
    // Silver-blue — events are informational, cool tone
    iconColor: blackGoldLight.SILVER,
    iconBg:    blackGoldLight.SILVER_DIM,
    border:    blackGoldLight.BORDER_SILVER,
  },
  order: {
    // Deep gold — orders are high-value moments
    iconColor: blackGoldLight.GOLD,
    iconBg:    blackGoldLight.GOLD_DIM,
    border:    blackGoldLight.BORDER_GOLD,
  },
  points: {
    // Bright gold — rewards and earnings, celebratory
    iconColor: blackGoldLight.GOLD_BRIGHT,
    iconBg:    "rgba(212,168,58,0.15)",
    border:    "rgba(212,168,58,0.3)",
  },
  admin: {
    // Warm red — alert/action required
    iconColor: "#C0392B",
    iconBg:    "rgba(192,57,43,0.1)",
    border:    "rgba(192,57,43,0.25)",
  },
  system: {
    // Silver — neutral system messages
    iconColor: blackGoldLight.SILVER,
    iconBg:    blackGoldLight.SILVER_DIM,
    border:    blackGoldLight.BORDER_SILVER,
  },
  default: {
    // Soft gold fallback
    iconColor: blackGoldLight.INK_MID,
    iconBg:    blackGoldLight.GOLD_DIM,
    border:    blackGoldLight.BORDER_GOLD,
  },
};

function getTypeColors(type: string) {
  return NOTIFICATION_COLORS[type] ?? NOTIFICATION_COLORS.default;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { userProfile, markNotificationAsRead } = useApp();

  const handleNotificationPress = (notificationId: string, actionUrl?: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markNotificationAsRead(notificationId);
    if (actionUrl) router.push(actionUrl as any);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'special': return 'star.fill';
      case 'event':   return 'calendar';
      case 'order':   return 'bag.fill';
      case 'points':  return 'gift.fill';
      case 'admin':   return 'exclamationmark.triangle.fill';
      case 'system':  return 'info.circle.fill';
      default:        return 'bell.fill';
    }
  };

  return (
    // Body: warm parchment gradient
    <LinearGradient
      colors={[blackGoldLight.BODY_BG, blackGoldLight.BODY_BG, "#F5F0E8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>

          {/* ── Header — dark near-black with gold bloom ── */}
          <LinearGradient
            colors={[blackGoldLight.HEADER_TOP, blackGoldLight.HEADER_MID]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            {/* Gold bloom — top-right, mirrors WelcomeHeader */}
            <LinearGradient
              colors={["rgba(212,168,58,0.18)", "rgba(184,146,42,0.06)", "transparent"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            <View style={styles.headerContent}>
              {/* Back button — gold-tinted pill */}
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={styles.backButton}
              >
                <IconSymbol name="chevron.left" size={24} color={blackGoldLight.INK_WHITE} />
              </Pressable>

              <View style={styles.headerCentre}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {userProfile && userProfile.notifications.length > 0 && (
                  <Text style={styles.notificationCount}>
                    {userProfile.notifications.filter((n) => !n.read).length} unread
                  </Text>
                )}
              </View>

              {/* Spacer to balance back button */}
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Empty state ── */}
            {!userProfile || userProfile.notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <IconSymbol name="bell" size={40} color={blackGoldLight.GOLD} />
                </View>
                <Text style={styles.emptyStateTitle}>No Notifications</Text>
                <Text style={styles.emptyStateText}>
                  You'll see notifications about orders, specials, and events here
                </Text>
              </View>
            ) : (
              userProfile.notifications.map((notification) => {
                const tc = getTypeColors(notification.type);

                return (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification.id, notification.actionUrl)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                  >
                    {/* Card: white surface, gold or type-coloured border */}
                    <LinearGradient
                      colors={[blackGoldLight.CARD_BG, blackGoldLight.CARD_FOOTER]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.notificationCard,
                        {
                          borderColor: notification.read
                            ? blackGoldLight.BORDER_LIGHT   // faint border when read
                            : tc.border,                   // type colour when unread
                          borderWidth: notification.read ? 1 : 1.5,
                        },
                      ]}
                    >
                      {/* Type icon pill */}
                      <View style={[styles.iconContainer, { backgroundColor: tc.iconBg }]}>
                        <IconSymbol
                          name={getNotificationIcon(notification.type)}
                          size={26}
                          color={tc.iconColor}
                        />
                      </View>

                      {/* Content */}
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle} numberOfLines={1}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={[styles.unreadBadge, { backgroundColor: tc.iconBg }]}>
                              <Text style={[styles.unreadBadgeText, { color: tc.iconColor }]}>
                                New
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.notificationMessage} numberOfLines={3}>
                          {notification.message}
                        </Text>

                        <View style={styles.notificationFooter}>
                          <Text style={styles.notificationDate}>
                            {new Date(notification.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                          <View style={[styles.typeLabel, { backgroundColor: tc.iconBg }]}>
                            <Text style={[styles.typeLabelText, { color: tc.iconColor }]}>
                              {notification.type}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea:          { flex: 1 },
  container:         { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: blackGoldLight.BORDER_GOLD,
    overflow: 'hidden',
    position: 'relative',
    elevation: 6,
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(184,146,42,0.15)',
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCentre: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'LibertinusSans_700Bold',
    letterSpacing: 0.3,
    color: blackGoldLight.INK_WHITE,
  },
  notificationCount: {
    fontSize: 12,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SILVER,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // ── Scroll ──────────────────────────────────────────────────────────
  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  // ── Empty state ──────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // ── Notification card ────────────────────────────────────────────────
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Icon pill — type-coloured background
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  // Text column
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK,
    flex: 1,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  unreadBadgeText: {
    fontSize: 9,
    fontFamily: 'LibertinusSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    lineHeight: 18,
    color: blackGoldLight.INK_MID,
    marginBottom: 10,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationDate: {
    fontSize: 11,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SOFT,
  },
  typeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeLabelText: {
    fontSize: 10,
    fontFamily: 'LibertinusSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});