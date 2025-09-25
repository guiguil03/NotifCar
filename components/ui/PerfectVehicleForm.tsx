import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export interface VehicleFormData {
  name?: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  notes?: string;
}

interface VehicleFormProps {
  onSubmit: (vehicleData: VehicleFormData) => void;
  onCancel: () => void;
  initialData?: Partial<VehicleFormData>;
  title?: string;
}

export function PerfectVehicleForm({ onSubmit, onCancel, initialData, title = "Ajouter un véhicule" }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    licensePlate: initialData?.licensePlate || '',
    color: initialData?.color || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Partial<VehicleFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  React.useEffect(() => {
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

    // Animation des cartes
    const animations = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, animations).start();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<VehicleFormData> = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'La marque est requise';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Le modèle est requis';
    }

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'La plaque d\'immatriculation est requise';
    } else if (!/^[A-Z0-9\-\s]{2,10}$/i.test(formData.licensePlate)) {
      newErrors.licensePlate = 'Format de plaque invalide';
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1 || isNaN(formData.year)) {
      newErrors.year = 'Année invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
    }
  };

  const updateField = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header avec gradient violet */}

        {/* Formulaire avec cartes animées */}
        <View style={styles.formContainer}>
          {/* Nom du véhicule */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: cardAnimations[0],
                transform: [{
                  translateY: cardAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.cardGradient}
            >
              <View style={styles.inputHeader}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="car-outline" size={20} color="#2633E1" />
                </View>
                <ThemedText style={styles.inputLabel}>Nom du véhicule (optionnel)</ThemedText>
              </View>
              <TextInput
                style={styles.modernInput}
                value={formData.name || ''}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Ex: Ma voiture principale"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </LinearGradient>
          </Animated.View>

          {/* Marque et Modèle */}
          <View style={styles.rowContainer}>
            <Animated.View
              style={[
                styles.halfCard,
                {
                  opacity: cardAnimations[1],
                  transform: [{
                    translateY: cardAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.cardGradient}
              >
                <View style={styles.inputHeader}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="business" size={20} color="#2633E1" />
                  </View>
                  <ThemedText style={styles.inputLabel}>
                    Marque <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.modernInput,
                    errors.brand && styles.inputError
                  ]}
                  value={formData.brand}
                  onChangeText={(value) => updateField('brand', value)}
                  placeholder="Ex: BMW, Renault..."
                  placeholderTextColor="#9CA3AF"
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.brand && (
                  <ThemedText style={styles.errorText}>{errors.brand}</ThemedText>
                )}
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={[
                styles.halfCard,
                {
                  opacity: cardAnimations[1],
                  transform: [{
                    translateY: cardAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.cardGradient}
              >
                <View style={styles.inputHeader}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="car-sport" size={20} color="#2633E1" />
                  </View>
                  <ThemedText style={styles.inputLabel}>
                    Modèle <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.modernInput,
                    errors.model && styles.inputError
                  ]}
                  value={formData.model}
                  onChangeText={(value) => updateField('model', value)}
                  placeholder="Ex: M3, Clio..."
                  placeholderTextColor="#9CA3AF"
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.model && (
                  <ThemedText style={styles.errorText}>{errors.model}</ThemedText>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Année et Plaque */}
          <View style={styles.rowContainer}>
            <Animated.View
              style={[
                styles.halfCard,
                {
                  opacity: cardAnimations[2],
                  transform: [{
                    translateY: cardAnimations[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.cardGradient}
              >
                <View style={styles.inputHeader}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="calendar" size={20} color="#2633E1" />
                  </View>
                  <ThemedText style={styles.inputLabel}>
                    Année <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.modernInput,
                    errors.year && styles.inputError
                  ]}
                  value={formData.year.toString()}
                  onChangeText={(value) => {
                    const yearValue = parseInt(value) || 0;
                    updateField('year', yearValue);
                  }}
                  placeholder="2024"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {errors.year && (
                  <ThemedText style={styles.errorText}>{errors.year}</ThemedText>
                )}
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={[
                styles.halfCard,
                {
                  opacity: cardAnimations[2],
                  transform: [{
                    translateY: cardAnimations[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.cardGradient}
              >
                <View style={styles.inputHeader}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="card" size={20} color="#2633E1" />
                  </View>
                  <ThemedText style={styles.inputLabel}>
                    Plaque <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.modernInput,
                    errors.licensePlate && styles.inputError
                  ]}
                  value={formData.licensePlate}
                  onChangeText={(value) => updateField('licensePlate', value)}
                  placeholder="AB-123-CD"
                  placeholderTextColor="#9CA3AF"
                  autoCorrect={false}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
                {errors.licensePlate && (
                  <ThemedText style={styles.errorText}>{errors.licensePlate}</ThemedText>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Couleur */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: cardAnimations[3],
                transform: [{
                  translateY: cardAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.cardGradient}
            >
              <View style={styles.inputHeader}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="color-palette" size={20} color="#2633E1" />
                </View>
                <ThemedText style={styles.inputLabel}>Couleur</ThemedText>
              </View>
              <TextInput
                style={styles.modernInput}
                value={formData.color || ''}
                onChangeText={(value) => updateField('color', value)}
                placeholder="Ex: Bleu, Noir, Blanc..."
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </LinearGradient>
          </Animated.View>

          {/* Notes */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: cardAnimations[4],
                transform: [{
                  translateY: cardAnimations[4].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.cardGradient}
            >
              <View style={styles.inputHeader}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="document-text" size={20} color="#2633E1" />
                </View>
                <ThemedText style={styles.inputLabel}>Notes</ThemedText>
              </View>
              <TextInput
                style={[styles.modernInput, styles.textArea]}
                value={formData.notes || ''}
                onChangeText={(value) => updateField('notes', value)}
                placeholder="Informations supplémentaires..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCorrect={false}
                returnKeyType="done"
              />
            </LinearGradient>
          </Animated.View>

          {/* Boutons d'action avec animations */}
          <Animated.View
            style={[
              styles.actionsContainer,
              {
                opacity: cardAnimations[4],
                transform: [{
                  translateY: cardAnimations[4].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={['#F3F4F6', '#E5E7EB']}
                style={styles.cancelButtonGradient}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
                <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#2633E1', '#2633E1']}
                style={styles.submitButtonGradient}
              >
                {isSubmitting ? (
                  <>
                    <Ionicons name="refresh" size={20} color="white" />
                    <ThemedText style={styles.submitButtonText}>Ajout en cours...</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <ThemedText style={styles.submitButtonText}>
                      {initialData ? 'Mettre à jour' : 'Ajouter le véhicule'}
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  formCard: {
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
    marginLeft: 4,
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  cancelButton: {
    flex: 1,
    flexBasis: 0,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    flexBasis: 0,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  // Nouveaux styles modernes
  headerGradient: {
    padding: 32,
    alignItems: 'center',
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerIconContainer: {
    marginBottom: 20,
  },
  headerIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Styles des cartes
  cardGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modernInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  halfCard: {
    flex: 1,
  },
  cancelButtonGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  submitButtonGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
