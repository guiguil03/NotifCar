import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
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

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    
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
  }, [conversation.id]);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    try {
      const message = await ChatService.sendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        senderId: user.id,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            {`${conversation.vehicleBrand ? conversation.vehicleBrand : 'Véhicule'} ${conversation.vehicleModel ? conversation.vehicleModel : ''}`.trim()}
          </Text>
          <Text style={styles.subtitle}>
            {conversation.vehicleLicensePlate ? conversation.vehicleLicensePlate : 'Plaque inconnue'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Messages Area */}
      <View style={[styles.messagesArea, { marginBottom: isKeyboardVisible ? 10 : 0 }]}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyMessageText}>Aucun message pour le moment</Text>
            <Text style={styles.emptySubText}>Commencez la conversation !</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              // Auto-scroll vers le bas quand de nouveaux messages arrivent
            }}
          />
        )}
      </View>

      {/* Input Area - ULTRA VISIBLE avec gestion clavier */}
      <View style={[
        styles.inputArea,
        { 
          paddingBottom: isKeyboardVisible ? 10 : 20,
          transform: [{ translateY: isKeyboardVisible ? -keyboardHeight * 0.1 : 0 }]
        }
      ]}>
        <View style={styles.inputContainer}>
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
            textAlignVertical="top"
          />
          <Animated.View
            style={[
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
              <Text style={[styles.sendText, !newMessage.trim() && styles.sendTextDisabled]}>
                {newMessage.trim() ? '📤' : '✉️'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Compteur de caractères avec style amélioré */}
        <View style={styles.characterCountContainer}>
          <Text style={styles.characterCount}>
            {newMessage.length}/1000 caractères
          </Text>
          {newMessage.length > 800 && (
            <Text style={styles.characterWarning}>
              ⚠️ Limite approchée
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#8B5CF6',
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  moreText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyMessageText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  inputArea: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    padding: 12,
    minHeight: 60,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 20,
    marginLeft: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonKeyboard: {
    backgroundColor: '#7C3AED',
    transform: [{ scale: 1.05 }],
  },
  sendText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendTextDisabled: {
    color: '#ccc',
  },
  characterCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
  },
  characterWarning: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
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
  emptyMessageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  ownMessageBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.7,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#666',
  },
});
