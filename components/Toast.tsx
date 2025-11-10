
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { BlurView } from 'expo-blur';

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onHide: () => void;
  type?: 'success' | 'error' | 'info';
  currentColors: any;
}

export default function Toast({ 
  visible, 
  message, 
  duration = 2000, 
  onHide, 
  type = 'success',
  currentColors 
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      console.log('Toast showing:', message);
      // Fade in and slide down
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

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    console.log('Toast hiding');
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
    ]).start(() => {
      onHide();
    });
  };

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'error':
        return 'xmark.circle.fill';
      case 'info':
        return 'info.circle.fill';
      default:
        return 'checkmark.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return currentColors.primary;
      case 'error':
        return '#EF5350';
      case 'info':
        return currentColors.secondary;
      default:
        return currentColors.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={[styles.content, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]}>
            <IconSymbol name={getIconName()} size={24} color={getIconColor()} />
            <Text style={[styles.message, { color: currentColors.text }]} numberOfLines={2}>
              {message}
            </Text>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.content, styles.androidContent, { backgroundColor: currentColors.card }]}>
          <IconSymbol name={getIconName()} size={24} color={getIconColor()} />
          <Text style={[styles.message, { color: currentColors.text }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
      )}
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
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderRadius: 16,
  },
  androidContent: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
    opacity: 0.95,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
