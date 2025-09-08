import { supabase } from './supabase';

export interface SignalNotification {
  id: string;
  conversation_id: string;
  vehicle_id: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_license_plate?: string;
  sender_id: string;
  sender_email?: string;
  sender_display_name?: string;
  message_content: string;
  created_at: string;
  is_read: boolean;
  urgency_level?: 'urgent' | 'important' | 'normal';
  reason_type?: string;
  vehicle_issue?: string;
}

export class NotificationHistoryService {
  /**
   * Récupère l'historique des signalisations reçues par l'utilisateur
   */
  static async getUserSignalNotifications(userId: string): Promise<SignalNotification[]> {
    try {
      // Récupérer les conversations où l'utilisateur est le propriétaire du véhicule
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          vehicle_id,
          vehicle_brand,
          vehicle_model,
          vehicle_license_plate,
          owner_id,
          other_participant_id,
          other_participant_email,
          created_at
        `)
        .eq('owner_id', userId);

      if (conversationsError) {
        console.error('Erreur récupération conversations:', conversationsError);
        return [];
      }

      if (!conversations || conversations.length === 0) {
        return [];
      }

      // Récupérer les messages de ces conversations
      const conversationIds = conversations.map(conv => conv.id);
      
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          metadata,
          created_at,
          is_read
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Erreur récupération messages:', messagesError);
        return [];
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // Récupérer les profils des expéditeurs
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, username, email')
        .in('id', senderIds);

      if (profilesError) {
        console.error('Erreur récupération profils:', profilesError);
      }

      // Combiner les données
      const notifications: SignalNotification[] = messages.map(message => {
        const conversation = conversations.find(conv => conv.id === message.conversation_id);
        const profile = profiles?.find(prof => prof.id === message.sender_id);
        
        // Parser le message pour extraire les informations structurées
        const parsedContent = this.parseStructuredMessage(message.content, message.metadata);
        
        return {
          id: message.id,
          conversation_id: message.conversation_id,
          vehicle_id: conversation?.vehicle_id || '',
          vehicle_brand: conversation?.vehicle_brand,
          vehicle_model: conversation?.vehicle_model,
          vehicle_license_plate: conversation?.vehicle_license_plate,
          sender_id: message.sender_id,
          sender_email: profile?.email || conversation?.other_participant_email,
          sender_display_name: profile?.display_name || profile?.full_name || profile?.username,
          message_content: message.content,
          created_at: message.created_at,
          is_read: message.is_read || false,
          urgency_level: parsedContent.urgency,
          reason_type: parsedContent.reason,
          vehicle_issue: parsedContent.vehicleIssue,
        };
      });

      return notifications;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * Parse un message structuré pour extraire les informations
   */
  private static parseStructuredMessage(content: string, metadata?: any): {
    reason?: string;
    vehicleIssue?: string;
    urgency?: 'urgent' | 'important' | 'normal';
    customMessage?: string;
  } {
    const result: any = {};

    // Si on a des métadonnées du formulaire, les utiliser en priorité
    if (metadata?.formData) {
      const formData = metadata.formData;
      result.reason = formData.reason;
      result.customMessage = formData.customReason || formData.customMessage;
      result.vehicleIssue = formData.vehicleIssue;
      result.urgency = formData.urgency;
      return result;
    }

    // Sinon, parser le contenu textuel (méthode de fallback)
    // Extraire la raison
    const reasonMatch = content.match(/\*\*Raison du scan:\*\* (.+?)(?:\n|$)/);
    if (reasonMatch) {
      result.reason = reasonMatch[1];
    }

    // Extraire les détails personnalisés
    const detailsMatch = content.match(/\*\*Détails:\*\* (.+?)(?:\n|$)/);
    if (detailsMatch) {
      result.customMessage = detailsMatch[1];
    }

    // Extraire le problème du véhicule
    const vehicleIssueMatch = content.match(/\*\*Problème observé:\*\* (.+?)(?:\n|$)/);
    if (vehicleIssueMatch) {
      result.vehicleIssue = vehicleIssueMatch[1];
    }

    // Extraire le niveau d'urgence
    const urgencyMatch = content.match(/\*\*Niveau d'urgence:\*\* (.+?)(?:\n|$)/);
    if (urgencyMatch) {
      const urgencyText = urgencyMatch[1].toLowerCase();
      if (urgencyText.includes('urgent')) {
        result.urgency = 'urgent';
      } else if (urgencyText.includes('important')) {
        result.urgency = 'important';
      } else {
        result.urgency = 'normal';
      }
    }

    // Extraire le message personnalisé
    const messageMatch = content.match(/\*\*Message:\*\* (.+?)(?:\n|$)/);
    if (messageMatch) {
      result.customMessage = messageMatch[1];
    }

    return result;
  }

  /**
   * Marque une notification comme lue
   */
  static async markNotificationAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        console.error('Erreur marquage message lu:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur marquage message lu:', error);
      return false;
    }
  }

  /**
   * Supprime une notification (supprime le message)
   */
  static async deleteNotification(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Erreur suppression message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression message:', error);
      return false;
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  static async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      // Récupérer les conversations de l'utilisateur
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('owner_id', userId);

      if (!conversations || conversations.length === 0) {
        return true;
      }

      const conversationIds = conversations.map(conv => conv.id);

      // Marquer tous les messages comme lus
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('conversation_id', conversationIds);

      if (error) {
        console.error('Erreur marquage tous messages lus:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur marquage tous messages lus:', error);
      return false;
    }
  }
}
