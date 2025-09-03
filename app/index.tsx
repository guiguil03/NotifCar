import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

export default function IndexScreen() {
  const { session, loading } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    if (!loading) {
      if (session) {
        // Utilisateur connecté, rediriger vers l'app
        console.log('User authenticated, redirecting to app');
        router.replace('/(tabs)');
      } else {
        // Utilisateur non connecté, rediriger vers l'authentification
        console.log('User not authenticated, redirecting to auth');
        router.replace('/auth');
      }
    }
  }, [session, loading]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.logoContainer}>
        <ThemedView style={[styles.logo, { backgroundColor: primaryColor }]}>
          <ThemedText style={styles.logoText}>N</ThemedText>
        </ThemedView>
        <ThemedText style={styles.appName}>Notifcar</ThemedText>
        <ThemedText style={styles.slogan}>Votre véhicule vous parle, écoutez-le</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
