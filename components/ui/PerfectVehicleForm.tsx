import { ThemedText } from '@/components/ThemedText';
import { VioletCard } from '@/components/ui/VioletCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
        {/* Header avec gradient */}
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="car" size={32} color="white" />
            </View>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.subtitle}>
              Renseignez les informations de votre véhicule
            </ThemedText>
          </View>
        </LinearGradient>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <VioletCard variant="light" style={styles.formCard}>
            {/* Nom du véhicule */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="car-outline" size={18} color="#7C3AED" />
                </View>
                <ThemedText style={styles.label}>Nom du véhicule (optionnel)</ThemedText>
              </View>
              <TextInput
                style={styles.input}
                value={formData.name || ''}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Ex: Ma voiture principale"
                placeholderTextColor="#6B7280"
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Marque et Modèle */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="business" size={18} color="#7C3AED" />
                  </View>
                  <ThemedText style={styles.label}>
                    Marque <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.brand && styles.inputError
                  ]}
                  value={formData.brand}
                  onChangeText={(value) => updateField('brand', value)}
                  placeholder="Ex: BMW"
                  placeholderTextColor="#6B7280"
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.brand && (
                  <ThemedText style={styles.errorText}>{errors.brand}</ThemedText>
                )}
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="car-sport" size={18} color="#7C3AED" />
                  </View>
                  <ThemedText style={styles.label}>
                    Modèle <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.model && styles.inputError
                  ]}
                  value={formData.model}
                  onChangeText={(value) => updateField('model', value)}
                  placeholder="Ex: M3"
                  placeholderTextColor="#6B7280"
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.model && (
                  <ThemedText style={styles.errorText}>{errors.model}</ThemedText>
                )}
              </View>
            </View>

            {/* Année et Plaque */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar" size={18} color="#7C3AED" />
                  </View>
                  <ThemedText style={styles.label}>
                    Année <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.year && styles.inputError
                  ]}
                  value={formData.year.toString()}
                  onChangeText={(value) => {
                    const yearValue = parseInt(value) || 0;
                    updateField('year', yearValue);
                  }}
                  placeholder="2024"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {errors.year && (
                  <ThemedText style={styles.errorText}>{errors.year}</ThemedText>
                )}
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="card" size={18} color="#7C3AED" />
                  </View>
                  <ThemedText style={styles.label}>
                    Plaque <ThemedText style={styles.required}>*</ThemedText>
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.licensePlate && styles.inputError
                  ]}
                  value={formData.licensePlate}
                  onChangeText={(value) => updateField('licensePlate', value)}
                  placeholder="AB-123-CD"
                  placeholderTextColor="#6B7280"
                  autoCorrect={false}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
                {errors.licensePlate && (
                  <ThemedText style={styles.errorText}>{errors.licensePlate}</ThemedText>
                )}
              </View>
            </View>

            {/* Couleur */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="color-palette" size={18} color="#7C3AED" />
                </View>
                <ThemedText style={styles.label}>Couleur</ThemedText>
              </View>
              <TextInput
                style={styles.input}
                value={formData.color || ''}
                onChangeText={(value) => updateField('color', value)}
                placeholder="Ex: Bleu, Noir, Blanc..."
                placeholderTextColor="#6B7280"
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text" size={18} color="#7C3AED" />
                </View>
                <ThemedText style={styles.label}>Notes</ThemedText>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes || ''}
                onChangeText={(value) => updateField('notes', value)}
                placeholder="Informations supplémentaires..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          </VioletCard>

          {/* Boutons d'action - Fixés en bas */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
              <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : [gradientStart, gradientEnd]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <Ionicons name="hourglass" size={20} color="white" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
                <ThemedText style={styles.submitButtonText}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  formCard: {
    marginBottom: 30,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
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
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  cancelButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
