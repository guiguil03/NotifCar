import React, { useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useFirebaseAnalytics, useScreenView } from '../hooks/useFirebaseAnalytics';
import { NotificationService } from '../lib/notificationService';

// Exemple d'utilisation de Firebase dans un composant
export const FirebaseUsageExample: React.FC = () => {
  const analytics = useFirebaseAnalytics();

  // Log automatique de la vue d'écran
  useScreenView('firebase_example_screen');

  useEffect(() => {
    // Exemple de configuration des propriétés utilisateur au montage
    analytics.setUserProperties({
      user_type: 'premium',
      preferred_language: 'fr',
      app_version: '1.0.0'
    });
  }, [analytics]);

  // Exemple d'utilisation des analytics pour différentes actions
  const handleCarAdded = () => {
    // Simuler l'ajout d'une voiture
    const carBrand = 'Toyota';
    const carModel = 'Prius';
    
    // Log de l'événement d'ajout de voiture
    analytics.logCarAdded(carBrand, carModel);
    
    Alert.alert('Voiture ajoutée', `${carBrand} ${carModel} ajoutée avec succès!`);
  };

  const handleQRScan = () => {
    // Simuler le scan d'un QR code
    analytics.logQRCodeScanned();
    
    // Exemple d'envoi de notification locale
    NotificationService.sendLocalNotification(
      'QR Code scanné',
      'Voiture identifiée avec succès!',
      { type: 'qr_scan', timestamp: Date.now() }
    );
    
    Alert.alert('QR Code', 'QR Code scanné avec succès!');
  };

  const handleMessageSent = () => {
    // Simuler l'envoi d'un message
    analytics.logMessageSent('owner');
    
    // Exemple de notification
    NotificationService.sendLocalNotification(
      'Message envoyé',
      'Votre message a été envoyé au propriétaire',
      { type: 'message_sent', recipient: 'owner' }
    );
    
    Alert.alert('Message', 'Message envoyé au propriétaire!');
  };

  const handleConversationStart = () => {
    // Simuler le début d'une conversation
    analytics.logConversationStarted();
    
    Alert.alert('Conversation', 'Nouvelle conversation démarrée!');
  };

  const handleProfileUpdate = () => {
    // Simuler la mise à jour du profil
    analytics.logProfileUpdated();
    
    Alert.alert('Profil', 'Profil mis à jour avec succès!');
  };

  const handleCustomEvent = () => {
    // Exemple d'événement personnalisé
    analytics.logEvent('custom_button_pressed', {
      button_name: 'special_action',
      screen: 'firebase_example',
      user_preference: 'premium',
      timestamp: Date.now()
    });
    
    Alert.alert('Événement personnalisé', 'Événement personnalisé enregistré!');
  };

  const handleError = () => {
    // Simuler une erreur pour tester le logging
    try {
      // Simuler une erreur
      throw new Error('Exemple d\'erreur pour test');
    } catch (error) {
      analytics.logAppError(error.message, 'TEST_ERROR_001');
      Alert.alert('Erreur loggée', 'Erreur enregistrée dans Firebase Analytics');
    }
  };

  const handleNotificationTest = async () => {
    // Tester les notifications push
    const expoPushToken = NotificationService.getExpoPushToken();
    const fcmToken = NotificationService.getFCMToken();
    
    let message = 'Tokens disponibles:\n';
    message += `Expo: ${expoPushToken ? 'Oui' : 'Non'}\n`;
    message += `FCM: ${fcmToken ? 'Oui' : 'Non'}`;
    
    Alert.alert('Statut des notifications', message);
  };

  return (
    <View style={{ padding: 20, gap: 15 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Firebase Analytics & Notifications
      </Text>
      
      <TouchableOpacity 
        onPress={handleCarAdded}
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Ajouter une voiture (Analytics)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleQRScan}
        style={{ backgroundColor: '#34C759', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Scanner QR Code (Analytics + Notification)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleMessageSent}
        style={{ backgroundColor: '#FF9500', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Envoyer un message (Analytics + Notification)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleConversationStart}
        style={{ backgroundColor: '#5856D6', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Démarrer conversation (Analytics)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleProfileUpdate}
        style={{ backgroundColor: '#AF52DE', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Mettre à jour profil (Analytics)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleCustomEvent}
        style={{ backgroundColor: '#FF2D92', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Événement personnalisé (Analytics)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleError}
        style={{ backgroundColor: '#FF3B30', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Tester log d'erreur (Analytics)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleNotificationTest}
        style={{ backgroundColor: '#8E8E93', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Statut des notifications
        </Text>
      </TouchableOpacity>
    </View>
  );
};
