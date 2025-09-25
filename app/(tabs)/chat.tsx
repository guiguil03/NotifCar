import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import UltraSimpleChat from '../../components/chat/UltraSimpleChat';
import { useAuth } from '../../contexts/AuthContext';
import { ChatService, Conversation } from '../../lib/chatService';

export default function ChatScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadConversations();
    
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const conversationsData = await ChatService.getUserConversations(user.id);
        setConversations(conversationsData);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      Alert.alert('Erreur', 'Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const closeConversation = async () => {
    setSelectedConversation(null);
    // Recharger les conversations pour mettre à jour le compteur de messages non lus
    await loadConversations();
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    if (conversation.otherParticipantEmail && conversation.otherParticipantEmail.trim()) {
      return conversation.otherParticipantEmail;
    }
    if (conversation.otherParticipantId && conversation.otherParticipantId.trim()) {
      return `${conversation.otherParticipantId.slice(0, 8)}...`;
    }
    return 'Utilisateur';
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openConversation(item)}
    >
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.vehicleName}>
            {`${item.vehicleBrand ? item.vehicleBrand : 'Véhicule'} ${item.vehicleModel ? item.vehicleModel : ''}`.trim()}
          </Text>
          <Text style={styles.timeText}>
            {formatLastMessageTime(item.lastMessageAt)}
          </Text>
        </View>
        
        <Text style={styles.licensePlate}>
          {item.vehicleLicensePlate ? item.vehicleLicensePlate : 'Plaque inconnue'}
        </Text>
        
        <Text style={styles.participantName}>
          avec {getOtherParticipantName(item)}
        </Text>
        
        {item.lastMessageContent && (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessageContent}
          </Text>
        )}
        
        {item.unreadCount && item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // Si une conversation est sélectionnée, afficher le chat
  if (selectedConversation) {
    return (
      <UltraSimpleChat
        conversation={selectedConversation}
        onBack={closeConversation}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
        <LinearGradient
          colors={['#2633E1', '#1E9B7E', '#26C29E', '#7DDAC5']}
          style={styles.headerGradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
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
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="chatbubbles" size={32} color="#2633E1" />
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.welcomeSection}>
              <Text style={styles.greetingText}>Messages</Text>
              <Text style={styles.subtitleText}>Chargement des conversations...</Text>
            </View>
          </Animated.View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des conversations...</Text>
        </View>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
        <LinearGradient
          colors={['#2633E1', '#1E9B7E', '#26C29E', '#7DDAC5']}
          style={styles.headerGradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
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
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="chatbubbles" size={32} color="#2633E1" />
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.welcomeSection}>
              <Text style={styles.greetingText}>Messages</Text>
              <Text style={styles.subtitleText}>Aucune conversation</Text>
            </View>
          </Animated.View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySubtitle}>
            Scannez un QR code pour commencer une conversation
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {/* Header avec gradient violet moderne (même style que l'onglet principal) */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E', '#1E9B7E', '#26C29E', '#7DDAC5']}
        locations={[0, 0.6, 0.7, 0.9, 1]}
        style={styles.headerGradient}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
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
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.logoGradient}
              >
                <Ionicons name="chatbubbles" size={32} color="#2633E1" />
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.welcomeSection}>
            <Text style={styles.greetingText}>Messages</Text>
            <Text style={styles.subtitleText}>
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        style={styles.conversationsList}
        contentContainerStyle={styles.conversationsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 0,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: -20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
    marginTop: -20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  conversationsList: {
    flex: 1,
    marginTop: -20,
  },
  conversationsContent: {
    padding: 24,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  licensePlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

