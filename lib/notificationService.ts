import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FirebaseAnalyticsService } from './firebaseAnalytics';
import { FirebaseMessagingService } from './firebaseMessaging';
import { supabase } from './supabase';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static expoPushToken: string | null = null;
  private static fcmToken: string | null = null;

  // Demander les permissions de notification
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Les notifications push ne fonctionnent que sur un appareil physique');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  // Configurer les notifications push
  static async setupPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Configurer Firebase Messaging
      await this.setupFirebaseMessaging();

      // Obtenir le token push Expo
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'ac950a40-2d18-4756-955f-2b1d308b9d4b', // Project ID Expo
      });

      this.expoPushToken = token.data;
      console.log('Token push Expo:', this.expoPushToken);

      // Enregistrer le token dans la base de données
      await this.registerPushToken(this.expoPushToken);

      // Log de l'événement d'initialisation des notifications
      FirebaseAnalyticsService.logEvent('notifications_setup', {
        platform: Platform.OS,
        has_expo_token: !!this.expoPushToken,
        has_fcm_token: !!this.fcmToken
      });

      return this.expoPushToken;
    } catch (error) {
      console.error('Erreur configuration notifications:', error);
      FirebaseAnalyticsService.logAppError('notification_setup_failed', error?.toString());
      return null;
    }
  }

  // Configurer Firebase Messaging
  private static async setupFirebaseMessaging(): Promise<void> {
    try {
      // Configurer l'écoute des messages en premier plan
      FirebaseMessagingService.setupForegroundMessageListener();

      // Obtenir le token FCM
      const fcmToken = await FirebaseMessagingService.requestPermissionAndGetToken();
      if (fcmToken) {
        this.fcmToken = fcmToken;
        console.log('Token FCM configuré:', fcmToken);
      }
    } catch (error) {
      console.error('Erreur configuration Firebase Messaging:', error);
    }
  }

  // Enregistrer le token push dans la base de données
  private static async registerPushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erreur enregistrement token:', error);
      }
    } catch (error) {
      console.error('Erreur enregistrement token push:', error);
    }
  }

  // Envoyer une notification locale
  static async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Immédiat
      });
    } catch (error) {
      console.error('Erreur notification locale:', error);
    }
  }

  // Envoyer une notification push
  static async sendPushNotification(
    recipientToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const message = {
        to: recipientToken,
        sound: 'default',
        title,
        body,
        data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Erreur envoi notification: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur notification push:', error);
    }
  }

  // Configurer les gestionnaires de notifications
  static setupNotificationHandlers(): void {
    // Gestionnaire pour les notifications reçues
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
      
      // Log analytics pour notification reçue
      const notificationType = notification.request.content.data?.type || 'unknown';
      FirebaseAnalyticsService.logNotificationReceived(notificationType);
    });

    // Gestionnaire pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interaction notification:', response);
      const data = response.notification.request.content.data;
      
      // Log analytics pour notification ouverte
      const notificationType = data?.type || 'unknown';
      FirebaseAnalyticsService.logNotificationOpened(notificationType);
      
      // Navigation vers la conversation si c'est un message
      if (data?.conversationId) {
        // Ici tu peux ajouter la logique de navigation
        console.log('Navigation vers conversation:', data.conversationId);
        FirebaseAnalyticsService.logEvent('notification_navigation', {
          destination: 'conversation',
          conversation_id: data.conversationId
        });
      }
    });
  }

  // Nettoyer les tokens expirés
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_tokens')
        .delete()
        .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 jours

      if (error) {
        console.error('Erreur nettoyage tokens:', error);
      }
    } catch (error) {
      console.error('Erreur nettoyage tokens expirés:', error);
    }
  }

  // Obtenir le token push actuel
  static getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Obtenir le token FCM actuel
  static getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Envoyer une notification de nouveau message
  static async notifyNewMessage(
    recipientUserId: string,
    senderName: string,
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Récupérer le token du destinataire
      const { data: tokenData } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', recipientUserId)
        .single();

      if (!tokenData?.token) {
        console.log('Aucun token trouvé pour l\'utilisateur:', recipientUserId);
        return;
      }

      // Envoyer la notification push
      await this.sendPushNotification(
        tokenData.token,
        `Nouveau message de ${senderName}`,
        messageContent.length > 50 ? `${messageContent.substring(0, 50)}...` : messageContent,
        {
          conversationId,
          type: 'new_message',
          senderName,
        }
      );
    } catch (error) {
      console.error('Erreur notification nouveau message:', error);
    }
  }
}