import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { FCMDirectService } from './fcmDirectService';
import { FirebaseAnalyticsService } from './firebaseAnalytics';
import { supabase } from './supabase';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        FirebaseAnalyticsService.logEvent('notification_permission_denied', {
          platform: Platform.OS,
          status: finalStatus
        });
        
        // Proposer à l'utilisateur d'aller dans les paramètres
        await this.showPermissionDeniedAlert();
        return false;
      }

      FirebaseAnalyticsService.logEvent('notification_permission_granted', {
        platform: Platform.OS
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      FirebaseAnalyticsService.logAppError('notification_permission_error', error?.toString());
      return false;
    }
  }

  // Configurer les notifications push
  static async setupPushNotifications(): Promise<string | null> {
    try {
      console.log('🚀 === CONFIGURATION NOTIFICATIONS - DÉBUT ===');
      
      // Diagnostic de configuration
      this.logConfigurationDiagnostic();

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Configurer Firebase Messaging
      await this.setupFirebaseMessaging();

      // Obtenir le token push Expo
      console.log('📱 Obtention token Expo...');
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '55f6b8d7-59e3-43b2-979c-1145b429c1b1', // Project ID Expo correct
      });

      this.expoPushToken = token.data;
      console.log('✅ Token push Expo obtenu:', this.expoPushToken);

      // Enregistrer le token dans la base de données
      await this.registerPushToken(this.expoPushToken);

      // Log de l'événement d'initialisation des notifications
      FirebaseAnalyticsService.logEvent('notifications_setup', {
        platform: Platform.OS,
        has_expo_token: !!this.expoPushToken,
        has_fcm_token: !!this.fcmToken,
        fcm_configured: FCMDirectService.isConfigured()
      });

      console.log('🎉 === CONFIGURATION NOTIFICATIONS - TERMINÉE ===');
      return this.expoPushToken;
    } catch (error) {
      console.error('💥 Erreur configuration notifications:', error);
      FirebaseAnalyticsService.logAppError('notification_setup_failed', error?.toString());
      return null;
    }
  }

  // Diagnostic de configuration (simplifié)
  private static logConfigurationDiagnostic(): void {
    // Configuration silencieuse - logs supprimés
  }

  // Configurer Firebase Messaging (simplifié)
  private static async setupFirebaseMessaging(): Promise<void> {
    try {
      if (Platform.OS !== 'web' && Device.isDevice) {
        try {
          const fcmToken = await this.getFCMToken();
          
          if (fcmToken) {
            this.fcmToken = fcmToken;
            await this.registerFCMToken(fcmToken);
          }
        } catch (error) {
          // Configuration silencieuse
        }
      }
    } catch (error) {
      // Configuration silencieuse
    }
  }

  // Obtenir le token FCM natif
  private static async getFCMToken(): Promise<string | null> {
    try {
      const messaging = await import('@react-native-firebase/messaging');
      const messagingInstance = messaging.default();
      
      const authStatus = await messagingInstance.hasPermission();
      let finalAuthStatus = authStatus;
      
      if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED && 
          authStatus !== messaging.AuthorizationStatus.PROVISIONAL) {
        finalAuthStatus = await messagingInstance.requestPermission();
      }

      const enabled = finalAuthStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                     finalAuthStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return null;
      }

      const token = await messagingInstance.getToken();
      
      if (token) {
        await this.setupFCMListeners(messagingInstance);
        return token;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Configurer les listeners FCM natifs
  private static async setupFCMListeners(messaging: any): Promise<void> {
    try {
      // Listener pour les messages en premier plan
      messaging.onMessage(async (remoteMessage: any) => {
        if (remoteMessage.notification) {
          await this.sendLocalNotification(
            remoteMessage.notification.title || 'Nouvelle notification',
            remoteMessage.notification.body || '',
            remoteMessage.data
          );
        }
        
        FirebaseAnalyticsService.logEvent('fcm_message_received_foreground', {
          has_notification: !!remoteMessage.notification,
          has_data: !!remoteMessage.data
        });
      });

      // Listener pour les messages en arrière-plan
      messaging.setBackgroundMessageHandler(async (remoteMessage: any) => {
        FirebaseAnalyticsService.logEvent('fcm_message_received_background', {
          has_notification: !!remoteMessage.notification,
          has_data: !!remoteMessage.data
        });
      });

      // Listener pour l'ouverture de notification
      messaging.onNotificationOpenedApp((remoteMessage: any) => {
        FirebaseAnalyticsService.logEvent('fcm_notification_opened', {
          from_background: true,
          has_data: !!remoteMessage.data
        });
      });

      // Vérifier si l'app a été ouverte depuis une notification
      const initialNotification = await messaging.getInitialNotification();
      if (initialNotification) {
        FirebaseAnalyticsService.logEvent('fcm_notification_opened', {
          from_quit: true,
          has_data: !!initialNotification.data
        });
      }

      // Listener pour le refresh du token
      messaging.onTokenRefresh((token: string) => {
        this.fcmToken = token;
        this.registerFCMToken(token);
        
        FirebaseAnalyticsService.logEvent('fcm_token_refreshed', {
          token_length: token.length
        });
      });
    } catch (error) {
      // Configuration silencieuse
    }
  }

  // Enregistrer le token FCM natif dans la base de données
  private static async registerFCMToken(token: string): Promise<void> {
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
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        console.error('Erreur enregistrement token FCM:', error);
      } else {
        console.log('✅ Token FCM enregistré en base');
      }
    } catch (error) {
      console.error('Erreur enregistrement token FCM:', error);
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
        }, {
          onConflict: 'user_id,platform'
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

  // Envoyer une notification push (FCM Direct avec fallback Expo)
  static async sendPushNotification(
    recipientToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Essayer d'abord avec FCM direct si configuré
      if (FCMDirectService.isConfigured()) {
        const isExpoToken = recipientToken.startsWith('ExponentPushToken[');
        const isFCMToken = !isExpoToken && recipientToken.length > 140;
        
        // Si on a un token FCM natif, l'utiliser
        if (isFCMToken) {
          const fcmNotification = {
            title,
            body,
            data,
            priority: 'high' as const,
            sound: 'default',
          };

          const fcmSuccess = await FCMDirectService.sendNotification(recipientToken, fcmNotification);
          
          if (fcmSuccess) {
            FirebaseAnalyticsService.logEvent('notification_sent_fcm_direct', {
              title: title.substring(0, 50),
              has_data: !!data
            });
            return;
          }
        } 
        // Si on a un token Expo mais qu'on a aussi un token FCM en mémoire, essayer FCM
        else if (isExpoToken && this.fcmToken) {
          const fcmNotification = {
            title,
            body,
            data,
            priority: 'high' as const,
            sound: 'default',
          };

          const fcmSuccess = await FCMDirectService.sendNotification(this.fcmToken, fcmNotification);
          
          if (fcmSuccess) {
            FirebaseAnalyticsService.logEvent('notification_sent_fcm_direct', {
              title: title.substring(0, 50),
              has_data: !!data
            });
            return;
          }
        }
      }

      // Fallback vers l'API Expo
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
        throw new Error(`Erreur envoi notification Expo: ${response.status}`);
      }

      FirebaseAnalyticsService.logEvent('notification_sent_expo_fallback', {
        title: title.substring(0, 50),
        has_data: !!data
      });
    } catch (error) {
      FirebaseAnalyticsService.logAppError('notification_push_failed', error?.toString());
    }
  }

  // Configurer les gestionnaires de notifications
  static setupNotificationHandlers(): void {
    // Gestionnaire pour les notifications reçues
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
      
      // Log analytics pour notification reçue
      const notificationType = notification.request.content.data?.type || 'unknown';
      FirebaseAnalyticsService.logNotificationReceived(notificationType.toString());
    });

    // Gestionnaire pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interaction notification:', response);
      const data = response.notification.request.content.data;
      
      // Log analytics pour notification ouverte
      const notificationType = data?.type || 'unknown';
      FirebaseAnalyticsService.logNotificationOpened(notificationType.toString());
      
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

  // Obtenir le token FCM d'un utilisateur depuis la base de données
  static async getUserFCMToken(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('platform', Platform.OS)
        .single();

      if (error || !data) {
        console.log('⚠️ Aucun token FCM trouvé en base pour l\'utilisateur');
        return null;
      }

      console.log('✅ Token FCM récupéré depuis la base:', data.token.substring(0, 30) + '...');
      return data.token;
    } catch (error) {
      console.error('Erreur récupération token FCM:', error);
      return null;
    }
  }

  // Vérifier le statut des permissions
  static async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return 'undetermined';
    }
  }

  // Afficher une alerte quand les permissions sont refusées
  private static async showPermissionDeniedAlert(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        'Notifications désactivées',
        'Pour recevoir des notifications importantes de NotifCar, activez les notifications dans les paramètres de votre appareil.',
        [
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => {
              FirebaseAnalyticsService.logEvent('notification_settings_dismissed');
              resolve();
            }
          },
          {
            text: 'Paramètres',
            onPress: async () => {
              FirebaseAnalyticsService.logEvent('notification_settings_opened');
              await Linking.openSettings();
              resolve();
            }
          }
        ]
      );
    });
  }

  // Demander à nouveau les permissions (utile après retour des paramètres)
  static async retryPermissions(): Promise<boolean> {
    try {
      const currentStatus = await this.getPermissionStatus();
      
      if (currentStatus === 'granted') {
        FirebaseAnalyticsService.logEvent('notification_permission_granted_retry');
        return true;
      }
      
      // Si toujours pas accordées, ne pas redemander (éviter le spam)
      if (currentStatus === 'denied') {
        console.log('Permissions toujours refusées');
        return false;
      }
      
      // Si undetermined, on peut redemander
      return await this.requestPermissions();
    } catch (error) {
      console.error('Erreur retry permissions:', error);
      return false;
    }
  }

  // Envoyer une notification de nouveau message
  static async notifyNewMessage(
    recipientUserId: string,
    senderName: string,
    messageContent: string,
    conversationId: string,
    options?: {
      title?: string;
      vehicleInfo?: string;
      senderName?: string;
      senderEmail?: string;
    }
  ): Promise<void> {
    try {
      // Utilisation directe d'Expo
      const { data: tokenData } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', recipientUserId)
        .single();

      if (!tokenData?.token) {
        return;
      }

      const title = options?.title || `Nouveau message de ${senderName}`;
      const body = messageContent.length > 50 ? `${messageContent.substring(0, 50)}...` : messageContent;

      await this.sendPushNotification(
        tokenData.token,
        title,
        body,
        {
          conversationId,
          type: 'new_message',
          senderName,
          vehicleInfo: options?.vehicleInfo,
          ...options,
        }
      );

      FirebaseAnalyticsService.logEvent('notification_sent', {
        type: 'new_message',
        method: 'expo',
        recipient_id: recipientUserId,
        sender_name: senderName,
        has_vehicle_info: !!options?.vehicleInfo
      });
    } catch (error) {
      console.error('Erreur notification nouveau message:', error);
      FirebaseAnalyticsService.logAppError('notification_new_message_failed', error?.toString());
    }
  }

  // Envoyer une notification d'alerte de véhicule
  static async notifyVehicleAlert(
    vehicleOwnerId: string,
    reporterName: string,
    vehicleInfo: string,
    alertType: string,
    urgencyLevel: 'urgent' | 'important' | 'normal',
    conversationId: string,
    customMessage?: string
  ): Promise<void> {
    try {
      // Récupérer le token du propriétaire du véhicule
      const { data: tokenData } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', vehicleOwnerId)
        .single();

      if (!tokenData?.token) {
        return;
      }

      // Créer le titre selon l'urgence
      let title: string;
      let emoji: string;
      
      switch (urgencyLevel) {
        case 'urgent':
          title = `🚨 URGENT - Alerte véhicule`;
          emoji = '🚨';
          break;
        case 'important':
          title = `⚠️ Alerte importante - ${vehicleInfo}`;
          emoji = '⚠️';
          break;
        default:
          title = `📋 Signalement - ${vehicleInfo}`;
          emoji = '📋';
          break;
      }

      // Créer le message
      const alertMessages = {
        'stationnement_genant': 'Stationnement gênant signalé',
        'probleme_technique': 'Problème technique détecté',
        'accident': 'Accident impliquant votre véhicule',
        'vehicule_abandonne': 'Véhicule signalé comme abandonné',
        'autre': 'Signalement concernant votre véhicule'
      };

      const baseMessage = alertMessages[alertType as keyof typeof alertMessages] || alertMessages['autre'];
      const body = customMessage 
        ? `${baseMessage}. ${customMessage}` 
        : `${baseMessage} par ${reporterName}`;

      // Envoyer la notification push
      await this.sendPushNotification(
        tokenData.token,
        title,
        body,
        {
          conversationId,
          type: 'vehicle_alert',
          alertType,
          urgencyLevel,
          vehicleInfo,
          reporterName,
          emoji,
        }
      );

      // Log analytics
      FirebaseAnalyticsService.logEvent('notification_sent', {
        type: 'vehicle_alert',
        alert_type: alertType,
        urgency_level: urgencyLevel,
        recipient_id: vehicleOwnerId,
        reporter_name: reporterName
      });
    } catch (error) {
      console.error('Erreur notification alerte véhicule:', error);
      FirebaseAnalyticsService.logAppError('notification_vehicle_alert_failed', error?.toString());
    }
  }

  // Envoyer une notification système
  static async notifySystemEvent(
    userId: string,
    eventType: 'welcome' | 'update' | 'maintenance' | 'security' | 'feature',
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      // Utilisation directe d'Expo
      const { data: tokenData } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', userId)
        .single();

      if (!tokenData?.token) {
        console.log('Aucun token trouvé pour l\'utilisateur:', userId);
        return;
      }

      const eventEmojis = {
        'welcome': '👋',
        'update': '🔄',
        'maintenance': '🔧',
        'security': '🔒',
        'feature': '✨'
      };

      const emoji = eventEmojis[eventType] || '📢';
      const fullTitle = `${emoji} ${title}`;

      await this.sendPushNotification(
        tokenData.token,
        fullTitle,
        message,
        {
          type: 'system_event',
          eventType,
          ...data,
        }
      );

      FirebaseAnalyticsService.logEvent('notification_sent', {
        type: 'system_event',
        method: 'expo',
        event_type: eventType,
        recipient_id: userId
      });
    } catch (error) {
      console.error('Erreur notification système:', error);
      FirebaseAnalyticsService.logAppError('notification_system_failed', error?.toString());
    }
  }

  // Envoyer une notification de mise à jour à tous les utilisateurs actifs
  static async sendUpdateNotification(
    version: string,
    features: string[],
    isRequired: boolean = false
  ): Promise<void> {
    try {
      const title = isRequired 
        ? `Mise à jour requise - v${version}`
        : `Nouvelle version disponible - v${version}`;
      
      const message = features.length > 0
        ? `Nouveautés: ${features.join(', ')}`
        : 'Améliorations et corrections de bugs';

      // Récupérer tous les utilisateurs actifs (connectés dans les 30 derniers jours)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: activeUsers } = await supabase
        .from('user_profiles')
        .select('user_id')
        .gte('last_seen_at', thirtyDaysAgo);

      if (!activeUsers || activeUsers.length === 0) {
        console.log('Aucun utilisateur actif trouvé');
        return;
      }

      // Envoyer les notifications par batch pour éviter la surcharge
      const batchSize = 10;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(user => 
            this.notifySystemEvent(
              user.user_id,
              'update',
              title,
              message,
              {
                version,
                features,
                isRequired,
                updateUrl: 'https://notifcar.app/update'
              }
            )
          )
        );

        // Petite pause entre les batches
        if (i + batchSize < activeUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Notification de mise à jour envoyée à ${activeUsers.length} utilisateurs`);
    } catch (error) {
      console.error('Erreur envoi notification mise à jour:', error);
    }
  }

  // Envoyer une notification de maintenance programmée
  static async sendMaintenanceNotification(
    startTime: Date,
    endTime: Date,
    description: string
  ): Promise<void> {
    try {
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      const title = 'Maintenance programmée';
      const message = `Service interrompu ${duration}min à partir de ${startTime.toLocaleTimeString()}. ${description}`;

      // Récupérer tous les utilisateurs avec des tokens de notification
      const { data: users } = await supabase
        .from('notification_tokens')
        .select('user_id')
        .not('token', 'is', null);

      if (!users || users.length === 0) {
        console.log('Aucun utilisateur avec token trouvé');
        return;
      }

      // Envoyer par batch
      const batchSize = 15;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(user => 
            this.notifySystemEvent(
              user.user_id,
              'maintenance',
              title,
              message,
              {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration,
                description
              }
            )
          )
        );

        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      console.log(`Notification de maintenance envoyée à ${users.length} utilisateurs`);
    } catch (error) {
      console.error('Erreur envoi notification maintenance:', error);
    }
  }
}