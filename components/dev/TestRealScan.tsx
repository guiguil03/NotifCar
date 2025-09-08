import { Camera, CameraView } from 'expo-camera';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QRCodeService } from '../../lib/qrCodeService';

export const TestRealScan: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState('');

  const askForCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Logs de débogage détaillés
    console.log('=== TEST SCAN RÉEL ===');
    console.log('Type:', type);
    console.log('Data scannée:', data);
    console.log('Type de data:', typeof data);
    console.log('Longueur:', data.length);
    console.log('Commence par notifcar:', data.startsWith('notifcar:'));
    console.log('Parties après split:', data.split(':'));
    console.log('========================');
    
    // Validation du QR code
    const validation = QRCodeService.validateQRCode(data);
    
    console.log('Résultat validation:', validation);
    
    let resultText = `=== RÉSULTAT DU SCAN ===\n`;
    resultText += `Type: ${type}\n`;
    resultText += `Data: "${data}"\n`;
    resultText += `Longueur: ${data.length}\n`;
    resultText += `Commence par 'notifcar:': ${data.startsWith('notifcar:')}\n`;
    resultText += `Parties: [${data.split(':').join(', ')}]\n\n`;
    resultText += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    if (validation.isValid) {
      resultText += `Vehicle ID: ${validation.vehicleId}\n`;
      resultText += `Owner ID: ${validation.ownerId}\n`;
    } else {
      resultText += `❌ ERREUR: QR code invalide\n`;
    }
    
    setScanResult(resultText);
  };

  const resetScan = () => {
    setScanned(false);
    setScanResult('');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Test Scan Réel</Text>
        <TouchableOpacity style={styles.button} onPress={askForCameraPermission}>
          <Text style={styles.buttonText}>Demander Permission Caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Test Scan Réel</Text>
        <Text style={styles.errorText}>Permission caméra refusée</Text>
        <TouchableOpacity style={styles.button} onPress={askForCameraPermission}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Scan Réel</Text>
      
      {!scanned ? (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.scanner}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Scannez un QR code NotifCar</Text>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Scan terminé</Text>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>{scanResult}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={resetScan}>
            <Text style={styles.buttonText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultScroll: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
