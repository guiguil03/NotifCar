import { NotificationService } from './notificationService';
import { ProfileService } from './profileService';
import { supabase } from './supabase';

export interface Signalization {
  id: string;
  created_at: string;
  reporter_id: string;
  vehicle_id: string;
  reason_type: 'stationnement_genant' | 'probleme_technique' | 'accident' | 'vehicule_abandonne' | 'autre';
  custom_reason?: string;
  vehicle_issue?: string;
  urgency_level: 'urgent' | 'important' | 'normal';
  custom_message?: string;
  status: 'active' | 'resolved' | 'closed';
  conversation_id?: string;
  // Informations du véhicule
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_license_plate?: string;
  // Informations du rapporteur
  reporter_display_name?: string;
  reporter_email?: string;
}

export interface CreateSignalizationData {
  vehicle_id: string;
  reason_type: 'stationnement_genant' | 'probleme_technique' | 'accident' | 'vehicule_abandonne' | 'autre';
  custom_reason?: string;
  vehicle_issue?: string;
  urgency_level: 'urgent' | 'important' | 'normal';
  custom_message?: string;
  conversation_id?: string;
}

export class SignalizationService {
  /**
   * Créer une nouvelle signalisation
   */
  static async createSignalization(data: CreateSignalizationData): Promise<Signalization> {
    try {
      const { data: result, error } = await supabase
        .rpc('create_signalization', {
          p_vehicle_id: data.vehicle_id,
          p_reason_type: data.reason_type,
          p_custom_reason: data.custom_reason || null,
          p_vehicle_issue: data.vehicle_issue || null,
          p_urgency_level: data.urgency_level,
          p_custom_message: data.custom_message || null,
          p_conversation_id: data.conversation_id || null,
        })
        .single();

      if (error) {
        console.error('Erreur création signalisation:', error);
        throw error;
      }

      // Récupérer la signalisation créée avec toutes les informations
      const signalization = await this.getSignalizationById(result);
      if (!signalization) {
        throw new Error('Signalisation créée mais impossible à récupérer');
      }

      // Envoyer une notification au propriétaire du véhicule
      try {
        await this.sendVehicleAlertNotification(signalization);
      } catch (notificationError) {
        console.error('Erreur envoi notification signalisation:', notificationError);
        // Ne pas faire échouer la création si la notification échoue
      }

      return signalization;
    } catch (error) {
      console.error('Erreur création signalisation:', error);
      throw new Error('Impossible de créer la signalisation');
    }
  }

  /**
   * Envoyer une notification d'alerte de véhicule
   */
  private static async sendVehicleAlertNotification(signalization: Signalization): Promise<void> {
    try {
      // Récupérer les informations du véhicule
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('owner_id, brand, model, license_plate')
        .eq('id', signalization.vehicle_id)
        .single();

      if (!vehicleData) {
        console.log('Véhicule non trouvé pour la notification');
        return;
      }

      // Récupérer le nom d'affichage du rapporteur
      const reporterName = await ProfileService.getDisplayNameForMessage(signalization.reporter_id);

      // Créer les informations du véhicule
      const vehicleInfo = vehicleData.brand && vehicleData.model
        ? `${vehicleData.brand} ${vehicleData.model}`
        : vehicleData.license_plate || 'votre véhicule';

      // Envoyer la notification d'alerte
      await NotificationService.notifyVehicleAlert(
        vehicleData.owner_id,
        reporterName,
        vehicleInfo,
        signalization.reason_type,
        signalization.urgency_level,
        signalization.conversation_id || '',
        signalization.custom_message
      );

      console.log('Notification d\'alerte véhicule envoyée avec succès');
    } catch (error) {
      console.error('Erreur envoi notification alerte véhicule:', error);
      throw error;
    }
  }

  /**
   * Récupérer une signalisation par son ID
   */
  static async getSignalizationById(signalizationId: string): Promise<Signalization | null> {
    try {
      const { data, error } = await supabase
        .from('signalizations')
        .select(`
          id,
          created_at,
          reporter_id,
          vehicle_id,
          reason_type,
          custom_reason,
          vehicle_issue,
          urgency_level,
          custom_message,
          status,
          conversation_id,
          vehicles!inner(brand, model, license_plate)
        `)
        .eq('id', signalizationId)
        .single();

      if (error) {
        console.error('Erreur récupération signalisation:', error);
        return null;
      }

      // Récupérer les informations du rapporteur depuis auth.users
      const { data: userData } = await supabase.auth.getUser();
      const reporterEmail = userData?.user?.email || 'Utilisateur inconnu';
      const reporterDisplayName = reporterEmail.split('@')[0];

      return this.mapSignalizationFromDB({
        ...data,
        profiles: {
          display_name: reporterDisplayName,
          email: reporterEmail
        }
      });
    } catch (error) {
      console.error('Erreur récupération signalisation:', error);
      return null;
    }
  }

  /**
   * Récupérer les signalisations d'un utilisateur (qu'il a créées)
   */
  static async getUserSignalizations(userId: string): Promise<Signalization[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_signalizations', { p_user_id: userId });

      if (error) {
        console.error('Erreur récupération signalisations utilisateur:', error);
        throw error;
      }

      // Récupérer les informations du rapporteur
      const { data: userData } = await supabase.auth.getUser();
      const reporterEmail = userData?.user?.email || 'Utilisateur inconnu';
      const reporterDisplayName = reporterEmail.split('@')[0];

      return data.map(item => this.mapSignalizationFromRPC({
        ...item,
        reporter_display_name: reporterDisplayName,
        reporter_email: reporterEmail
      }));
    } catch (error) {
      console.error('Erreur récupération signalisations utilisateur:', error);
      throw new Error('Impossible de récupérer les signalisations');
    }
  }

  /**
   * Récupérer les signalisations reçues (pour les propriétaires de véhicules)
   */
  static async getReceivedSignalizations(userId: string): Promise<Signalization[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_received_signalizations', { p_user_id: userId });

      if (error) {
        console.error('Erreur récupération signalisations reçues:', error);
        throw error;
      }

      // Récupérer les informations du rapporteur depuis auth.users
      const { data: userData } = await supabase.auth.getUser();
      const reporterEmail = userData?.user?.email || 'Utilisateur inconnu';
      const reporterDisplayName = reporterEmail.split('@')[0];

      return data.map(item => this.mapSignalizationFromRPC({
        ...item,
        reporter_display_name: reporterDisplayName,
        reporter_email: reporterEmail
      }));
    } catch (error) {
      console.error('Erreur récupération signalisations reçues:', error);
      throw new Error('Impossible de récupérer les signalisations reçues');
    }
  }

  /**
   * Mettre à jour le statut d'une signalisation
   */
  static async updateSignalizationStatus(
    signalizationId: string, 
    status: 'active' | 'resolved' | 'closed'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('signalizations')
        .update({ status })
        .eq('id', signalizationId);

      if (error) {
        console.error('Erreur mise à jour statut signalisation:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur mise à jour statut signalisation:', error);
      throw new Error('Impossible de mettre à jour le statut');
    }
  }

  /**
   * Mettre à jour l'ID de conversation d'une signalisation
   */
  static async updateSignalizationConversation(
    signalizationId: string, 
    conversationId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('signalizations')
        .update({ conversation_id: conversationId })
        .eq('id', signalizationId);

      if (error) {
        console.error('Erreur mise à jour conversation signalisation:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur mise à jour conversation signalisation:', error);
      throw new Error('Impossible de mettre à jour la conversation');
    }
  }

  /**
   * Supprimer une signalisation
   */
  static async deleteSignalization(signalizationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('signalizations')
        .delete()
        .eq('id', signalizationId);

      if (error) {
        console.error('Erreur suppression signalisation:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression signalisation:', error);
      throw new Error('Impossible de supprimer la signalisation');
    }
  }

  /**
   * Obtenir les statistiques des signalisations
   */
  static async getSignalizationStats(userId: string): Promise<{
    total: number;
    urgent: number;
    important: number;
    normal: number;
    active: number;
    resolved: number;
    closed: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('signalizations')
        .select('urgency_level, status')
        .eq('reporter_id', userId);

      if (error) {
        console.error('Erreur récupération statistiques:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        urgent: data.filter(s => s.urgency_level === 'urgent').length,
        important: data.filter(s => s.urgency_level === 'important').length,
        normal: data.filter(s => s.urgency_level === 'normal').length,
        active: data.filter(s => s.status === 'active').length,
        resolved: data.filter(s => s.status === 'resolved').length,
        closed: data.filter(s => s.status === 'closed').length,
      };

      return stats;
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  }

  /**
   * Mapper les données de la DB vers l'interface Signalization
   */
  private static mapSignalizationFromDB(data: any): Signalization {
    return {
      id: data.id,
      created_at: data.created_at,
      reporter_id: data.reporter_id,
      vehicle_id: data.vehicle_id,
      reason_type: data.reason_type,
      custom_reason: data.custom_reason,
      vehicle_issue: data.vehicle_issue,
      urgency_level: data.urgency_level,
      custom_message: data.custom_message,
      status: data.status,
      conversation_id: data.conversation_id,
      vehicle_brand: data.vehicles?.brand,
      vehicle_model: data.vehicles?.model,
      vehicle_license_plate: data.vehicles?.license_plate,
      reporter_display_name: data.profiles?.display_name,
      reporter_email: data.profiles?.email,
    };
  }

  /**
   * Mapper les données de la RPC vers l'interface Signalization
   */
  private static mapSignalizationFromRPC(data: any): Signalization {
    return {
      id: data.id,
      created_at: data.created_at,
      reporter_id: data.reporter_id,
      vehicle_id: data.vehicle_id,
      reason_type: data.reason_type,
      custom_reason: data.custom_reason,
      vehicle_issue: data.vehicle_issue,
      urgency_level: data.urgency_level,
      custom_message: data.custom_message,
      status: data.status,
      conversation_id: data.conversation_id,
      vehicle_brand: data.vehicle_brand,
      vehicle_model: data.vehicle_model,
      vehicle_license_plate: data.vehicle_license_plate,
      reporter_display_name: data.reporter_display_name,
      reporter_email: data.reporter_email,
    };
  }
}
