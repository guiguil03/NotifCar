import * as FileSystem from 'expo-file-system';

export interface VehicleQRData {
  vehicleId: string;
  vehicleName: string;
  ownerId: string;
  createdAt: string;
  type: 'notifcar';
}

export class QRCodeService {
  /**
   * Génère un QR code unique pour un véhicule
   */
  static generateVehicleQRCode(vehicleData: Omit<VehicleQRData, 'vehicleId' | 'createdAt'>): { qrString: string; vehicleId: string } {
    const vehicleId = this.generateUniqueVehicleId();
    const qrString = `notifcar:${vehicleId}:${vehicleData.ownerId}`;
    
    return { qrString, vehicleId };
  }

  /**
   * Génère un ID unique pour le véhicule
   */
  static generateUniqueVehicleId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `VH${timestamp}${random}`.toUpperCase();
  }

  /**
   * Sauvegarde le QR code sur l'appareil
   */
  static async saveQRCodeToDevice(qrString: string, vehicleName: string): Promise<string> {
    try {
      const fileName = `notifcar_${vehicleName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, qrString);
      
      return filePath;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du QR code:', error);
      throw new Error('Impossible de sauvegarder le QR code');
    }
  }

  /**
   * Valide un QR code scanné
   */
  static validateQRCode(qrString: string): { isValid: boolean; vehicleId?: string; ownerId?: string } {
    try {
      if (!qrString.startsWith('notifcar:')) {
        return { isValid: false };
      }

      const parts = qrString.split(':');
      if (parts.length !== 3) {
        return { isValid: false };
      }

      const [, vehicleId, ownerId] = parts;
      
      return {
        isValid: true,
        vehicleId,
        ownerId,
      };
    } catch (error) {
      console.error('Erreur lors de la validation du QR code:', error);
      return { isValid: false };
    }
  }
}
