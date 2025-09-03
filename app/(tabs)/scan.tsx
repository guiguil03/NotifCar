import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

// const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Simulation d'un scan de QR code Notifcar
    if (data.startsWith('notifcar:')) {
      const vehicleId = data.replace('notifcar:', '');
      Alert.alert(
        'QR Code détecté !',
        `Véhicule ID: ${vehicleId}\n\nQue souhaitez-vous faire ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => setScanned(false),
          },
          {
            text: 'Notifier',
            onPress: () => {
              // Ici on ouvrirait l'écran de notification
              Alert.alert('Notification', 'Écran de notification à implémenter');
              setScanned(false);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'QR Code invalide',
        'Ce QR code n&apos;est pas un code Notifcar valide.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Demande d'autorisation de la caméra...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={primaryColor} />
          <ThemedText style={styles.permissionTitle}>Autorisation requise</ThemedText>
          <ThemedText style={styles.permissionText}>
            Notifcar a besoin d&apos;accéder à votre caméra pour scanner les QR codes.
          </ThemedText>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: primaryColor }]}
            onPress={requestPermission}
          >
            <ThemedText style={styles.permissionButtonText}>Autoriser la caméra</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        flash={flashOn ? 'on' : 'off'}
      >
        {/* Overlay avec cadre de scan */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Scanner QR Code</ThemedText>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Ionicons 
                name={flashOn ? "flash" : "flash-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Zone de scan */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <ThemedText style={styles.scanInstruction}>
              Positionnez le QR code dans le cadre
            </ThemedText>
          </View>

          {/* Footer avec instructions */}
          <View style={styles.footer}>
            <ThemedView style={[styles.instructionCard, { backgroundColor: cardColor, borderColor }]}>
              <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
              <ThemedText style={styles.instructionText}>
                Scannez le QR code Notifcar apposé sur le pare-brise du véhicule
              </ThemedText>
            </ThemedView>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#F97316',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanInstruction: {
    color: 'white',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  footer: {
    padding: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    opacity: 0.7,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});