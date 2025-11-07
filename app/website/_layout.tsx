
import { Stack } from 'expo-router';
import React from 'react';

export default function WebsiteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="about" />
      <Stack.Screen name="events" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}
