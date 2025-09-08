import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'switch' | 'select' | 'input' | 'action';
  value: any;
  options?: { label: string; value: any }[];
  icon: string;
  color: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'notifications',
      title: 'Notifications Push',
      subtitle: 'Recevoir des notifications pour les nouveaux messages',
      type: 'switch',
      value: true,
      icon: 'notifications',
      color: '#8B5CF6',
    },
    {
      id: 'sound',
      title: 'Sons de notification',
      subtitle: 'Activer les sons lors des notifications',
      type: 'switch',
      value: true,
      icon: 'volume-high',
      color: '#10b981',
    },
    {
      id: 'vibration',
      title: 'Vibration',
      subtitle: 'Vibrer lors des notifications',
      type: 'switch',
      value: true,
      icon: 'phone-portrait',
      color: '#f59e0b',
    },
    {
      id: 'darkMode',
      title: 'Mode sombre',
      subtitle: 'Activer le thème sombre',
      type: 'switch',
      value: false,
      icon: 'moon',
      color: '#6366f1',
    },
    {
      id: 'autoRead',
      title: 'Lecture automatique',
      subtitle: 'Marquer automatiquement les messages comme lus',
      type: 'switch',
      value: true,
      icon: 'eye',
      color: '#06b6d4',
    },
    {
      id: 'typingIndicator',
      title: 'Indicateur de frappe',
      subtitle: 'Voir quand quelqu\'un écrit',
      type: 'switch',
      value: true,
      icon: 'create',
      color: '#84cc16',
    },
    {
      id: 'messagePreview',
      title: 'Aperçu des messages',
      subtitle: 'Afficher le contenu des messages dans les notifications',
      type: 'switch',
      value: true,
      icon: 'eye-outline',
      color: '#f97316',
    },
    {
      id: 'language',
      title: 'Langue',
      subtitle: 'Choisir la langue de l\'application',
      type: 'select',
      value: 'fr',
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' },
      ],
      icon: 'language',
      color: '#ec4899',
    },
    {
      id: 'fontSize',
      title: 'Taille de police',
      subtitle: 'Ajuster la taille du texte',
      type: 'select',
      value: 'medium',
      options: [
        { label: 'Petite', value: 'small' },
        { label: 'Moyenne', value: 'medium' },
        { label: 'Grande', value: 'large' },
      ],
      icon: 'text',
      color: '#8b5cf6',
    },
    {
      id: 'autoDelete',
      title: 'Suppression automatique',
      subtitle: 'Supprimer automatiquement les anciens messages',
      type: 'select',
      value: 'never',
      options: [
        { label: 'Jamais', value: 'never' },
        { label: 'Après 30 jours', value: '30days' },
        { label: 'Après 90 jours', value: '90days' },
        { label: 'Après 1 an', value: '1year' },
      ],
      icon: 'trash',
      color: '#ef4444',
    },
    {
      id: 'privacy',
      title: 'Confidentialité',
      subtitle: 'Gérer les paramètres de confidentialité',
      type: 'action',
      value: null,
      icon: 'shield-checkmark',
      color: '#059669',
    },
    {
      id: 'dataUsage',
      title: 'Utilisation des données',
      subtitle: 'Gérer l\'utilisation des données mobiles',
      type: 'action',
      value: null,
      icon: 'cellular',
      color: '#3b82f6',
    },
  ]);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showAutoDeleteModal, setShowAutoDeleteModal] = useState(false);

  const handleSettingChange = async (id: string, value: any) => {
    const updatedSettings = settings.map(setting =>
      setting.id === id ? { ...setting, value } : setting
    );
    setSettings(updatedSettings);

    // Sauvegarder dans AsyncStorage
    try {
      await AsyncStorage.setItem(`setting_${id}`, JSON.stringify(value));
    } catch (error) {
      console.error('Erreur sauvegarde paramètre:', error);
    }

    // Actions spéciales
    if (id === 'darkMode') {
      // Ici tu peux implémenter le changement de thème
      console.log('Mode sombre:', value);
    } else if (id === 'notifications') {
      // Ici tu peux gérer les permissions de notification
      console.log('Notifications:', value);
    }
  };

  const handleActionPress = (id: string) => {
    switch (id) {
      case 'privacy':
        Alert.alert('Confidentialité', 'Fonctionnalité à venir');
        break;
      case 'dataUsage':
        Alert.alert('Utilisation des données', 'Fonctionnalité à venir');
        break;
      default:
        break;
    }
  };

  const SettingItem = ({ item }: { item: SettingItem }) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.settingRight}>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={(value) => handleSettingChange(item.id, value)}
            trackColor={{ false: '#e5e7eb', true: item.color }}
            thumbColor={item.value ? 'white' : '#f3f4f6'}
          />
        )}
        {item.type === 'select' && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              if (item.id === 'language') setShowLanguageModal(true);
              else if (item.id === 'fontSize') setShowFontSizeModal(true);
              else if (item.id === 'autoDelete') setShowAutoDeleteModal(true);
            }}
          >
            <Text style={styles.selectText}>
              {item.options?.find(opt => opt.value === item.value)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
        {item.type === 'action' && (
          <TouchableOpacity
            onPress={() => handleActionPress(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const SelectModal = ({ 
    visible, 
    onClose, 
    title, 
    options, 
    currentValue, 
    onSelect 
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: { label: string; value: any }[];
    currentValue: any;
    onSelect: (value: any) => void;
  }) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={styles.modalContent}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                currentValue === option.value && styles.selectedOption
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text style={[
                styles.optionText,
                currentValue === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              {currentValue === option.value && (
                <Ionicons name="checkmark" size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#8B5CF6', '#A855F7', '#C084FC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réglages</Text>
          <TouchableOpacity style={styles.resetButton} onPress={() => {
            Alert.alert(
              'Réinitialiser',
              'Voulez-vous réinitialiser tous les paramètres ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Réinitialiser', style: 'destructive', onPress: () => {
                  // Réinitialiser les paramètres
                  setSettings(prev => prev.map(s => ({ ...s, value: s.id === 'language' ? 'fr' : s.id === 'fontSize' ? 'medium' : s.id === 'autoDelete' ? 'never' : true })));
                }}
              ]
            );
          }}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {settings.filter(s => ['notifications', 'sound', 'vibration', 'messagePreview'].includes(s.id)).map(item => (
            <SettingItem key={item.id} item={item} />
          ))}
        </View>

        {/* Section Apparence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          {settings.filter(s => ['darkMode', 'fontSize', 'language'].includes(s.id)).map(item => (
            <SettingItem key={item.id} item={item} />
          ))}
        </View>

        {/* Section Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {settings.filter(s => ['autoRead', 'typingIndicator', 'autoDelete'].includes(s.id)).map(item => (
            <SettingItem key={item.id} item={item} />
          ))}
        </View>

        {/* Section Avancé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avancé</Text>
          {settings.filter(s => ['privacy', 'dataUsage'].includes(s.id)).map(item => (
            <SettingItem key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals de sélection */}
      <SelectModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Choisir la langue"
        options={settings.find(s => s.id === 'language')?.options || []}
        currentValue={settings.find(s => s.id === 'language')?.value}
        onSelect={(value) => handleSettingChange('language', value)}
      />

      <SelectModal
        visible={showFontSizeModal}
        onClose={() => setShowFontSizeModal(false)}
        title="Taille de police"
        options={settings.find(s => s.id === 'fontSize')?.options || []}
        currentValue={settings.find(s => s.id === 'fontSize')?.value}
        onSelect={(value) => handleSettingChange('fontSize', value)}
      />

      <SelectModal
        visible={showAutoDeleteModal}
        onClose={() => setShowAutoDeleteModal(false)}
        title="Suppression automatique"
        options={settings.find(s => s.id === 'autoDelete')?.options || []}
        currentValue={settings.find(s => s.id === 'autoDelete')?.value}
        onSelect={(value) => handleSettingChange('autoDelete', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resetButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingRight: {
    marginLeft: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minWidth: 100,
  },
  selectText: {
    fontSize: 14,
    color: '#1f2937',
    marginRight: 8,
  },
  actionButton: {
    padding: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedOption: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedOptionText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});
