import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
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
  }, [conversation.id]);

  const loadMessages = async () => {
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
      
      // Scroller vers le bas après l'envoi du message
      setTimeout(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
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
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {/* Header avec gradient violet moderne (même style que l'onglet principal) */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
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

      {/* Messages Area */}
      <View style={[styles.messagesArea, { marginBottom: isKeyboardVisible ? 10 : 20 }]}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
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
      </View>

      {/* Input Area - ULTRA VISIBLE avec gestion clavier */}
      <View style={[
        styles.inputArea,
        { 
          paddingBottom: isKeyboardVisible ? 30 : 60,
          paddingTop: 25,
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
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 60,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#7C3AED',
    padding: 16,
    minHeight: 70,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 50,
    maxHeight: 120,
    textAlignVertical: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    marginLeft: 12,
    minWidth: 70,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonKeyboard: {
    backgroundColor: '#6D28D9',
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
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
