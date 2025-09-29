import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';
import { FirebaseMessagingService } from '@/lib/firebaseMessaging';
import { NotificationService } from '@/lib/notificationService';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

export const FirebaseTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const analytics = useFirebaseAnalytics();

  const addResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  const testAnalytics = () => {
    try {
      analytics.logEvent('test_analytics', {
        platform: Platform.OS,
        timestamp: Date.now(),
        test_type: 'manual'
      });
      addResult('✅ Analytics: Événement test envoyé');
    } catch (error) {
      addResult(`❌ Analytics: ${error}`);
    }
  };

  const testNotificationPermissions = async () => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      addResult(`📱 Permissions notifications: ${hasPermission ? 'Accordées' : 'Refusées'}`);
    } catch (error) {
      addResult(`❌ Permissions: ${error}`);
    }
  };

  const testFCMToken = async () => {
    try {
      if (Platform.OS !== 'web') {
        addResult('📱 FCM: Disponible seulement sur web actuellement');
        return;
      }

      const token = await FirebaseMessagingService.requestPermissionAndGetToken();
      if (token) {
        addResult(`✅ FCM Token obtenu: ${token.substring(0, 20)}...`);
      } else {
        addResult('❌ FCM: Impossible d\'obtenir le token');
      }
    } catch (error) {
      addResult(`❌ FCM: ${error}`);
    }
  };

  const testLocalNotification = async () => {
    try {
      await NotificationService.sendLocalNotification(
        'Test NotifCar',
        'Notification locale de test',
        { type: 'test', timestamp: Date.now() }
      );
      addResult('✅ Notification locale envoyée');
    } catch (error) {
      addResult(`❌ Notification locale: ${error}`);
    }
  };

  const testFullSetup = async () => {
    addResult('🚀 Test complet démarré...');
    
    // Test des permissions
    await testNotificationPermissions();
    
    // Test configuration notifications
    try {
      const expoPushToken = NotificationService.getExpoPushToken();
      const fcmToken = NotificationService.getFCMToken();
      
      addResult(`📱 Expo Token: ${expoPushToken ? 'Configuré' : 'Non configuré'}`);
      addResult(`🌐 FCM Token: ${fcmToken ? 'Configuré' : 'Non configuré'}`);
    } catch (error) {
      addResult(`❌ Test tokens: ${error}`);
    }

    // Test analytics
    testAnalytics();
    
    addResult('✅ Test complet terminé');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 10, margin: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          🧪 Panel de Test Firebase
        </Text>
        <Text style={{ color: '#666', marginBottom: 15 }}>
          Les tests Firebase complets sont disponibles sur web. Sur mobile, seuls les tests Expo fonctionnent.
        </Text>
        
        <TouchableOpacity 
          onPress={testNotificationPermissions}
          style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 10 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Tester les permissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testLocalNotification}
          style={{ backgroundColor: '#34C759', padding: 12, borderRadius: 8, marginBottom: 10 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Tester notification locale
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testAnalytics}
          style={{ backgroundColor: '#FF9500', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Tester Analytics
          </Text>
        </TouchableOpacity>

        {testResults.length > 0 && (
          <View style={{ marginTop: 20, backgroundColor: '#000', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 5 }}>
              Résultats des tests :
            </Text>
            {testResults.map((result, index) => (
              <Text key={index} style={{ color: '#fff', fontSize: 12, marginBottom: 2 }}>
                {result}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 10, margin: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        🧪 Panel de Test Firebase (Web)
      </Text>
      <Text style={{ color: '#666', marginBottom: 15 }}>
        Utilisez ces boutons pour tester la configuration Firebase sur web.
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
        <TouchableOpacity 
          onPress={testAnalytics}
          style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Test Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testNotificationPermissions}
          style={{ backgroundColor: '#34C759', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Test Permissions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testFCMToken}
          style={{ backgroundColor: '#FF9500', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Test FCM Token
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testLocalNotification}
          style={{ backgroundColor: '#5856D6', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Test Notification
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity 
          onPress={testFullSetup}
          style={{ backgroundColor: '#FF2D92', padding: 15, borderRadius: 8, flex: 1 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            🚀 Test Complet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={clearResults}
          style={{ backgroundColor: '#8E8E93', padding: 15, borderRadius: 8, minWidth: 80 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={{ marginTop: 20, backgroundColor: '#000', padding: 15, borderRadius: 8, maxHeight: 200 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>
            📋 Console de test :
          </Text>
          <View style={{ maxHeight: 150 }}>
            {testResults.map((result, index) => (
              <Text key={index} style={{ color: '#fff', fontSize: 12, marginBottom: 3, fontFamily: 'monospace' }}>
                {result}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
