import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="monster/[id]" options={{ title: 'モンスター詳細' }} />
        <Stack.Screen name="egg/[id]" options={{ title: 'タマゴ' }} />
        <Stack.Screen name="battle/result" options={{ title: 'バトル結果' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
