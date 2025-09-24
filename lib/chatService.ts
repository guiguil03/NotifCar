import { NotificationService } from './notificationService';
import { QRCodeService } from './qrCodeService';
import { supabase } from './supabase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'location' | 'system';
  metadata?: {
    formData?: {
      reason?: string;
      customReason?: string;
      vehicleIssue?: string;
      urgency?: 'urgent' | 'important' | 'normal';
      customMessage?: string;
    };
    [key: string]: any;
  };
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
  metadata?: any;
}

export class ChatService {
  // Créer une nouvelle conversation
  static async createConversation(data: CreateConversationData): Promise<Conversation> {
    try {
      // S'assurer que reporterId est défini (utilisateur courant)
      let reporterId = data.reporterId;
      if (!reporterId) {
        const { data: authData } = await supabase.auth.getUser();
        reporterId = authData.user?.id as string;
      }
      // Valider le QR code et extraire l'ID du propriétaire
      const qrValidation = QRCodeService.validateQRCode(data.vehicleId);
      
      if (!qrValidation.isValid || !qrValidation.ownerId) {
        throw new Error('QR code invalide. Assurez-vous de scanner un QR code NotifCar valide.');
      }

      // Vérifier qu'on ne crée pas une conversation avec soi-même
      if (qrValidation.ownerId === reporterId) {
        throw new Error('Vous ne pouvez pas signaler un problème sur votre propre véhicule.');
      }

      // Chercher le véhicule par son QR code (forme brute puis forme normalisée)
      const tryFetchVehicle = async (qr: string) => {
        return supabase
          .from('vehicles')
          .select('id, owner_id, brand, model, license_plate')
          .eq('qr_code', qr)
          .maybeSingle();
      };

      // 1) tentative avec la donnée brute
      let { data: vehicle } = await tryFetchVehicle(data.vehicleId);

      // 2) si introuvable, normaliser et réessayer
      if (!vehicle) {
        const normalized = `notifcar:${qrValidation.vehicleId}:${qrValidation.ownerId}`;
        const retry = await tryFetchVehicle(normalized);
        vehicle = retry.data as any;
      }

      // 3) si toujours introuvable, recherche par id de véhicule extrait du QR
      if (!vehicle) {
        const byId = await supabase
          .from('vehicles')
          .select('id, owner_id, brand, model, license_plate, qr_code')
          .eq('id', qrValidation.vehicleId)
          .maybeSingle();
        vehicle = byId.data as any;
      }

      if (!vehicle) {
        throw new Error('Véhicule non trouvé. Le QR code semble valide mais le véhicule n\'existe plus.');
      }

      // Vérifier que l'ID du propriétaire correspond
      if (vehicle.owner_id !== qrValidation.ownerId) {
        throw new Error('Erreur de sécurité : le propriétaire du QR code ne correspond pas au véhicule.');
      }

      // Vérifier si une conversation existe déjà
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('reporter_id', reporterId)
        .eq('status', 'active')
        .single();

      let conversation;
      if (existingConversation) {
        conversation = existingConversation;
      } else {
        // Créer une nouvelle conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            vehicle_id: vehicle.id,
            owner_id: qrValidation.ownerId,
            reporter_id: reporterId,
            status: 'active',
            subject: data.subject || 'Problème signalé via QR Code',
          })
          .select()
          .single();

        if (convError) throw convError;
        conversation = newConversation;

        // Ajouter les participants
        const participants = [
          { conversation_id: conversation.id, user_id: qrValidation.ownerId },
          { conversation_id: conversation.id, user_id: reporterId }
        ];

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (participantsError) {
          console.error('Erreur ajout participants:', participantsError);
          // Ne pas faire échouer la création de conversation
        }
      }

      // Ajouter le message initial si fourni
      if (data.initialMessage) {
        const { error: sendErr } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: reporterId,
            content: data.initialMessage,
            message_type: 'text',
            is_read: false
          });

        if (sendErr) {
          console.error('Erreur envoi message initial:', sendErr);
          // Ne pas faire échouer la création de conversation
        }
      }

      return this.mapConversationFromDB(conversation);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      throw new Error('Impossible de créer la conversation');
    }
  }

  // Créer une conversation avec métadonnées (alias pour createConversation)
  static async createConversationWithMetadata(data: CreateConversationData): Promise<Conversation> {
    return this.createConversation(data);
  }

  // Obtenir les conversations d'un utilisateur
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      // Récupérer les conversations où l'utilisateur est participant
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          vehicles!inner(brand, model, license_plate),
          conversation_participants!inner(user_id),
          messages(content, created_at, sender_id)
        `)
        .or(`owner_id.eq.${userId},reporter_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération conversations:', error);
        throw error;
      }

      if (!conversations) {
        return [];
      }

      return conversations.map((conv: any) => {
        // Trouver l'autre participant
        const otherParticipant = conv.conversation_participants.find((p: any) => p.user_id !== userId);
        const otherParticipantId = otherParticipant?.user_id;

        // Récupérer le dernier message
        const lastMessage = conv.messages && conv.messages.length > 0 
          ? conv.messages[conv.messages.length - 1] 
          : null;

        // Compter les messages non lus
        const unreadCount = conv.messages ? conv.messages.filter((msg: any) => 
          msg.sender_id !== userId && !msg.is_read
        ).length : 0;

        return {
          id: conv.id,
          vehicleId: conv.vehicle_id,
          ownerId: conv.owner_id,
          reporterId: conv.reporter_id,
          status: conv.status as 'active' | 'resolved' | 'closed',
          subject: conv.subject,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          resolvedAt: conv.resolved_at,
          vehicleBrand: conv.vehicles?.brand,
          vehicleModel: conv.vehicles?.model,
          vehicleLicensePlate: conv.vehicles?.license_plate,
          otherParticipantId: otherParticipantId,
          otherParticipantEmail: null, // On ne récupère pas l'email pour l'instant
          lastMessageContent: lastMessage?.content,
          lastMessageAt: lastMessage?.created_at,
          unreadCount: unreadCount,
        };
      });
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
      console.log('[ChatService] Préparation envoi', {
        conversationId: data.conversationId,
        contentLength: data.content?.length,
        messageType: data.messageType || 'text',
      });
      // Obtenir l'ID de l'utilisateur actuel si non fourni
      const { data: { user } } = await supabaseClient.auth.getUser();
      const senderId = data.senderId || user?.id;
      
      if (!senderId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier que l'utilisateur est bien participant de la conversation
      const { data: participantCheck, error: participantError } = await supabaseClient
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', data.conversationId)
        .eq('user_id', senderId)
        .single();

      if (participantError || !participantCheck) {
        throw new Error('Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation');
      }

      console.log('[ChatService] Insertion message dans la table messages...');
      // Insérer le message directement dans la table messages
      const { data: newMessage, error } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: data.conversationId,
          sender_id: senderId,
          content: data.content,
          message_type: data.messageType || 'text',
          metadata: data.metadata || null,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('[ChatService] Erreur insertion message:', error);
        throw error;
      }

      // Mapper vers l'interface Message
      const message: Message = {
        id: newMessage.id,
        conversationId: newMessage.conversation_id,
        senderId: newMessage.sender_id,
        content: newMessage.content,
        messageType: newMessage.message_type,
        metadata: newMessage.metadata,
        isRead: newMessage.is_read,
        createdAt: newMessage.created_at,
      };

      // Envoyer une notification push
      try {
        console.log('[ChatService] Tentative envoi notification push...');
        await this.sendNotificationForMessage(message, senderId);
        console.log('[ChatService] Notification push envoyée');
      } catch (notificationError) {
        console.error('[ChatService] Erreur envoi notification:', notificationError);
        // Ne pas faire échouer l'envoi du message si la notification échoue
      }

      console.log('[ChatService] Envoi message OK', { id: message.id });
      return message;
    } catch (error) {
      console.error('[ChatService] Erreur envoi message:', error);
      // Propager un message d'erreur plus détaillé côté UI
      const detailed = (error as any)?.message || 'Erreur inconnue';
      throw new Error(`Impossible d'envoyer le message: ${detailed}`);
    }
  }

  // Envoyer une notification pour un nouveau message
  private static async sendNotificationForMessage(message: Message, senderId: string): Promise<void> {
    try {
      // Récupérer les informations de la conversation
      const { data: conversationData } = await supabase
        .from('conversations')
        .select(`
          id,
          vehicle_brand,
          vehicle_model,
          vehicle_license_plate,
          conversation_participants!inner(user_id)
        `)
        .eq('id', message.conversationId)
        .single();

      if (!conversationData) return;

      // Trouver l'autre participant
      const otherParticipant = conversationData.conversation_participants
        .find((p: any) => p.user_id !== senderId);

      if (!otherParticipant) return;

      // Récupérer le nom de l'expéditeur
      const { data: senderData } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', senderId)
        .single();

      const senderName = senderData?.email || 'Utilisateur';

      // Envoyer la notification
      await NotificationService.notifyNewMessage(
        otherParticipant.user_id,
        senderName,
        message.content,
        message.conversationId
      );
    } catch (error) {
      console.error('Erreur envoi notification message:', error);
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
