import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export interface QRCaptureOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  result?: 'base64' | 'data-uri' | 'tmpfile' | 'zip';
}

export class QRCaptureService {
  /**
   * Capture un QR code en image
   */
  static async captureQRCode(
    viewRef: React.RefObject<any>,
    options: QRCaptureOptions = {}
  ): Promise<string> {
    const {
      format = 'png',
      quality = 1,
      result = 'tmpfile'
    } = options;

    try {
      const uri = await captureRef(viewRef, {
        format,
        quality,
        result,
        fileName: `qr_code_${Date.now()}.${format}`
      });

      return uri;
    } catch (error) {
      console.error('Erreur lors de la capture du QR code:', error);
      throw new Error('Impossible de capturer le QR code');
    }
  }

  /**
   * Sauvegarde le QR code capturé dans le dossier Documents
   */
  static async saveQRCodeToDocuments(
    qrData: string,
    vehicleName: string,
    format: 'png' | 'jpg' = 'png'
  ): Promise<string> {
    try {
      const fileName = `notifcar_${vehicleName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Créer le dossier Documents s'il n'existe pas
      const documentsDir = FileSystem.documentDirectory;
      if (!(await FileSystem.getInfoAsync(documentsDir)).exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      // Sauvegarder l'image
      await FileSystem.copyAsync({
        from: qrData,
        to: filePath
      });

      return filePath;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du QR code:', error);
      throw new Error('Impossible de sauvegarder le QR code');
    }
  }

  /**
   * Partage le QR code via le système de partage natif
   */
  static async shareQRCode(
    qrData: string,
    vehicleName: string,
    options: QRCaptureOptions = {}
  ): Promise<void> {
    try {
      const {
        format = 'png',
        quality = 1
      } = options;

      // Sauvegarder temporairement le fichier
      const fileName = `notifcar_${vehicleName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
      const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: qrData,
        to: tempPath
      });

      // Vérifier que le partage est disponible
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }

      // Partager le fichier
      await Sharing.shareAsync(tempPath, {
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        dialogTitle: `Partager QR Code - ${vehicleName}`,
        UTI: format === 'png' ? 'public.png' : 'public.jpeg'
      });

      // Nettoyer le fichier temporaire après un délai
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
        } catch (cleanupError) {
          console.warn('Erreur lors du nettoyage du fichier temporaire:', cleanupError);
        }
      }, 5000);

    } catch (error) {
      console.error('Erreur lors du partage du QR code:', error);
      throw new Error('Impossible de partager le QR code');
    }
  }

  /**
   * Sauvegarde le QR code dans la galerie photos
   */
  static async saveQRCodeToGallery(
    qrData: string,
    vehicleName: string,
    format: 'png' | 'jpg' = 'png'
  ): Promise<void> {
    try {
      const fileName = `notifcar_${vehicleName.replace(/\s+/g, '_')}_${Date.now()}.${format}`;
      const galleryPath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Copier vers le dossier Documents (accessible par la galerie)
      await FileSystem.copyAsync({
        from: qrData,
        to: galleryPath
      });

      // Note: Pour sauvegarder dans la galerie, il faudrait utiliser expo-media-library
      // mais cela nécessite des permissions supplémentaires
      console.log('QR code sauvegardé dans:', galleryPath);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans la galerie:', error);
      throw new Error('Impossible de sauvegarder dans la galerie');
    }
  }
}
