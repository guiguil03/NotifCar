import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

interface TestChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TestChatModal: React.FC<TestChatModalProps> = ({ visible, onClose }) => {
  const { createConversationFromQR } = useChat();
  const { user } = useAuth();
  const [testMessage, setTestMessage] = useState('Test de message automatique');
  const [testVehicleId, setTestVehicleId] = useState('');

  const handleCreateTestConversation = async () => {
    if (!testMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message de test');
      return;
    }

    try {
      // Utiliser le QR code fourni ou un QR code de test
      const qrCode = testVehicleId.trim() || `test-qr-${Date.now()}`;
      
      const conversation = await createConversationFromQR(qrCode, testMessage.trim());
      
      if (conversation) {
        Alert.alert(
          'Conversation créée !',
          'Une conversation a été créée. Vous pouvez maintenant la voir dans l\'onglet Messages.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                setTestMessage('Test de message automatique');
                setTestVehicleId('');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la conversation. Vérifiez que le QR code existe.');
    }
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>Test du Chat</Text>
            <TouchableOpacity 
              onPress={Keyboard.dismiss} 
              style={styles.keyboardDismissButton}
            >
              <Ionicons name="keyboard-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flask" size={20} color="#2633E1" />
              <Text style={styles.sectionTitle}>Mode Test</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Entrez un QR code NotifCar existant (format: notifcar:vehicleId:ownerId) pour créer une conversation avec le propriétaire du véhicule.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Message de test :</Text>
            <TextInput
              style={styles.textInput}
              value={testMessage}
              onChangeText={setTestMessage}
              placeholder="Entrez votre message de test..."
              multiline
              maxLength={500}
              returnKeyType="default"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>QR Code du véhicule :</Text>
            <TextInput
              style={styles.textInput}
              value={testVehicleId}
              onChangeText={setTestVehicleId}
              placeholder="notifcar:vehicleId:ownerId"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleCreateTestConversation}
            >
              <Ionicons name="chatbubble" size={20} color="white" />
              <Text style={styles.buttonText}>Créer Conversation</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Comment tester :</Text>
              <Text style={styles.infoText}>
                1. Créez d'abord un véhicule pour obtenir un QR code{'\n'}
                2. Copiez le QR code généré (format: notifcar:vehicleId:ownerId){'\n'}
                3. Entrez ce QR code ici avec votre message{'\n'}
                4. Cliquez sur "Créer Conversation"{'\n'}
                5. Le propriétaire du véhicule recevra votre message
              </Text>
            </View>
          </View>
        </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  keyboardDismissButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 50,
  },
  buttons: {
    gap: 12,
    marginBottom: 24,
  },
  testButton: {
    backgroundColor: '#2633E1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  autoTestButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});
