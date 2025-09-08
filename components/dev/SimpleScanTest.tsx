import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { QRCodeService } from '../../lib/qrCodeService';

export const SimpleScanTest: React.FC = () => {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState('');

  const testQRCode = () => {
    if (!qrCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un QR code');
      return;
    }

    console.log('=== TEST QR CODE MANUEL ===');
    console.log('QR Code saisi:', qrCode);
    console.log('Longueur:', qrCode.length);
    console.log('Commence par notifcar:', qrCode.startsWith('notifcar:'));
    console.log('Parties après split:', qrCode.split(':'));
    console.log('============================');
    
    const validation = QRCodeService.validateQRCode(qrCode.trim());
    
    console.log('Résultat validation:', validation);
    
    let resultText = `=== TEST QR CODE MANUEL ===\n`;
    resultText += `QR Code: "${qrCode}"\n`;
    resultText += `Longueur: ${qrCode.length}\n`;
    resultText += `Commence par 'notifcar:': ${qrCode.startsWith('notifcar:')}\n`;
    resultText += `Parties: [${qrCode.split(':').join(', ')}]\n\n`;
    resultText += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID: ${validation.vehicleId}\n`;
      resultText += `Owner ID: ${validation.ownerId}\n`;
    } else {
      resultText += `❌ ERREUR: QR code invalide\n`;
      resultText += `Format attendu: notifcar:vehicleId:ownerId\n`;
    }
    
    setResult(resultText);
  };

  const generateTestQR = () => {
    console.log('Génération d\'un QR code de test...');
    
    const testQR = QRCodeService.generateVehicleQRCode({
      vehicleName: 'Test Vehicle',
      ownerId: 'test-owner-123',
      type: 'notifcar'
    });
    
    console.log('QR généré:', testQR);
    
    setQrCode(testQR.qrString);
    
    // Tester immédiatement
    const validation = QRCodeService.validateQRCode(testQR.qrString);
    
    let resultText = `=== QR CODE GÉNÉRÉ ===\n`;
    resultText += `QR Code: ${testQR.qrString}\n`;
    resultText += `Vehicle ID: ${testQR.vehicleId}\n`;
    resultText += `Longueur: ${testQR.qrString.length}\n`;
    resultText += `Commence par 'notifcar:': ${testQR.qrString.startsWith('notifcar:')}\n`;
    resultText += `Parties: [${testQR.qrString.split(':').join(', ')}]\n\n`;
    resultText += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID extrait: ${validation.vehicleId}\n`;
      resultText += `Owner ID extrait: ${validation.ownerId}\n`;
    } else {
      resultText += `❌ ERREUR: Le QR code généré n'est pas valide !\n`;
    }
    
    setResult(resultText);
  };

  const testManualQR = () => {
    const manualQR = 'notifcar:12345678-1234-4567-8901-123456789012:87654321-4321-7654-3210-987654321098';
    setQrCode(manualQR);
    
    const validation = QRCodeService.validateQRCode(manualQR);
    
    let resultText = `=== QR CODE MANUEL ===\n`;
    resultText += `QR Code: ${manualQR}\n`;
    resultText += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID: ${validation.vehicleId}\n`;
      resultText += `Owner ID: ${validation.ownerId}\n`;
    }
    
    setResult(resultText);
  };

  const clearResults = () => {
    setResult('');
    setQrCode('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test QR Code Simple</Text>
      
      <Text style={styles.instruction}>
        Collez ici le QR code que vous avez scanné pour voir pourquoi il est invalide
      </Text>
      
      <Text style={styles.inputLabel}>QR Code scanné :</Text>
      <TextInput
        style={styles.input}
        value={qrCode}
        onChangeText={setQrCode}
        placeholder="notifcar:vehicleId:ownerId"
        multiline
      />
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={testQRCode}>
          <Text style={styles.buttonText}>Tester QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={generateTestQR}>
          <Text style={styles.buttonText}>Générer Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testManualQR}>
          <Text style={styles.buttonText}>Test Manuel</Text>
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
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    minWidth: '45%',
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
