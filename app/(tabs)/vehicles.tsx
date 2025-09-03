import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

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
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');

  const generateQRCode = (licensePlate: string) => {
    return `notifcar:veh_${licensePlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
  };

  const handleAddVehicle = () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const vehicle: Vehicle = {
      id: Date.now().toString(),
      brand: newVehicle.brand,
      model: newVehicle.model,
      licensePlate: newVehicle.licensePlate,
      qrCode: generateQRCode(newVehicle.licensePlate),
      isActive: true,
    };

    setVehicles([...vehicles, vehicle]);
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
      `Code: ${vehicle.qrCode}\n\nCe QR code doit être apposé sur le pare-brise du véhicule.`,
      [
        { text: 'OK' },
        { text: 'Partager', onPress: () => Alert.alert('Partage', 'Fonctionnalité de partage à implémenter') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: primaryColor }]}>
        <ThemedText style={styles.headerTitle}>Mes Véhicules</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </ThemedView>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <ThemedView style={[styles.addForm, { backgroundColor: cardColor, borderColor }]}>
          <ThemedText style={styles.formTitle}>Ajouter un véhicule</ThemedText>
          
          <TextInput
            style={[styles.input, { borderColor }]}
            placeholder="Marque (ex: Renault)"
            value={newVehicle.brand}
            onChangeText={(text) => setNewVehicle({ ...newVehicle, brand: text })}
          />
          
          <TextInput
            style={[styles.input, { borderColor }]}
            placeholder="Modèle (ex: Clio)"
            value={newVehicle.model}
            onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })}
          />
          
          <TextInput
            style={[styles.input, { borderColor }]}
            placeholder="Plaque d'immatriculation"
            value={newVehicle.licensePlate}
            onChangeText={(text) => setNewVehicle({ ...newVehicle, licensePlate: text.toUpperCase() })}
            autoCapitalize="characters"
          />
          
          <ThemedView style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton, { borderColor }]}
              onPress={() => setShowAddForm(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: primaryColor }]}
              onPress={handleAddVehicle}
            >
              <ThemedText style={styles.addButtonText}>Ajouter</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      )}

      {/* Liste des véhicules */}
      <ThemedView style={styles.vehiclesList}>
        {vehicles.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={primaryColor} />
            <ThemedText style={styles.emptyTitle}>Aucun véhicule</ThemedText>
            <ThemedText style={styles.emptyText}>
              Ajoutez votre premier véhicule pour commencer à utiliser Notifcar
            </ThemedText>
          </ThemedView>
        ) : (
          vehicles.map((vehicle) => (
            <ThemedView
              key={vehicle.id}
              style={[styles.vehicleCard, { backgroundColor: cardColor, borderColor }]}
            >
              <ThemedView style={styles.vehicleInfo}>
                <ThemedView style={styles.vehicleHeader}>
                  <ThemedText style={styles.vehicleName}>
                    {vehicle.brand} {vehicle.model}
                  </ThemedText>
                  <ThemedView style={[
                    styles.statusBadge,
                    { backgroundColor: vehicle.isActive ? successColor : borderColor }
                  ]}>
                    <ThemedText style={[
                      styles.statusText,
                      { color: vehicle.isActive ? 'white' : primaryColor }
                    ]}>
                      {vehicle.isActive ? 'Actif' : 'Inactif'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedText style={styles.licensePlate}>
                  {vehicle.licensePlate}
                </ThemedText>
                
                <ThemedText style={styles.qrCode}>
                  QR: {vehicle.qrCode}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.vehicleActions}>
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
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleDeleteVehicle(vehicle.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vehiclesList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  licensePlate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  qrCode: {
    fontSize: 12,
    opacity: 0.7,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
