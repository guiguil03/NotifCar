import { logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { Platform } from 'react-native';
import { analytics } from './firebase';

export class FirebaseAnalyticsService {
  // Vérifier si analytics est disponible
  private static isAnalyticsAvailable(): boolean {
    return Platform.OS === 'web' && analytics !== null;
  }

  // Mode simulation pour développement
  private static isDevMode(): boolean {
    return __DEV__ && Platform.OS === 'web' && analytics === null;
  }

  // Log un événement personnalisé
  static logEvent(eventName: string, parameters?: Record<string, any>): void {
    try {
      if (!this.isAnalyticsAvailable()) {
        console.log(`Analytics event (${eventName}):`, parameters);
        return;
      }

      firebaseLogEvent(analytics!, eventName, parameters);
      console.log(`Analytics event logged: ${eventName}`, parameters);
    } catch (error) {
      console.error('Erreur lors du log de l\'événement analytics:', error);
    }
  }

  // Définir l'ID utilisateur
  static setUserId(userId: string): void {
    try {
      if (!this.isAnalyticsAvailable()) {
        console.log(`Analytics user ID set: ${userId}`);
        return;
      }

      setUserId(analytics!, userId);
      console.log(`User ID set in analytics: ${userId}`);
    } catch (error) {
      console.error('Erreur lors de la définition de l\'ID utilisateur:', error);
    }
  }

  // Définir les propriétés utilisateur
  static setUserProperties(properties: Record<string, string>): void {
    try {
      if (!this.isAnalyticsAvailable()) {
        console.log('Analytics user properties set:', properties);
        return;
      }

      setUserProperties(analytics!, properties);
      console.log('User properties set in analytics:', properties);
    } catch (error) {
      console.error('Erreur lors de la définition des propriétés utilisateur:', error);
    }
  }

  // Événements spécifiques à l'app
  static logLogin(method: string = 'email'): void {
    this.logEvent('login', {
      method: method
    });
  }

  static logSignUp(method: string = 'email'): void {
    this.logEvent('sign_up', {
      method: method
    });
  }

  static logCarAdded(carBrand?: string, carModel?: string): void {
    this.logEvent('car_added', {
      car_brand: carBrand,
      car_model: carModel
    });
  }

  static logQRCodeScanned(): void {
    this.logEvent('qr_code_scanned', {
      feature: 'car_identification'
    });
  }

  static logMessageSent(recipientType: 'owner' | 'visitor'): void {
    this.logEvent('message_sent', {
      recipient_type: recipientType
    });
  }

  static logConversationStarted(): void {
    this.logEvent('conversation_started');
  }

  static logNotificationReceived(notificationType: string): void {
    this.logEvent('notification_received', {
      notification_type: notificationType
    });
  }

  static logNotificationOpened(notificationType: string): void {
    this.logEvent('notification_opened', {
      notification_type: notificationType
    });
  }

  static logScreenView(screenName: string): void {
    this.logEvent('screen_view', {
      screen_name: screenName
    });
  }

  static logCarInfoViewed(carId?: string): void {
    this.logEvent('car_info_viewed', {
      car_id: carId
    });
  }

  static logProfileUpdated(): void {
    this.logEvent('profile_updated');
  }

  static logAppError(errorMessage: string, errorCode?: string): void {
    this.logEvent('app_error', {
      error_message: errorMessage,
      error_code: errorCode
    });
  }
}
