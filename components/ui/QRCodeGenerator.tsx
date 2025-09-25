import { ThemedText } from '@/components/ThemedText';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CloudStorageService, QRCodeData } from '@/lib/cloudStorageService';
import { PrintService } from '@/lib/printService';
import { QRCodeService, VehicleQRData } from '@/lib/qrCodeService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

interface QRCodeGeneratorProps {
  vehicleData: VehicleQRData; // On exige maintenant l'ID véhicule pour garantir l'idempotence
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
        setQrString(qrCodeFromDB);
        const parts = qrCodeFromDB.split(':');
        setVehicleId(parts[1] || 'unknown');
        return;
      }
      // PRIORITÉ 2: Composer strictement à partir des IDs existants (aucune génération aléatoire ici)
      if (vehicleData?.vehicleId && vehicleData?.ownerId) {
        const correctQRString = `notifcar:${vehicleData.vehicleId}:${vehicleData.ownerId}`;
        setQrString(correctQRString);
        setVehicleId(vehicleData.vehicleId);
        return;
      }
      // Sinon, on ne sait pas construire un QR déterministe
      Alert.alert('QR code indisponible', "Impossible de déterminer l'ID du véhicule. Veuillez réessayer.");
      setQrString(null);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le QR code');
      console.error('Erreur génération QR:', error);
      setQrString(null);
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
    if (!qrString) return;

    setIsCapturing(true);
    try {
      // Générer une image via PrintService puis partager
      const imageUri = await PrintService.generateQRCodeImage(qrString, vehicleData.vehicleName);
      await Share.share({ url: imageUri, message: qrString });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le QR code');
      console.error('Erreur partage QR:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const printToPdf = async () => {
    if (!qrString || !vehicleId) return;

    setIsPrinting(true);
    try {
      await PrintService.shareQRCodePDF({
        id: vehicleId,
        vehicleId: vehicleId,
        vehicleName: vehicleData.vehicleName,
        ownerId: vehicleData.ownerId,
        qrString: qrString,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer ou partager le PDF');
      console.error('Erreur impression QR:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const shareHtmlDocument = async () => {
    if (!qrString) return;
    try {
      const htmlPath = await QRCodeService.saveQRCodeToDevice(qrString, vehicleData.vehicleName);
      await Share.share({ url: htmlPath, message: qrString });
    } catch (error) {
      Alert.alert('Erreur', "Impossible de partager le document");
      console.error('Erreur partage document:', error);
    }
  };

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

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={captureAndShare}>
          <Ionicons name="share-social" size={18} color="#2633E1" />
          <ThemedText style={styles.actionText}>Partager</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={printToPdf}>
          <Ionicons name="print" size={18} color="#2633E1" />
          <ThemedText style={styles.actionText}>Imprimer</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={saveToCloud}>
          <Ionicons name="cloud-upload" size={18} color="#2633E1" />
          <ThemedText style={styles.actionText}>Sauvegarder</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={shareHtmlDocument}>
          <Ionicons name="document-text" size={18} color="#2633E1" />
          <ThemedText style={styles.actionText}>Partager document</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  qrSection: {
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  qrCodeText: {
    marginTop: 6,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    color: '#2633E1',
    fontWeight: '700',
  },
});
