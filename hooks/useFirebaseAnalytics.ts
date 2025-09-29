import { useEffect } from 'react';
import { FirebaseAnalyticsService } from '../lib/firebaseAnalytics';

export const useFirebaseAnalytics = () => {
  // Log d'une vue d'écran
  const logScreenView = (screenName: string) => {
    FirebaseAnalyticsService.logScreenView(screenName);
  };

  // Log d'un événement personnalisé
  const logEvent = (eventName: string, parameters?: Record<string, any>) => {
    FirebaseAnalyticsService.logEvent(eventName, parameters);
  };

  // Log de connexion
  const logLogin = (method: string = 'email') => {
    FirebaseAnalyticsService.logLogin(method);
  };

  // Log d'inscription
  const logSignUp = (method: string = 'email') => {
    FirebaseAnalyticsService.logSignUp(method);
  };

  // Log d'ajout de voiture
  const logCarAdded = (carBrand?: string, carModel?: string) => {
    FirebaseAnalyticsService.logCarAdded(carBrand, carModel);
  };

  // Log de scan QR
  const logQRCodeScanned = () => {
    FirebaseAnalyticsService.logQRCodeScanned();
  };

  // Log d'envoi de message
  const logMessageSent = (recipientType: 'owner' | 'visitor') => {
    FirebaseAnalyticsService.logMessageSent(recipientType);
  };

  // Log de début de conversation
  const logConversationStarted = () => {
    FirebaseAnalyticsService.logConversationStarted();
  };

  // Log de vue d'infos voiture
  const logCarInfoViewed = (carId?: string) => {
    FirebaseAnalyticsService.logCarInfoViewed(carId);
  };

  // Log de mise à jour profil
  const logProfileUpdated = () => {
    FirebaseAnalyticsService.logProfileUpdated();
  };

  // Log d'erreur app
  const logAppError = (errorMessage: string, errorCode?: string) => {
    FirebaseAnalyticsService.logAppError(errorMessage, errorCode);
  };

  // Définir l'ID utilisateur
  const setUserId = (userId: string) => {
    FirebaseAnalyticsService.setUserId(userId);
  };

  // Définir les propriétés utilisateur
  const setUserProperties = (properties: Record<string, string>) => {
    FirebaseAnalyticsService.setUserProperties(properties);
  };

  return {
    logScreenView,
    logEvent,
    logLogin,
    logSignUp,
    logCarAdded,
    logQRCodeScanned,
    logMessageSent,
    logConversationStarted,
    logCarInfoViewed,
    logProfileUpdated,
    logAppError,
    setUserId,
    setUserProperties,
  };
};

// Hook pour logger automatiquement la vue d'écran
export const useScreenView = (screenName: string) => {
  const { logScreenView } = useFirebaseAnalytics();

  useEffect(() => {
    logScreenView(screenName);
  }, [screenName, logScreenView]);
};
