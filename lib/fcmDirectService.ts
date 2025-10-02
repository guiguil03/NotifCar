import Constants from 'expo-constants';
import { FirebaseAnalyticsService } from './firebaseAnalytics';
import { supabase } from './supabase';

// Interface pour les données de notification FCM
interface FCMNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
  sound?: string;
  badge?: number;
  click_action?: string;
  icon?: string;
  color?: string;
}

// Interface pour la réponse FCM
interface FCMResponse {
  success: number;
  failure: number;
  canonical_ids: number;
  multicast_id: number;
  results: {
    message_id?: string;
    registration_id?: string;
    error?: string;
  }[];
}

export class FCMDirectService {
  // Clé serveur FCM - À configurer dans app.config.js
  private static readonly FCM_SERVER_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_FCM_SERVER_KEY || process.env.EXPO_PUBLIC_FCM_SERVER_KEY || '';
  private static readonly FCM_ENDPOINT_LEGACY = 'https://fcm.googleapis.com/fcm/send';
  private static readonly FCM_ENDPOINT_V1 = 'https://fcm.googleapis.com/v1/projects/notifcar-4115c/messages:send';
  private static readonly PROJECT_ID = 'notifcar-4115c';

  // Vérifier si la configuration FCM est valide
  static isConfigured(): boolean {
    const isConfigured = !!this.FCM_SERVER_KEY;
    console.log('🔧 FCM Configuration Check:', {
      hasServerKey: isConfigured,
      keyLength: this.FCM_SERVER_KEY ? this.FCM_SERVER_KEY.length : 0,
      keyPreview: this.FCM_SERVER_KEY ? `${this.FCM_SERVER_KEY.substring(0, 10)}...` : 'AUCUNE'
    });
    return isConfigured;
  }

  // Envoyer une notification FCM directement
  static async sendNotification(
    token: string,
    notification: FCMNotificationData
  ): Promise<boolean> {
    try {
      console.log('🚀 FCM Send Notification - Début:', {
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'AUCUN',
        title: notification.title,
        bodyLength: notification.body.length
      });

      if (!this.isConfigured()) {
        console.error('❌ FCM Server Key non configurée');
        console.log('💡 Solution: Ajoutez EXPO_PUBLIC_FCM_SERVER_KEY dans votre fichier .env');
        return false;
      }

      console.log('✅ FCM configuré, envoi en cours...');

      const payload = {
        to: token,
        notification: {
          title: notification.title,
          body: notification.body,
          sound: notification.sound || 'default',
          badge: notification.badge,
          click_action: notification.click_action,
          icon: notification.icon,
          color: notification.color || '#8B5CF6',
        },
        data: notification.data || {},
        priority: notification.priority || 'high',
        content_available: true,
        mutable_content: true,
      };

      // Utiliser l'API Legacy (compatible avec votre clé API)
      console.log('📡 Envoi avec FCM API Legacy (clé API compatible)...');
      const response = await this.sendWithLegacyAPI(token, notification);

      console.log('📨 Réponse FCM:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur FCM HTTP:', response.status, errorText);
        console.log('🔍 Diagnostic:');
        console.log('  - Status:', response.status);
        console.log('  - Endpoint:', this.FCM_ENDPOINT_LEGACY);
        console.log('  - Clé utilisée:', `${this.FCM_SERVER_KEY.substring(0, 10)}...`);
        return false;
      }

      const result: FCMResponse = await response.json();
      
      if (result.failure > 0) {
        console.error('Erreur FCM:', result.results);
        result.results.forEach((res, index) => {
          if (res.error) {
            console.error(`Erreur FCM pour le token ${index}:`, res.error);
            FirebaseAnalyticsService.logAppError('fcm_send_error', res.error);
          }
        });
        return false;
      }

      console.log('🎉 Notification FCM envoyée avec succès!');
      console.log('📊 Résultat FCM:', {
        success: result.success,
        failure: result.failure,
        multicast_id: result.multicast_id
      });
      return true;
    } catch (error) {
      console.error('💥 Erreur envoi notification FCM:', error);
      console.log('🔍 Détails erreur:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack?.substring(0, 200)
      });
      FirebaseAnalyticsService.logAppError('fcm_send_failed', error?.toString());
      return false;
    }
  }

  // Envoyer avec l'API FCM v1 (moderne)
  private static async sendWithV1API(token: string, notification: FCMNotificationData): Promise<Response> {
    const v1Payload = {
      message: {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: notification.priority || 'high',
          notification: {
            sound: notification.sound || 'default',
            color: notification.color || '#8B5CF6',
            click_action: notification.click_action,
            icon: notification.icon,
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              badge: notification.badge,
            }
          }
        }
      }
    };

    console.log('📦 Payload FCM v1:', JSON.stringify(v1Payload, null, 2));

    return await fetch(this.FCM_ENDPOINT_V1, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(v1Payload),
    });
  }

  // Envoyer avec l'API FCM legacy (ancienne)
  private static async sendWithLegacyAPI(token: string, notification: FCMNotificationData): Promise<Response> {
    const legacyPayload = {
      to: token,
      notification: {
        title: notification.title,
        body: notification.body,
        sound: notification.sound || 'default',
        badge: notification.badge,
        click_action: notification.click_action,
        icon: notification.icon,
        color: notification.color || '#8B5CF6',
      },
      data: notification.data || {},
      priority: notification.priority || 'high',
      content_available: true,
      mutable_content: true,
    };

    console.log('📦 Payload FCM Legacy:', JSON.stringify(legacyPayload, null, 2));

    return await fetch(this.FCM_ENDPOINT_LEGACY, {
      method: 'POST',
      headers: {
        'Authorization': `key=${this.FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(legacyPayload),
    });
  }

  // Envoyer une notification à un utilisateur spécifique
  static async sendNotificationToUser(
    userId: string,
    notification: FCMNotificationData
  ): Promise<boolean> {
    try {
      // Récupérer tous les tokens FCM de l'utilisateur
      const { data: tokens, error } = await supabase
        .from('notification_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur récupération tokens FCM:', error);
        return false;
      }

      if (!tokens || tokens.length === 0) {
        console.log('Aucun token FCM trouvé pour l\'utilisateur:', userId);
        return false;
      }

      const tokenList = tokens.map(t => t.token);
      
      // Envoyer à tous les tokens de l'utilisateur
      let successCount = 0;
      for (const token of tokenList) {
        const success = await this.sendNotification(token, notification);
        if (success) successCount++;
      }

      return successCount > 0;
    } catch (error) {
      console.error('Erreur envoi notification à l\'utilisateur:', error);
      return false;
    }
  }

  // Créer une notification formatée pour un nouveau message
  static createNewMessageNotification(
    senderName: string,
    messageContent: string,
    conversationId: string,
    options?: {
      vehicleInfo?: string;
      senderEmail?: string;
    }
  ): FCMNotificationData {
    const title = `💬 Nouveau message de ${senderName}`;
    const body = messageContent.length > 100 
      ? `${messageContent.substring(0, 100)}...` 
      : messageContent;

    return {
      title,
      body,
      data: {
        type: 'new_message',
        conversationId,
        senderName,
        vehicleInfo: options?.vehicleInfo,
        senderEmail: options?.senderEmail,
      },
      priority: 'high',
      sound: 'default',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      icon: 'ic_notification',
      color: '#8B5CF6',
    };
  }

  // Créer une notification formatée pour une alerte véhicule
  static createVehicleAlertNotification(
    reporterName: string,
    vehicleInfo: string,
    alertType: string,
    urgencyLevel: 'urgent' | 'important' | 'normal',
    conversationId: string,
    customMessage?: string
  ): FCMNotificationData {
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

    return {
      title,
      body,
      data: {
        type: 'vehicle_alert',
        conversationId,
        alertType,
        urgencyLevel,
        vehicleInfo,
        reporterName,
        emoji,
      },
      priority: urgencyLevel === 'urgent' ? 'high' : 'normal',
      sound: urgencyLevel === 'urgent' ? 'alarm' : 'default',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      icon: 'ic_notification',
      color: urgencyLevel === 'urgent' ? '#FF4444' : '#8B5CF6',
    };
  }

  // Créer une notification système
  static createSystemNotification(
    eventType: 'welcome' | 'update' | 'maintenance' | 'security' | 'feature',
    title: string,
    message: string,
    data?: any
  ): FCMNotificationData {
    const eventEmojis = {
      'welcome': '👋',
      'update': '🔄',
      'maintenance': '🔧',
      'security': '🔒',
      'feature': '✨'
    };

    const emoji = eventEmojis[eventType] || '📢';
    const fullTitle = `${emoji} ${title}`;

    return {
      title: fullTitle,
      body: message,
      data: {
        type: 'system_event',
        eventType,
        ...data,
      },
      priority: eventType === 'security' ? 'high' : 'normal',
      sound: 'default',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      icon: 'ic_notification',
      color: '#8B5CF6',
    };
  }

  // Nettoyer les tokens invalides
  static async cleanupInvalidTokens(): Promise<void> {
    try {
      console.log('Nettoyage des tokens FCM invalides...');
      
      const { error } = await supabase
        .from('notification_tokens')
        .delete()
        .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Erreur nettoyage tokens FCM:', error);
      } else {
        console.log('Tokens FCM expirés nettoyés avec succès');
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des tokens FCM:', error);
    }
  }

  // Valider un token FCM
  static async validateToken(token: string): Promise<boolean> {
    try {
      const testNotification: FCMNotificationData = {
        title: 'Test de validation',
        body: 'Ce message teste la validité de votre token',
        data: { type: 'validation_test' },
        priority: 'normal'
      };

      return await this.sendNotification(token, testNotification);
    } catch (error) {
      console.error('Erreur validation token FCM:', error);
      return false;
    }
  }
}
