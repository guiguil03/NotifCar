import { ThemedText } from '@/components/ThemedText';
import { VioletButton } from '@/components/ui/VioletButton';
import { VioletCard } from '@/components/ui/VioletCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export interface VehicleFormData {
  name?: string; // Optionnel, sera généré automatiquement
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

export function SimpleVehicleForm({ onSubmit, onCancel, initialData, title = "Ajouter un véhicule" }: VehicleFormProps) {
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

  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

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

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    } else {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
    }
  };

  const updateField = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <VioletCard variant="light" style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>
            Renseignez les informations de votre véhicule
          </ThemedText>
        </View>

        <ScrollView 
          style={styles.form} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Nom du véhicule (optionnel) */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Nom du véhicule (optionnel)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: borderColor }
              ]}
              value={formData.name || ''}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Ex: Ma voiture principale (laissé vide = généré automatiquement)"
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          {/* Marque et Modèle */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <ThemedText style={styles.label}>
                Marque <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  errors.brand && styles.inputError,
                  { color: textColor, borderColor: errors.brand ? '#EF4444' : borderColor }
                ]}
                value={formData.brand}
                onChangeText={(value) => updateField('brand', value)}
                placeholder="Ex: Renault"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {errors.brand && (
                <ThemedText style={styles.errorText}>{errors.brand}</ThemedText>
              )}
            </View>
            <View style={styles.halfWidth}>
              <ThemedText style={styles.label}>
                Modèle <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  errors.model && styles.inputError,
                  { color: textColor, borderColor: errors.model ? '#EF4444' : borderColor }
                ]}
                value={formData.model}
                onChangeText={(value) => updateField('model', value)}
                placeholder="Ex: Clio"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {errors.model && (
                <ThemedText style={styles.errorText}>{errors.model}</ThemedText>
              )}
            </View>
          </View>

          {/* Année et Plaque */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <ThemedText style={styles.label}>
                Année <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  errors.year && styles.inputError,
                  { color: textColor, borderColor: errors.year ? '#EF4444' : borderColor }
                ]}
                value={formData.year.toString()}
                onChangeText={(value) => {
                  const yearValue = parseInt(value) || 0;
                  updateField('year', yearValue);
                }}
                placeholder="2020"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                autoCorrect={false}
              />
              {errors.year && (
                <ThemedText style={styles.errorText}>{errors.year}</ThemedText>
              )}
            </View>
            <View style={styles.halfWidth}>
              <ThemedText style={styles.label}>
                Plaque d'immatriculation <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  errors.licensePlate && styles.inputError,
                  { color: textColor, borderColor: errors.licensePlate ? '#EF4444' : borderColor }
                ]}
                value={formData.licensePlate}
                onChangeText={(value) => updateField('licensePlate', value)}
                placeholder="AB-123-CD"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                autoCapitalize="characters"
              />
              {errors.licensePlate && (
                <ThemedText style={styles.errorText}>{errors.licensePlate}</ThemedText>
              )}
            </View>
          </View>

          {/* Couleur */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Couleur (optionnel)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: borderColor }
              ]}
              value={formData.color}
              onChangeText={(value) => updateField('color', value)}
              placeholder="Ex: Blanc, Noir, Gris..."
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Notes (optionnel)</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: textColor, borderColor: borderColor }
              ]}
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholder="Informations supplémentaires..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect={false}
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <VioletButton
            title="Annuler"
            onPress={onCancel}
            variant="outline"
            size="medium"
            style={styles.actionButton}
          />
          <VioletButton
            title="Enregistrer"
            onPress={handleSubmit}
            variant="primary"
            size="medium"
            style={styles.actionButton}
          />
        </View>
      </VioletCard>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    margin: 16,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    minHeight: 48,
  },
  textArea: {
    height: 80,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
  },
});
