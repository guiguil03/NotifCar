import { ThemedText } from '@/components/ThemedText';
import { VioletButton } from '@/components/ui/VioletButton';
import { VioletCard } from '@/components/ui/VioletCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export interface VehicleFormData {
  name: string;
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

export function VehicleForm({ onSubmit, onCancel, initialData, title = "Ajouter un véhicule" }: VehicleFormProps) {
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  const validateForm = (): boolean => {
    const newErrors: Partial<VehicleFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du véhicule est requis';
    }

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

  const InputField = ({ 
    label, 
    field, 
    placeholder, 
    keyboardType = 'default',
    multiline = false,
    required = false,
    icon
  }: {
    label: string;
    field: keyof VehicleFormData;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    multiline?: boolean;
    required?: boolean;
    icon?: string;
  }) => {
    const isFocused = focusedField === field;
    const hasError = !!errors[field];
    const hasValue = formData[field] !== undefined && formData[field] !== '';

    return (
      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={16} 
              color={isFocused ? primaryColor : '#6B7280'} 
              style={styles.labelIcon}
            />
          )}
          <ThemedText style={[
            styles.label,
            isFocused && styles.labelFocused,
            hasError && styles.labelError
          ]}>
            {label} {required && <ThemedText style={styles.required}>*</ThemedText>}
          </ThemedText>
        </View>
        
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          hasValue && !hasError && styles.inputContainerSuccess
        ]}>
          <TextInput
            style={[
              styles.input,
              multiline && styles.textArea,
              { color: textColor }
            ]}
            value={formData[field] !== undefined ? formData[field].toString() : ''}
            onChangeText={(value) => {
              if (field === 'year') {
                const yearValue = parseInt(value) || 0;
                updateField(field, yearValue);
              } else {
                updateField(field, value);
              }
            }}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="next"
            blurOnSubmit={false}
            selectTextOnFocus={true}
          />
          
          {hasValue && !hasError && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.successIcon} />
          )}
        </View>
        
        {errors[field] && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <ThemedText style={styles.errorText}>{errors[field]}</ThemedText>
          </View>
        )}
      </View>
    );
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
          keyboardDismissMode="none"
        >
          <InputField
            label="Nom du véhicule"
            field="name"
            placeholder="Ex: Ma voiture principale"
            required
            icon="car"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Marque"
                field="brand"
                placeholder="Ex: Renault"
                required
                icon="business"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Modèle"
                field="model"
                placeholder="Ex: Clio"
                required
                icon="car-sport"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Année"
                field="year"
                placeholder="2020"
                keyboardType="numeric"
                required
                icon="calendar"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Plaque d'immatriculation"
                field="licensePlate"
                placeholder="AB-123-CD"
                required
                icon="card"
              />
            </View>
          </View>

          <InputField
            label="Couleur (optionnel)"
            field="color"
            placeholder="Ex: Blanc, Noir, Gris..."
            icon="color-palette"
          />

          <InputField
            label="Notes (optionnel)"
            field="notes"
            placeholder="Informations supplémentaires..."
            multiline
            icon="document-text"
          />
        </ScrollView>

        <View style={styles.actions}>
          <VioletButton
            title="Annuler"
            onPress={onCancel}
            variant="outline"
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
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelFocused: {
    color: '#2633E1',
  },
  labelError: {
    color: '#EF4444',
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: '#2633E1',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
  },
  inputContainerSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 20,
    textAlign: 'left',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  successIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 4,
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