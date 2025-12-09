
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { ThemeMode, ColorScheme } from '@/types';
import { themeService } from '@/services/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { themeSettings, updateThemeMode, updateColorScheme, currentColors } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const themeModes: { value: ThemeMode; label: string; icon: string; description: string }[] = [
    { value: 'light', label: 'Light', icon: 'sun.max.fill', description: 'Bright and clean interface' },
    { value: 'dark', label: 'Dark', icon: 'moon.fill', description: 'Easy on the eyes at night' },
    { value: 'auto', label: 'Auto', icon: 'auto-mode', description: 'Follows system settings' },
  ];

  const colorSchemes: { value: ColorScheme; label: string; description: string; colors: string[] }[] = [
    { 
      value: 'default', 
      label: 'Default', 
      description: 'Warm orange tones inspired by West African cuisine',
      colors: ['#E64A19', '#F57C00', '#FFB74D']
    },
    { 
      value: 'warm', 
      label: 'Warm Sunset', 
      description: 'Rich earthy tones with deep oranges',
      colors: ['#D84315', '#F4511E', '#FF8A65']
    },
    { 
      value: 'cool', 
      label: 'Cool Ocean', 
      description: 'Calming blues and aqua tones',
      colors: ['#1976D2', '#42A5F5', '#64B5F6']
    },
    { 
      value: 'vibrant', 
      label: 'Vibrant Purple', 
      description: 'Bold and energetic purple hues',
      colors: ['#7B1FA2', '#AB47BC', '#CE93D8']
    },
    { 
      value: 'minimal', 
      label: 'Minimal Gray', 
      description: 'Clean and sophisticated grayscale',
      colors: ['#424242', '#616161', '#9E9E9E']
    },
  ];

  const handleThemeModeChange = async (mode: ThemeMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // AppContext handles both local update and Supabase save
    await updateThemeMode(mode);
  };

  const handleColorSchemeChange = async (scheme: ColorScheme) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // AppContext handles both local update and Supabase save
    await updateColorScheme(scheme);
  };

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Pressable
              style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
            >
              <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Theme Settings</Text>
            {isSaving ? (
              <ActivityIndicator size="small" color={currentColors.secondary} />
            ) : (
              <View style={{ width: 40 }} />
            )}
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Theme Mode Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Theme Mode</Text>
              <Text style={[styles.sectionDescription, { color: currentColors.textSecondary }]}>
                Choose how the app looks. Auto mode follows your device settings.
              </Text>
              {themeModes.map((mode) => (
                <Pressable
                  key={mode.value}
                  onPress={() => handleThemeModeChange(mode.value)}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.optionCard,
                      { borderColor: themeSettings.mode === mode.value ? currentColors.secondary : currentColors.border },
                    ]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
                      <IconSymbol 
                        name={mode.icon} 
                        size={24} 
                        color={themeSettings.mode === mode.value ? currentColors.secondary : currentColors.textSecondary} 
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: currentColors.text }]}>{mode.label}</Text>
                      <Text style={[styles.optionDescription, { color: currentColors.textSecondary }]}>{mode.description}</Text>
                    </View>
                    {themeSettings.mode === mode.value && (
                      <LinearGradient
                        colors={[currentColors.secondary, currentColors.highlight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.checkIcon}
                      >
                        <IconSymbol name="checkmark" size={16} color={currentColors.background} />
                      </LinearGradient>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
            </View>

            {/* Color Scheme Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Color Scheme</Text>
              <Text style={[styles.sectionDescription, { color: currentColors.textSecondary }]}>
                Select a color palette that matches your style.
              </Text>
              {colorSchemes.map((scheme) => (
                <Pressable
                  key={scheme.value}
                  onPress={() => handleColorSchemeChange(scheme.value)}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.colorSchemeCard,
                      { borderColor: themeSettings.colorScheme === scheme.value ? currentColors.secondary : currentColors.border },
                    ]}
                  >
                    <View style={styles.colorSchemeHeader}>
                      <View style={styles.colorSchemeInfo}>
                        <Text style={[styles.colorSchemeLabel, { color: currentColors.text }]}>{scheme.label}</Text>
                        <Text style={[styles.colorSchemeDescription, { color: currentColors.textSecondary }]}>{scheme.description}</Text>
                      </View>
                      <View style={styles.colorPreview}>
                        {scheme.colors.map((color, index) => (
                          <View
                            key={index}
                            style={[styles.colorCircle, { backgroundColor: color, borderColor: currentColors.border }]}
                          />
                        ))}
                      </View>
                    </View>
                    {themeSettings.colorScheme === scheme.value && (
                      <View style={[styles.previewSection, { backgroundColor: currentColors.background }]}>
                        <Text style={[styles.previewTitle, { color: currentColors.text }]}>Preview</Text>
                        <View style={styles.previewRow}>
                          <LinearGradient
                            colors={[currentColors.secondary, currentColors.highlight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.previewChip}
                          >
                            <Text style={[styles.previewChipText, { color: currentColors.background }]}>Primary</Text>
                          </LinearGradient>
                          <LinearGradient
                            colors={[currentColors.primary, currentColors.highlight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.previewChip}
                          >
                            <Text style={[styles.previewChipText, { color: currentColors.background }]}>Secondary</Text>
                          </LinearGradient>
                          <View style={[styles.previewChip, { backgroundColor: currentColors.accent }]}>
                            <Text style={[styles.previewChipText, { color: currentColors.background }]}>Accent</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
    borderBottomWidth: 2,
    boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    flex: 1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  colorSchemeCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  colorSchemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  colorSchemeInfo: {
    flex: 1,
  },
  colorSchemeLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  colorSchemeDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 0,
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  previewSection: {
    marginTop: 8,
    padding: 16,
    borderRadius: 0,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  previewChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  previewChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
