import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Signalization, SignalizationService } from '@/lib/signalizationService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [sentSignalizations, setSentSignalizations] = useState<Signalization[]>([]);
  const [receivedSignalizations, setReceivedSignalizations] = useState<Signalization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const loadSignalizations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Charger les signalisations envoyées et reçues en parallèle
      const [sentData, receivedData] = await Promise.all([
        SignalizationService.getUserSignalizations(user.id),
        SignalizationService.getReceivedSignalizations(user.id)
      ]);
      
      setSentSignalizations(sentData);
      setReceivedSignalizations(receivedData);
    } catch (error) {
      console.error('Erreur chargement signalisations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSignalizations();
    
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

    // Animation des cartes avec délai
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [loadSignalizations, fadeAnim, slideAnim, cardAnimations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSignalizations();
    setRefreshing(false);
  };

  const getSignalizationColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return errorColor;
      case 'important': return warningColor;
      case 'normal': return successColor;
      default: return primaryColor;
    }
  };

  const getSignalizationIcon = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'alert-circle';
      case 'important': return 'warning';
      case 'normal': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getSignalizationTitle = (signalization: Signalization) => {
    if (signalization.reason_type) {
      const reasonMap: { [key: string]: string } = {
        'stationnement_genant': 'Stationnement gênant',
        'probleme_technique': 'Problème technique',
        'accident': 'Accident',
        'vehicule_abandonne': 'Véhicule abandonné',
        'autre': 'Autre problème'
      };
      return reasonMap[signalization.reason_type] || 'Nouvelle signalisation';
    }
    return 'Nouvelle signalisation';
  };

  const getSignalizationMessage = (signalization: Signalization) => {
    if (signalization.vehicle_issue) {
      return signalization.vehicle_issue;
    }
    if (signalization.custom_message) {
      return signalization.custom_message;
    }
    if (signalization.custom_reason) {
      return signalization.custom_reason;
    }
    return 'Signalisation reçue';
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const signalizationDate = new Date(timestamp);
    const diff = now.getTime() - signalizationDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  const handleMarkAsResolved = async (id: string) => {
    try {
      const success = await SignalizationService.updateSignalizationStatus(id, 'resolved');
      if (success) {
        // Mettre à jour les deux listes
        setSentSignalizations(prev => prev.map(s => 
          s.id === id ? { ...s, status: 'resolved' } : s
        ));
        setReceivedSignalizations(prev => prev.map(s => 
          s.id === id ? { ...s, status: 'resolved' } : s
        ));
      }
    } catch (error) {
      console.error('Erreur marquage signalisation résolue:', error);
      Alert.alert('Erreur', 'Impossible de marquer la signalisation comme résolue');
    }
  };

  const handleDeleteSignalization = async (id: string) => {
    Alert.alert(
      'Supprimer la signalisation',
      'Êtes-vous sûr de vouloir supprimer cette signalisation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await SignalizationService.deleteSignalization(id);
              if (success) {
                // Supprimer des deux listes
                setSentSignalizations(prev => prev.filter(s => s.id !== id));
                setReceivedSignalizations(prev => prev.filter(s => s.id !== id));
              }
            } catch (error) {
              console.error('Erreur suppression signalisation:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la signalisation');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsResolved = async () => {
    Alert.alert(
      'Marquer toutes comme résolues',
      'Êtes-vous sûr de vouloir marquer toutes les signalisations comme résolues ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const activeSignalizations = currentSignalizations.filter(s => s.status === 'active');
              await Promise.all(
                activeSignalizations.map(s => 
                  SignalizationService.updateSignalizationStatus(s.id, 'resolved')
                )
              );
              
              // Mettre à jour les deux listes
              setSentSignalizations(prev => prev.map(s => 
                s.status === 'active' ? { ...s, status: 'resolved' } : s
              ));
              setReceivedSignalizations(prev => prev.map(s => 
                s.status === 'active' ? { ...s, status: 'resolved' } : s
              ));
            } catch (error) {
              console.error('Erreur marquage toutes résolues:', error);
              Alert.alert('Erreur', 'Impossible de marquer toutes les signalisations comme résolues');
            }
          },
        },
      ]
    );
  };

  // Obtenir les signalisations actives selon l'onglet sélectionné
  const currentSignalizations = activeTab === 'sent' ? sentSignalizations : receivedSignalizations;
  
  // Statistiques
  const totalSignalizations = currentSignalizations.length;
  const urgentSignalizations = currentSignalizations.filter(s => s.urgency_level === 'urgent').length;
  const importantSignalizations = currentSignalizations.filter(s => s.urgency_level === 'important').length;
  const activeSignalizations = currentSignalizations.filter(s => s.status === 'active').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Chargement des signalisations...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {/* Header avec gradient violet moderne (même style que l'onglet principal) */}
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
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.logoGradient}
              >
                <Ionicons name="notifications" size={32} color="#7C3AED" />
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.greetingText}>Mes Signalisations</ThemedText>
            <ThemedText style={styles.subtitleText}>
              {totalSignalizations} signalisation{totalSignalizations > 1 ? 's' : ''} {activeTab === 'sent' ? 'envoyée' : 'reçue'}{totalSignalizations > 1 ? 's' : ''}
            </ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Onglets de navigation */}
        <Animated.View style={[styles.tabsContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'sent' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('sent')}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={activeTab === 'sent' ? 'white' : '#7C3AED'} 
            />
            <ThemedText style={[
              styles.tabText,
              activeTab === 'sent' && styles.activeTabText
            ]}>
              Envoyées ({sentSignalizations.length})
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'received' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('received')}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color={activeTab === 'received' ? 'white' : '#7C3AED'} 
            />
            <ThemedText style={[
              styles.tabText,
              activeTab === 'received' && styles.activeTabText
            ]}>
              Reçues ({receivedSignalizations.length})
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {/* Statistiques */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statNumber}>{totalSignalizations}</ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: errorColor }]}>{urgentSignalizations}</ThemedText>
              <ThemedText style={styles.statLabel}>Urgentes</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: warningColor }]}>{importantSignalizations}</ThemedText>
              <ThemedText style={styles.statLabel}>Importantes</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={[styles.statNumber, { color: successColor }]}>{activeSignalizations}</ThemedText>
              <ThemedText style={styles.statLabel}>Actives</ThemedText>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        {activeSignalizations > 0 && (
          <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllAsResolved}
            >
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
              <ThemedText style={styles.actionButtonText}>
                Marquer toutes comme résolues
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Liste des signalisations */}
        {currentSignalizations.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="notifications-off" size={64} color={secondaryColor} />
            <ThemedText style={styles.emptyTitle}>
              Aucune signalisation {activeTab === 'sent' ? 'envoyée' : 'reçue'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {activeTab === 'sent' 
                ? 'Vous n\'avez pas encore envoyé de signalisation. Scannez un QR code pour commencer !'
                : 'Vous n\'avez pas encore reçu de signalisation sur vos véhicules.'
              }
            </ThemedText>
          </Animated.View>
        ) : (
          currentSignalizations.map((signalization, index) => (
            <Animated.View
              key={signalization.id}
              style={[
                styles.signalizationCard,
                {
                  opacity: cardAnimations[index % cardAnimations.length],
                  transform: [{
                    translateY: cardAnimations[index % cardAnimations.length].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.signalizationHeader}>
                <View style={styles.signalizationIconContainer}>
                  <Ionicons
                    name={getSignalizationIcon(signalization.urgency_level)}
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.signalizationInfo}>
                  <ThemedText style={styles.signalizationTitle}>
                    {getSignalizationTitle(signalization)}
                  </ThemedText>
                  <ThemedText style={styles.signalizationMessage}>
                    {getSignalizationMessage(signalization)}
                  </ThemedText>
                </View>
                <View style={styles.signalizationStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getSignalizationColor(signalization.urgency_level) }
                  ]}>
                    <ThemedText style={styles.statusText}>
                      {signalization.urgency_level === 'urgent' ? 'Urgent' : 
                       signalization.urgency_level === 'important' ? 'Important' : 'Normal'}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Informations du véhicule */}
              {signalization.vehicle_brand && (
                <View style={styles.vehicleInfo}>
                  <Ionicons name="car" size={16} color={secondaryColor} />
                  <ThemedText style={styles.vehicleText}>
                    {signalization.vehicle_brand} {signalization.vehicle_model} - {signalization.vehicle_license_plate}
                  </ThemedText>
                </View>
              )}

              {/* Informations du rapporteur */}
              {signalization.reporter_display_name && (
                <View style={styles.reporterInfo}>
                  <Ionicons name="person" size={16} color={secondaryColor} />
                  <ThemedText style={styles.reporterText}>
                    {signalization.reporter_display_name}
                  </ThemedText>
                </View>
              )}

              <View style={styles.signalizationFooter}>
                <ThemedText style={styles.signalizationTime}>
                  {formatTimestamp(signalization.created_at)}
                </ThemedText>
                
                <View style={styles.signalizationActions}>
                  {signalization.status === 'active' && (
                    <TouchableOpacity
                      style={styles.actionButtonSmall}
                      onPress={() => handleMarkAsResolved(signalization.id)}
                    >
                      <Ionicons name="checkmark" size={16} color={successColor} />
                      <ThemedText style={[styles.actionTextSmall, { color: successColor }]}>
                        Résolu
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.actionButtonSmall}
                    onPress={() => handleDeleteSignalization(signalization.id)}
                  >
                    <Ionicons name="trash" size={16} color={errorColor} />
                    <ThemedText style={[styles.actionTextSmall, { color: errorColor }]}>
                      Supprimer
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  activeTabText: {
    color: 'white',
  },
  statsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  signalizationCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signalizationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  signalizationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  signalizationInfo: {
    flex: 1,
  },
  signalizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  signalizationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  signalizationStatus: {
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  reporterText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  signalizationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalizationTime: {
    fontSize: 12,
    color: '#999',
  },
  signalizationActions: {
    flexDirection: 'row',
  },
  actionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionTextSmall: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});