import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import AuthGuard from '@/components/AuthGuard';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF', // Blanc pour l'onglet actif
          tabBarInactiveTintColor: 'rgba(255,255,255,0.6)', // Blanc 60% pour inactifs
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
              backgroundColor: 'rgba(139, 92, 246, 0.95)', // Violet avec transparence
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0.3,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: -5 },
              shadowColor: Colors[colorScheme ?? 'light'].primary,
              height: 90,
              paddingBottom: 30,
              paddingTop: 10,
            },
            default: {
              backgroundColor: Colors[colorScheme ?? 'light'].primary,
              borderTopWidth: 1,
              borderTopColor: Colors[colorScheme ?? 'light'].primaryDark,
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode.viewfinder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Véhicules',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="car.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <IconSymbol size={28} name="bell.fill" color={color} />
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: Colors[colorScheme ?? 'light'].alert,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    shadowColor: Colors[colorScheme ?? 'light'].alert,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <View style={{ width: 6, height: 6, backgroundColor: 'white', borderRadius: 3 }} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
    </AuthGuard>
  );
}
