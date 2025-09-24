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
    
    console.log('[QRCodeService] Génération QR code:', {
      vehicleId,
      ownerId: vehicleData.ownerId,
      qrString,
      vehicleName: vehicleData.vehicleName
    });
    
    return { qrString, vehicleId };
  }

  /**
   * Génère un QR code pour un véhicule existant (utilise l'ID existant)
   */
  static generateQRCodeForExistingVehicle(vehicleId: string, ownerId: string): string {
    const qrString = `notifcar:${vehicleId}:${ownerId}`;
    
    console.log('[QRCodeService] Génération QR code pour véhicule existant:', {
      vehicleId,
      ownerId,
      qrString
    });
    
    return qrString;
  }

  /**
   * Génère un ID unique pour le véhicule (UUID v4)
   */
  static generateUniqueVehicleId(): string {
    // Générer un UUID v4 simple
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Sauvegarde le QR code sur l'appareil
   */
  static async saveQRCodeToDevice(qrString: string, vehicleName: string): Promise<string> {
    try {
      // Utiliser l'API QR Server pour générer l'image du QR code
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}&format=png&color=000000&bgcolor=FFFFFF&margin=10&ecc=M`;
      
      // Créer un HTML simple avec le QR code
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              max-width: 300px;
            }
            .vehicle-name {
              font-size: 18px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 20px;
            }
            .qr-image {
              width: 200px;
              height: 200px;
              margin: 20px auto;
              border: 2px solid #E5E7EB;
              border-radius: 10px;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-text {
              font-family: monospace;
              font-size: 12px;
              color: #6B7280;
              background: #F9FAFB;
              padding: 10px;
              border-radius: 8px;
              word-break: break-all;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="vehicle-name">${vehicleName}</div>
            <div class="qr-image">
              <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 100%; max-height: 100%;" />
            </div>
            <div class="qr-text">${qrString}</div>
          </div>
        </body>
        </html>
      `;

      const fileName = `notifcar_${vehicleName.replace(/\s+/g, '_')}_${Date.now()}.html`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, html);
      
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
      console.log('Validation QR code:', qrString);
      console.log('Type:', typeof qrString);
      console.log('Longueur:', qrString.length);
      
      if (!qrString || typeof qrString !== 'string') {
        console.log('QR code vide ou pas une string');
        return { isValid: false };
      }

      if (!qrString.startsWith('notifcar:')) {
        console.log('Ne commence pas par notifcar:');
        return { isValid: false };
      }

      const parts = qrString.split(':');
      console.log('Parties après split:', parts);
      console.log('Nombre de parties:', parts.length);
      
      // Helper: validation simple d'un UUID v4
      const isUuid = (value: string | undefined): boolean => {
        if (!value) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
      };

      let vehicleId: string | undefined;
      let ownerId: string | undefined;

      if (parts.length === 3) {
        [, vehicleId, ownerId] = parts;
      } else if (parts.length === 5 && parts[0] === 'notifcar' && parts[1] === 'notifcar') {
        // Format toléré: notifcar:notifcar:<vehicleId>:<ownerId>:<ownerId>
        const candVehicle = parts[2];
        const candOwner1 = parts[3];
        const candOwner2 = parts[4];
        if (isUuid(candVehicle) && isUuid(candOwner1) && candOwner1 === candOwner2) {
          vehicleId = candVehicle;
          ownerId = candOwner1;
        }
      } else {
        // Tentative de normalisation générique: prendre les 2 premiers UUIDs après le premier segment "notifcar"
        const uuidCandidates = parts.slice(1).filter(isUuid);
        if (uuidCandidates.length >= 2) {
          vehicleId = uuidCandidates[0];
          ownerId = uuidCandidates[1];
        }
      }

      if (!vehicleId || !ownerId) {
        console.log('Impossible d\'extraire vehicleId/ownerId');
        return { isValid: false };
      }

      console.log('Vehicle ID extrait:', vehicleId);
      console.log('Owner ID extrait:', ownerId);
      
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

  /**
   * Partage le QR code
   */
  static async shareQRCode(vehicleId: string): Promise<void> {
    try {
      const { Share } = await import('react-native');
      
      await Share.share({
        message: `QR Code NotifCar - Véhicule ID: ${vehicleId}\n\nScannez ce code pour accéder aux informations du véhicule.`,
        title: 'QR Code NotifCar',
      });
    } catch (error) {
      console.error('Erreur lors du partage du QR code:', error);
      throw new Error('Impossible de partager le QR code');
    }
  }
}
