import { ThemedText } from '@/components/ThemedText';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { VioletButton } from '@/components/ui/VioletButton';
import { VioletCard } from '@/components/ui/VioletCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CloudStorageService, QRCodeData } from '@/lib/cloudStorageService';
import { PrintService } from '@/lib/printService';
import { QRCodeService, VehicleQRData } from '@/lib/qrCodeService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';

interface QRCodeGeneratorProps {
  vehicleData: Omit<VehicleQRData, 'vehicleId' | 'createdAt'>;
  onQRGenerated?: (qrData: VehicleQRData) => void;
}

export function QRCodeGenerator({ vehicleData, onQRGenerated }: QRCodeGeneratorProps) {
  const [qrString, setQrString] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToCloud, setSavedToCloud] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const primaryColor = useThemeColor({}, 'primary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  const generateQRCode = useCallback(() => {
    if (qrString) return; // Ne pas régénérer si déjà généré
    
    setIsGenerating(true);
    try {
      const { qrString: generatedQrString, vehicleId: generatedVehicleId } = QRCodeService.generateVehicleQRCode(vehicleData);
      setQrString(generatedQrString);
      setVehicleId(generatedVehicleId);
      
      // Notifier le parent que le QR code a été généré
      if (onQRGenerated) {
        const qrData: VehicleQRData = {
          ...vehicleData,
          vehicleId: generatedVehicleId,
          createdAt: new Date().toISOString(),
        };
        onQRGenerated(qrData);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le QR code');
      console.error('Erreur génération QR:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [vehicleData, onQRGenerated, qrString]);

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
      <VioletCard variant="light" style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            style={styles.loadingIcon}
          >
            <Ionicons name="qr-code" size={32} color="white" />
          </LinearGradient>
          <ThemedText style={styles.loadingText}>
            Génération du QR code...
          </ThemedText>
        </View>
      </VioletCard>
    );
  }

  if (!qrString) {
    return (
      <VioletCard variant="light" style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <ThemedText style={styles.errorText}>
            Impossible de générer le QR code
          </ThemedText>
          <VioletButton
            title="Réessayer"
            onPress={generateQRCode}
            variant="outline"
            size="small"
          />
        </View>
      </VioletCard>
    );
  }

  return (
    <VioletCard variant="light" style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          QR Code pour {vehicleData.vehicleName}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Collez ce QR code sur le pare-brise de votre véhicule
        </ThemedText>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          <QRCodeDisplay 
            value={qrString}
            size={200}
          />
        </View>
        <ThemedText style={styles.qrCodeText}>
          Code: {qrString}
        </ThemedText>
      </View>

      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <Ionicons name="print" size={20} color={primaryColor} />
          <ThemedText style={styles.instructionText}>
            Imprimez ce QR code
          </ThemedText>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="cut" size={20} color={primaryColor} />
          <ThemedText style={styles.instructionText}>
            Découpez-le aux dimensions
          </ThemedText>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="car" size={20} color={primaryColor} />
          <ThemedText style={styles.instructionText}>
            Collez-le sur le pare-brise
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <VioletButton
          title={savedToCloud ? "✓ Sauvegardé" : "Sauvegarder"}
          onPress={saveToCloud}
          variant={savedToCloud ? "accent" : "primary"}
          size="medium"
          disabled={isSaving || savedToCloud}
          style={styles.actionButton}
        />
        <VioletButton
          title="Télécharger"
          onPress={downloadQRCode}
          variant="outline"
          size="medium"
          disabled={isDownloading}
          style={styles.actionButton}
        />
      </View>
      
      <View style={styles.actions}>
        <VioletButton
          title="Partager"
          onPress={() => shareQRCode()}
          variant="outline"
          size="medium"
          style={styles.actionButton}
        />
        <VioletButton
          title={isPrinting ? "Impression..." : "Imprimer"}
          onPress={printQRCode}
          variant="accent"
          size="medium"
          disabled={isPrinting}
          style={styles.actionButton}
        />
      </View>
    </VioletCard>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  instructions: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
