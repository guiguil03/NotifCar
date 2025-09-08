import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ChatService, Conversation, Message } from '../lib/chatService';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, messageType?: 'text' | 'image' | 'location' | 'system') => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  updateConversationStatus: (status: 'active' | 'resolved' | 'closed') => Promise<void>;
  createConversationFromQR: (vehicleId: string, initialMessage: string) => Promise<Conversation | null>;
  createConversationFromQRWithMetadata: (vehicleId: string, initialMessage: string, metadata: any) => Promise<Conversation | null>;
  
  // État
  setCurrentConversation: (conversation: Conversation | null) => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les conversations de l'utilisateur
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const userConversations = await ChatService.getUserConversations(user.id);
      setConversations(userConversations);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Charger une conversation spécifique avec ses messages
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger la conversation
      const conversation = await ChatService.getConversation(conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        
        // Charger les messages
        const conversationMessages = await ChatService.getConversationMessages(conversationId);
        setMessages(conversationMessages);
        
        // Marquer comme lus
        if (user?.id) {
          await ChatService.markMessagesAsRead(conversationId, user.id);
        }
      }
    } catch (err) {
      console.error('Erreur chargement conversation:', err);
      setError('Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Envoyer un message
  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'text' | 'image' | 'location' | 'system' = 'text'
  ) => {
    if (!currentConversation?.id || !user?.id) return;

    try {
      setError(null);
      const newMessage = await ChatService.sendMessage({
        conversationId: currentConversation.id,
        content,
        messageType,
      });

      // Ajouter le message à la liste locale
      setMessages(prev => [...prev, newMessage]);
      
      // Mettre à jour la conversation dans la liste
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, lastMessageContent: content, lastMessageAt: newMessage.createdAt }
            : conv
        )
      );
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message');
    }
  }, [currentConversation?.id, user?.id]);

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await ChatService.markMessagesAsRead(conversationId, user.id);
      
      // Mettre à jour l'état local
      setMessages(prev => 
        prev.map(msg => 
          msg.conversationId === conversationId && msg.senderId !== user.id
            ? { ...msg, isRead: true }
            : msg
        )
      );
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Erreur marquage messages lus:', err);
    }
  }, [user?.id]);

  // Mettre à jour le statut d'une conversation
  const updateConversationStatus = useCallback(async (status: 'active' | 'resolved' | 'closed') => {
    if (!currentConversation?.id) return;

    try {
      setError(null);
      await ChatService.updateConversationStatus(currentConversation.id, status);
      
      // Mettre à jour l'état local
      setCurrentConversation(prev => prev ? { ...prev, status } : null);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, status }
            : conv
        )
      );
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      setError('Impossible de mettre à jour le statut');
    }
  }, [currentConversation?.id]);

  // Créer une conversation à partir d'un scan QR
  const createConversationFromQR = useCallback(async (
    qrCode: string, 
    initialMessage: string
  ): Promise<Conversation | null> => {
    if (!user?.id) return null;

    try {
      setError(null);
      
      // Créer la conversation en cherchant le véhicule par son QR code
      const conversation = await ChatService.createConversation({
        vehicleId: qrCode, // Le QR code scanné
        reporterId: user.id,
        subject: 'Problème signalé via QR Code',
        initialMessage,
      });

      // Ajouter à la liste des conversations
      setConversations(prev => [conversation, ...prev]);
      
      return conversation;
    } catch (err) {
      console.error('Erreur création conversation QR:', err);
      setError('Impossible de créer la conversation');
      return null;
    }
  }, [user?.id]);

  // Créer une conversation à partir d'un scan QR avec métadonnées
  const createConversationFromQRWithMetadata = useCallback(async (
    qrCode: string, 
    initialMessage: string,
    metadata: any
  ): Promise<Conversation | null> => {
    if (!user?.id) return null;

    try {
      setError(null);
      
      // Créer la conversation en cherchant le véhicule par son QR code
      const conversation = await ChatService.createConversationWithMetadata({
        vehicleId: qrCode, // Le QR code scanné
        reporterId: user.id,
        subject: 'Problème signalé via QR Code',
        initialMessage,
        metadata,
      });

      // Ajouter à la liste des conversations
      setConversations(prev => [conversation, ...prev]);
      
      return conversation;
    } catch (err) {
      console.error('Erreur création conversation QR avec métadonnées:', err);
      setError('Impossible de créer la conversation');
      return null;
    }
  }, [user?.id]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les conversations au montage
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  // S'abonner aux mises à jour en temps réel
  useEffect(() => {
    if (!user?.id) return;

    // S'abonner aux conversations
    const conversationsSubscription = ChatService.subscribeToConversations(
      user.id,
      (conversation) => {
        setConversations(prev => {
          const existingIndex = prev.findIndex(conv => conv.id === conversation.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = conversation;
            return updated;
          } else {
            return [conversation, ...prev];
          }
        });
      }
    );

    // S'abonner aux messages de la conversation courante
    let messagesSubscription: any = null;
    if (currentConversation?.id) {
      messagesSubscription = ChatService.subscribeToMessages(
        currentConversation.id,
        (message) => {
          setMessages(prev => {
            // Éviter les doublons
            if (prev.some(msg => msg.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
        }
      );
    }

    return () => {
      conversationsSubscription.unsubscribe();
      if (messagesSubscription) {
        messagesSubscription.unsubscribe();
      }
    };
  }, [user?.id, currentConversation?.id]);

  const value: ChatContextType = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    loadConversations,
    loadConversation,
    sendMessage,
    markAsRead,
    updateConversationStatus,
    createConversationFromQR,
    createConversationFromQRWithMetadata,
    setCurrentConversation,
    clearError,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
