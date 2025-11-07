
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

export default function WebsiteHome() {
  const router = useRouter();

  const features = [
    {
      icon: 'restaurant-menu' as const,
      title: 'Authentic Cuisine',
      description: 'Traditional West African dishes made with love',
    },
    {
      icon: 'stars' as const,
      title: 'Rewards Program',
      description: 'Earn points with every purchase',
    },
    {
      icon: 'event' as const,
      title: 'Exclusive Events',
      description: 'Join our private dining experiences',
    },
    {
      icon: 'card-giftcard' as const,
      title: 'Gift Cards',
      description: 'Share the taste with friends and family',
    },
  ];

  const handleNavigation = (route: string) => {
    console.log('Navigating to:', route);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.navbar}>
          <Text style={styles.logo}>Jagabans LA</Text>
          <View style={styles.navLinks}>
            <Pressable onPress={() => handleNavigation('/website/menu')}>
              <Text style={styles.navLink}>Menu</Text>
            </Pressable>
            <Pressable onPress={() => handleNavigation('/website/about')}>
              <Text style={styles.navLink}>About</Text>
            </Pressable>
            <Pressable onPress={() => handleNavigation('/website/events')}>
              <Text style={styles.navLink}>Events</Text>
            </Pressable>
            <Pressable onPress={() => handleNavigation('/website/contact')}>
              <Text style={styles.navLink}>Contact</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Welcome to Jagabans LA</Text>
            <Text style={styles.heroSubtitle}>
              Experience the authentic flavors of West Africa
            </Text>
            <Pressable
              style={styles.heroButton}
              onPress={() => handleNavigation('/website/menu')}
            >
              <Text style={styles.heroButtonText}>View Menu</Text>
              <IconSymbol name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Jagabans LA?</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <IconSymbol name={feature.icon} size={32} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Download Our Mobile App</Text>
          <Text style={styles.ctaDescription}>
            Order ahead, earn rewards, and get exclusive access to special events
          </Text>
          <View style={styles.appButtons}>
            <Pressable style={styles.appButton}>
              <IconSymbol name="apple" size={24} color="#FFFFFF" />
              <View style={styles.appButtonText}>
                <Text style={styles.appButtonLabel}>Download on the</Text>
                <Text style={styles.appButtonStore}>App Store</Text>
              </View>
            </Pressable>
            <Pressable style={styles.appButton}>
              <IconSymbol name="android" size={24} color="#FFFFFF" />
              <View style={styles.appButtonText}>
                <Text style={styles.appButtonLabel}>Get it on</Text>
                <Text style={styles.appButtonStore}>Google Play</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Jagabans LA</Text>
          <Text style={styles.footerText}>
            Bringing the authentic taste of West Africa to Los Angeles
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => handleNavigation('/website/menu')}>
              <Text style={styles.footerLink}>Menu</Text>
            </Pressable>
            <Text style={styles.footerDivider}>•</Text>
            <Pressable onPress={() => handleNavigation('/website/about')}>
              <Text style={styles.footerLink}>About</Text>
            </Pressable>
            <Text style={styles.footerDivider}>•</Text>
            <Pressable onPress={() => handleNavigation('/website/events')}>
              <Text style={styles.footerLink}>Events</Text>
            </Pressable>
            <Text style={styles.footerDivider}>•</Text>
            <Pressable onPress={() => handleNavigation('/website/contact')}>
              <Text style={styles.footerLink}>Contact</Text>
            </Pressable>
          </View>
          <Text style={styles.copyright}>
            © 2024 Jagabans LA. All rights reserved.
          </Text>
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
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  navLink: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  hero: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    padding: 40,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  featureCard: {
    width: 250,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ctaSection: {
    backgroundColor: colors.primary,
    padding: 60,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 600,
  },
  appButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  appButtonText: {
    alignItems: 'flex-start',
  },
  appButtonLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  appButtonStore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    backgroundColor: colors.card,
    padding: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 14,
    color: colors.text,
  },
  footerDivider: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  copyright: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
