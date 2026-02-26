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

const termsSections: Section[] = [
  {
    id: '1',
    title: 'Agreement to Terms',
    content: [
      'By accessing and using the Jagabans Rewards app (the "App"), you accept and agree to be bound by the terms and provision of this agreement.',
      'If you do not agree to abide by the above, please do not use this service.',
      'We reserve the right to update these terms at any time without notice. Your continued use of the App following the posting of changes means that you accept and agree to the changes.',
    ],
  },
  {
    id: '2',
    title: 'Use License',
    content: [
      'Permission is granted to temporarily download one copy of the materials (information or software) on the App for personal, non-commercial transitory viewing only.',
      'This is the grant of a license, not a transfer of title, and under this license you may not:',
      '• Modify or copy the materials',
      '• Use the materials for any commercial purpose or for any public display',
      '• Attempt to decompile or reverse engineer any software contained on the App',
      '• Remove any copyright or other proprietary notations from the materials',
      '• Transfer the materials to another person or "mirror" the materials on any other server',
      '• Violate any applicable laws or regulations',
    ],
  },
  {
    id: '3',
    title: 'Disclaimer',
    content: [
      'The materials on the App are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
      'Further, we do not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.',
      'We do not guarantee that the App will be uninterrupted or error-free.',
    ],
  },
  {
    id: '4',
    title: 'Limitations',
    content: [
      'In no event shall Jagabans LA or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the App, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.',
      'Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.',
    ],
  },
  {
    id: '5',
    title: 'Accuracy of Materials',
    content: [
      'The materials appearing on the App could include technical, typographical, or photographic errors.',
      'We do not warrant that any of the materials on the App are accurate, complete, or current.',
      'We may make changes to the materials contained on the App at any time without notice.',
      'However, we do not make any commitment to update the materials.',
    ],
  },
  {
    id: '6',
    title: 'Links',
    content: [
      'We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site.',
      'The inclusion of any link does not imply endorsement by us of the site.',
      'Use of any such linked website is at the user\'s own risk.',
      'If you discover that a link is no longer accurate, please notify us.',
    ],
  },
  {
    id: '7',
    title: 'Modifications',
    content: [
      'We may revise these terms of service for the App at any time without notice.',
      'By using this App, you are agreeing to be bound by the then current version of these terms of service.',
      'It is your responsibility to review these terms periodically for changes.',
    ],
  },
  {
    id: '8',
    title: 'User Accounts & Conduct',
    content: [
      'When you create an account, you agree to provide accurate, complete, and current information.',
      'You are responsible for maintaining the confidentiality of your account credentials and password.',
      'You agree to accept responsibility for all activities that occur under your account.',
      'You agree not to use the App for any unlawful or prohibited purposes including harassment, defamation, or illegal activities.',
      'You agree not to attempt to gain unauthorized access to the App or its systems.',
    ],
  },
  {
    id: '9',
    title: 'Order & Payment Terms',
    content: [
      'All orders are subject to acceptance and confirmation by Jagabans LA.',
      'We reserve the right to refuse any order.',
      'Prices are subject to change without notice.',
      'Payment must be received before order fulfillment unless other arrangements have been made.',
      'For disputes regarding charges, contact us within 30 days of the transaction.',
      'You agree to pay all charges incurred by use of your account at the prices in effect when such charges are incurred.',
    ],
  },
  {
    id: '10',
    title: 'Delivery & Cancellation',
    content: [
      'Delivery times are estimates. We are not responsible for delays caused by delivery partners or traffic conditions.',
      'Orders can be cancelled within 5 minutes of placement. Cancellation requests after this time require approval.',
      'For cancelled orders, refunds will be processed within 5-7 business days.',
      'We are not responsible for lost, stolen, or damaged items after delivery confirmation.',
      'Confirm your delivery address before completing your order.',
    ],
  },
  {
    id: '11',
    title: 'Rewards & Points Program',
    content: [
      'Points are awarded based on the purchase amount at the conversion rate specified in the App.',
      'Points can be redeemed for future purchases as specified in the rewards program details.',
      'Points have no cash value and cannot be transferred or sold.',
      'We reserve the right to modify or terminate the rewards program with 30 days notice.',
      'Fraudulent point acquisition will result in account termination without refund.',
      'Unused points expire after 24 months of account inactivity.',
    ],
  },
  {
    id: '12',
    title: 'Intellectual Property',
    content: [
      'The App and its content, features, and functionality are owned by Jagabans LA and are protected by international copyright, trademark, and other intellectual property laws.',
      'You may not reproduce, distribute, transmit, or prepare derivative works of the App without our prior written permission.',
      'All content, including text, graphics, logos, and images, is the property of Jagabans LA or its content suppliers.',
    ],
  },
  {
    id: '13',
    title: 'Limitation of Liability',
    content: [
      'To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages.',
      'Our total liability for any claim is limited to the amount you paid for your order (if any).',
      'Some jurisdictions do not allow limitation of liability, so this limitation may not apply to you.',
    ],
  },
  {
    id: '14',
    title: 'Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless Jagabans LA and its owners, operators, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:',
      '• Your violation of these terms',
      '• Your use of the App',
      '• Your violation of any law or third-party rights',
      '• Any content you provide or post',
    ],
  },
  {
    id: '15',
    title: 'Prohibited Activities',
    content: [
      'You agree not to:',
      '• Use the App for any illegal or unauthorized purpose',
      '• Violate any laws or regulations',
      '• Infringe on rights of others',
      '• Abuse or harm others',
      '• Attempt to gain unauthorized access',
      '• Disrupt the normal flow of the App',
      '• Transmit malware or harmful code',
      '• Engage in fraud or deception',
    ],
  },
  {
    id: '16',
    title: 'Termination',
    content: [
      'We reserve the right to terminate or suspend your account and access to the App at any time, for any reason, without notice or liability.',
      'Termination may occur for violations of these terms, illegal activity, or other conduct we determine inappropriate.',
      'Upon termination, your right to use the App ceases immediately.',
      'We may delete your account and associated data according to our privacy policy.',
    ],
  },
  {
    id: '17',
    title: 'Governing Law',
    content: [
      'These terms are governed by and construed in accordance with the laws of the State of California, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
      'If any provision is found to be invalid or unenforceable, that provision will be enforced to the maximum extent possible, and all other provisions will remain in effect.',
    ],
  },
  {
    id: '18',
    title: 'Contact & Disputes',
    content: [
      'For questions regarding these terms, contact us at: legal@jagabansla.com',
      'For billing disputes, contact us within 30 days of the transaction.',
      'We will attempt to resolve disputes in good faith.',
      'If resolution cannot be reached, disputes are subject to binding arbitration as specified by California law.',
    ],
  },
  {
    id: '19',
    title: 'Third-Party Services',
    content: [
      'The App integrates with third-party payment processors and delivery partners.',
      'We are not responsible for the services, policies, or practices of third-party providers.',
      'Use of third-party services is subject to their respective terms and conditions.',
      'We recommend reviewing third-party terms before using their services through our App.',
    ],
  },
  {
    id: '20',
    title: 'Changes to Terms',
    content: [
      'We may modify these terms at any time. Changes are effective immediately upon posting.',
      'Your continued use following changes indicates acceptance of the modified terms.',
      'We recommend reviewing these terms periodically for updates.',
      'Major changes will be announced via email notification or prominent notice in the App.',
    ],
  },
];

export default function TermsAndConditionsScreen() {
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
    const allIds = new Set(termsSections.map(s => s.id));
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
          Terms & Conditions
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
            name="doc.text.fill"
            size={40}
            color={currentColors.primary}
          />
          <Text style={[styles.infoTitle, { color: currentColors.textSecondary }]}>
            Terms of Service
          </Text>
          <Text style={[styles.infoSubtitle, { color: currentColors.textSecondary }]}>
            Please read these terms carefully before using our App.
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
        {termsSections.map((section, index) => {
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
