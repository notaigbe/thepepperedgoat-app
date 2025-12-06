
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function CheckoutWebScreen() {
  const router = useRouter();
  const { currentColors, setTabBarVisible } = useApp();

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentColors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: currentColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      backgroundColor: currentColors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.card,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron-left" size={24} color={currentColors.primary} />
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconSymbol name="phone-iphone" size={40} color={currentColors.primary} />
          </View>
          
          <Text style={styles.title}>Mobile App Required</Text>
          
          <Text style={styles.message}>
            Checkout is only available on the mobile app. Please download the Jagabans LA app on your iOS or Android device to place orders.
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
