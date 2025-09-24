import { QRCodeService } from './qrCodeService';
import { supabase } from './supabase';

export interface Vehicle {
  id: string;
  name: string; // Sera généré à partir de brand + model
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  notes?: string;
  ownerId: string;
  qrCodeId?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export class VehicleService {
  /**
   * Crée un nouveau véhicule en base de données
   */
  static async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    try {
      console.log('Création véhicule avec données:', vehicleData);
      
      // Générer un nom à partir de brand + model si pas fourni
      const vehicleName = vehicleData.name || `${vehicleData.brand} ${vehicleData.model}`;
      
      // Générer un ID unique pour le véhicule
      const vehicleId = QRCodeService.generateUniqueVehicleId();
      
      // Générer le QR code avec l'ID du véhicule
      const qrString = QRCodeService.generateQRCodeForExistingVehicle(vehicleId, vehicleData.ownerId);
      
      console.log('[VehicleService] Création véhicule avec QR code:', {
        vehicleId,
        qrString,
        ownerId: vehicleData.ownerId
      });
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          id: vehicleId,
          owner_id: vehicleData.ownerId,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          license_plate: vehicleData.licensePlate,
          color: vehicleData.color || null,
          notes: vehicleData.notes || null,
          qr_code: qrString, // Utiliser le QR code généré avec le bon ID
          is_active: vehicleData.isActive ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création véhicule:', error);
        throw new Error(`Impossible de créer le véhicule: ${error.message}`);
      }

      console.log('Véhicule créé avec succès:', data);

      return {
        id: data.id,
        name: vehicleName,
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.license_plate,
        color: data.color,
        notes: data.notes,
        ownerId: data.owner_id,
        qrCodeId: data.qr_code,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Erreur VehicleService createVehicle:', error);
      throw new Error(`Impossible de créer le véhicule: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère tous les véhicules d'un utilisateur
   */
  static async getUserVehicles(ownerId: string): Promise<Vehicle[]> {
    try {
      console.log('Récupération véhicules pour ownerId:', ownerId);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération véhicules:', error);
        throw new Error(`Impossible de récupérer les véhicules: ${error.message}`);
      }

      console.log('Véhicules récupérés:', data);

      return data.map(item => ({
        id: item.id,
        name: `${item.brand} ${item.model}`, // Générer le nom à partir de brand + model
        brand: item.brand,
        model: item.model,
        year: item.year,
        licensePlate: item.license_plate,
        color: item.color,
        notes: item.notes,
        ownerId: item.owner_id,
        qrCodeId: item.qr_code,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (error) {
      console.error('Erreur VehicleService getUserVehicles:', error);
      throw new Error(`Impossible de récupérer les véhicules: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un véhicule
   */
  static async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.brand) updateData.brand = updates.brand;
      if (updates.model) updateData.model = updates.model;
      if (updates.year) updateData.year = updates.year;
      if (updates.licensePlate) updateData.license_plate = updates.licensePlate;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.qrCodeId !== undefined) updateData.qr_code = updates.qrCodeId;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour véhicule:', error);
        throw new Error('Impossible de mettre à jour le véhicule');
      }

      return {
        id: data.id,
        name: `${data.brand} ${data.model}`, // Générer le nom à partir de brand + model
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.license_plate,
        color: data.color,
        notes: data.notes,
        ownerId: data.owner_id,
        qrCodeId: data.qr_code,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Erreur VehicleService updateVehicle:', error);
      throw new Error('Impossible de mettre à jour le véhicule');
    }
  }

  /**
   * Supprime un véhicule
   */
  static async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        console.error('Erreur suppression véhicule:', error);
        throw new Error('Impossible de supprimer le véhicule');
      }
    } catch (error) {
      console.error('Erreur VehicleService deleteVehicle:', error);
      throw new Error('Impossible de supprimer le véhicule');
    }
  }

  /**
   * Lie un QR code à un véhicule
   */
  static async linkQRCodeToVehicle(vehicleId: string, qrCodeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          qr_code: qrCodeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) {
        console.error('Erreur liaison QR code:', error);
        throw new Error('Impossible de lier le QR code au véhicule');
      }
    } catch (error) {
      console.error('Erreur VehicleService linkQRCodeToVehicle:', error);
      throw new Error('Impossible de lier le QR code au véhicule');
    }
  }

  /**
   * Régénère le QR code d'un véhicule existant
   */
  static async regenerateQRCode(vehicleId: string): Promise<string> {
    try {
      // Récupérer les infos du véhicule
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('id, owner_id')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !vehicle) {
        throw new Error('Véhicule non trouvé');
      }

      // Générer le nouveau QR code avec le bon ID
      const qrString = QRCodeService.generateQRCodeForExistingVehicle(vehicleId, vehicle.owner_id);

      // Mettre à jour le véhicule avec le nouveau QR code
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          qr_code: qrString,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (updateError) {
        throw new Error('Impossible de mettre à jour le QR code');
      }

      console.log('[VehicleService] QR code régénéré:', {
        vehicleId,
        qrString
      });

      return qrString;
    } catch (error) {
      console.error('Erreur VehicleService regenerateQRCode:', error);
      throw new Error('Impossible de régénérer le QR code');
    }
  }

  /**
   * Recherche un véhicule par son QR code
   */
  static async getVehicleByQRCode(qrCode: string): Promise<Vehicle | null> {
    try {
      console.log('[VehicleService] Recherche véhicule par QR code:', qrCode);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('qr_code', qrCode)
        .maybeSingle();

      if (error) {
        console.error('Erreur recherche véhicule par QR code:', error);
        throw new Error(`Impossible de rechercher le véhicule: ${error.message}`);
      }

      if (!data) {
        console.log('Aucun véhicule trouvé avec ce QR code');
        return null;
      }

      console.log('Véhicule trouvé par QR code:', {
        id: data.id,
        brand: data.brand,
        model: data.model,
        qr_code: data.qr_code
      });

      return {
        id: data.id,
        name: `${data.brand} ${data.model}`,
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.license_plate,
        color: data.color,
        notes: data.notes,
        ownerId: data.owner_id,
        qrCodeId: data.qr_code,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Erreur VehicleService getVehicleByQRCode:', error);
      throw new Error(`Impossible de rechercher le véhicule: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche un véhicule par son ID
   */
  static async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    try {
      console.log('[VehicleService] Recherche véhicule par ID:', vehicleId);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

      if (error) {
        console.error('Erreur recherche véhicule par ID:', error);
        throw new Error(`Impossible de rechercher le véhicule: ${error.message}`);
      }

      if (!data) {
        console.log('Aucun véhicule trouvé avec cet ID');
        return null;
      }

      console.log('Véhicule trouvé par ID:', {
        id: data.id,
        brand: data.brand,
        model: data.model,
        qr_code: data.qr_code
      });

      return {
        id: data.id,
        name: `${data.brand} ${data.model}`,
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.license_plate,
        color: data.color,
        notes: data.notes,
        ownerId: data.owner_id,
        qrCodeId: data.qr_code,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Erreur VehicleService getVehicleById:', error);
      throw new Error(`Impossible de rechercher le véhicule: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

}
