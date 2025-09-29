import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface NetworkState {
  isOnline: boolean;
  isConnecting: boolean;
  lastSync: Date | null;
}

interface PendingAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export const useNetworkSync = () => {
  const { session, refreshSession } = useAuth();
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isConnecting: false,
    lastSync: null,
  });
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  // Vérifier l'état du réseau
  const checkOnlineStatus = async () => {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }
    
    // Pour mobile, on peut utiliser @react-native-netinfo
    // Pour l'instant, on assume que c'est en ligne
    try {
      const response = await fetch('https://lifmyjdygwakmimjgkef.supabase.co/rest/v1/', {
        method: 'HEAD',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Sauvegarder une action en attente
  const queueAction = async (type: string, data: any) => {
    const action: PendingAction = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const updatedActions = [...pendingActions, action];
    setPendingActions(updatedActions);

    // Sauvegarder dans le stockage local
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('pending_actions', JSON.stringify(updatedActions));
      } else {
        await AsyncStorage.setItem('pending_actions', JSON.stringify(updatedActions));
      }
    } catch (error) {
      console.error('Erreur sauvegarde action en attente:', error);
    }
  };

  // Charger les actions en attente
  const loadPendingActions = async () => {
    try {
      const actions = Platform.OS === 'web'
        ? localStorage.getItem('pending_actions')
        : await AsyncStorage.getItem('pending_actions');
      
      if (actions) {
        const parsed = JSON.parse(actions);
        setPendingActions(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erreur chargement actions en attente:', error);
    }
    return [];
  };

  // Synchroniser les actions en attente
  const syncPendingActions = async () => {
    if (!networkState.isOnline || !session) return;

    setNetworkState(prev => ({ ...prev, isConnecting: true }));

    const actionsToSync = [...pendingActions];
    const failedActions: PendingAction[] = [];

    for (const action of actionsToSync) {
      try {
        // Ici vous pouvez implémenter la logique spécifique pour chaque type d'action
        console.log('Synchronisation action:', action.type, action.data);
        
        // Exemple pour différents types d'actions
        switch (action.type) {
          case 'create_signalization':
            // Logique pour créer une signalisation
            break;
          case 'update_profile':
            // Logique pour mettre à jour le profil
            break;
          case 'send_message':
            // Logique pour envoyer un message
            break;
          default:
            console.warn('Type d\'action non géré:', action.type);
        }
        
        // Si l'action réussit, ne pas l'ajouter aux actions échouées
      } catch (error) {
        console.error('Erreur synchronisation action:', error);
        
        // Incrémenter le compteur de retry
        action.retryCount += 1;
        
        // Si moins de 3 tentatives, garder l'action
        if (action.retryCount < 3) {
          failedActions.push(action);
        }
      }
    }

    // Mettre à jour les actions en attente
    setPendingActions(failedActions);
    
    // Sauvegarder
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('pending_actions', JSON.stringify(failedActions));
      } else {
        await AsyncStorage.setItem('pending_actions', JSON.stringify(failedActions));
      }
    } catch (error) {
      console.error('Erreur sauvegarde actions échouées:', error);
    }

    setNetworkState(prev => ({
      ...prev,
      isConnecting: false,
      lastSync: new Date(),
    }));
  };

  // Rafraîchir la session si nécessaire
  const refreshSessionIfNeeded = async () => {
    if (!session) return;

    const now = Date.now();
    const sessionExp = session.expires_at ? session.expires_at * 1000 : 0;
    
    // Rafraîchir si la session expire dans moins de 5 minutes
    if (sessionExp - now < 5 * 60 * 1000) {
      try {
        await refreshSession();
        console.log('Session rafraîchie automatiquement');
      } catch (error) {
        console.error('Erreur rafraîchissement session automatique:', error);
      }
    }
  };

  // Effet pour surveiller l'état du réseau
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateNetworkState = async () => {
      const isOnline = await checkOnlineStatus();
      setNetworkState(prev => ({ ...prev, isOnline }));

      if (isOnline && pendingActions.length > 0) {
        await syncPendingActions();
      }

      // Rafraîchir la session si nécessaire
      await refreshSessionIfNeeded();
    };

    // Vérifier immédiatement
    updateNetworkState();

    // Puis vérifier toutes les 30 secondes
    interval = setInterval(updateNetworkState, 30000);

    // Écouter les changements de réseau sur web
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setNetworkState(prev => ({ ...prev, isOnline: true }));
        syncPendingActions();
      };
      
      const handleOffline = () => {
        setNetworkState(prev => ({ ...prev, isOnline: false }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => clearInterval(interval);
  }, [pendingActions, session]);

  // Charger les actions en attente au montage
  useEffect(() => {
    loadPendingActions();
  }, []);

  return {
    networkState,
    pendingActions,
    queueAction,
    syncPendingActions,
    refreshSessionIfNeeded,
  };
};
