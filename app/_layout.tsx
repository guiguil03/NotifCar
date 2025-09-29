import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { FirebaseInitializer } from '@/components/FirebaseInitializer';
import { NotificationProvider } from '@/components/NotificationProvider';
import { PersistenceManager } from '@/components/PersistenceManager';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <PersistenceManager>
        <FirebaseInitializer>
          <ChatProvider>
            <NotificationProvider>
              <GradientBackground variant="primary" style={{ flex: 1 }}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </GradientBackground>
            </NotificationProvider>
          </ChatProvider>
        </FirebaseInitializer>
      </PersistenceManager>
    </AuthProvider>
  );
}
