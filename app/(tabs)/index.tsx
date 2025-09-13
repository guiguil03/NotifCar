import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const successColor = useThemeColor({}, 'success');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const gradientLight = useThemeColor({}, 'gradientLight');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerSlideAnim = useRef(new Animated.Value(-30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    // Mise à jour de l'heure
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Animation d'entrée principale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation pour le bouton principal
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Animations en cascade pour les cartes
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: 300 + (index * 150),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      clearInterval(timer);
      pulseAnimation.stop();
    };
  }, [fadeAnim, slideAnim, scaleAnim, headerSlideAnim, cardAnimations, pulseAnim]);

  const handleScanQR = () => {
    router.push('/(tabs)/scan');
  };

  const handleMyVehicles = () => {
    router.push('/(tabs)/vehicles');
  };

  const handleNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const handleProfile = () => {
    router.push('/(tabs)/explore');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getTimeString = () => {
    return currentTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDateString = () => {
    return currentTime.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
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
              transform: [{ translateY: headerSlideAnim }]
            }
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.logoGradient}
              >
                <Ionicons name="car-sport" size={32} color="#7C3AED" />
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.greetingText}>
              {getGreeting()}{user?.user_metadata?.full_name ? ` ${user.user_metadata.full_name.split(' ')[0]}` : ''} !
            </ThemedText>
            <ThemedText style={styles.subtitleText}>
              Votre sécurité automobile en un clic
            </ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Action principale avec animation de pulsation */}
        <Animated.View 
          style={[
            styles.mainActionContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim }, 
                { scale: Animated.multiply(scaleAnim, pulseAnim) }
              ]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={handleScanQR}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7C3AED', '#5B21B6', '#4C1D95']}
              style={styles.mainActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mainActionContent}>
                <View style={styles.mainActionIcon}>
                  <Ionicons name="qr-code" size={36} color="white" />
                </View>
                <View style={styles.mainActionTextContainer}>
                  <ThemedText style={styles.mainActionTitle}>Scanner QR Code</ThemedText>
                  <ThemedText style={styles.mainActionSubtitle}>
                    Notifier un véhicule instantanément
                  </ThemedText>
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={24} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Actions rapides avec design moderne */}
        <View style={styles.quickActionsContainer}>
          <ThemedText style={styles.sectionTitle}>Accès rapide</ThemedText>
          
          <View style={styles.quickActionsGrid}>
            <Animated.View
              style={[
                styles.quickActionWrapper,
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
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={handleMyVehicles}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionHeader}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#7C3AED' }]}>
                      <Ionicons name="car" size={24} color="white" />
                    </View>
                    <View style={styles.quickActionArrow}>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                  <ThemedText style={styles.quickActionTitle}>Mes Véhicules</ThemedText>
                  <ThemedText style={styles.quickActionCount}>1 véhicule actif</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.quickActionWrapper,
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
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={handleNotifications}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionHeader}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
                      <Ionicons name="notifications" size={24} color="white" />
                    </View>
                    <View style={styles.quickActionArrow}>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                  <ThemedText style={styles.quickActionTitle}>Notifications</ThemedText>
                  <View style={styles.notificationBadge}>
                    <View style={[styles.notificationDot, { backgroundColor: '#F59E0B' }]} />
                    <ThemedText style={styles.quickActionCount}>3 nouvelles</ThemedText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Statistiques avec design sophistiqué */}
        <Animated.View 
          style={[
            styles.statsContainer,
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
          <ThemedText style={styles.sectionTitle}>Vue d&apos;ensemble</ThemedText>
          
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
                  <Ionicons name="alert-circle" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#F59E0B' }]}>3</ThemedText>
                <ThemedText style={styles.statLabel}>Alertes</ThemedText>
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

        {/* Section fonctionnalités */}
        <Animated.View 
          style={[
            styles.featuresContainer,
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
          <ThemedText style={styles.sectionTitle}>Fonctionnalités</ThemedText>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#E9D5FF', '#DDD6FE']}
                style={styles.featureGradient}
              >
                <Ionicons name="qr-code-outline" size={32} color="#7C3AED" />
                <ThemedText style={styles.featureTitle}>Scan QR</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Scanner et notifier instantanément
                </ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.featureGradient}
              >
                <Ionicons name="notifications-outline" size={32} color="#F59E0B" />
                <ThemedText style={styles.featureTitle}>Alertes</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Recevez des notifications en temps réel
                </ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.featureGradient}
              >
                <Ionicons name="shield-outline" size={32} color="#10B981" />
                <ThemedText style={styles.featureTitle}>Sécurité</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Protection maximale de vos données
                </ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.featureGradient}
              >
                <Ionicons name="cloud-outline" size={32} color="#3B82F6" />
                <ThemedText style={styles.featureTitle}>Cloud</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Synchronisation automatique
                </ThemedText>
              </LinearGradient>
            </View>
          </View>
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
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerContent: {
    alignItems: 'center',
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
    zIndex: 1,
    top: 20,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainActionContainer: {
    paddingHorizontal: 24,
    marginTop: -20,
    marginBottom: 32,
  },
  mainActionButton: {
    top: 30,
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  mainActionGradient: {
    borderRadius: 24,
    padding: 24,
  },
  mainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  mainActionTextContainer: {
    flex: 1,
  },
  mainActionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  mainActionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsContainer: {
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
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionWrapper: {
    flex: 1,
  },
  quickActionCard: {
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
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  quickActionCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActionArrow: {
    // Arrow positioning handled by flexDirection in header
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  guideContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  guideSteps: {
    gap: 20,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Nouveaux styles pour les sections modernes
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileButton: {
    borderRadius: 12,
  },
  profileButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  featuresContainer: {
    padding: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});