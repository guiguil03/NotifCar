import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { ConversationList } from '../../components/chat/ConversationList';
import { ConversationView } from '../../components/chat/ConversationView';
import { useChat } from '../../contexts/ChatContext';
import { Conversation } from '../../lib/chatService';

export default function ChatScreen() {
  const { conversations } = useChat();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={24} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        {getUnreadCount() > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {getUnreadCount()}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {renderHeader()}
      
      {selectedConversation ? (
        <ConversationView
          conversationId={selectedConversation.id}
          onBack={handleBackToList}
        />
      ) : (
        <ConversationList onSelectConversation={handleSelectConversation} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});
