import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '@/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'モンスター',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🐾" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gacha"
        options={{
          title: 'ガチャ',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dungeon"
        options={{
          title: 'ダンジョン',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: 'バトル',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚔️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
