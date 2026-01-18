import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Controle',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name='remote-desktop' size={28} color={color}/>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Informações',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name='monitor' size={28} color={color}/>,
        }}
      />
    </Tabs>
  );
}
