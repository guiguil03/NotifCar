import { useAuth } from '@/contexts/AuthContext';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { FirebaseAnalyticsService } from '@/lib/firebaseAnalytics';
import { OfflineStorage } from '@/lib/offlineStorage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface PersistenceManagerProps {
  children: React.ReactNode;
}

export const PersistenceManager: React.FC<PersistenceManagerProps> = ({ children }) => {
  const { loading, isInitialized, user } = useAuth();
  const { networkState, syncPendingActions } = useNetworkSync();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializePersistence = async () => {
      try {
        // Nettoyer les données expirées
        await OfflineStorage.cleanupExpired();
        
        // Charger les préférences utilisateur
        if (user) {
          const preferences = await OfflineStorage.getUserPreferences();
          if (preferences) {
            console.log('Préférences utilisateur chargées depuis le cache');
          }
        }

        // Synchroniser si en ligne
        if (networkState.isOnline && user) {
          await syncPendingActions();
        }

        // Log analytics pour session persistante
        if (user) {
          FirebaseAnalyticsService.logEvent('app_session_restored', {
            user_id: user.id,
            is_online: networkState.isOnline,
            has_pending_actions: false, // TODO: récupérer le vrai nombre
          });
        }

        setIsReady(true);
      } catch (error) {
        console.error('Erreur initialisation persistance:', error);
        setIsReady(true); // Continue même en cas d'erreur
      }
    };

    if (isInitialized) {
      initializePersistence();
    }
  }, [isInitialized, user, networkState.isOnline]);

  // Afficher un loading si pas encore prêt
  if (loading || !isInitialized || !isReady) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <ActivityIndicator size="large" color="#2633E1" />
        <Text style={{
          marginTop: 20,
          fontSize: 16,
          color: '#666',
          textAlign: 'center'
        }}>
          {loading ? 'Chargement...' : 'Initialisation...'}
        </Text>
        
        {!networkState.isOnline && (
          <Text style={{
            marginTop: 10,
            fontSize: 14,
            color: '#ff6b6b',
            textAlign: 'center'
          }}>
            📶 Mode hors ligne
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
};
