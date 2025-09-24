import { ThemedText } from '@/components/ThemedText';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CloudStorageService, QRCodeData } from '@/lib/cloudStorageService';
import { PrintService } from '@/lib/printService';
import { QRCaptureService } from '@/lib/qrCaptureService';
import { QRCodeService, VehicleQRData } from '@/lib/qrCodeService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

interface QRCodeGeneratorProps {
  vehicleData: Omit<VehicleQRData, 'vehicleId' | 'createdAt'>;
  qrCodeFromDB?: string; // QR code stocké en base de données
  onQRGenerated?: (qrData: VehicleQRData) => void;
}

export function QRCodeGenerator({ vehicleData, qrCodeFromDB, onQRGenerated }: QRCodeGeneratorProps) {
  const [qrString, setQrString] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToCloud, setSavedToCloud] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Référence pour la capture d'écran
  const qrCodeRef = useRef<View>(null);
  
  const primaryColor = useThemeColor({}, 'primary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  const generateQRCode = useCallback(() => {
    if (qrString) return; // Ne pas régénérer si déjà généré
    
    setIsGenerating(true);
    try {
      // PRIORITÉ 1: Utiliser le QR code de la base de données s'il est fourni et valide
      if (qrCodeFromDB && qrCodeFromDB.startsWith('notifcar:')) {
        console.log('[QRCodeGenerator] Utilisation QR code de la base:', qrCodeFromDB);
        setQrString(qrCodeFromDB);
        // Extraire l'ID du véhicule du QR code
        const parts = qrCodeFromDB.split(':');
        setVehicleId(parts[1] || 'unknown');
      } 
      // PRIORITÉ 2: Utiliser l'ID du véhicule existant pour générer le bon QR code
      else if (vehicleData && vehicleData.vehicleId) {
        console.log('[QRCodeGenerator] Génération avec ID existant:', vehicleData.vehicleId);
        const correctQRString = `notifcar:${vehicleData.vehicleId}:${vehicleData.ownerId}`;
        setQrString(correctQRString);
        setVehicleId(vehicleData.vehicleId);
      } 
      // PRIORITÉ 3: Générer un nouveau QR code (seulement pour nouveaux véhicules)
      else if (vehicleData) {
        console.log('[QRCodeGenerator] Génération nouveau QR code');
        const result = QRCodeService.generateVehicleQRCode(vehicleData);
        setQrString(result.qrString);
        setVehicleId(result.vehicleId);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le QR code');
      console.error('Erreur génération QR:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [qrCodeFromDB, vehicleData, qrString]);

  useEffect(() => {
    if (!qrString) {
      generateQRCode();
    }
  }, [generateQRCode, qrString]);

  const saveToCloud = async () => {
    if (!qrString || !vehicleId) return;

    setIsSaving(true);
    try {
      const qrCodeId = CloudStorageService.generateQRCodeId();
      const now = new Date().toISOString();

      const qrCodeData: QRCodeData = {
        id: qrCodeId,
        vehicleId: vehicleId,
        vehicleName: vehicleData.vehicleName,
        ownerId: vehicleData.ownerId,
        qrString: qrString,
        createdAt: now,
        updatedAt: now,
      };

      // Sauvegarder dans le bucket
      const qrCodeUrl = await CloudStorageService.saveQRCodeToBucket(qrCodeData);
      
      // Sauvegarder les métadonnées en base
      await CloudStorageService.saveQRCodeMetadata(qrCodeData, qrCodeUrl);

      setSavedToCloud(true);
      Alert.alert(
        'Succès',
        'QR code sauvegardé dans le cloud ! Il est maintenant accessible depuis n\'importe où et synchronisé sur tous vos appareils.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder dans le cloud');
      console.error('Erreur sauvegarde cloud:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const captureAndShare = async () => {
    if (!qrCodeRef.current || !qrString) return;

    setIsCapturing(true);
    try {
      // Capturer le QR code en image
      const imageUri = await QRCaptureService.captureQRCode(qrCodeRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile'
      });

      // Partager l'image
      await QRCaptureService.shareQRCode(imageUri, vehicleData.vehicleName, {
        format: 'png',
        quality: 1
      });

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de capturer et partager le QR code');
      console.error('Erreur capture/partage:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const captureAndSave = async () => {
    if (!qrCodeRef.current || !qrString) return;

    setIsCapturing(true);
    try {
      // Capturer le QR code en image
      const imageUri = await QRCaptureService.captureQRCode(qrCodeRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile'
      });

      // Sauvegarder dans les documents
      const savedPath = await QRCaptureService.saveQRCodeToDocuments(
        imageUri, 
        vehicleData.vehicleName, 
        'png'
      );

      Alert.alert(
        'Succès',
        `QR code sauvegardé dans les documents : ${savedPath}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de capturer et sauvegarder le QR code');
      console.error('Erreur capture/sauvegarde:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadQRCode = async () => {
    if (!qrString) return;

    setIsDownloading(true);
    try {
      // Sauvegarder le QR code string localement
      const filePath = await QRCodeService.saveQRCodeToDevice(qrString, vehicleData.vehicleName);

      Alert.alert(
        'Succès',
        'QR code sauvegardé localement ! Vous pouvez maintenant l\'imprimer et le coller sur le pare-brise.',
        [
          { text: 'OK' },
          { text: 'Partager', onPress: () => shareQRCode(filePath) }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le QR code');
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareQRCode = async (fileUri?: string) => {
    try {
      if (fileUri) {
        await Share.share({
          url: fileUri,
          title: `QR Code NotifCar - ${vehicleData.vehicleName}`,
          message: `QR Code pour le véhicule ${vehicleData.vehicleName}. Collez-le sur le pare-brise.\n\nCode: ${qrString}`,
        });
      } else {
        await Share.share({
          message: `QR Code NotifCar - ${vehicleData.vehicleName}\nCode: ${qrString}\n\nCollez ce QR code sur le pare-brise de votre véhicule.`,
          title: 'QR Code NotifCar',
        });
      }
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const printQRCode = async () => {
    if (!qrString || !vehicleId) return;

    try {
      setIsPrinting(true);
      
      const qrData: QRCodeData = {
        id: vehicleId,
        vehicleId: vehicleId,
        vehicleName: vehicleData.vehicleName,
        ownerId: vehicleData.ownerId,
        qrString: qrString,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await PrintService.shareQRCodePDF(qrData);
    } catch (error) {
      console.error('Erreur impression:', error);
      Alert.alert('Erreur', 'Impossible d\'imprimer le QR code');
    } finally {
      setIsPrinting(false);
    }
  };

  if (isGenerating) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="qr-code" size={32} color="#2633E1" />
          </View>
          <ThemedText style={styles.loadingText}>
            Génération du QR code...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!qrString) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <ThemedText style={styles.errorText}>
            Impossible de générer le QR code
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={generateQRCode}
          >
            <Ionicons name="refresh" size={16} color="#2633E1" />
            <ThemedText style={styles.retryText}>Réessayer</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="qr-code" size={24} color="#2633E1" />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>
            QR Code - {vehicleData.vehicleName}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Collez ce QR code sur le pare-brise de votre véhicule
          </ThemedText>
        </View>
      </View>

      {/* QR Code Display */}
      <View style={styles.qrSection} ref={qrCodeRef}>
        <View style={styles.qrWrapper}>
          <QRCodeDisplay 
            value={qrString}
            size={200}
          />
        </View>
        <View style={styles.qrInfo}>
          <ThemedText style={styles.qrLabel}>Code QR :</ThemedText>
          <ThemedText style={styles.qrCodeText}>{qrString}</ThemedText>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <ThemedText style={styles.instructionsTitle}>Instructions :</ThemedText>
        <View style={styles.instructionList}>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="print" size={16} color="#6B7280" />
            </View>
            <ThemedText style={styles.instructionText}>
              Imprimez ce QR code
            </ThemedText>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="cut" size={16} color="#6B7280" />
            </View>
            <ThemedText style={styles.instructionText}>
              Découpez-le aux dimensions
            </ThemedText>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="car" size={16} color="#6B7280" />
            </View>
            <ThemedText style={styles.instructionText}>
              Collez-le sur le pare-brise
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Actions principales - 3 boutons en ligne */}
      <View style={styles.mainActionsContainer}>
        <TouchableOpacity
          style={[styles.mainActionButton, styles.violetButton]}
          onPress={printQRCode}
          disabled={isPrinting}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="share" size={20} color="white" />
          </View>
          <ThemedText style={styles.mainButtonText}>
            {isPrinting ? "Génération..." : "Partager"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainActionButton, styles.violetButton]}
          onPress={printQRCode}
          disabled={isPrinting}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="save" size={20} color="white" />
          </View>
          <ThemedText style={styles.mainButtonText}>
            {isPrinting ? "Génération..." : "Sauvegarder"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainActionButton, styles.violetButton]}
          onPress={printQRCode}
          disabled={isPrinting}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="print" size={20} color="white" />
          </View>
          <ThemedText style={styles.mainButtonText}>
            {isPrinting ? "Génération..." : "Imprimer"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2633E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  qrCodeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#374151',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  instructions: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionList: {
    gap: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  // Nouveaux styles pour les 3 boutons principaux
  mainActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  mainActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  violetButton: {
    backgroundColor: '#2633E1', // Couleur primaire du nouveau DA
  },
  buttonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
