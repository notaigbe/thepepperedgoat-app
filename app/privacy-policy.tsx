import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';

interface Section {
  id: string;
  title: string;
  content: string[];
}

const privacySections: Section[] = [
  {
    id: '1',
    title: 'Information We Collect',
    content: [
      'Account Information: When you create an account, we collect your name, email address, phone number, and password.',
      'Profile Information: Information you provide when editing your profile, including delivery address, preferences, and dietary restrictions.',
      'Payment Information: We collect payment details including card information, billing address, and transaction history. Payment processing is handled by our secure payment providers.',
      'Order Information: Details about orders you place, including items ordered, delivery location, and order status.',
      'Device Information: Information about your device, including device model, operating system, unique device identifiers, mobile network information, and locale settings.',
      'Usage Information: We automatically collect information about how you interact with our app, including features used, pages visited, and frequency of engagement.',
      'Location Information: With your permission, we collect precise location data to track order delivery and provide location-based services.',
    ],
  },
  {
    id: '2',
    title: 'How We Use Your Information',
    content: [
      'Service Delivery: To process orders, generate invoices, deliver products, and provide customer support.',
      'Account Management: To authenticate your identity, manage your account, and provide personalized services.',
      'Communication: To send order confirmations, delivery updates, promotional offers, and important account notifications.',
      'Research & Development: To improve our services, develop new features, and understand user preferences.',
      'Analytics: To analyze usage patterns, track popular items, and optimize our user experience.',
      'Fraud Prevention: To detect unauthorized access, fraudulent transactions, and protect account security.',
      'Legal Compliance: To comply with legal obligations, resolve disputes, and enforce our terms of service.',
    ],
  },
  {
    id: '3',
    title: 'Data Sharing & Third Parties',
    content: [
      'Service Providers: We share information with payment processors, delivery partners, hosting providers, and analytics services necessary to provide our services.',
      'Business Transfers: If we merge, acquire, or sell assets, your information may be transferred as part of that transaction.',
      'Legal Requirements: We may disclose information when required by law or when we have a good faith belief that disclosure is necessary.',
      'No Sale of Data: We do not sell, rent, or trade your personal information to third parties for marketing purposes.',
      'Consent-Based Sharing: We only share additional information with your explicit consent.',
    ],
  },
  {
    id: '4',
    title: 'Data Security',
    content: [
      'Encryption: We use industry-standard SSL/TLS encryption to protect data in transit.',
      'Secure Storage: Sensitive information is stored on encrypted servers in secure facilities.',
      'Access Controls: Only authorized employees have access to personal data, and access is limited on a need-to-know basis.',
      'Regular Audits: We conduct regular security assessments and updates to protect against vulnerabilities.',
      'No Guarantee: While we implement robust security measures, no system is completely secure. We cannot guarantee absolute security.',
    ],
  },
  {
    id: '5',
    title: 'Your Privacy Rights',
    content: [
      'Access: You have the right to request a copy of the personal information we hold about you.',
      'Correction: You can request that we correct inaccurate or incomplete information.',
      'Deletion: You can request deletion of your account and associated personal data (applicable laws may require retention of certain records).',
      'Opt-Out: You can opt-out of marketing communications at any time.',
      'Data Portability: You can request your data in a portable format.',
      'Right to Withdraw Consent: You can withdraw consent for location tracking or other optional data collection.',
    ],
  },
  {
    id: '6',
    title: 'Cookies & Tracking',
    content: [
      'Cookies: We use cookies to enhance user experience, remember preferences, and analyze usage patterns.',
      'Tracking Technologies: We may use web beacons, pixels, and similar technologies for analytics and marketing purposes.',
      'Third-Party Services: Analytics services like Google Analytics may collect data about your interactions with our app.',
      'Cookie Control: You can manage cookie preferences through your device settings.',
    ],
  },
  {
    id: '7',
    title: 'Retention of Data',
    content: [
      'Active Accounts: We retain information for active accounts as long as necessary to provide services.',
      'Deleted Accounts: After account deletion, personal information is removed, but order history and transaction records may be retained in anonymized form for accounting and legal purposes.',
      'Marketing Data: Marketing information is retained for 2 years unless you opt-out sooner.',
      'Legal Requirements: We may retain data longer if required by legal obligations.',
    ],
  },
  {
    id: '8',
    title: 'Children\'s Privacy',
    content: [
      'Age Restriction: Our service is not intended for children under 13 years old.',
      'Parental Consent: If a child under 13 creates an account, we require parental consent.',
      'Protection: We take additional steps to protect the privacy and safety of children.',
      'Reporting: If you believe a child has provided information without consent, please contact us immediately.',
    ],
  },
  {
    id: '9',
    title: 'International Data Transfer',
    content: [
      'Data Transfers: Your information may be transferred to and processed in countries outside your country of residence.',
      'Data Protection: We ensure that data transfers comply with applicable data protection laws.',
      'Protections: We implement standard contractual clauses and other safeguards for international transfers.',
    ],
  },
  {
    id: '10',
    title: 'Changes to This Policy',
    content: [
      'Updates: We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.',
      'Notification: We will notify you of major changes via email or prominent notice in the app.',
      'Continued Use: Your continued use of the app after changes indicates acceptance of the updated policy.',
      'Effective Date: The date of the latest update is shown at the bottom of this policy.',
    ],
  },
  {
    id: '11',
    title: 'Contact Us',
    content: [
      'Questions: If you have questions about this Privacy Policy or our privacy practices, please contact us at:',
      'Email: privacy@jagabansla.com',
      'Phone: +1 (818) 210-6659',
      'Mailing Address: Jagabans LA, 7970 W. Sunset Blvd, Los Angeles, CA 90046',
      'Response Time: We will respond to privacy inquiries within 30 days.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { currentColors } = useApp();
  const [expandedSections, setExpandedSections] = useState(new Set<string>());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set(privacySections.map(s => s.id));
    setExpandedSections(allIds);
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name="chevron.left"
            size={28}
            color={currentColors.textSecondary}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: currentColors.textSecondary }]}>
          Privacy Policy
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Header */}
        <LinearGradient
          colors={[
            currentColors.cardGradientStart || currentColors.card,
            currentColors.cardGradientEnd || currentColors.card,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoCard}
        >
          <IconSymbol
            name="lock.shield.fill"
            size={40}
            color={currentColors.primary}
          />
          <Text style={[styles.infoTitle, { color: currentColors.textSecondary }]}>
            Your Privacy Matters
          </Text>
          <Text style={[styles.infoSubtitle, { color: currentColors.textSecondary }]}>
            We're committed to protecting your personal information and being transparent about how we use it.
          </Text>
        </LinearGradient>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={expandAll}
          >
            <Text style={[styles.controlButtonText, { color: currentColors.primary }]}>
              Expand All
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={collapseAll}
          >
            <Text style={[styles.controlButtonText, { color: currentColors.primary }]}>
              Collapse All
            </Text>
          </Pressable>
        </View>

        {/* Sections */}
        {privacySections.map((section, index) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <LinearGradient
              key={index}
              colors={[
                currentColors.cardGradientStart || currentColors.card,
                currentColors.cardGradientEnd || currentColors.card,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionCard}
            >
              <Pressable
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <View style={styles.sectionTitleContainer}>
                  <Text style={[styles.sectionIndex, { color: currentColors.primary }]}>
                    {index + 1}
                  </Text>
                  <Text
                    style={[styles.sectionTitle, { color: currentColors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {section.title}
                  </Text>
                </View>
                <IconSymbol
                  name={isExpanded ? 'chevron.up' : 'chevron.down'}
                  size={20}
                  color={currentColors.textSecondary}
                />
              </Pressable>

              {isExpanded && (
                <View style={[styles.sectionContent, { borderTopColor: currentColors.border }]}>
                  {section.content.map((paragraph, pIndex) => (
                    <Text
                      key={pIndex}
                      style={[styles.sectionText, { color: currentColors.textSecondary }]}
                    >
                      {paragraph}
                    </Text>
                  ))}
                </View>
              )}
            </LinearGradient>
          );
        })}

        {/* Last Updated */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>
            Last Updated: February 2024
          </Text>
          <Text style={[styles.footerText, { color: currentColors.textSecondary, marginTop: 8 }]}>
            Effective Date: February 1, 2024
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIndex: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
