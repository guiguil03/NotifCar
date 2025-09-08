import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
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

const { width, height } = Dimensions.get('window');

interface BeautifulChatScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

export default function BeautifulChatScreen({ conversation, onBack }: BeautifulChatScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const messageAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToTyping();
    setupNotifications();
    
    // Animation d'entrée
    Animated.timing(messageAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
      TypingService.stopTyping(conversation.id, user.id);
      setIsTyping(false);

      const message = await ChatService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        senderId: user.id,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Animation d'envoi
      Animated.sequence([
        Animated.timing(messageAnimation, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Notification push
      const otherParticipantId = conversation.otherParticipantId;
      if (otherParticipantId) {
        await NotificationService.notifyNewMessage(
          otherParticipantId,
          user.email || 'Utilisateur',
          newMessage.trim(),
          conversation.id
        );
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);

    if (!user?.id) return;

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      TypingService.startTyping(conversation.id, user.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        TypingService.stopTyping(conversation.id, user.id);
        setIsTyping(false);
      }
    }, 2000);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <Animated.View 
        style={[
          styles.messageWrapper, 
          isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
          {
            opacity: messageAnimation,
            transform: [{
              translateY: messageAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        <View style={[styles.messageBubble, isOwn ? styles.ownMessageBubble : styles.otherMessageBubble]}>
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
        {isLastMessage && isOwn && (
          <View style={styles.messageStatus}>
            <Ionicons name="checkmark-done" size={16} color="#8B5CF6" />
          </View>
        )}
      </Animated.View>
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
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.loadingGradient}
        >
          <Animated.View style={[styles.loadingContent, { opacity: messageAnimation }]}>
            <Ionicons name="chatbubbles-outline" size={80} color="white" />
            <Text style={styles.loadingText}>Chargement des messages...</Text>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.loadingDot, { opacity: typingAnimation }]} />
              <Animated.View style={[styles.loadingDot, { opacity: typingAnimation }]} />
              <Animated.View style={[styles.loadingDot, { opacity: typingAnimation }]} />
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header avec gradient et glassmorphism */}
      <LinearGradient
        colors={['#8B5CF6', '#A855F7', '#C084FC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {conversation.vehicleBrand || 'Véhicule'} {conversation.vehicleModel || ''}
            </Text>
            <Text style={styles.headerSubtitle}>
              {conversation.vehicleLicensePlate || 'Plaque inconnue'} • {getOtherParticipantName()}
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages avec fond dégradé subtil */}
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={styles.messagesContainer}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Indicateur de frappe moderne */}
        {typingUsers.length > 0 && (
          <Animated.View style={[styles.typingContainer, { opacity: typingAnimation }]}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>
                {typingUsers.length === 1 
                  ? `${getOtherParticipantName()} écrit...`
                  : `${typingUsers.length} personnes écrivent...`
                }
              </Text>
              <View style={styles.typingDots}>
                <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
                <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
                <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
              </View>
            </View>
          </Animated.View>
        )}
      </LinearGradient>

      {/* Input moderne avec glassmorphism */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={handleTextChange}
              placeholder="Tapez votre message..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              onPress={sendMessage}
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              disabled={!newMessage.trim()}
            >
              <LinearGradient
                colors={newMessage.trim() ? ['#8B5CF6', '#A855F7'] : ['#e5e7eb', '#d1d5db']}
                style={styles.sendButtonGradient}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() ? "white" : "#9ca3af"} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    fontWeight: '600',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  moreButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  ownMessageBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 8,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
    fontWeight: '500',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#6b7280',
  },
  messageStatus: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  typingBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    fontWeight: '500',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginHorizontal: 2,
  },
  inputWrapper: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 120,
    paddingVertical: 8,
    fontWeight: '500',
  },
  sendButton: {
    marginLeft: 12,
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    shadowOpacity: 0,
  },
});
