
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Menu',
    },
    {
      name: 'cart',
      route: '/(tabs)/cart',
      icon: 'cart.fill',
      label: 'Cart',
    },
    {
      name: 'enquiry',
      route: '/(tabs)/enquiry',
      icon: 'bubble.left.and.bubble.right',
      label: 'Enquiry',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
        // detachInactiveScreens={false}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="enquiry" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
