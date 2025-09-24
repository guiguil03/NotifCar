import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { VehicleService } from '@/lib/vehicleService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [vehicleData, setVehicleData] = useState({
    brand: '',
    model: '',
    licensePlate: '',
  });
  const [loading, setLoading] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<string>('');

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const successColor = useThemeColor({}, 'success');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: step / 3,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [step, fadeAnim, slideAnim, progressAnim]);

  const generateQRCode = (licensePlate: string) => {
    // Nettoyer la plaque d'immatriculation
    const cleanPlate = licensePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    // Générer un ID unique basé sur la plaque et un timestamp
    const timestamp = Date.now().toString(36);
    return `notifcar:${cleanPlate}:${timestamp}`;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!vehicleData.brand || !vehicleData.model || !vehicleData.licensePlate) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }
      // Générer le QR code pour l'étape 2
      const qrCode = generateQRCode(vehicleData.licensePlate);
      setGeneratedQRCode(qrCode);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setLoading(true);
    
    try {
      // Créer le véhicule en base de données
      const vehicle = await VehicleService.createVehicle({
        name: `${vehicleData.brand} ${vehicleData.model}`,
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: new Date().getFullYear(), // Année actuelle par défaut
        licensePlate: vehicleData.licensePlate,
        ownerId: user.id,
        isActive: true,
      });

      if (vehicle) {
        Alert.alert(
          'Succès !',
          'Votre véhicule a été ajouté avec succès. Vous pouvez maintenant utiliser Notifcar !',
          [
            {
              text: 'Continuer',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        throw new Error('Erreur lors de la création du véhicule');
      }
    } catch (error: any) {
      console.error('Erreur création véhicule:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de créer le véhicule. Veuillez réessayer.',
        [
          {
            text: 'Réessayer',
            onPress: () => setLoading(false),
          },
        ]
      );
    }
  };

  const renderStep1 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.stepHeader}>
        <LinearGradient
          colors={['#2633E1', '#2633E1']}
          style={styles.stepIconGradient}
        >
          <Ionicons name="car-sport" size={32} color="white" />
        </LinearGradient>
        <ThemedText style={styles.stepTitle}>Votre véhicule</ThemedText>
        <ThemedText style={styles.stepDescription}>
          Renseignez les informations de votre véhicule pour commencer à utiliser Notifcar
        </ThemedText>
      </View>

      <View style={styles.formCard}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.formGradient}
        >
          <View style={styles.formHeader}>
            <Ionicons name="information-circle" size={24} color="#2633E1" />
            <ThemedText style={styles.formTitle}>Informations du véhicule</ThemedText>
            <ThemedText style={styles.formSubtitle}>
              Ces informations permettront d'identifier votre véhicule
            </ThemedText>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Marque du véhicule</ThemedText>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons name="car-sport" size={20} color="#2633E1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Renault, Peugeot, BMW..."
                  placeholderTextColor="#9CA3AF"
                  value={vehicleData.brand}
                  onChangeText={(text) => setVehicleData({ ...vehicleData, brand: text })}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Modèle du véhicule</ThemedText>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons name="car" size={20} color="#2633E1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Clio, 308, X3..."
                  placeholderTextColor="#9CA3AF"
                  value={vehicleData.model}
                  onChangeText={(text) => setVehicleData({ ...vehicleData, model: text })}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Plaque d'immatriculation</ThemedText>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Ionicons name="card" size={20} color="#2633E1" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: AB-123-CD"
                  placeholderTextColor="#9CA3AF"
                  value={vehicleData.licensePlate}
                  onChangeText={(text) => setVehicleData({ ...vehicleData, licensePlate: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <ThemedText style={styles.infoText}>
              Vos informations sont sécurisées et ne seront utilisées que pour identifier votre véhicule
            </ThemedText>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: secondaryColor }]}>
          <Ionicons name="qr-code" size={24} color="white" />
        </View>
        <ThemedText style={styles.stepTitle}>Votre QR Code</ThemedText>
        <ThemedText style={styles.stepDescription}>
          Voici votre QR code unique pour {vehicleData.brand} {vehicleData.model}
        </ThemedText>
      </View>

      <View style={styles.qrCodeContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.qrCodeCard}
        >
          <View style={styles.qrCodePlaceholder}>
            <Ionicons name="qr-code" size={80} color={primaryColor} />
          </View>
          <ThemedText style={styles.qrCodeText}>
            {generatedQRCode}
          </ThemedText>
          <ThemedText style={styles.qrCodeDescription}>
            Collez ce QR code sur le pare-brise de votre véhicule
          </ThemedText>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: successColor }]}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
        </View>
        <ThemedText style={styles.stepTitle}>Configuration terminée !</ThemedText>
        <ThemedText style={styles.stepDescription}>
          Votre véhicule est maintenant protégé par Notifcar
        </ThemedText>
      </View>

      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.summaryCard}
        >
          <View style={styles.summaryItem}>
            <Ionicons name="car" size={20} color={primaryColor} />
            <ThemedText style={styles.summaryText}>
              {vehicleData.brand} {vehicleData.model}
            </ThemedText>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="card" size={20} color={primaryColor} />
            <ThemedText style={styles.summaryText}>
              {vehicleData.licensePlate}
            </ThemedText>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="qr-code" size={20} color={primaryColor} />
            <ThemedText style={styles.summaryText}>
              QR Code généré
            </ThemedText>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      
      {/* Background avec gradient violet */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E', '#1E9B7E', '#26C29E', '#7DDAC5']}
        locations={[0, 0.6, 0.7, 0.9, 1]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header avec progression */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.progressText}>
                Étape {step} sur 3
              </ThemedText>
            </View>
          </View>

          {/* Contenu des étapes */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Boutons de navigation */}
          <View style={styles.navigationContainer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.previousButton}
                onPress={handlePrevious}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.previousButtonGradient}
                >
                  <Ionicons name="arrow-back" size={20} color="white" />
                  <ThemedText style={styles.previousButtonText}>Précédent</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={step === 3 ? handleComplete : handleNext}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.nextButtonGradient}
              >
                {loading ? (
                  <>
                    <Ionicons name="refresh" size={20} color="#1E3A8A" />
                    <ThemedText style={styles.nextButtonText}>Finalisation...</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons 
                      name={step === 3 ? "checkmark" : "arrow-forward"} 
                      size={20} 
                      color="#1E3A8A" 
                    />
                    <ThemedText style={styles.nextButtonText}>
                      {step === 3 ? 'Terminer' : 'Suivant'}
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  stepIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 20,
  },
  formGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 52,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    fontWeight: '500',
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCodeCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryContainer: {
    alignItems: 'center',
  },
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    gap: 16,
  },
  previousButton: {
    flex: 1,
    borderRadius: 16,
  },
  previousButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  previousButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
});

