import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeService } from '../../lib/qrCodeService';
import { VehicleService } from '../../lib/vehicleService';

export const QRCodeDebugger: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);

  const loadVehicles = async () => {
    if (!user?.id) {
      setResult('Erreur: Utilisateur non connecté');
      return;
    }

    try {
      const userVehicles = await VehicleService.getUserVehicles(user.id);
      setVehicles(userVehicles);
      
      let resultText = `Véhicules chargés: ${userVehicles.length}\n\n`;
      
      userVehicles.forEach((vehicle, index) => {
        resultText += `Véhicule ${index + 1}:\n`;
        resultText += `  ID: ${vehicle.id}\n`;
        resultText += `  QR Code: ${vehicle.qrCodeId}\n`;
        resultText += `  Nom: ${vehicle.name}\n`;
        
        // Valider le QR code
        if (vehicle.qrCodeId) {
          const validation = QRCodeService.validateQRCode(vehicle.qrCodeId);
          resultText += `  Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
          if (validation.isValid) {
            resultText += `  Vehicle ID: ${validation.vehicleId}\n`;
            resultText += `  Owner ID: ${validation.ownerId}\n`;
          }
        } else {
          resultText += `  Validation: ❌ Pas de QR code\n`;
        }
        resultText += `\n`;
      });
      
      setResult(resultText);
    } catch (error) {
      setResult(`Erreur chargement véhicules: ${error}`);
    }
  };

  const testQRCode = (qrCode: string) => {
    if (!qrCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un QR code');
      return;
    }

    const validation = QRCodeService.validateQRCode(qrCode.trim());
    
    let resultText = `QR Code testé: ${qrCode}\n\n`;
    resultText += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID: ${validation.vehicleId}\n`;
      resultText += `Owner ID: ${validation.ownerId}\n`;
    } else {
      resultText += `Erreur: QR code invalide\n`;
      resultText += `Format attendu: notifcar:vehicleId:ownerId\n`;
    }

    setResult(resultText);
  };

  const testVehicleQR = (vehicle: any) => {
    if (!vehicle.qrCodeId) {
      Alert.alert('Erreur', 'Ce véhicule n\'a pas de QR code');
      return;
    }

    testQRCode(vehicle.qrCodeId);
  };

  const createTestVehicle = async () => {
    if (!user?.id) {
      setResult('Erreur: Utilisateur non connecté');
      return;
    }

    try {
      setResult('Création d\'un véhicule de test...\n\n');

      const testVehicle = await VehicleService.createVehicle({
        name: 'Debug Test Car',
        brand: 'Debug Brand',
        model: 'Debug Model',
        year: 2024,
        licensePlate: 'DEBUG123',
        color: 'Rouge',
        notes: 'Véhicule de test pour débogage',
        ownerId: user.id,
        isActive: true
      });

      setResult(prev => prev + `✅ Véhicule créé: ${testVehicle.id}\n`);
      setResult(prev => prev + `✅ QR Code: ${testVehicle.qrCodeId}\n\n`);

      // Tester immédiatement le QR code
      if (testVehicle.qrCodeId) {
        setResult(prev => prev + 'Test de validation du QR code...\n');
        testQRCode(testVehicle.qrCodeId);
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
      <Text style={styles.title}>Débogueur QR Code</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={loadVehicles}>
          <Text style={styles.buttonText}>Charger Véhicules</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={createTestVehicle}>
          <Text style={styles.buttonText}>Créer Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={clearResults}>
          <Text style={styles.buttonText}>Effacer</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length > 0 && (
        <View style={styles.vehiclesList}>
          <Text style={styles.sectionTitle}>Véhicules disponibles:</Text>
          {vehicles.map((vehicle, index) => (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleItem}
              onPress={() => testVehicleQR(vehicle)}
            >
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleQR}>{vehicle.qrCodeId}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
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
  vehiclesList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  vehicleItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleQR: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
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