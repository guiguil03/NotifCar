// Composant de test supprimé - analytics opérationnels
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Signalization, SignalizationService } from '@/lib/signalizationService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const insets = useSafeAreaInsets();
  const primaryColor = useThemeColor({}, 'primary');
  
  // États pour les notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [sentSignalizations, setSentSignalizations] = useState<Signalization[]>([]);
  const [receivedSignalizations, setReceivedSignalizations] = useState<Signalization[]>([]);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // const primaryColor = useThemeColor({}, 'primary');
  // const secondaryColor = useThemeColor({}, 'secondary');
  // const successColor = useThemeColor({}, 'success');
  // const gradientStart = useThemeColor({}, 'gradientStart');
  // const gradientEnd = useThemeColor({}, 'gradientEnd');
  // const gradientLight = useThemeColor({}, 'gradientLight');

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
    setShowNotifications(true);
    loadSignalizations();
  };

  const loadSignalizations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [sent, received] = await Promise.all([
        SignalizationService.getUserSignalizations(user.id),
        SignalizationService.getReceivedSignalizations(user.id)
      ]);
      setSentSignalizations(sent);
      setReceivedSignalizations(received);
    } catch (error) {
      console.error('Erreur chargement signalisations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefreshNotifications = async () => {
    setRefreshing(true);
    await loadSignalizations();
    setRefreshing(false);
  };

  // const handleProfile = () => {
  //   router.push('/(tabs)/explore');
  // };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // const getTimeString = () => {
  //   return currentTime.toLocaleTimeString('fr-FR', { 
  //     hour: '2-digit', 
  //     minute: '2-digit' 
  //   });
  // };

  // const getDateString = () => {
  //   return currentTime.toLocaleDateString('fr-FR', { 
  //     weekday: 'long',
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   });
  // };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      
      {/* Header simple avec gradient */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E', '#26C29E']}
        style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <ThemedText style={{ fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 4 }}>
          {getGreeting()}{user?.user_metadata?.full_name ? ` ${user.user_metadata.full_name.split(' ')[0]}` : ''}
        </ThemedText>
        <ThemedText style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>Votre sécurité automobile en un clic</ThemedText>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Composant de test supprimé - analytics opérationnels */}
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
              colors={['#2633E1', '#2633E1']}
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
                    <View style={[styles.quickActionIcon, { backgroundColor: '#2633E1' }]}>
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
                <View style={[styles.statIcon, { backgroundColor: '#2633E1' }]}>
                  <Ionicons name="car" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#2633E1' }]}>1</ThemedText>
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

        {/* Section fonctionnalités SUPPRIMÉE */}
        
      </ScrollView>

      {/* Modal des notifications */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#2633E1', '#1E9B7E', '#26C29E']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity 
                onPress={() => setShowNotifications(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Mes Signalisations</ThemedText>
              <View style={styles.modalPlaceholder} />
            </View>
            
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'sent' && styles.activeTabButton]}
                onPress={() => setActiveTab('sent')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
                  Envoyées
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'received' && styles.activeTabButton]}
                onPress={() => setActiveTab('received')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
                  Reçues
                </ThemedText>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.modalContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefreshNotifications}
                colors={[primaryColor]}
                tintColor={primaryColor}
              />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ThemedText style={styles.loadingText}>Chargement des signalisations...</ThemedText>
              </View>
            ) : (
              <>
                {activeTab === 'sent' ? (
                  sentSignalizations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="send-outline" size={80} color="#ccc" />
                      <ThemedText style={styles.emptyTitle}>Aucune signalisation envoyée</ThemedText>
                      <ThemedText style={styles.emptySubtitle}>
                        Scannez un QR code pour signaler un problème
                      </ThemedText>
                    </View>
                  ) : (
                    sentSignalizations.map((signalization) => (
                      <View key={signalization.id} style={styles.signalizationCard}>
                        <View style={styles.signalizationHeader}>
                          <View style={styles.signalizationIcon}>
                            <Ionicons name="car" size={20} color="white" />
                          </View>
                          <View style={styles.signalizationInfo}>
                            <ThemedText style={styles.signalizationTitle}>
                              {signalization.vehicle_brand} {signalization.vehicle_model}
                            </ThemedText>
                            <ThemedText style={styles.signalizationSubtitle}>
                              {signalization.vehicle_license_plate}
                            </ThemedText>
                          </View>
                          <View style={[styles.urgencyBadge, { backgroundColor: 
                            signalization.urgency_level === 'urgent' ? '#EF4444' :
                            signalization.urgency_level === 'important' ? '#F59E0B' : '#10B981'
                          }]}>
                            <ThemedText style={styles.urgencyText}>
                              {signalization.urgency_level === 'urgent' ? 'Urgent' :
                               signalization.urgency_level === 'important' ? 'Important' : 'Normal'}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.signalizationReason}>
                          {signalization.reason_type === 'stationnement_genant' ? 'Stationnement gênant' :
                           signalization.reason_type === 'probleme_technique' ? 'Problème technique' :
                           signalization.reason_type === 'accident' ? 'Accident' :
                           signalization.reason_type === 'vehicule_abandonne' ? 'Véhicule abandonné' : 'Autre'}
                        </ThemedText>
                        {signalization.custom_message && (
                          <ThemedText style={styles.signalizationMessage}>
                            {signalization.custom_message}
                          </ThemedText>
                        )}
                        <ThemedText style={styles.signalizationDate}>
                          {new Date(signalization.created_at).toLocaleDateString('fr-FR')}
                        </ThemedText>
                      </View>
                    ))
                  )
                ) : (
                  receivedSignalizations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="notifications-outline" size={80} color="#ccc" />
                      <ThemedText style={styles.emptyTitle}>Aucune signalisation reçue</ThemedText>
                      <ThemedText style={styles.emptySubtitle}>
                        Les signalisations concernant vos véhicules apparaîtront ici
                      </ThemedText>
                    </View>
                  ) : (
                    receivedSignalizations.map((signalization) => (
                      <View key={signalization.id} style={styles.signalizationCard}>
                        <View style={styles.signalizationHeader}>
                          <View style={styles.signalizationIcon}>
                            <Ionicons name="car" size={20} color="white" />
                          </View>
                          <View style={styles.signalizationInfo}>
                            <ThemedText style={styles.signalizationTitle}>
                              {signalization.vehicle_brand} {signalization.vehicle_model}
                            </ThemedText>
                            <ThemedText style={styles.signalizationSubtitle}>
                              {signalization.vehicle_license_plate}
                            </ThemedText>
                          </View>
                          <View style={[styles.urgencyBadge, { backgroundColor: 
                            signalization.urgency_level === 'urgent' ? '#EF4444' :
                            signalization.urgency_level === 'important' ? '#F59E0B' : '#10B981'
                          }]}>
                            <ThemedText style={styles.urgencyText}>
                              {signalization.urgency_level === 'urgent' ? 'Urgent' :
                               signalization.urgency_level === 'important' ? 'Important' : 'Normal'}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.signalizationReason}>
                          {signalization.reason_type === 'stationnement_genant' ? 'Stationnement gênant' :
                           signalization.reason_type === 'probleme_technique' ? 'Problème technique' :
                           signalization.reason_type === 'accident' ? 'Accident' :
                           signalization.reason_type === 'vehicule_abandonne' ? 'Véhicule abandonné' : 'Autre'}
                        </ThemedText>
                        {signalization.custom_message && (
                          <ThemedText style={styles.signalizationMessage}>
                            {signalization.custom_message}
                          </ThemedText>
                        )}
                        <ThemedText style={styles.signalizationDate}>
                          {new Date(signalization.created_at).toLocaleDateString('fr-FR')}
                        </ThemedText>
                      </View>
                    ))
                  )
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    marginBottom: 10,
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
    paddingTop: 10,
    paddingBottom: 12,
  },
  greetingText: {
    top: 10,
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainActionContainer: {
    position: 'relative',
    top: 20,
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
    position: 'relative',
    top: 35,
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
    position: 'relative',
    top: 35,
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
  // Styles pour le modal des notifications
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  modalPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  activeTabText: {
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  signalizationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signalizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  signalizationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2633E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signalizationInfo: {
    flex: 1,
  },
  signalizationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  signalizationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  signalizationReason: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  signalizationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  signalizationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});