import { StyleSheet } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// ─── The Peppered Goat — Black · Gold · Silver ────────────────────────
// Primary palette: near-black base / burnished gold accent / cool silver
// Light body (warm parchment) / Dark header (near-black with gold blooms)

// ─── Raw tokens — imported by screens that need direct access ─────────
export const blackGoldLight = {
  GOLD:          "#B8922A",                    // burnished gold — legible on light bg
  GOLD_BRIGHT:   "#D4A83A",                    // highlight / gradient top stop
  GOLD_DIM:      "rgba(184,146,42,0.12)",      // tinted fill for active states
  SILVER:        "#C0C0C8",                    // cool silver — header + muted accents
  SILVER_DIM:    "rgba(192,192,200,0.18)",     // silver pill backgrounds
  SILVER_SOFT:   "rgba(192,192,200,0.5)",      // silver borders mid-opacity

  // Header — near-black dark background
  HEADER_TOP:    "#0A0A0A",
  HEADER_MID:    "#111108",
  HEADER_BOT:    "#0D0D09",

  // Body — warm parchment
  BODY_BG:       "#F8F6F1",
  CARD_BG:       "#FFFFFF",
  CARD_FOOTER:   "#FAFAF7",

  // Text — dark ink on light surface
  INK:           "#1A1612",
  INK_MID:       "#6B6055",
  INK_SOFT:      "rgba(26,22,18,0.72)",
  // Header-only text
  INK_WHITE:     "#F5F5F0",
  INK_SILVER:    "#A8A8B0",

  BORDER_GOLD:   "rgba(184,146,42,0.22)",
  BORDER_SILVER: "rgba(192,192,200,0.15)",
  BORDER_LIGHT:  "rgba(26,22,18,0.08)",
};

// ─── Shared base — all schemes inherit these tokens ───────────────────
const base = {
  // ── Core ─────────────────────────────────────────────────────────────
  // primary / secondary / accent map to gold so every component that
  // calls currentColors.primary automatically picks up the brand accent.
  text:             blackGoldLight.INK,
  textSecondary:    blackGoldLight.INK_MID,
  primary:          blackGoldLight.GOLD,          // gold — CTAs, active states
  secondary:        blackGoldLight.INK,           // dark ink — secondary actions
  accent:           blackGoldLight.GOLD_BRIGHT,   // bright gold — highlights
  highlight:        blackGoldLight.GOLD_DIM,      // subtle gold tint
  card:             blackGoldLight.CARD_BG,
  border:           blackGoldLight.BORDER_LIGHT,

  // ── Header ────────────────────────────────────────────────────────────
  headerBackground: blackGoldLight.HEADER_TOP,
  headerText:       blackGoldLight.INK_WHITE,
  headerSubtext:    blackGoldLight.INK_SILVER,
  headerBorder:     "rgba(184,146,42,0.2)",       // gold hairline

  // ── Gradient fallbacks ────────────────────────────────────────────────
  // Body — flat parchment (no body gradient needed)
  gradientStart:    blackGoldLight.BODY_BG,
  gradientMid:      blackGoldLight.BODY_BG,
  gradientEnd:      blackGoldLight.BODY_BG,

  // Header — near-black bloom
  headerGradientStart: blackGoldLight.HEADER_TOP,
  headerGradientEnd:   blackGoldLight.HEADER_MID,

  // Card — white to faintly warm footer
  cardGradientStart: blackGoldLight.CARD_BG,
  cardGradientEnd:   blackGoldLight.CARD_FOOTER,
};

// ─── Color scheme variants ────────────────────────────────────────────
const colorSchemes = {

  // ── default — standard warm parchment ────────────────────────────────
  default: {
    light: {
      ...base,
      background: blackGoldLight.BODY_BG,         // #F8F6F1
    },
    dark: {
      ...base,
      background: blackGoldLight.BODY_BG,
    },
  },

  // ── warm — deeper parchment, border leans into gold ──────────────────
  warm: {
    light: {
      ...base,
      background:      "#F5F0E8",
      gradientStart:   "#F5F0E8",
      gradientMid:     "#F5F0E8",
      gradientEnd:     "#F5F0E8",
      cardGradientEnd: "#F7F3EC",
      border:          "rgba(184,146,42,0.16)",
    },
    dark: {
      ...base,
      background:      "#F5F0E8",
      gradientStart:   "#F5F0E8",
      gradientMid:     "#F5F0E8",
      gradientEnd:     "#F5F0E8",
      cardGradientEnd: "#F7F3EC",
      border:          "rgba(184,146,42,0.16)",
    },
  },

  // ── cool — grey-white, silver accents breathe more ───────────────────
  cool: {
    light: {
      ...base,
      background:      "#F4F3F0",
      gradientStart:   "#F4F3F0",
      gradientMid:     "#F4F3F0",
      gradientEnd:     "#F4F3F0",
      cardGradientEnd: "#F9F8F6",
      border:          blackGoldLight.BORDER_SILVER,
      accent:          blackGoldLight.SILVER,
    },
    dark: {
      ...base,
      background:      "#F4F3F0",
      gradientStart:   "#F4F3F0",
      gradientMid:     "#F4F3F0",
      gradientEnd:     "#F4F3F0",
      cardGradientEnd: "#F9F8F6",
      border:          blackGoldLight.BORDER_SILVER,
      accent:          blackGoldLight.SILVER,
    },
  },

  // ── vibrant — richer gold, stronger borders ───────────────────────────
  vibrant: {
    light: {
      ...base,
      background: blackGoldLight.BODY_BG,
      primary:    blackGoldLight.GOLD_BRIGHT,
      accent:     blackGoldLight.GOLD_BRIGHT,
      highlight:  "rgba(212,168,58,0.18)",
      border:     "rgba(184,146,42,0.28)",
    },
    dark: {
      ...base,
      background: blackGoldLight.BODY_BG,
      primary:    blackGoldLight.GOLD_BRIGHT,
      accent:     blackGoldLight.GOLD_BRIGHT,
      highlight:  "rgba(212,168,58,0.18)",
      border:     "rgba(184,146,42,0.28)",
    },
  },

  // ── minimal — silver-led, gold pulled back ────────────────────────────
  minimal: {
    light: {
      ...base,
      background: "#F6F6F4",
      primary:    blackGoldLight.INK,              // ink replaces gold on minimal
      accent:     blackGoldLight.SILVER,
      highlight:  blackGoldLight.SILVER_DIM,
      border:     "rgba(26,22,18,0.06)",
      gradientStart: "#F6F6F4",
      gradientMid:   "#F6F6F4",
      gradientEnd:   "#F6F6F4",
    },
    dark: {
      ...base,
      background: "#F6F6F4",
      primary:    blackGoldLight.INK,
      accent:     blackGoldLight.SILVER,
      highlight:  blackGoldLight.SILVER_DIM,
      border:     "rgba(26,22,18,0.06)",
      gradientStart: "#F6F6F4",
      gradientMid:   "#F6F6F4",
      gradientEnd:   "#F6F6F4",
    },
  },
};

export const getColors = (
  mode: ThemeMode,
  colorScheme: ColorScheme,
  systemColorScheme: 'light' | 'dark' | null
) => {
  const effectiveMode =
    mode === 'auto' ? (systemColorScheme || 'light') : mode;
  return colorSchemes[colorScheme][effectiveMode];
};

// Default export — used directly by components that import `colors`
export const colors = colorSchemes.default.light;

// ─── Button styles ────────────────────────────────────────────────────
export const buttonStyles = StyleSheet.create({
  primaryButton: {
    // Solid gold fallback; wrap in LinearGradient in component for the
    // GOLD_BRIGHT → GOLD metallic sheen used across the HomeScreen.
    backgroundColor: blackGoldLight.GOLD,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 50,
    elevation: 3,
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: blackGoldLight.CARD_BG,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 50,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});

// ─── Common layout styles ─────────────────────────────────────────────
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
    fontFamily: 'LibertinusSans_700Bold',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    fontFamily: 'LibertinusSans_400Regular',
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
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: blackGoldLight.GOLD,
  },
});