
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { AppProvider } from "@/contexts/AppContext";
import { colors } from "@/styles/commonStyles";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="item-detail" 
            options={{ 
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Item Details',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.primary,
            }} 
          />
          <Stack.Screen 
            name="checkout" 
            options={{ 
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Checkout',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.primary,
            }} 
          />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
