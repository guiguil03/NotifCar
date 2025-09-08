import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { QRCodeService } from '../../lib/qrCodeService';
import { VehicleService } from '../../lib/vehicleService';

export const CompleteSystemTest: React.FC = () => {
  const { user } = useAuth();
  const { createConversationFromQR } = useChat();
  const [result, setResult] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);

  const testCompleteFlow = async () => {
    if (!user?.id) {
      setResult('Erreur: Utilisateur non connecté');
      return;
    }

    try {
      setResult('🧪 Test du système complet...\n\n');

      // 1. Créer un véhicule de test
      setResult(prev => prev + '1. Création d\'un véhicule de test...\n');
      const testVehicle = await VehicleService.createVehicle({
        name: 'Test Car',
        brand: 'Test Brand',
        model: 'Test Model',
        year: 2024,
        licensePlate: 'TEST123',
        color: 'Rouge',
        notes: 'Véhicule de test',
        ownerId: user.id,
        isActive: true
      });
      setResult(prev => prev + `✅ Véhicule créé: ${testVehicle.id}\n`);
      setResult(prev => prev + `✅ QR Code: ${testVehicle.qrCodeId}\n\n`);

      // 2. Valider le QR code
      setResult(prev => prev + '2. Validation du QR code...\n');
      const validation = QRCodeService.validateQRCode(testVehicle.qrCodeId!);
      if (validation.isValid) {
        setResult(prev => prev + `✅ QR code valide\n`);
        setResult(prev => prev + `✅ Vehicle ID: ${validation.vehicleId}\n`);
        setResult(prev => prev + `✅ Owner ID: ${validation.ownerId}\n\n`);
      } else {
        setResult(prev => prev + `❌ QR code invalide\n\n`);
        return;
      }

      // 3. Charger les véhicules
      setResult(prev => prev + '3. Chargement des véhicules...\n');
      const userVehicles = await VehicleService.getUserVehicles(user.id);
      setVehicles(userVehicles);
      setResult(prev => prev + `✅ ${userVehicles.length} véhicule(s) chargé(s)\n\n`);

      setResult(prev => prev + '🎉 Test de création de véhicule réussi !\n');
      setResult(prev => prev + 'Le QR code est valide et prêt à être scanné.\n');
      setResult(prev => prev + 'Pour tester le chat, utilisez "Test Scan QR" avec un autre utilisateur.\n');

    } catch (error) {
      setResult(prev => prev + `❌ Erreur: ${error}\n`);
      console.error('Erreur test complet:', error);
    }
  };

  const testQRScan = async () => {
    if (vehicles.length === 0) {
      Alert.alert('Erreur', 'Aucun véhicule chargé. Lancez d\'abord le test complet.');
      return;
    }

    const vehicle = vehicles[0];
    if (!vehicle.qrCodeId) {
      Alert.alert('Erreur', 'Ce véhicule n\'a pas de QR code.');
      return;
    }

    try {
      setResult('🔍 Test de scan de QR code...\n\n');

      // Simuler le scan
      const validation = QRCodeService.validateQRCode(vehicle.qrCodeId);
      
      if (validation.isValid) {
        setResult(prev => prev + `✅ QR code scanné avec succès\n`);
        setResult(prev => prev + `✅ Vehicle ID: ${validation.vehicleId}\n`);
        setResult(prev => prev + `✅ Owner ID: ${validation.ownerId}\n\n`);

        // Vérifier si c'est le même utilisateur
        if (validation.ownerId === user.id) {
          setResult(prev => prev + `⚠️  Vous ne pouvez pas signaler un problème sur votre propre véhicule.\n`);
          setResult(prev => prev + `✅ Le système fonctionne correctement - protection contre l'auto-signalement.\n`);
          setResult(prev => prev + `💡 Pour tester le chat, demandez à quelqu'un d'autre de scanner votre QR code.\n`);
        } else {
          // Tester la création de conversation
          setResult(prev => prev + '💬 Test de création de conversation...\n');
          const conversation = await createConversationFromQR(
            vehicle.qrCodeId,
            'Message de test via scan'
          );

          if (conversation) {
            setResult(prev => prev + `✅ Conversation créée: ${conversation.id}\n`);
            setResult(prev => prev + `✅ Vous pouvez maintenant discuter avec le propriétaire !\n`);
          } else {
            setResult(prev => prev + `❌ Échec de création de conversation\n`);
          }
        }
      } else {
        setResult(prev => prev + `❌ QR code invalide\n`);
      }
    } catch (error) {
      setResult(prev => prev + `❌ Erreur: ${error}\n`);
    }
  };

  const clearResults = () => {
    setResult('');
    setVehicles([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test Système Complet</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={testCompleteFlow}>
          <Text style={styles.buttonText}>Test Complet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testQRScan}>
          <Text style={styles.buttonText}>Test Scan QR</Text>
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
