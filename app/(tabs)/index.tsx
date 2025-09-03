import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleScanQR = () => {
    router.push('/scan');
  };

  const handleMyVehicles = () => {
    router.push('/vehicles');
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec logo et slogan */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: primaryColor,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ThemedView style={styles.headerContent}>
          <ThemedView style={[styles.logoContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="car-sport" size={40} color="white" />
          </ThemedView>
          <ThemedText style={styles.logo}>Notifcar</ThemedText>
          <ThemedText style={styles.slogan}>Votre véhicule vous parle, écoutez-le</ThemedText>
        </ThemedView>
      </Animated.View>

      {/* Actions principales */}
      <Animated.View 
        style={[
          styles.actionsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: secondaryColor }]}
          onPress={handleScanQR}
          activeOpacity={0.8}
        >
          <ThemedView style={styles.actionButtonContent}>
            <ThemedView style={styles.actionIconContainer}>
              <Ionicons name="qr-code-outline" size={32} color="white" />
            </ThemedView>
            <ThemedText style={styles.actionButtonText}>Scanner QR Code</ThemedText>
            <ThemedText style={styles.actionButtonSubtext}>Notifier un véhicule en 3 clics</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <ThemedView style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: cardColor, borderColor }]}
            onPress={handleMyVehicles}
            activeOpacity={0.7}
          >
            <ThemedView style={[styles.quickActionIcon, { backgroundColor: primaryColor }]}>
              <Ionicons name="car-outline" size={24} color="white" />
            </ThemedView>
            <ThemedText style={styles.quickActionText}>Mes Véhicules</ThemedText>
            <ThemedText style={styles.quickActionSubtext}>1 véhicule</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: cardColor, borderColor }]}
            onPress={handleNotifications}
            activeOpacity={0.7}
          >
            <ThemedView style={[styles.quickActionIcon, { backgroundColor: secondaryColor }]}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </ThemedView>
            <ThemedText style={styles.quickActionText}>Notifications</ThemedText>
            <ThemedView style={[styles.notificationBadge, { backgroundColor: secondaryColor }]}>
              <ThemedText style={styles.notificationBadgeText}>3</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>
      </Animated.View>

      {/* Statistiques rapides */}
      <Animated.View 
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ThemedText style={styles.sectionTitle}>Aperçu</ThemedText>
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
            <ThemedView style={[styles.statIcon, { backgroundColor: primaryColor }]}>
              <Ionicons name="car" size={20} color="white" />
            </ThemedView>
            <ThemedText style={styles.statNumber}>1</ThemedText>
            <ThemedText style={styles.statLabel}>Véhicule actif</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
            <ThemedView style={[styles.statIcon, { backgroundColor: secondaryColor }]}>
              <Ionicons name="notifications" size={20} color="white" />
            </ThemedView>
            <ThemedText style={styles.statNumber}>3</ThemedText>
            <ThemedText style={styles.statLabel}>Notifications</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
            <ThemedView style={[styles.statIcon, { backgroundColor: successColor }]}>
              <Ionicons name="shield-checkmark" size={20} color="white" />
            </ThemedView>
            <ThemedText style={styles.statNumber}>100%</ThemedText>
            <ThemedText style={styles.statLabel}>Sécurisé</ThemedText>
          </ThemedView>
        </ThemedView>
      </Animated.View>

      {/* Guide d'utilisation */}
      <Animated.View 
        style={[
          styles.guideContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ThemedText style={styles.sectionTitle}>Comment ça marche ?</ThemedText>
        <ThemedView style={styles.guideSteps}>
          <ThemedView style={styles.guideStep}>
            <ThemedView style={[styles.stepNumber, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </ThemedView>
            <ThemedView style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Enregistrez votre véhicule</ThemedText>
              <ThemedText style={styles.stepDescription}>Ajoutez vos véhicules et obtenez un QR code unique</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.guideStep}>
            <ThemedView style={[styles.stepNumber, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </ThemedView>
            <ThemedView style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Collez le QR code</ThemedText>
              <ThemedText style={styles.stepDescription}>Apposez le QR code sur votre pare-brise</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.guideStep}>
            <ThemedView style={[styles.stepNumber, { backgroundColor: primaryColor }]}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </ThemedView>
            <ThemedView style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Recevez les notifications</ThemedText>
              <ThemedText style={styles.stepDescription}>Soyez alerté instantanément en cas de problème</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  actionsContainer: {
    padding: 20,
    marginTop: -20,
  },
  actionButton: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonContent: {
    padding: 24,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtext: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 16,
  },
  guideContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  guideSteps: {
    gap: 20,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
});
