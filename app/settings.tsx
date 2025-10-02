// Composants de test supprimés - notifications FCM fonctionnelles
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { AppSettings, SettingsService } from '@/lib/settingsService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  
  // États pour les paramètres
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: false,
    autoRefresh: true,
    locationSharing: false,
    language: 'fr',
    refreshInterval: 5,
  });
  const [loading, setLoading] = useState(true);
  // États pour les testeurs supprimés

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loadedSettings = await SettingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      Alert.alert('Erreur', 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

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

    // Animations en cascade pour les cartes
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 200 + (index * 100),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleSaveSettings = async () => {
    try {
      await SettingsService.saveSettings(settings);
      Alert.alert(
        'Paramètres sauvegardés',
        'Vos paramètres ont été mis à jour avec succès !',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await SettingsService.resetSettings();
              await loadSettings();
              Alert.alert('Paramètres réinitialisés', 'Tous les paramètres ont été remis aux valeurs par défaut.');
            } catch (error) {
              console.error('Erreur réinitialisation paramètres:', error);
              Alert.alert('Erreur', 'Impossible de réinitialiser les paramètres');
            }
          },
        },
      ]
    );
  };

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await SettingsService.updateSetting(key, value);
    } catch (error) {
      console.error('Erreur mise à jour paramètre:', error);
      // Revenir à l'ancienne valeur en cas d'erreur
      setSettings(settings);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch' 
  }: {
    icon: string;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    type?: 'switch' | 'button';
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={24} color="#2633E1" />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#2633E1' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
        ) : (
          <TouchableOpacity onPress={() => onValueChange(!value)}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {/* Header avec gradient violet moderne */}
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <ThemedText style={styles.headerTitle}>Paramètres</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Personnalisez votre expérience</ThemedText>
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications */}
        <Animated.View
          style={[
            styles.settingsSection,
            {
              opacity: cardAnimations[0],
              transform: [{
                translateY: cardAnimations[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          
          <View style={styles.settingsCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.settingsGradient}
            >
              <SettingItem
                icon="notifications"
                title="Notifications push"
                subtitle="Recevoir des notifications sur votre appareil"
                value={settings.notificationsEnabled}
                onValueChange={(value) => updateSetting('notificationsEnabled', value)}
              />
              
              <View style={styles.separator} />
              
              <SettingItem
                icon="volume-high"
                title="Son des notifications"
                subtitle="Jouer un son lors des notifications"
                value={settings.soundEnabled}
                onValueChange={(value) => updateSetting('soundEnabled', value)}
              />
              
              <View style={styles.separator} />
              
              <SettingItem
                icon="phone-portrait"
                title="Vibration"
                subtitle="Vibrer lors des notifications"
                value={settings.vibrationEnabled}
                onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              />
              
              {/* Boutons de test supprimés - notifications FCM opérationnelles */}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Apparence */}
        <Animated.View
          style={[
            styles.settingsSection,
            {
              opacity: cardAnimations[1],
              transform: [{
                translateY: cardAnimations[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Apparence</ThemedText>
          
          <View style={styles.settingsCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.settingsGradient}
            >
              <SettingItem
                icon="moon"
                title="Mode sombre"
                subtitle="Activer le thème sombre"
                value={settings.darkMode}
                onValueChange={(value) => updateSetting('darkMode', value)}
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Fonctionnalités */}
        <Animated.View
          style={[
            styles.settingsSection,
            {
              opacity: cardAnimations[2],
              transform: [{
                translateY: cardAnimations[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Fonctionnalités</ThemedText>
          
          <View style={styles.settingsCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.settingsGradient}
            >
              <SettingItem
                icon="refresh"
                title="Actualisation automatique"
                subtitle="Actualiser automatiquement les données"
                value={settings.autoRefresh}
                onValueChange={(value) => updateSetting('autoRefresh', value)}
              />
              
              <View style={styles.separator} />
              
              <SettingItem
                icon="location"
                title="Partage de localisation"
                subtitle="Partager votre localisation pour de meilleures recommandations"
                value={settings.locationSharing}
                onValueChange={(value) => updateSetting('locationSharing', value)}
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[
            styles.settingsSection,
            {
              opacity: cardAnimations[3],
              transform: [{
                translateY: cardAnimations[3].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Actions</ThemedText>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleResetSettings}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.actionGradient}
              >
                <Ionicons name="refresh-circle" size={24} color="white" />
                <ThemedText style={styles.actionText}>Réinitialiser</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.actionGradient}
              >
                <Ionicons name="log-out" size={24} color="white" />
                <ThemedText style={styles.actionText}>Déconnexion</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modales de test supprimées - notifications FCM opérationnelles */}
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
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  saveButton: {
    marginLeft: 16,
  },
  saveButtonGradient: {
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  settingsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  settingsCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  settingsGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  settingItemRight: {
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
});
