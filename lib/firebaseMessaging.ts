import { getToken, MessagePayload, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import { messaging } from './firebase';
import { supabase } from './supabase';

// Interface pour les options de notification étendues
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: {
    action: string;
    title: string;
  }[];
}

export class FirebaseMessagingService {
  private static fcmToken: string | null = null;

  // Vérifier si FCM est disponible
  private static isMessagingAvailable(): boolean {
    return Platform.OS === 'web' && messaging !== null;
  }

  // Demander les permissions et obtenir le token FCM
  static async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (!this.isMessagingAvailable()) {
        console.log('Firebase Messaging n\'est disponible que sur web pour le moment');
        return null;
      }

      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Permission de notification refusée');
        return null;
      }

      // Obtenir le token FCM
      const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || 'BKt_HLwLyC3hOAousQpIR4SE1ji49541qkR4RwbGBQ56CX1mAxGpJkijmXuoBBHdpcCAFm9z38FC4VS4ekEeSBc';
      const token = await getToken(messaging!, {
        vapidKey: vapidKey // Générez une clé VAPID dans Firebase Console > Cloud Messaging
      });

      if (token) {
        this.fcmToken = token;
        console.log('Token FCM obtenu:', token);
        
        // Enregistrer le token dans la base de données
        await this.saveFCMToken(token);
        
        return token;
      } else {
        console.log('Aucun token FCM disponible');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token FCM:', error);
      return null;
    }
  }

  // Sauvegarder le token FCM dans Supabase
  private static async saveFCMToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erreur sauvegarde token FCM:', error);
      } else {
        console.log('Token FCM sauvegardé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token FCM:', error);
    }
  }

  // Configurer l'écoute des messages en premier plan
  static setupForegroundMessageListener(): void {
    if (!this.isMessagingAvailable()) {
      console.log('Firebase Messaging n\'est pas disponible');
      return;
    }

    onMessage(messaging!, (payload: MessagePayload) => {
      console.log('Message reçu en premier plan:', payload);
      
      // Afficher une notification personnalisée
      this.showNotification(payload);
    });
  }

  // Afficher une notification personnalisée
  private static showNotification(payload: MessagePayload): void {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        const notificationOptions: ExtendedNotificationOptions = {
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/icon-192x192.png',
          badge: '/badge-icon.png',
          data: payload.data,
          actions: [
            {
              action: 'open',
              title: 'Ouvrir'
            },
            {
              action: 'close',
              title: 'Fermer'
            }
          ]
        };

        registration.showNotification(
          payload.notification?.title || 'Nouvelle notification',
          notificationOptions
        );
      });
    }
  }

  // Obtenir le token FCM actuel
  static getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Supprimer le token FCM
  static async deleteFCMToken(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Erreur suppression token FCM:', error);
      } else {
        this.fcmToken = null;
        console.log('Token FCM supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du token FCM:', error);
    }
  }

  // Nettoyer les tokens expirés
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 jours

      if (error) {
        console.error('Erreur nettoyage tokens FCM:', error);
      } else {
        console.log('Tokens FCM expirés nettoyés avec succès');
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des tokens FCM expirés:', error);
    }
  }
}
