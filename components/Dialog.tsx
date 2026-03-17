import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform, Modal } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Black · Gold · Silver tokens ────────────────────────────────────
const GOLD         = "#B8922A";
const GOLD_BRIGHT  = "#D4A83A";
const GOLD_DIM     = "rgba(184,146,42,0.12)";
const SILVER       = "#C0C0C8";
const INK_WHITE    = "#F5F5F0";
const INK_SILVER   = "#A8A8B0";
const DIALOG_BG    = "#141410";   // near-black warm — slightly lighter than header
const DIALOG_CARD  = "#1C1C18";   // card surface
const BORDER_GOLD  = "rgba(184,146,42,0.22)";
const BORDER_DIM   = "rgba(184,146,42,0.12)";
const DESTRUCTIVE  = "#C0392B";
const CANCEL_COL   = INK_SILVER;

interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface DialogProps {
  visible?: boolean;
  title?: string;
  message?: string;
  buttons?: DialogButton[];
  onHide?: () => void;
  currentColors?: any;
}

export default function Dialog({
  visible = false,
  title = '',
  message = '',
  buttons = [],
  onHide = () => {},
  currentColors = {},
}: DialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const getButtonColor = (style?: string) => {
    switch (style) {
      case 'destructive': return DESTRUCTIVE;
      case 'cancel':      return CANCEL_COL;
      default:            return GOLD;       // default action uses gold
    }
  };

  const getButtonWeight = (style?: string): '400' | '600' | '700' => {
    switch (style) {
      case 'destructive': return '600';
      case 'cancel':      return '400';
      default:            return '700';      // primary action bold
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Outer glow border — gold hairline around the whole dialog */}
          <View style={styles.glowBorder}>
            <View style={styles.dialog}>

              {/* Radial gold bloom in the top area — mirrors WelcomeHeader treatment */}
              <LinearGradient
                colors={["rgba(212,168,58,0.14)", "rgba(184,146,42,0.04)", "transparent"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.radialBloom}
                pointerEvents="none"
              />

              {/* Title */}
              {!!title && (
                <View style={styles.titleRow}>
                  {/* Gold accent bar left of title */}
                  <View style={styles.titleAccent} />
                  <Text style={styles.title}>{title}</Text>
                </View>
              )}

              {/* Message */}
              {!!message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* Fading gold divider above buttons */}
              <LinearGradient
                colors={['transparent', BORDER_GOLD, BORDER_GOLD, 'transparent']}
                locations={[0, 0.2, 0.8, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.divider}
              />

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      index !== buttons.length - 1 && styles.buttonBorder,
                    ]}
                    android_ripple={{ color: GOLD_DIM }}
                    onPress={() => {
                      button.onPress();
                      onHide();
                    }}
                  >
                    {/* Active buttons get a very subtle gold tint on press */}
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: getButtonColor(button.style),
                          fontWeight: getButtonWeight(button.style),
                          fontFamily:
                            button.style === 'cancel'
                              ? 'LibertinusSans_400Regular'
                              : 'LibertinusSans_700Bold',
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',   // darker scrim — suits the dark dialog
  },
  dialogContainer: {
    width: '85%',
    maxWidth: 400,
    // Outer gold glow
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },

  // 1px gold border wrapping the card
  glowBorder: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_GOLD,
    overflow: 'hidden',
  },

  dialog: {
    backgroundColor: DIALOG_CARD,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },

  // Radial gold bloom — top-right, same technique as WelcomeHeader
  radialBloom: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none',
  } as any,

  // Title row: gold accent bar + text
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 26,
    marginBottom: 10,
    gap: 10,
    zIndex: 1,
  },
  titleAccent: {
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: GOLD,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'LibertinusSans_700Bold',
    color: INK_WHITE,
    letterSpacing: 0.2,
  },

  message: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    lineHeight: 21,
    color: INK_SILVER,
    paddingHorizontal: 24,
    paddingBottom: 22,
    zIndex: 1,
  },

  // Fading gold rule — same treatment as header divider
  divider: {
    height: 1,
    zIndex: 1,
  },

  buttonContainer: {
    overflow: 'hidden',
    zIndex: 1,
  },

  button: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: GOLD_DIM,
  },
  buttonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_DIM,
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});