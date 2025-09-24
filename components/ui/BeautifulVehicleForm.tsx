import { ThemedText } from '@/components/ThemedText';
import { VioletButton } from '@/components/ui/VioletButton';
import { VioletCard } from '@/components/ui/VioletCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

const { width } = Dimensions.get('window');

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

export function BeautifulVehicleForm({ onSubmit, onCancel, initialData, title = "Ajouter un véhicule" }: VehicleFormProps) {
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
  const [animatedValue] = useState(new Animated.Value(0));

  const primaryColor = useThemeColor({}, 'primary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
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

  const InputField = ({ 
    label, 
    field, 
    placeholder, 
    keyboardType = 'default',
    multiline = false,
    required = false,
    icon,
    style
  }: {
    label: string;
    field: keyof VehicleFormData;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    multiline?: boolean;
    required?: boolean;
    icon?: string;
    style?: any;
  }) => {
    const isFocused = focusedField === field;
    const hasError = !!errors[field];
    const hasValue = formData[field] !== undefined && formData[field] !== '';

    return (
      <Animated.View 
        style={[
          styles.inputGroup,
          style,
          {
            opacity: animatedValue,
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.labelContainer}>
          {icon && (
            <View style={[
              styles.iconContainer,
              isFocused && styles.iconContainerFocused,
              hasError && styles.iconContainerError
            ]}>
              <Ionicons 
                name={icon as any} 
                size={18} 
                color={isFocused ? '#FFFFFF' : hasError ? '#EF4444' : '#2633E1'} 
              />
            </View>
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
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          )}
        </View>
        
        {errors[field] && (
          <Animated.View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <ThemedText style={styles.errorText}>{errors[field]}</ThemedText>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
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
            <InputField
              label="Nom du véhicule"
              field="name"
              placeholder="Ex: Ma voiture principale (optionnel)"
              icon="car-outline"
            />

            <View style={styles.row}>
              <InputField
                label="Marque"
                field="brand"
                placeholder="Ex: BMW"
                required
                icon="business"
                style={styles.halfWidth}
              />
              <InputField
                label="Modèle"
                field="model"
                placeholder="Ex: M3"
                required
                icon="car-sport"
                style={styles.halfWidth}
              />
            </View>

            <View style={styles.row}>
              <InputField
                label="Année"
                field="year"
                placeholder="2024"
                keyboardType="numeric"
                required
                icon="calendar"
                style={styles.halfWidth}
              />
              <InputField
                label="Plaque d'immatriculation"
                field="licensePlate"
                placeholder="AB-123-CD"
                required
                icon="card"
                style={styles.halfWidth}
              />
            </View>

            <InputField
              label="Couleur"
              field="color"
              placeholder="Ex: Bleu, Noir, Blanc..."
              icon="color-palette"
            />

            <InputField
              label="Notes"
              field="notes"
              placeholder="Informations supplémentaires..."
              multiline
              icon="document-text"
            />
          </VioletCard>

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>
            <VioletButton
              title="Annuler"
              onPress={onCancel}
              variant="outline"
              size="large"
              style={styles.actionButton}
            />
            <VioletButton
              title="Enregistrer"
              onPress={handleSubmit}
              variant="primary"
              size="large"
              style={styles.actionButton}
            />
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
    shadowColor: '#2633E1',
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
  iconContainerFocused: {
    backgroundColor: '#2633E1',
  },
  iconContainerError: {
    backgroundColor: '#FEE2E2',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  labelFocused: {
    color: '#2633E1',
  },
  labelError: {
    color: '#EF4444',
  },
  required: {
    color: '#EF4444',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#2633E1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputContainerSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
    minHeight: 24,
    textAlign: 'left',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  successContainer: {
    marginLeft: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 6,
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
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
  },
});
