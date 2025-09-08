import { QRCodeService } from './qrCodeService';
import { supabase } from './supabase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'location' | 'system';
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  vehicleId: string;
  ownerId: string;
  reporterId: string;
  status: 'active' | 'resolved' | 'closed';
  subject?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  // Détails du véhicule
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  // Détails de l'autre participant
  otherParticipantId?: string;
  otherParticipantEmail?: string;
  // Dernier message
  lastMessageContent?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface CreateConversationData {
  vehicleId: string;
  reporterId: string;
  subject?: string;
  initialMessage?: string;
}

export class ChatService {
  // Créer une nouvelle conversation
  static async createConversation(data: CreateConversationData): Promise<Conversation> {
    try {
      // Valider le QR code et extraire l'ID du propriétaire
      const qrValidation = QRCodeService.validateQRCode(data.vehicleId);
      
      if (!qrValidation.isValid || !qrValidation.ownerId) {
        throw new Error('QR code invalide. Assurez-vous de scanner un QR code NotifCar valide.');
      }

      // Vérifier qu'on ne crée pas une conversation avec soi-même
      if (qrValidation.ownerId === data.reporterId) {
        throw new Error('Vous ne pouvez pas signaler un problème sur votre propre véhicule.');
      }

      // Chercher le véhicule par son QR code pour obtenir les détails
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, owner_id, brand, model, license_plate')
        .eq('qr_code', data.vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Véhicule non trouvé. Le QR code semble valide mais le véhicule n\'existe plus.');
      }

      // Vérifier que l'ID du propriétaire correspond
      if (vehicle.owner_id !== qrValidation.ownerId) {
        throw new Error('Erreur de sécurité : le propriétaire du QR code ne correspond pas au véhicule.');
      }

      // Créer la conversation avec le propriétaire du véhicule
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          vehicle_id: vehicle.id,
          owner_id: qrValidation.ownerId, // L'ID du propriétaire extrait du QR code
          reporter_id: data.reporterId, // L'utilisateur qui scanne
          subject: data.subject || 'Problème signalé via QR Code',
        })
        .select(`
          *,
          vehicles!inner(brand, model, license_plate)
        `)
        .single();

      if (error) throw error;

      // Ajouter le message initial si fourni
      if (data.initialMessage) {
        await this.sendMessage({
          conversationId: conversation.id,
          content: data.initialMessage,
          messageType: 'text',
          senderId: data.reporterId
        });
      }

      return this.mapConversationFromDB(conversation);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      throw new Error('Impossible de créer la conversation');
    }
  }

  // Obtenir les conversations d'un utilisateur
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_conversations', { user_uuid: userId });

      if (error) throw error;

      return data.map((conv: any) => ({
        id: conv.conversation_id,
        vehicleId: conv.vehicle_id,
        ownerId: conv.other_participant_id === conv.other_participant_id ? conv.other_participant_id : conv.other_participant_id,
        reporterId: conv.other_participant_id,
        status: conv.status,
        subject: conv.subject,
        createdAt: conv.created_at,
        updatedAt: conv.last_message_at || conv.created_at,
        vehicleBrand: conv.vehicle_brand,
        vehicleModel: conv.vehicle_model,
        vehicleLicensePlate: conv.vehicle_license_plate,
        otherParticipantId: conv.other_participant_id,
        otherParticipantEmail: conv.other_participant_email,
        lastMessageContent: conv.last_message_content,
        lastMessageAt: conv.last_message_at,
        unreadCount: conv.unread_count || 0,
      }));
    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      throw new Error('Impossible de récupérer les conversations');
    }
  }

  // Obtenir les messages d'une conversation
  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(this.mapMessageFromDB);
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      throw new Error('Impossible de récupérer les messages');
    }
  }

  // Envoyer un message
  static async sendMessage(data: {
    conversationId: string;
    content: string;
    messageType?: 'text' | 'image' | 'location' | 'system';
    metadata?: any;
    senderId?: string;
  }): Promise<Message> {
    return this.sendMessageWithClient(supabase, data);
  }

  // Envoyer un message avec un client Supabase spécifique
  static async sendMessageWithClient(supabaseClient: any, data: {
    conversationId: string;
    content: string;
    messageType?: 'text' | 'image' | 'location' | 'system';
    metadata?: any;
    senderId?: string;
  }): Promise<Message> {
    try {
      // Obtenir l'ID de l'utilisateur actuel si non fourni
      const { data: { user } } = await supabaseClient.auth.getUser();
      const senderId = data.senderId || user?.id;
      
      if (!senderId) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data: message, error } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: data.conversationId,
          sender_id: senderId,
          content: data.content,
          message_type: data.messageType || 'text',
          metadata: data.metadata,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapMessageFromDB(message);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      throw new Error('Impossible d\'envoyer le message');
    }
  }

  // Marquer les messages comme lus
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur marquage messages lus:', error);
    }
  }

  // Mettre à jour le statut d'une conversation
  static async updateConversationStatus(
    conversationId: string, 
    status: 'active' | 'resolved' | 'closed'
  ): Promise<void> {
    try {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      throw new Error('Impossible de mettre à jour le statut');
    }
  }

  // Obtenir une conversation par ID
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          vehicles!inner(brand, model, license_plate)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      return this.mapConversationFromDB(data);
    } catch (error) {
      console.error('Erreur récupération conversation:', error);
      return null;
    }
  }

  // S'abonner aux nouveaux messages d'une conversation
  static subscribeToMessages(
    conversationId: string, 
    onNewMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(this.mapMessageFromDB(payload.new as any));
        }
      )
      .subscribe();
  }

  // S'abonner aux conversations d'un utilisateur
  static subscribeToConversations(
    userId: string,
    onConversationUpdate: (conversation: Conversation) => void
  ) {
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `owner_id=eq.${userId}`,
        },
        async () => {
          // Recharger les conversations
          const conversations = await this.getUserConversations(userId);
          conversations.forEach(onConversationUpdate);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `reporter_id=eq.${userId}`,
        },
        async () => {
          // Recharger les conversations
          const conversations = await this.getUserConversations(userId);
          conversations.forEach(onConversationUpdate);
        }
      )
      .subscribe();
  }

  // Mapper les données de la DB vers l'interface Message
  private static mapMessageFromDB(data: any): Message {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      messageType: data.message_type,
      metadata: data.metadata,
      isRead: data.is_read,
      createdAt: data.created_at,
    };
  }

  // Mapper les données de la DB vers l'interface Conversation
  private static mapConversationFromDB(data: any): Conversation {
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      ownerId: data.owner_id,
      reporterId: data.reporter_id,
      status: data.status,
      subject: data.subject,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at,
      vehicleBrand: data.vehicles?.brand,
      vehicleModel: data.vehicles?.model,
      vehicleLicensePlate: data.vehicles?.license_plate,
    };
  }
}
