import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { QRCodeService } from '../../lib/qrCodeService';

export const QRValidationTest: React.FC = () => {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState('');

  const testQRCode = () => {
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

  const generateTestQR = () => {
    const testQR = QRCodeService.generateVehicleQRCode({
      vehicleName: 'Test Vehicle',
      ownerId: 'test-owner-123',
      type: 'notifcar'
    });
    
    setQrCode(testQR.qrString);
    
    // Tester immédiatement
    const validation = QRCodeService.validateQRCode(testQR.qrString);
    
    let resultText = `QR Code généré: ${testQR.qrString}\n`;
    resultText += `Vehicle ID: ${testQR.vehicleId}\n`;
    resultText += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID extrait: ${validation.vehicleId}\n`;
      resultText += `Owner ID extrait: ${validation.ownerId}\n`;
    }
    
    setResult(resultText);
  };

  const clearResults = () => {
    setResult('');
    setQrCode('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test Validation QR Code</Text>
      
      <TextInput
        style={styles.input}
        value={qrCode}
        onChangeText={setQrCode}
        placeholder="notifcar:vehicleId:ownerId"
        multiline
      />
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={testQRCode}>
          <Text style={styles.buttonText}>Tester QR Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={generateTestQR}>
          <Text style={styles.buttonText}>Générer Test</Text>
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
