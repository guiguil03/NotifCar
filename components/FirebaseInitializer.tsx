import { useAuth } from '@/contexts/AuthContext';
import { FirebaseAnalyticsService } from '@/lib/firebaseAnalytics';
import { NotificationService } from '@/lib/notificationService';
import React, { useEffect } from 'react';

interface FirebaseInitializerProps {
  children: React.ReactNode;
}

export const FirebaseInitializer: React.FC<FirebaseInitializerProps> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Initialiser les notifications
    const initializeNotifications = async () => {
      try {
        // Configurer les gestionnaires de notifications
        NotificationService.setupNotificationHandlers();
        
        // Configurer les notifications push
        await NotificationService.setupPushNotifications();
        
        console.log('Firebase et notifications initialisés avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation Firebase:', error);
        FirebaseAnalyticsService.logAppError('firebase_initialization_failed', error?.toString());
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    // Configurer l'utilisateur dans Analytics quand il se connecte
    if (user) {
      FirebaseAnalyticsService.setUserId(user.id);
      FirebaseAnalyticsService.setUserProperties({
        user_type: 'authenticated',
        signup_date: user.created_at || new Date().toISOString(),
        email_verified: user.email_confirmed_at ? 'true' : 'false',
      });
      
      // Log de l'événement de session
      FirebaseAnalyticsService.logEvent('user_session_start', {
        user_id: user.id,
        email: user.email,
      });
    }
  }, [user]);

  return <>{children}</>;
};
