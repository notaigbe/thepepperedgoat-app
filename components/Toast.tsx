import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { blackGoldLight } from "@/styles/commonStyles";

// ─── Semantic colours for toast types ────────────────────────────────
// These are intentionally NOT from blackGoldLight — they carry universal
// semantic meaning (green = good, red = bad, gold = neutral info).
const SUCCESS_GREEN = "#2E7D52";   // muted forest green — readable on dark
const ERROR_RED     = "#C0392B";   // warm red
const INFO_GOLD     = blackGoldLight.GOLD_BRIGHT;  // gold for info — on-brand

interface ToastProps {
  visible?: boolean;
  message?: string;
  duration?: number;
  onHide?: () => void;
  type?: 'success' | 'error' | 'info';
  currentColors?: any;
}

export default function Toast({
  visible = false,
  message = '',
  duration = 2000,
  onHide = () => {},
  type = 'success',
  currentColors = {},
}: ToastProps) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  const getIconName = () => {
    switch (type) {
      case 'success': return 'checkmark.circle.fill';
      case 'error':   return 'error';
      case 'info':    return 'info';
      default:        return 'checkmark.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return SUCCESS_GREEN;
      case 'error':   return ERROR_RED;
      case 'info':    return INFO_GOLD;
      default:        return SUCCESS_GREEN;
    }
  };

  // Left accent bar colour — thin strip on the left edge of the toast
  const getAccentColor = () => {
    switch (type) {
      case 'success': return SUCCESS_GREEN;
      case 'error':   return ERROR_RED;
      case 'info':    return INFO_GOLD;
      default:        return SUCCESS_GREEN;
    }
  };

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => { onHide(); });
  }, [fadeAnim, translateY, onHide]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => { hideToast(); }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, message, duration, fadeAnim, translateY, hideToast]);

  if (!visible && (fadeAnim as any)._value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      {/*
        Dark near-black toast — sits in the header's colour world
        (dark surface, white text) so it reads over both the light
        body content and the dark header without clashing with either.

        Structure:
          ┌──────────────────────────────────────────┐
          │ ▌ [icon]  Message text                   │
          └──────────────────────────────────────────┘
              ↑ 3px coloured left accent bar
      */}
      <View style={styles.toastOuter}>
        {/* Gold bloom overlay — subtle warmth top-right, same as header */}
        <LinearGradient
          colors={["rgba(212,168,58,0.14)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Left accent bar — type colour */}
        <View style={[styles.accentBar, { backgroundColor: getAccentColor() }]} />

        {/* Icon + message */}
        <View style={styles.inner}>
          <IconSymbol name={getIconName()} size={22} color={getIconColor()} />
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },

  // Outer card — dark near-black matching header world
  toastOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blackGoldLight.HEADER_MID,   // #111108 — warm near-black
    borderRadius: 16,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,       // gold hairline
    overflow: 'hidden',
    elevation: 10,
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },

  // 3px coloured left accent strip — quick visual type indicator
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    flexShrink: 0,
  },

  // Icon + text row
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    lineHeight: 20,
    color: blackGoldLight.INK_WHITE,   // #F5F5F0 — off-white on dark
    letterSpacing: 0.1,
  },
});