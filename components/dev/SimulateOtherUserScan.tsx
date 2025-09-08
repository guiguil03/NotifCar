import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { QRCodeService } from '../../lib/qrCodeService';

export const SimulateOtherUserScan: React.FC = () => {
  const { user } = useAuth();
  const { createConversationFromQR } = useChat();
  const [result, setResult] = useState('');
  const [qrCode, setQrCode] = useState('');

  const simulateScan = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un QR code');
      return;
    }

    if (!user?.id) {
      setResult('Erreur: Utilisateur non connecté');
      return;
    }

    try {
      setResult('🔍 Simulation de scan par un autre utilisateur...\n\n');

      // Valider le QR code
      const validation = QRCodeService.validateQRCode(qrCode.trim());
      
      if (!validation.isValid) {
        setResult(prev => prev + `❌ QR code invalide\n`);
        setResult(prev => prev + `Format attendu: notifcar:vehicleId:ownerId\n`);
        return;
      }

      setResult(prev => prev + `✅ QR code valide\n`);
      setResult(prev => prev + `✅ Vehicle ID: ${validation.vehicleId}\n`);
      setResult(prev => prev + `✅ Owner ID: ${validation.ownerId}\n\n`);

      // Vérifier si c'est le même utilisateur
      if (validation.ownerId === user.id) {
        setResult(prev => prev + `⚠️  Vous ne pouvez pas signaler un problème sur votre propre véhicule.\n`);
        setResult(prev => prev + `✅ Le système fonctionne correctement - protection contre l'auto-signalement.\n`);
        setResult(prev => prev + `💡 Pour tester le chat, utilisez un QR code d'un autre utilisateur.\n`);
        return;
      }

      // Simuler la création de conversation
      setResult(prev => prev + '💬 Création de conversation...\n');
      const conversation = await createConversationFromQR(
        qrCode.trim(),
        'Bonjour, j\'ai remarqué un problème avec votre véhicule. Pouvez-vous me contacter ?'
      );

      if (conversation) {
        setResult(prev => prev + `✅ Conversation créée avec succès !\n`);
        setResult(prev => prev + `✅ ID: ${conversation.id}\n`);
        setResult(prev => prev + `✅ Sujet: ${conversation.subject}\n`);
        setResult(prev => prev + `✅ Propriétaire: ${conversation.ownerId}\n`);
        setResult(prev => prev + `✅ Signaleur: ${conversation.reporterId}\n\n`);
        setResult(prev => prev + `🎉 Le système de chat fonctionne parfaitement !\n`);
        setResult(prev => prev + `Vous pouvez maintenant discuter avec le propriétaire du véhicule.\n`);
      } else {
        setResult(prev => prev + `❌ Échec de création de conversation\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Erreur: ${error}\n`);
      console.error('Erreur simulation scan:', error);
    }
  };

  const clearResults = () => {
    setResult('');
    setQrCode('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulation Scan Autre Utilisateur</Text>
      
      <Text style={styles.instructions}>
        Entrez un QR code d'un véhicule appartenant à un autre utilisateur pour tester le système de chat.
      </Text>
      
      <TextInput
        style={styles.input}
        value={qrCode}
        onChangeText={setQrCode}
        placeholder="notifcar:vehicleId:ownerId"
        multiline
      />
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={simulateScan}>
          <Text style={styles.buttonText}>Simuler Scan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={clearResults}>
          <Text style={styles.buttonText}>Effacer</Text>
        </TouchableOpacity>
      </View>
      
      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'white',
    minHeight: 80,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  result: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
