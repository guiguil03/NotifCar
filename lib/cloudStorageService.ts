import { supabase } from './supabase';

export interface QRCodeData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  ownerId: string;
  qrString: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export class CloudStorageService {
  /**
   * Sauvegarde un QR code dans le bucket Supabase
   */
  static async saveQRCodeToBucket(qrData: QRCodeData): Promise<string> {
    try {
      // Créer un nom de fichier unique
      const fileName = `qr-codes/${qrData.vehicleId}_${Date.now()}.txt`;
      
      // Sauvegarder le QR code string dans le bucket QRCodec
      const { data, error } = await supabase.storage
        .from('QRCodec')
        .upload(fileName, qrData.qrString, {
          contentType: 'text/plain',
          upsert: false
        });

      if (error) {
        console.error('Erreur upload bucket:', error);
        throw new Error('Impossible de sauvegarder le QR code dans le cloud');
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('QRCodec')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur CloudStorageService:', error);
      throw new Error('Impossible de sauvegarder le QR code');
    }
  }

  /**
   * Sauvegarde les métadonnées du QR code en base de données
   */
  static async saveQRCodeMetadata(qrData: QRCodeData, qrCodeUrl: string): Promise<QRCodeData> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          id: qrData.id,
          vehicle_id: qrData.vehicleId,
          vehicle_name: qrData.vehicleName,
          owner_id: qrData.ownerId,
          qr_string: qrData.qrString,
          qr_code_url: qrCodeUrl,
          created_at: qrData.createdAt,
          updated_at: qrData.updatedAt,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur sauvegarde métadonnées:', error);
        throw new Error('Impossible de sauvegarder les métadonnées');
      }

      return {
        id: data.id,
        vehicleId: data.vehicle_id,
        vehicleName: data.vehicle_name,
        ownerId: data.owner_id,
        qrString: data.qr_string,
        qrCodeUrl: data.qr_code_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Erreur CloudStorageService metadata:', error);
      throw new Error('Impossible de sauvegarder les métadonnées');
    }
  }

  /**
   * Récupère tous les QR codes d'un utilisateur
   */
  static async getUserQRCodes(ownerId: string): Promise<QRCodeData[]> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération QR codes:', error);
        throw new Error('Impossible de récupérer les QR codes');
      }

      return data.map(item => ({
        id: item.id,
        vehicleId: item.vehicle_id,
        vehicleName: item.vehicle_name,
        ownerId: item.owner_id,
        qrString: item.qr_string,
        qrCodeUrl: item.qr_code_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (error) {
      console.error('Erreur CloudStorageService getUserQRCodes:', error);
      throw new Error('Impossible de récupérer les QR codes');
    }
  }

  /**
   * Supprime un QR code du bucket et de la base de données
   */
  static async deleteQRCode(qrCodeId: string, vehicleId: string): Promise<void> {
    try {
      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrCodeId);

      if (dbError) {
        console.error('Erreur suppression DB:', dbError);
        throw new Error('Impossible de supprimer de la base de données');
      }

      // Supprimer du bucket (optionnel, car les fichiers peuvent être conservés)
      const fileName = `qr-codes/${vehicleId}_*.txt`;
      const { error: storageError } = await supabase.storage
        .from('QRCodec')
        .remove([fileName]);

      if (storageError) {
        console.warn('Avertissement suppression bucket:', storageError);
        // Ne pas faire échouer la suppression si le fichier n'existe pas
      }
    } catch (error) {
      console.error('Erreur CloudStorageService deleteQRCode:', error);
      throw new Error('Impossible de supprimer le QR code');
    }
  }

  /**
   * Génère un ID unique pour le QR code
   */
  static generateQRCodeId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
