import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const primaryColor = useThemeColor({}, 'primary');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const loadConversations = useCallback(async () => {
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
  }, [user?.id]);

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
  }, [fadeAnim, slideAnim, loadConversations]);

  // loadConversations est géré par useCallback ci-dessus

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

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isOwner = item.ownerId === user?.id;
    const isReporter = item.reporterId === user?.id;
    
    return (
      <Animated.View
        style={[
          styles.conversationItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.conversationCard,
            isOwner && styles.conversationCardReceived,
            isReporter && styles.conversationCardSent
          ]}
          onPress={() => openConversation(item)}
          activeOpacity={0.7}
        >
          <View style={styles.conversationContent}>
            {/* Header avec icône véhicule et info */}
            <View style={styles.conversationHeader}>
              <View style={[
                styles.vehicleIconContainer,
                isOwner && styles.vehicleIconContainerReceived,
                isReporter && styles.vehicleIconContainerSent
              ]}>
                <Ionicons 
                  name={isOwner ? "alert-circle" : "send"} 
                  size={24} 
                  color={isOwner ? "#EF4444" : "#10B981"} 
                />
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.vehicleName}>
                    {`${item.vehicleBrand ? item.vehicleBrand : 'Véhicule'} ${item.vehicleModel ? item.vehicleModel : ''}`.trim()}
                  </Text>
                  <View style={[
                    styles.signalizationTypeBadge,
                    isOwner && styles.signalizationTypeBadgeReceived,
                    isReporter && styles.signalizationTypeBadgeSent
                  ]}>
                    <Text style={[
                      styles.signalizationTypeText,
                      isOwner && styles.signalizationTypeTextReceived,
                      isReporter && styles.signalizationTypeTextSent
                    ]}>
                      {isOwner ? 'Reçu' : 'Envoyé'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.licensePlate}>
                  {item.vehicleLicensePlate ? item.vehicleLicensePlate : 'Plaque inconnue'}
                </Text>
              </View>
              <View style={styles.conversationMeta}>
                <Text style={styles.timeText}>
                  {formatLastMessageTime(item.lastMessageAt ?? null)}
                </Text>
                {item.unreadCount && item.unreadCount > 0 && (
                  <View style={[
                    styles.unreadBadge,
                    isOwner && styles.unreadBadgeReceived,
                    isReporter && styles.unreadBadgeSent
                  ]}>
                    <Text style={styles.unreadText}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Participant info avec distinction */}
            <View style={[
              styles.participantContainer,
              isOwner && styles.participantContainerReceived,
              isReporter && styles.participantContainerSent
            ]}>
              <Ionicons 
                name={isOwner ? "person-remove" : "person-add"} 
                size={16} 
                color={isOwner ? "#EF4444" : "#10B981"} 
              />
              <Text style={[
                styles.participantName,
                isOwner && styles.participantNameReceived,
                isReporter && styles.participantNameSent
              ]}>
                {isOwner 
                  ? `Signalement reçu de ${getOtherParticipantName(item)}`
                  : `Signalement envoyé à ${getOtherParticipantName(item)}`
                }
              </Text>
            </View>
            
            {/* Last message preview */}
            {item.lastMessageContent && (
              <View style={[
                styles.lastMessageContainer,
                isOwner && styles.lastMessageContainerReceived,
                isReporter && styles.lastMessageContainerSent
              ]}>
                <Text style={styles.lastMessage} numberOfLines={2}>
                  {item.lastMessageContent}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
        <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
        <LinearGradient
          colors={['#2633E1', '#1E9B7E', '#26C29E']}
          style={{ paddingTop: 48, paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <Text style={{ fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6 }}>Messages</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>Chargement des conversations...</Text>
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
        <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
        <LinearGradient
          colors={['#2633E1', '#1E9B7E', '#26C29E']}
          style={{ paddingTop: 48, paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <Text style={{ fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6 }}>Messages</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>Aucune conversation</Text>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#2633E1" />
          </View>
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySubtitle}>
            Scannez un QR code pour commencer une conversation
          </Text>
          <View style={styles.emptyActionContainer}>
            <Ionicons name="qr-code" size={20} color="#2633E1" />
            <Text style={styles.emptyActionText}>
              Utilisez l&apos;onglet Scanner pour commencer
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <LinearGradient
        colors={['#2633E1', '#1E9B7E', '#26C29E']}
        style={{ paddingTop: 48, paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text style={{ fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6 }}>Messages</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</Text>
      </LinearGradient>

      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={styles.messagesBackground}
      >
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
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
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
    marginTop: 0,
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
    marginTop: 0,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(38, 51, 225, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  emptyActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 51, 225, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(38, 51, 225, 0.1)',
  },
  emptyActionText: {
    fontSize: 14,
    color: '#2633E1',
    marginLeft: 8,
    fontWeight: '600',
  },
  messagesBackground: {
    flex: 1,
  },
  conversationsList: {
    flex: 1,
    marginTop: 0,
  },
  conversationsContent: {
    padding: 24,
    paddingBottom: 40,
  },
  conversationItem: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationCardReceived: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  conversationCardSent: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(38, 51, 225, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleIconContainerReceived: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    shadowColor: '#EF4444',
  },
  vehicleIconContainerSent: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    shadowColor: '#10B981',
  },
  conversationInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  signalizationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(38, 51, 225, 0.1)',
  },
  signalizationTypeBadgeReceived: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  signalizationTypeBadgeSent: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  signalizationTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2633E1',
  },
  signalizationTypeTextReceived: {
    color: '#EF4444',
  },
  signalizationTypeTextSent: {
    color: '#10B981',
  },
  licensePlate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 8,
  },
  participantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(38, 51, 225, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  participantContainerReceived: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  participantContainerSent: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  participantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  participantNameReceived: {
    color: '#EF4444',
  },
  participantNameSent: {
    color: '#10B981',
  },
  lastMessageContainer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2633E1',
  },
  lastMessageContainerReceived: {
    borderLeftColor: '#EF4444',
  },
  lastMessageContainerSent: {
    borderLeftColor: '#10B981',
  },
  lastMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#2633E1',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadBadgeReceived: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  unreadBadgeSent: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  chevronContainer: {
    marginLeft: 12,
    padding: 8,
  },
});

