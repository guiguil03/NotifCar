import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
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

  useEffect(() => {
    loadConversations();
  }, []);

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

  const closeConversation = () => {
    setSelectedConversation(null);
    loadConversations(); // Recharger les conversations
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des conversations...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Aucune conversation</Text>
        <Text style={styles.emptySubtitle}>
          Scannez un QR code pour commencer une conversation
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f8f9fa',
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
  },
  conversationsContent: {
    padding: 16,
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
