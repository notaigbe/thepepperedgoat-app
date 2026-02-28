import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// The Peppered Goat Website-inspired color scheme - Nigerian Spice & Fire
// Sourced from thepepperedgoat.com: deep charcoal backgrounds, fiery amber-orange accents,
// warm cream text, and rich earthy tones evoking Nigerian spices and pepper.
const colorSchemes = {
  default: {
    light: {
      background: '#0E0C0A', // Near-black charcoal (site background)
      text: '#F5F0E8', // Warm cream/off-white (site text)
      textSecondary: '#C4A882', // Warm tan for descriptions
      primary: '#E07B2A', // Fiery amber-orange (primary CTA/accent)
      secondary: '#B84C1E', // Deep red-orange (secondary accent)
      accent: '#F0A500', // Bright amber highlight
      card: '#1A1612', // Dark charcoal card surface
      highlight: '#F5631A', // Vivid pepper-red highlight
      border: '#E07B2A', // Amber border
      // Gradient colors
      gradientStart: '#0E0C0A',
      gradientMid: '#1A1612',
      gradientEnd: '#2E1E10',
      headerGradientStart: '#0E0C0A',
      headerGradientEnd: '#2A1508',
      cardGradientStart: '#1A1612',
      cardGradientEnd: '#2E1E10',
    },
    dark: {
      background: '#0E0C0A', // Near-black charcoal (site background)
      text: '#F5F0E8', // Warm cream/off-white (site text)
      textSecondary: '#C4A882', // Warm tan for descriptions
      primary: '#E07B2A', // Fiery amber-orange (primary CTA/accent)
      secondary: '#B84C1E', // Deep red-orange (secondary accent)
      accent: '#F0A500', // Bright amber highlight
      card: '#1A1612', // Dark charcoal card surface
      highlight: '#F5631A', // Vivid pepper-red highlight
      border: '#E07B2A', // Amber border
      // Gradient colors
      gradientStart: '#0E0C0A',
      gradientMid: '#1A1612',
      gradientEnd: '#2E1E10',
      headerGradientStart: '#0E0C0A',
      headerGradientEnd: '#2A1508',
      cardGradientStart: '#1A1612',
      cardGradientEnd: '#2E1E10',
    },
  },
  warm: {
    light: {
      background: '#130D08',
      text: '#F5F0E8',
      textSecondary: '#D4B896',
      primary: '#E8832E',
      secondary: '#C25520',
      accent: '#F5A623',
      card: '#1E1510',
      highlight: '#FF6B2B',
      border: '#E8832E',
      gradientStart: '#130D08',
      gradientMid: '#1E1510',
      gradientEnd: '#332010',
      headerGradientStart: '#130D08',
      headerGradientEnd: '#2E180A',
      cardGradientStart: '#1E1510',
      cardGradientEnd: '#332010',
    },
    dark: {
      background: '#130D08',
      text: '#F5F0E8',
      textSecondary: '#D4B896',
      primary: '#E8832E',
      secondary: '#C25520',
      accent: '#F5A623',
      card: '#1E1510',
      highlight: '#FF6B2B',
      border: '#E8832E',
      gradientStart: '#130D08',
      gradientMid: '#1E1510',
      gradientEnd: '#332010',
      headerGradientStart: '#130D08',
      headerGradientEnd: '#2E180A',
      cardGradientStart: '#1E1510',
      cardGradientEnd: '#332010',
    },
  },
  cool: {
    light: {
      background: '#0A0C0E',
      text: '#F0EDE8',
      textSecondary: '#A89880',
      primary: '#D4732A',
      secondary: '#8B3A18',
      accent: '#E09030',
      card: '#141618',
      highlight: '#E05820',
      border: '#D4732A',
      gradientStart: '#0A0C0E',
      gradientMid: '#141618',
      gradientEnd: '#221A14',
      headerGradientStart: '#0A0C0E',
      headerGradientEnd: '#1E1410',
      cardGradientStart: '#141618',
      cardGradientEnd: '#221A14',
    },
    dark: {
      background: '#0A0C0E',
      text: '#F0EDE8',
      textSecondary: '#A89880',
      primary: '#D4732A',
      secondary: '#8B3A18',
      accent: '#E09030',
      card: '#141618',
      highlight: '#E05820',
      border: '#D4732A',
      gradientStart: '#0A0C0E',
      gradientMid: '#141618',
      gradientEnd: '#221A14',
      headerGradientStart: '#0A0C0E',
      headerGradientEnd: '#1E1410',
      cardGradientStart: '#141618',
      cardGradientEnd: '#221A14',
    },
  },
  vibrant: {
    light: {
      background: '#0C0A08',
      text: '#FFF8EE',
      textSecondary: '#D4AA78',
      primary: '#FF7A1A',
      secondary: '#CC3D10',
      accent: '#FFB020',
      card: '#181410',
      highlight: '#FF4500',
      border: '#FF7A1A',
      gradientStart: '#0C0A08',
      gradientMid: '#181410',
      gradientEnd: '#301808',
      headerGradientStart: '#0C0A08',
      headerGradientEnd: '#281208',
      cardGradientStart: '#181410',
      cardGradientEnd: '#301808',
    },
    dark: {
      background: '#0C0A08',
      text: '#FFF8EE',
      textSecondary: '#D4AA78',
      primary: '#FF7A1A',
      secondary: '#CC3D10',
      accent: '#FFB020',
      card: '#181410',
      highlight: '#FF4500',
      border: '#FF7A1A',
      gradientStart: '#0C0A08',
      gradientMid: '#181410',
      gradientEnd: '#301808',
      headerGradientStart: '#0C0A08',
      headerGradientEnd: '#281208',
      cardGradientStart: '#181410',
      cardGradientEnd: '#301808',
    },
  },
  minimal: {
    light: {
      background: '#111010',
      text: '#EDE8E0',
      textSecondary: '#AA9070',
      primary: '#C86820',
      secondary: '#8C3815',
      accent: '#D48818',
      card: '#1C1A18',
      highlight: '#D85010',
      border: '#C86820',
      gradientStart: '#111010',
      gradientMid: '#1C1A18',
      gradientEnd: '#281E14',
      headerGradientStart: '#111010',
      headerGradientEnd: '#221810',
      cardGradientStart: '#1C1A18',
      cardGradientEnd: '#281E14',
    },
    dark: {
      background: '#111010',
      text: '#EDE8E0',
      textSecondary: '#AA9070',
      primary: '#C86820',
      secondary: '#8C3815',
      accent: '#D48818',
      card: '#1C1A18',
      highlight: '#D85010',
      border: '#C86820',
      gradientStart: '#111010',
      gradientMid: '#1C1A18',
      gradientEnd: '#281E14',
      headerGradientStart: '#111010',
      headerGradientEnd: '#221810',
      cardGradientStart: '#1C1A18',
      cardGradientEnd: '#281E14',
    },
  },
};

export const getColors = (mode: ThemeMode, colorScheme: ColorScheme, systemColorScheme: 'light' | 'dark' | null) => {
  const effectiveMode = mode === 'auto' ? (systemColorScheme || 'dark') : mode;
  return colorSchemes[colorScheme][effectiveMode];
};

// Default colors for backward compatibility
export const colors = colorSchemes.default.dark;

export const buttonStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0px 8px 24px rgba(224, 123, 42, 0.40)',
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0px 8px 24px rgba(184, 76, 30, 0.35)',
    elevation: 8,
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 0,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 8px 24px rgba(224, 123, 42, 0.20)',
    elevation: 8,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});