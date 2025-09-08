import { Ionicons } from '@expo/vector-icons';
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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [userName, setUserName] = useState(user?.email?.split('@')[0] || 'Utilisateur');
  const [userBio, setUserBio] = useState('Conducteur passionné 🚗');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSettings = () => {
    console.log('Bouton paramètres cliqué');
    setShowSettingsModal(true);
  };

  const saveProfile = () => {
    // Ici tu peux sauvegarder les modifications dans la base de données
    setEditMode(false);
    setShowEditModal(false);
    Alert.alert('Succès', 'Profil mis à jour avec succès !');
  };

  const ProfileOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    color = '#8B5CF6' 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Profil Utilisateur */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileBio}>{userBio}</Text>
            </View>
          </View>
        </View>

        {/* Section Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          <ProfileOption
            icon="settings-outline"
            title="Réglages de l'application"
            subtitle="Personnaliser NotifCar"
            onPress={handleSettings}
            color="#8B5CF6"
          />

          <ProfileOption
            icon="notifications-outline"
            title="Notifications"
            subtitle="Gérer les notifications push"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e5e7eb', true: '#8B5CF6' }}
                thumbColor={notificationsEnabled ? 'white' : '#f3f4f6'}
              />
            }
          />

          <ProfileOption
            icon="moon-outline"
            title="Mode sombre"
            subtitle="Activer le thème sombre"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e5e7eb', true: '#8B5CF6' }}
                thumbColor={darkMode ? 'white' : '#f3f4f6'}
              />
            }
          />
        </View>

        {/* Section Compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <ProfileOption
            icon="person-outline"
            title="Modifier le profil"
            subtitle="Nom, photo, bio"
            onPress={handleEditProfile}
            color="#10b981"
          />

          <ProfileOption
            icon="shield-checkmark-outline"
            title="Sécurité"
            subtitle="Mot de passe, authentification"
            color="#f59e0b"
          />

          <ProfileOption
            icon="privacy-outline"
            title="Confidentialité"
            subtitle="Données personnelles"
            color="#ef4444"
          />
        </View>

        {/* Section Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <ProfileOption
            icon="help-circle-outline"
            title="Aide & FAQ"
            subtitle="Questions fréquentes"
            color="#3b82f6"
          />

          <ProfileOption
            icon="mail-outline"
            title="Nous contacter"
            subtitle="Support technique"
            color="#8b5cf6"
          />

          <ProfileOption
            icon="star-outline"
            title="Évaluer l'app"
            subtitle="Notez NotifCar"
            color="#f59e0b"
          />
        </View>

        {/* Section Légale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          
          <ProfileOption
            icon="document-text-outline"
            title="Conditions d'utilisation"
            color="#6b7280"
          />

          <ProfileOption
            icon="shield-outline"
            title="Politique de confidentialité"
            color="#6b7280"
          />

          <ProfileOption
            icon="information-circle-outline"
            title="À propos"
            subtitle="Version 1.0.0"
            color="#6b7280"
          />
        </View>

        {/* Bouton Déconnexion */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.signOutGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal d'édition du profil */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.modalSave}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.editInput}
                value={userName}
                onChangeText={setUserName}
                placeholder="Votre nom"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Bio</Text>
              <TextInput
                style={[styles.editInput, styles.bioInput]}
                value={userBio}
                onChangeText={setUserBio}
                placeholder="Décrivez-vous en quelques mots..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editLabel}>Email</Text>
              <Text style={styles.emailDisplay}>{user?.email}</Text>
              <Text style={styles.emailNote}>L'email ne peut pas être modifié</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal des paramètres */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Text style={styles.modalCancel}>Fermer</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Réglages de l'application</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Section Notifications */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Notifications</Text>
              
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Ionicons name="notifications" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Notifications Push</Text>
                  <Text style={styles.settingSubtitle}>Recevoir des notifications pour les nouveaux messages</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#8B5CF6' }}
                  thumbColor={notificationsEnabled ? 'white' : '#f3f4f6'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#10b981' + '20' }]}>
                  <Ionicons name="volume-high" size={24} color="#10b981" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Sons de notification</Text>
                  <Text style={styles.settingSubtitle}>Activer les sons lors des notifications</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                  thumbColor={soundEnabled ? 'white' : '#f3f4f6'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                  <Ionicons name="phone-portrait" size={24} color="#f59e0b" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Vibration</Text>
                  <Text style={styles.settingSubtitle}>Vibrer lors des notifications</Text>
                </View>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#f59e0b' }}
                  thumbColor={vibrationEnabled ? 'white' : '#f3f4f6'}
                />
              </View>
            </View>

            {/* Section Apparence */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Apparence</Text>
              
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#6366f1' + '20' }]}>
                  <Ionicons name="moon" size={24} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Mode sombre</Text>
                  <Text style={styles.settingSubtitle}>Activer le thème sombre</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                  thumbColor={darkMode ? 'white' : '#f3f4f6'}
                />
              </View>
            </View>

            {/* Section Messages */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Messages</Text>
              
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#06b6d4' + '20' }]}>
                  <Ionicons name="eye" size={24} color="#06b6d4" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Lecture automatique</Text>
                  <Text style={styles.settingSubtitle}>Marquer automatiquement les messages comme lus</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: '#e5e7eb', true: '#06b6d4' }}
                  thumbColor="white"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#84cc16' + '20' }]}>
                  <Ionicons name="create" size={24} color="#84cc16" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Indicateur de frappe</Text>
                  <Text style={styles.settingSubtitle}>Voir quand quelqu'un écrit</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: '#e5e7eb', true: '#84cc16' }}
                  thumbColor="white"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
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
  optionItem: {
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
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  modalSave: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  editSection: {
    marginBottom: 24,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  emailDisplay: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  emailNote: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
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
});
