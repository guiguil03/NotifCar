import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeService } from '../../lib/qrCodeService';
import { VehicleService } from '../../lib/vehicleService';

export const AdvancedQRDebugger: React.FC = () => {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);

  const loadVehicles = async () => {
    if (!user?.id) return;
    
    try {
      const userVehicles = await VehicleService.getUserVehicles(user.id);
      setVehicles(userVehicles);
      setResult(`Véhicules chargés: ${userVehicles.length}\n\n${userVehicles.map(v => 
        `ID: ${v.id}\nQR: ${v.qrCodeId}\nNom: ${v.name}\n---`
      ).join('\n')}`);
    } catch (error) {
      setResult(`Erreur chargement véhicules: ${error}`);
    }
  };

  const testQRCode = () => {
    if (!qrCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un QR code');
      return;
    }

    const validation = QRCodeService.validateQRCode(qrCode.trim());
    
    let resultText = `QR Code: ${qrCode}\n\n`;
    resultText += `Valide: ${validation.isValid ? 'OUI' : 'NON'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID: ${validation.vehicleId}\n`;
      resultText += `Owner ID: ${validation.ownerId}\n`;
      
      // Vérifier si le véhicule existe en base
      const vehicle = vehicles.find(v => v.id === validation.vehicleId);
      if (vehicle) {
        resultText += `\nVéhicule trouvé en base:\n`;
        resultText += `Nom: ${vehicle.name}\n`;
        resultText += `QR en base: ${vehicle.qrCodeId}\n`;
        resultText += `QR cohérent: ${vehicle.qrCodeId === qrCode ? 'OUI' : 'NON'}\n`;
      } else {
        resultText += `\nVéhicule NON trouvé en base\n`;
      }
    } else {
      resultText += `Erreur: QR code invalide\n`;
      resultText += `Format attendu: notifcar:vehicleId:ownerId\n`;
    }

    setResult(resultText);
  };

  const generateTestQR = () => {
    const testQR = QRCodeService.generateVehicleQRCode({
      vehicleName: 'Test Vehicle',
      ownerId: user?.id || 'test-owner-123',
      type: 'notifcar'
    });
    
    setQrCode(testQR.qrString);
    
    // Vérifier si l'ID est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testQR.vehicleId);
    
    setResult(`QR Code généré: ${testQR.qrString}\nVehicle ID: ${testQR.vehicleId}\nUUID valide: ${isUUID ? 'OUI' : 'NON'}`);
  };

  const testWithRealVehicle = () => {
    if (vehicles.length === 0) {
      Alert.alert('Erreur', 'Aucun véhicule chargé. Cliquez sur "Charger véhicules" d\'abord.');
      return;
    }
    
    const vehicle = vehicles[0];
    if (vehicle.qrCodeId) {
      setQrCode(vehicle.qrCodeId);
      setResult(`QR Code du véhicule "${vehicle.name}":\n${vehicle.qrCodeId}\n\nCliquez sur "Tester" pour valider.`);
    } else {
      setResult(`Le véhicule "${vehicle.name}" n'a pas de QR code.`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Débogueur QR Code Avancé</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={loadVehicles}>
          <Text style={styles.buttonText}>Charger Véhicules</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testWithRealVehicle}>
          <Text style={styles.buttonText}>Test Véhicule Réel</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.input}
        value={qrCode}
        onChangeText={setQrCode}
        placeholder="Entrez un QR code à tester"
        multiline
      />
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={testQRCode}>
          <Text style={styles.buttonText}>Tester</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={generateTestQR}>
          <Text style={styles.buttonText}>Générer Test</Text>
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
