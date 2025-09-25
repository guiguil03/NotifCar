import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ChatService, Message } from '../../lib/chatService';

interface UltraSimpleChatProps {
  conversation: any;
  onBack: () => void;
}

export default function UltraSimpleChat({ conversation, onBack }: UltraSimpleChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  
  // Référence pour le FlatList des messages
  const messagesListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const messagesData = await ChatService.getConversationMessages(conversation.id);
      setMessages(messagesData);
      
      // Scroller vers le bas après le chargement des messages
      setTimeout(() => {
        if (messagesListRef.current && messagesData.length > 0) {
          messagesListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  const subscribeToMessages = useCallback(() => {
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
  }, [conversation.id, user?.id]);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    
    // Marquer tous les messages comme lus quand on ouvre la conversation
    if (user?.id) {
      ChatService.markMessagesAsRead(conversation.id, user.id);
    }
    
    // Animations d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Gestion du clavier
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      
      // Animation du bouton d'envoi
      Animated.timing(inputFocusAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      
      // Animation du bouton d'envoi
      Animated.timing(inputFocusAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [conversation.id, user?.id, fadeAnim, slideAnim, inputFocusAnim, loadMessages, subscribeToMessages]);

  const sendMessage = async () => {
    console.log('[Chat] Préparation envoi message', {
      conversationId: conversation?.id,
      hasUser: Boolean(user?.id),
      contentLength: newMessage.length,
      contentTrimmedLength: newMessage.trim().length,
    });
    if (!newMessage.trim()) {
      console.log('[Chat] Abandon envoi: message vide après trim');
      return;
    }
    if (!user?.id) {
      console.log('[Chat] Abandon envoi: utilisateur non authentifié');
      return;
    }

    try {
      console.log('[Chat] Envoi en cours via ChatService.sendMessage...');
      const message = await ChatService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        senderId: user.id,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      console.log('[Chat] Envoi réussi', { messageId: message.id, createdAt: message.createdAt });
      
      // Scroller vers le bas après l'envoi du message
      setTimeout(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('[Chat] Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const messageTime = new Date(item.createdAt);
    const now = new Date();
    const isRecent = (now.getTime() - messageTime.getTime()) < 60000; // Moins d'1 minute
    
    return (
      <Animated.View 
        style={[
          styles.messageWrapper, 
          isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: pulseAnim }
            ]
          }
        ]}
      >
        <View style={[styles.messageBubble, isOwn ? styles.ownMessageBubble : styles.otherMessageBubble]}>
          {/* Message content with modern styling */}
          <View style={styles.messageContent}>
            <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
              {item.content}
            </Text>
          </View>
          
          {/* Message footer with time and status */}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isOwn ? styles.ownMessageTime : styles.otherMessageTime]}>
              {messageTime.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {/* Status indicators for own messages */}
            {isOwn && (
              <View style={styles.messageStatus}>
                {isRecent ? (
                  <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />
                ) : (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
                )}
              </View>
            )}
          </View>
        </View>
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
        <Text style={styles.loadingText}>Chargement des messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {/* Header avec gradient violet moderne (même style que l'onglet principal) */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E', '#26C29E', '#7DDAC5']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.vehicleInfoContainer}>
              <Ionicons name="car" size={24} color="rgba(255,255,255,0.9)" style={styles.vehicleIcon} />
              <Text style={styles.title}>
                {`${conversation.vehicleBrand ? conversation.vehicleBrand : 'Véhicule'} ${conversation.vehicleModel ? conversation.vehicleModel : ''}`.trim()}
              </Text>
            </View>
            <View style={styles.licenseContainer}>
              <Ionicons name="card" size={18} color="rgba(255,255,255,0.8)" style={styles.licenseIcon} />
              <Text style={styles.subtitle}>
                {conversation.vehicleLicensePlate ? conversation.vehicleLicensePlate : 'Plaque inconnue'}
              </Text>
            </View>
            <View style={styles.participantContainer}>
              <Ionicons name="person" size={18} color="rgba(255,255,255,0.8)" style={styles.participantIcon} />
              <Text style={styles.participantText}>
                Conversation avec {getOtherParticipantName()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.moreButtonGradient}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Messages Area avec fond dégradé moderne */}
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={[styles.messagesArea, { marginBottom: isKeyboardVisible ? 10 : 20 }]}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#2633E1" />
            </View>
            <Text style={styles.emptyMessageText}>Aucun message pour le moment</Text>
            <Text style={styles.emptySubText}>Commencez la conversation !</Text>
          </View>
        ) : (
          <FlatList
            ref={messagesListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              // Auto-scroll vers le bas quand de nouveaux messages arrivent
              if (messagesListRef.current) {
                messagesListRef.current.scrollToEnd({ animated: true });
              }
            }}
          />
        )}
      </LinearGradient>

      {/* Input Area - Design moderne avec glassmorphism */}
      <View style={[
        styles.inputArea,
        { 
          paddingBottom: isKeyboardVisible ? 30 : 60,
          paddingTop: 25,
          transform: [{ translateY: isKeyboardVisible ? -keyboardHeight * 0.1 : 0 }]
        }
      ]}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Écrivez votre message ici..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
              autoFocus={false}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              textAlignVertical="center"
            />
            <Animated.View
              style={[
                styles.sendButtonContainer,
                {
                  transform: [
                    { scale: inputFocusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1]
                    })},
                    { translateY: inputFocusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -2]
                    })}
                  ]
                }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  !newMessage.trim() && styles.sendButtonDisabled,
                  isKeyboardVisible && styles.sendButtonKeyboard
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={newMessage.trim() ? "send" : "mail"} 
                  size={20} 
                  color={newMessage.trim() ? "white" : "#9CA3AF"} 
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
        
        {/* Compteur de caractères moderne */}
        <View style={styles.characterCountContainer}>
          <View style={styles.characterCountWrapper}>
            <Text style={styles.characterCount}>
              {newMessage.length}/1000
            </Text>
            {newMessage.length > 800 && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={12} color="#F59E0B" />
                <Text style={styles.characterWarning}>
                  Limite approchée
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // Animation handled by Animated.View
  },
  backButton: {
    marginRight: 16,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  vehicleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleIcon: {
    marginRight: 10,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  licenseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  licenseIcon: {
    marginRight: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontWeight: '500',
  },
  participantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  participantIcon: {
    marginRight: 8,
  },
  participantText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  moreButton: {
    marginLeft: 16,
  },
  moreButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: -30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(38, 51, 225, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyMessageText: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputArea: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 60,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 51, 225, 0.05)',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(38, 51, 225, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  sendButtonContainer: {
    marginLeft: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2633E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonKeyboard: {
    backgroundColor: '#1E40AF',
    transform: [{ scale: 1.05 }],
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  characterCountContainer: {
    alignItems: 'center',
  },
  characterCountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 51, 225, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  characterCount: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  characterWarning: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  ownMessageBubble: {
    backgroundColor: '#2633E1',
    borderBottomRightRadius: 8,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    // Effet de gradient moderne
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(38, 51, 225, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  messageContent: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  ownMessageText: {
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  messageStatus: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
