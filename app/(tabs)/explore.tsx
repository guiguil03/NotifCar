import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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

  const handleSettings = () => {
    Alert.alert('Paramètres', 'Fonctionnalité de paramètres à implémenter');
  };

  const handleHelp = () => {
    Alert.alert('Aide', 'Fonctionnalité d\'aide à implémenter');
  };

  const handleAbout = () => {
    Alert.alert('À propos', 'Notifcar v1.0.0\n\nApplication de notification automobile');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      
      {/* Header avec gradient violet moderne */}
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
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={40} color="#7C3AED" />
              </LinearGradient>
            </View>
            
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {user?.user_metadata?.full_name || 'Utilisateur'}
        </ThemedText>
              <ThemedText style={styles.userEmail}>
                {user?.email || 'email@example.com'}
        </ThemedText>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Statistiques personnelles */}
        <Animated.View
          style={[
            styles.statsContainer,
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
          <ThemedText style={styles.sectionTitle}>Mes statistiques</ThemedText>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: '#7C3AED' }]}>
                  <Ionicons name="car" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#7C3AED' }]}>1</ThemedText>
                <ThemedText style={styles.statLabel}>Véhicule</ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="notifications" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#F59E0B' }]}>3</ThemedText>
                <ThemedText style={styles.statLabel}>Notifications</ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#10B981' }]}>100%</ThemedText>
                <ThemedText style={styles.statLabel}>Sécurisé</ThemedText>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Actions rapides */}
        <Animated.View
          style={[
            styles.quickActionsContainer,
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
          <ThemedText style={styles.sectionTitle}>Actions rapides</ThemedText>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.quickActionGradient}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#7C3AED' }]}>
                  <Ionicons name="settings" size={24} color="white" />
                </View>
                <ThemedText style={styles.quickActionTitle}>Paramètres</ThemedText>
                <ThemedText style={styles.quickActionSubtitle}>Personnaliser l&apos;app</ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.quickActionGradient}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="help-circle" size={24} color="white" />
                </View>
                <ThemedText style={styles.quickActionTitle}>Aide</ThemedText>
                <ThemedText style={styles.quickActionSubtitle}>Support & FAQ</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Informations légales */}
        <Animated.View
          style={[
            styles.legalContainer,
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
          <ThemedText style={styles.sectionTitle}>Informations</ThemedText>
          
          <View style={styles.legalCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.legalGradient}
            >
              <TouchableOpacity style={styles.legalItem}>
                <View style={styles.legalItemContent}>
                  <Ionicons name="document-text" size={20} color="#7C3AED" />
                  <ThemedText style={styles.legalItemText}>Conditions d&apos;utilisation</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              <TouchableOpacity style={styles.legalItem}>
                <View style={styles.legalItemContent}>
                  <Ionicons name="shield" size={20} color="#7C3AED" />
                  <ThemedText style={styles.legalItemText}>Politique de confidentialité</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              <TouchableOpacity style={styles.legalItem} onPress={handleAbout}>
                <View style={styles.legalItemContent}>
                  <Ionicons name="information-circle" size={20} color="#7C3AED" />
                  <ThemedText style={styles.legalItemText}>À propos</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Bouton de déconnexion */}
        <Animated.View
          style={[
            styles.logoutContainer,
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
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.logoutGradient}
            >
              <Ionicons name="log-out" size={24} color="white" />
              <ThemedText style={styles.logoutText}>Se déconnecter</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Version de l'app */}
        <Animated.View
          style={[
            styles.versionContainer,
            {
              opacity: cardAnimations[4],
              transform: [{
                translateY: cardAnimations[4].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.versionText}>Notifcar v1.0.0</ThemedText>
          <ThemedText style={styles.copyrightText}>
            © 2024 Notifcar. Tous droits réservés.
          </ThemedText>
        </Animated.View>
      </ScrollView>
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
    // Animation handled by Animated.View
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  quickActionGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1F2937',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  legalContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  legalCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  legalGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  legalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  logoutContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoutButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});