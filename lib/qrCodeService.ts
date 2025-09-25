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
          <title>QR Code NotifCar - ${vehicleName}</title>
          <style>
            body { margin: 0; padding: 28px; background: #F1F5F9; font-family: Inter, Arial, sans-serif; color: #0F172A; }
            .sheet { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 24px; box-shadow: 0 12px 30px rgba(15,23,42,0.12); border: 1px solid #E2E8F0; }
            .header { padding: 26px 26px 18px 26px; border-bottom: 1px solid #EEF2FF; background: linear-gradient(180deg, rgba(38,51,225,0.06) 0%, rgba(38,51,225,0) 100%); border-top-left-radius: 24px; border-top-right-radius: 24px; text-align: center; }
            .brand { font-size: 30px; font-weight: 900; color: #2633E1; letter-spacing: .2px; }
            .vehicle-name { font-size: 22px; font-weight: 800; color: #0F172A; margin: 8px 0 4px 0; }
            .subtitle { font-size: 14px; color: #475569; }
            .body { padding: 26px; }
            .qr-container { background: #F8FAFC; border-radius: 18px; padding: 22px; margin: 22px 0; border: 2px dashed #E2E8F0; text-align: center; }
            .qr-image { width: 260px; height: 260px; margin: 0 auto 16px auto; border-radius: 16px; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 22px rgba(2,6,23,0.08); border: 1px solid #E2E8F0; }
            .qr-image img { max-width: 100%; max-height: 100%; border-radius: 12px; }
            .badge { display: inline-block; padding: 8px 12px; border-radius: 999px; background: #EEF2FF; color: #2633E1; font-weight: 700; font-size: 11px; letter-spacing: 0.3px; }
            .qr-text { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: #0F172A; background: #ffffff; padding: 12px 14px; border-radius: 12px; border: 1px solid #E2E8F0; white-space: nowrap; overflow-x: auto; word-break: normal; }
            .footer { margin: 18px 26px 26px 26px; padding-top: 14px; border-top: 1px solid #E2E8F0; color: #475569; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="brand">🚗 NotifCar</div>
              <div class="vehicle-name">${vehicleName}</div>
              <div class="subtitle">QR Code de sécurité</div>
            </div>
            <div class="body">
              <div class="qr-container">
                <div class="qr-image">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                </div>
                <div style="margin: 8px 0 10px 0; color:#64748B; font-size:12px;">Scannez pour contacter le propriétaire</div>
                <div class="badge">CHAÎNE</div>
                <div class="qr-text">${qrString}</div>
              </div>
              <div style="display:flex; gap:10px; justify-content:center; margin-top:6px;">
                <div style="background:#EEF2FF; color:#2633E1; padding:8px 12px; border-radius:10px; font-weight:700; font-size:11px;">notifcar</div>
                <div style="background:#ECFDF5; color:#065F46; padding:8px 12px; border-radius:10px; font-weight:700; font-size:11px;">sécurisé</div>
              </div>
            </div>
            <div class="footer">
              Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </div>
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
