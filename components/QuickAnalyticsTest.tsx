import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export const QuickAnalyticsTest = () => {
  const analytics = useFirebaseAnalytics();

  const testAnalytics = () => {
    try {
      analytics.logEvent('quick_test_button', {
        timestamp: Date.now(),
        test_type: 'manual',
        platform: 'web'
      });
      
      console.log('✅ Analytics: Événement test envoyé');
      Alert.alert('Test Analytics', 'Événement envoyé ! Vérifiez la console et Firebase DebugView.');
    } catch (error) {
      console.error('❌ Analytics error:', error);
      Alert.alert('Erreur', 'Erreur lors du test analytics');
    }
  };

  return (
    <View style={{ 
      backgroundColor: '#f0f8ff', 
      padding: 15, 
      margin: 20, 
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#007AFF',
      borderStyle: 'dashed'
    }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 10,
        textAlign: 'center',
        color: '#007AFF'
      }}>
        🧪 Test Firebase Analytics
      </Text>
      
      <TouchableOpacity 
        onPress={testAnalytics}
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 12, 
          borderRadius: 8,
          marginBottom: 10
        }}
      >
        <Text style={{ 
          color: 'white', 
          textAlign: 'center',
          fontWeight: '600'
        }}>
          Envoyer événement test
        </Text>
      </TouchableOpacity>

      <Text style={{ 
        fontSize: 12, 
        color: '#666', 
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Vérifiez la console (F12) et Firebase Console {'>'} DebugView
      </Text>
    </View>
  );
};
