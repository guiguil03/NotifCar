import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  qrCode: string;
  isActive: boolean;
}

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    // Données de démonstration
    {
      id: '1',
      brand: 'Renault',
      model: 'Clio',
      licensePlate: 'AB-123-CD',
      qrCode: 'notifcar:veh_001',
      isActive: true,
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    licensePlate: '',
  });

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

    // Animations en cascade pour les cartes
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 200 + (index * 150),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const generateQRCode = (licensePlate: string) => {
    return `notifcar:veh_${licensePlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
  };

  const handleAddVehicle = () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const newVeh: Vehicle = {
      id: Date.now().toString(),
      brand: newVehicle.brand,
      model: newVehicle.model,
      licensePlate: newVehicle.licensePlate,
      qrCode: generateQRCode(newVehicle.licensePlate),
      isActive: true,
    };

    setVehicles([...vehicles, newVeh]);
    setNewVehicle({ brand: '', model: '', licensePlate: '' });
    setShowAddForm(false);
    
    Alert.alert('Succès', 'Véhicule ajouté avec succès !');
  };

  const handleToggleVehicle = (id: string) => {
    setVehicles(vehicles.map(vehicle => 
      vehicle.id === id ? { ...vehicle, isActive: !vehicle.isActive } : vehicle
    ));
  };

  const handleDeleteVehicle = (id: string) => {
    Alert.alert(
      'Supprimer le véhicule',
      'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
          },
        },
      ]
    );
  };

  const handleViewQR = (vehicle: Vehicle) => {
    Alert.alert(
      'QR Code du véhicule',
      `Code QR: ${vehicle.qrCode}\n\nVoulez-vous partager ce code ?`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Partager', onPress: () => Alert.alert('Partage', 'Fonctionnalité de partage à implémenter') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
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
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>Mes Véhicules</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} enregistré{vehicles.length > 1 ? 's' : ''}
              </ThemedText>
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color="#1E3A8A" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Formulaire d'ajout avec design sophistiqué */}
        {showAddForm && (
          <Animated.View
            style={[
              styles.addFormContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.addForm}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.addFormGradient}
              >
                <View style={styles.formHeader}>
                  <View style={[styles.formIcon, { backgroundColor: primaryColor }]}>
                    <Ionicons name="car" size={24} color="white" />
                  </View>
                  <ThemedText style={styles.formTitle}>Ajouter un véhicule</ThemedText>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Marque (ex: Renault)"
                    placeholderTextColor="#9CA3AF"
                    value={newVehicle.brand}
                    onChangeText={(text) => setNewVehicle({ ...newVehicle, brand: text })}
                  />
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Modèle (ex: Clio)"
                    placeholderTextColor="#9CA3AF"
                    value={newVehicle.model}
                    onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })}
                  />
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Plaque d'immatriculation"
                    placeholderTextColor="#9CA3AF"
                    value={newVehicle.licensePlate}
                    onChangeText={(text) => setNewVehicle({ ...newVehicle, licensePlate: text.toUpperCase() })}
                    autoCapitalize="characters"
                  />
                </View>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddForm(false)}
                  >
                    <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.addButtonForm}
                    onPress={handleAddVehicle}
                  >
                    <LinearGradient
                      colors={[primaryColor, '#3B82F6']}
                      style={styles.addButtonFormGradient}
                    >
                      <Ionicons name="checkmark" size={20} color="white" />
                      <ThemedText style={styles.addButtonText}>Ajouter</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* Liste des véhicules avec design premium */}
        <View style={styles.vehiclesList}>
          {vehicles.length === 0 ? (
            <Animated.View
              style={[
                styles.emptyState,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.emptyStateGradient}
              >
                <View style={[styles.emptyIcon, { backgroundColor: primaryColor }]}>
                  <Ionicons name="car-outline" size={40} color="white" />
                </View>
                <ThemedText style={styles.emptyTitle}>Aucun véhicule</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Ajoutez votre premier véhicule pour commencer à utiliser Notifcar
                </ThemedText>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowAddForm(true)}
                >
                  <LinearGradient
                    colors={[primaryColor, '#3B82F6']}
                    style={styles.emptyButtonGradient}
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <ThemedText style={styles.emptyButtonText}>Ajouter un véhicule</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          ) : (
            vehicles.map((vehicle, index) => (
              <Animated.View
                key={vehicle.id}
                style={[
                  styles.vehicleCardWrapper,
                  {
                    opacity: cardAnimations[index % 3],
                    transform: [{
                      translateY: cardAnimations[index % 3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.vehicleCard}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.vehicleCardGradient}
                  >
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleTitleRow}>
                          <ThemedText style={styles.vehicleName}>
                            {vehicle.brand} {vehicle.model}
                          </ThemedText>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: vehicle.isActive ? successColor : '#E5E7EB' }
                          ]}>
                            <ThemedText style={[
                              styles.statusText,
                              { color: vehicle.isActive ? 'white' : '#6B7280' }
                            ]}>
                              {vehicle.isActive ? 'Actif' : 'Inactif'}
                            </ThemedText>
                          </View>
                        </View>
                        
                        <View style={styles.vehicleDetails}>
                          <View style={styles.licensePlateContainer}>
                            <Ionicons name="card" size={16} color={primaryColor} />
                            <ThemedText style={styles.licensePlate}>
                              {vehicle.licensePlate}
                            </ThemedText>
                          </View>
                          
                          <View style={styles.qrCodeContainer}>
                            <Ionicons name="qr-code" size={16} color="#6B7280" />
                            <ThemedText style={styles.qrCode}>
                              {vehicle.qrCode}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.vehicleActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: primaryColor }]}
                        onPress={() => handleViewQR(vehicle)}
                      >
                        <Ionicons name="qr-code-outline" size={20} color="white" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: secondaryColor }]}
                        onPress={() => handleToggleVehicle(vehicle.id)}
                      >
                        <Ionicons 
                          name={vehicle.isActive ? "pause" : "play"} 
                          size={20} 
                          color="white" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: errorColor }]}
                        onPress={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            ))
          )}
        </View>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  addFormContainer: {
    margin: 24,
    marginTop: -10,
  },
  addForm: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  addFormGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  formIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  addButtonForm: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonFormGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  vehiclesList: {
    padding: 24,
  },
  emptyState: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1F2937',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 32,
    fontSize: 16,
  },
  emptyButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleCardWrapper: {
    marginBottom: 20,
  },
  vehicleCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  vehicleCardGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleHeader: {
    marginBottom: 20,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleDetails: {
    gap: 12,
  },
  licensePlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  licensePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  qrCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrCode: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  vehicleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});