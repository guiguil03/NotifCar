import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NotificationService } from '../lib/notificationService';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Configurer les notifications push
      const token = await NotificationService.setupPushNotifications();
      
      if (token) {
        console.log('Notifications configurées avec succès');
      }

      // Configurer les gestionnaires
      NotificationService.setupNotificationHandlers();

      // Nettoyer les tokens expirés
      await NotificationService.cleanupExpiredTokens();

      setIsInitialized(true);
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
      setIsInitialized(true); // Continuer même en cas d'erreur
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Configuration des notifications...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});