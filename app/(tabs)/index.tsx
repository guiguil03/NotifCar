import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
// import { VioletCard } from '@/components/ui/VioletCard';
// import { VioletButton } from '@/components/ui/VioletButton';

// const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const successColor = useThemeColor({}, 'success');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const gradientLight = useThemeColor({}, 'gradientLight');
  // const gradientAccent = useThemeColor({}, 'gradientAccent');
  // const warningColor = useThemeColor({}, 'warning');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerSlideAnim = useRef(new Animated.Value(-30)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    // Animation d'entrée principale
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
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
  }, [fadeAnim, slideAnim, scaleAnim, headerSlideAnim, cardAnimations]);

  const handleScanQR = () => {
    router.push('/(tabs)/scan');
  };

  const handleMyVehicles = () => {
    router.push('/(tabs)/vehicles');
  };

  const handleNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={gradientStart} />
      
      {/* Header avec gradient violet */}
      <LinearGradient
        colors={[gradientStart, gradientEnd, gradientLight]}
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
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.logoGradient}
              >
                <Ionicons name="car-sport" size={28} color="#1E3A8A" />
              </LinearGradient>
            </View>
            
            <View style={styles.welcomeSection}>
              <ThemedText style={styles.greetingText}>
                {getGreeting()}{user?.user_metadata?.full_name ? ` ${user.user_metadata.full_name.split(' ')[0]}` : ''} !
              </ThemedText>
              <ThemedText style={styles.subtitleText}>
                Votre sécurité automobile en un clic
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
        {/* Action principale avec design premium */}
        <Animated.View 
          style={[
            styles.mainActionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={handleScanQR}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[gradientStart, gradientEnd]}
              style={styles.mainActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mainActionContent}>
                <View style={styles.mainActionIcon}>
                  <Ionicons name="qr-code" size={32} color="white" />
                </View>
                <View style={styles.mainActionTextContainer}>
                  <ThemedText style={styles.mainActionTitle}>Scanner QR Code</ThemedText>
                  <ThemedText style={styles.mainActionSubtitle}>
                    Notifier un véhicule instantanément
                  </ThemedText>
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={24} color="rgba(255,255,255,0.8)" />
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
                    <View style={[styles.quickActionIcon, { backgroundColor: primaryColor }]}>
                      <Ionicons name="car" size={20} color="white" />
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
                    <View style={[styles.quickActionIcon, { backgroundColor: secondaryColor }]}>
                      <Ionicons name="notifications" size={20} color="white" />
                    </View>
                    <View style={styles.quickActionArrow}>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                  <ThemedText style={styles.quickActionTitle}>Notifications</ThemedText>
                  <View style={styles.notificationBadge}>
                    <View style={[styles.notificationDot, { backgroundColor: secondaryColor }]} />
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
                <View style={[styles.statIcon, { backgroundColor: primaryColor }]}>
                  <Ionicons name="car" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: primaryColor }]}>1</ThemedText>
                <ThemedText style={styles.statLabel}>Véhicule</ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: secondaryColor }]}>
                  <Ionicons name="alert-circle" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: secondaryColor }]}>3</ThemedText>
                <ThemedText style={styles.statLabel}>Alertes</ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: successColor }]}>
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: successColor }]}>100%</ThemedText>
                <ThemedText style={styles.statLabel}>Sécurisé</ThemedText>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Guide d'utilisation avec design moderne */}
        <Animated.View 
          style={[
            styles.guideContainer,
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
          <ThemedText style={styles.sectionTitle}>Comment ça marche ?</ThemedText>
          
          <View style={styles.guideSteps}>
            <View style={styles.guideStep}>
              <LinearGradient
                colors={[gradientStart, gradientEnd]}
                style={styles.stepIndicator}
              >
                <ThemedText style={styles.stepNumber}>1</ThemedText>
              </LinearGradient>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>Enregistrez</ThemedText>
                <ThemedText style={styles.stepDescription}>
                  Ajoutez vos véhicules dans l&apos;application
        </ThemedText>
              </View>
            </View>

            <View style={styles.guideStep}>
              <LinearGradient
                colors={[gradientStart, gradientEnd]}
                style={styles.stepIndicator}
              >
                <ThemedText style={styles.stepNumber}>2</ThemedText>
              </LinearGradient>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>Collez</ThemedText>
                <ThemedText style={styles.stepDescription}>
                  QR code sur le pare-brise de votre véhicule
        </ThemedText>
              </View>
            </View>

            <View style={styles.guideStep}>
              <LinearGradient
                colors={[gradientStart, gradientEnd]}
                style={styles.stepIndicator}
              >
                <ThemedText style={styles.stepNumber}>3</ThemedText>
              </LinearGradient>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>Recevez</ThemedText>
                <ThemedText style={styles.stepDescription}>
                  Notifications instantanées en cas d&apos;incident
        </ThemedText>
              </View>
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
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
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
});