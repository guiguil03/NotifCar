import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ChatService, Conversation, Message } from '../../lib/chatService';
import { NotificationService } from '../../lib/notificationService';
import { TypingService, TypingUser } from '../../lib/typingService';

interface ChatScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

export default function ChatScreen({ conversation, onBack }: ChatScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToTyping();
    setupNotifications();
  }, [conversation.id]);

  useEffect(() => {
    // Animation de l'indicateur de frappe
    if (typingUsers.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [typingUsers.length]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await ChatService.getConversationMessages(conversation.id);
      setMessages(messagesData);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = ChatService.subscribeToMessages(
      conversation.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        // Marquer comme lu si ce n'est pas notre message
        if (newMessage.senderId !== user?.id) {
          ChatService.markMessagesAsRead(conversation.id, user?.id || '');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToTyping = () => {
    const subscription = TypingService.subscribeToTyping(
      conversation.id,
      (users) => {
        // Filtrer l'utilisateur actuel
        const otherTypingUsers = users.filter(u => u.userId !== user?.id);
        setTypingUsers(otherTypingUsers);
      }
    );

    return () => {
      subscription();
    };
  };

  const setupNotifications = () => {
    const subscription = NotificationService.subscribeToMessageNotifications(
      conversation.id,
      (data) => {
        // Envoyer une notification locale
        NotificationService.sendLocalNotification(data);
      }
    );

    return () => {
      subscription();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    try {
      // Arrêter l'indicateur de frappe
      TypingService.stopTyping(conversation.id, user.id);
      setIsTyping(false);

      const message = await ChatService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        senderId: user.id,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Envoyer une notification push à l'autre participant
      const otherParticipantId = conversation.otherParticipantId;
      if (otherParticipantId) {
        await NotificationService.sendPushNotification(otherParticipantId, {
          conversationId: conversation.id,
          senderId: user.id,
          senderName: user.email || 'Utilisateur',
          message: newMessage.trim(),
          vehicleInfo: `${conversation.vehicleBrand} ${conversation.vehicleModel}`,
        });
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);

    if (!user?.id) return;

    // Démarrer l'indicateur de frappe
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      TypingService.startTyping(conversation.id, user.id);
    }

    // Nettoyer l'ancien timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Arrêter la frappe après 2 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        TypingService.stopTyping(conversation.id, user.id);
        setIsTyping(false);
      }
    }, 2000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    
    return (
      <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isOwn ? styles.ownMessageTime : styles.otherMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  const getOtherParticipantName = () => {
    if (conversation.otherParticipantEmail && conversation.otherParticipantEmail.trim()) {
      return conversation.otherParticipantEmail;
    }
    if (conversation.otherParticipantId && conversation.otherParticipantId.trim()) {
      return `${conversation.otherParticipantId.slice(0, 8)}...`;
    }
    return 'Utilisateur';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
         <View style={styles.headerInfo}>
           <Text style={styles.headerTitle}>
             {conversation.vehicleBrand || 'Véhicule'} {conversation.vehicleModel || ''}
           </Text>
           <Text style={styles.headerSubtitle}>
             {conversation.vehicleLicensePlate || 'Plaque inconnue'} • {getOtherParticipantName()}
           </Text>
         </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Indicateur de frappe */}
      {typingUsers.length > 0 && (
        <View style={styles.typingContainer}>
          <Animated.View style={[styles.typingBubble, { opacity: typingAnimation }]}>
            <Text style={styles.typingText}>
              {typingUsers.length === 1 
                ? `${getOtherParticipantName()} est en train d'écrire...`
                : `${typingUsers.length} personnes sont en train d'écrire...`
              }
            </Text>
            <View style={styles.typingDots}>
              <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
            </View>
          </Animated.View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={handleTextChange}
          placeholder="Tapez votre message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 18,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 1,
  },
});
