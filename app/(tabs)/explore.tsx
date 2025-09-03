import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  const { user, signOut } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const colorScheme = useColorScheme();

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert('Support', 'Fonctionnalité de contact support à implémenter');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Politique de confidentialité', 'Fonctionnalité à implémenter');
  };

  const handleTermsOfService = () => {
    Alert.alert('Conditions d\'utilisation', 'Fonctionnalité à implémenter');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: primaryColor }]}>
        <ThemedView style={styles.profileInfo}>
          <ThemedView style={[styles.avatar, { backgroundColor: 'white' }]}>
            <Ionicons name="person" size={40} color={primaryColor} />
          </ThemedView>
          <ThemedView style={styles.userInfo}>
            <ThemedText style={styles.userName}>
              {user?.user_metadata?.full_name || 'Utilisateur Notifcar'}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email || 'user@notifcar.com'}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Statistiques utilisateur */}
      <ThemedView style={styles.statsContainer}>
        <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
          <Ionicons name="car-outline" size={24} color={primaryColor} />
          <ThemedText style={styles.statNumber}>1</ThemedText>
          <ThemedText style={styles.statLabel}>Véhicule</ThemedText>
        </ThemedView>
        
        <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
          <Ionicons name="notifications-outline" size={24} color={secondaryColor} />
          <ThemedText style={styles.statNumber}>3</ThemedText>
          <ThemedText style={styles.statLabel}>Notifications</ThemedText>
        </ThemedView>
        
        <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
          <Ionicons name="qr-code-outline" size={24} color={primaryColor} />
          <ThemedText style={styles.statNumber}>1</ThemedText>
          <ThemedText style={styles.statLabel}>QR Code</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Paramètres */}
      <ThemedView style={styles.settingsContainer}>
        <ThemedText style={styles.sectionTitle}>Paramètres</ThemedText>
        
        <ThemedView style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}>
          <ThemedView style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color={primaryColor} />
            <ThemedView style={styles.settingText}>
              <ThemedText style={styles.settingTitle}>Notifications push</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Recevoir des notifications en temps réel
        </ThemedText>
            </ThemedView>
          </ThemedView>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: borderColor, true: primaryColor }}
            thumbColor="white"
          />
        </ThemedView>

        <ThemedView style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}>
          <ThemedView style={styles.settingInfo}>
            <Ionicons name="location-outline" size={24} color={primaryColor} />
            <ThemedView style={styles.settingText}>
              <ThemedText style={styles.settingTitle}>Géolocalisation</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Partager la localisation pour les notifications
        </ThemedText>
            </ThemedView>
          </ThemedView>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: borderColor, true: primaryColor }}
            thumbColor="white"
          />
        </ThemedView>

        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: cardColor, borderColor }]}
          onPress={() => Alert.alert('Mode sombre', 'Fonctionnalité à implémenter')}
        >
          <ThemedView style={styles.settingInfo}>
            <Ionicons 
              name={colorScheme === 'dark' ? 'moon-outline' : 'sunny-outline'} 
              size={24} 
              color={primaryColor} 
            />
            <ThemedView style={styles.settingText}>
              <ThemedText style={styles.settingTitle}>Mode sombre</ThemedText>
              <ThemedText style={styles.settingDescription}>
                {colorScheme === 'dark' ? 'Désactiver' : 'Activer'} le mode sombre
        </ThemedText>
            </ThemedView>
          </ThemedView>
          <Ionicons name="chevron-forward" size={20} color={primaryColor} />
        </TouchableOpacity>
      </ThemedView>

      {/* Actions rapides */}
      <ThemedView style={styles.actionsContainer}>
        <ThemedText style={styles.sectionTitle}>Actions rapides</ThemedText>
        
        <TouchableOpacity 
          style={[styles.actionItem, { backgroundColor: cardColor, borderColor }]}
          onPress={() => router.push('/vehicles')}
        >
          <Ionicons name="car-outline" size={24} color={primaryColor} />
          <ThemedText style={styles.actionText}>Gérer mes véhicules</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={primaryColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, { backgroundColor: cardColor, borderColor }]}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={primaryColor} />
          <ThemedText style={styles.actionText}>Voir les notifications</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={primaryColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, { backgroundColor: cardColor, borderColor }]}
          onPress={handleContactSupport}
        >
          <Ionicons name="help-circle-outline" size={24} color={primaryColor} />
          <ThemedText style={styles.actionText}>Support client</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={primaryColor} />
        </TouchableOpacity>
      </ThemedView>

      {/* Informations légales */}
      <ThemedView style={styles.legalContainer}>
        <ThemedText style={styles.sectionTitle}>Informations légales</ThemedText>
        
        <TouchableOpacity 
          style={[styles.legalItem, { backgroundColor: cardColor, borderColor }]}
          onPress={handlePrivacyPolicy}
        >
          <ThemedText style={styles.legalText}>Politique de confidentialité</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={primaryColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.legalItem, { backgroundColor: cardColor, borderColor }]}
          onPress={handleTermsOfService}
        >
          <ThemedText style={styles.legalText}>Conditions d'utilisation</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={primaryColor} />
        </TouchableOpacity>
      </ThemedView>

      {/* Déconnexion */}
      <ThemedView style={styles.logoutContainer}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#EF4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <ThemedText style={styles.logoutText}>Se déconnecter</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Version */}
      <ThemedView style={styles.versionContainer}>
        <ThemedText style={styles.versionText}>Notifcar v1.0.0</ThemedText>
        <ThemedText style={styles.versionSubtext}>&quot;Votre véhicule vous parle, écoutez-le&quot;</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  settingsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionsContainer: {
    padding: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  legalContainer: {
    padding: 20,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutContainer: {
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});