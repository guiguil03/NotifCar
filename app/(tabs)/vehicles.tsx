import { ThemedText } from '@/components/ThemedText';
import { PerfectVehicleForm as VehicleForm, VehicleFormData } from '@/components/ui/PerfectVehicleForm';
import { QRCodeGenerator } from '@/components/ui/QRCodeGenerator';
import { VioletButton } from '@/components/ui/VioletButton';
import { VioletCard } from '@/components/ui/VioletCard';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PrintService } from '@/lib/printService';
import { QRCodeService, VehicleQRData } from '@/lib/qrCodeService';
import { Vehicle, VehicleService } from '@/lib/vehicleService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export default function VehiclesScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const primaryColor = useThemeColor({}, 'primary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const successColor = useThemeColor({}, 'success');

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const loadVehicles = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      const userVehicles = await VehicleService.getUserVehicles(user.id);
      setVehicles(userVehicles);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
      Alert.alert('Erreur', 'Impossible de charger les véhicules');
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVehicles();
    setIsRefreshing(false);
  };

  const addVehicle = () => {
    setEditingVehicle(null);
    setShowVehicleForm(true);
  };

  const editVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleVehicleSubmit = async (vehicleData: VehicleFormData) => {
    try {
      if (!user?.id) return;

      if (editingVehicle) {
        // Mise à jour d'un véhicule existant
        await VehicleService.updateVehicle(editingVehicle.id, vehicleData);
        Alert.alert('Succès', 'Véhicule mis à jour avec succès');
      } else {
        // Création d'un nouveau véhicule
        const newVehicle = await VehicleService.createVehicle({
          ...vehicleData,
          ownerId: user.id,
        });

        // Générer automatiquement un QR code pour le nouveau véhicule
        try {
          const qrData: VehicleQRData = {
            vehicleName: newVehicle.name,
            ownerId: user.id,
            type: 'notifcar',
          };
          
          const qrResult = await QRCodeService.generateVehicleQRCode(qrData);
          
          // Lier le QR code au véhicule
          await VehicleService.linkQRCodeToVehicle(newVehicle.id, qrResult.vehicleId);
          
          Alert.alert(
            'Succès', 
            'Véhicule ajouté avec succès ! Un QR code a été généré automatiquement.',
            [
              { text: 'OK' },
              { 
                text: 'Voir QR Code', 
                onPress: () => {
                  setSelectedVehicle({ ...newVehicle, qrCodeId: qrResult.vehicleId });
                  setShowQRGenerator(true);
                }
              }
            ]
          );
        } catch (qrError) {
          console.error('Erreur génération QR code:', qrError);
          Alert.alert(
            'Succès partiel', 
            'Véhicule ajouté avec succès, mais impossible de générer le QR code. Vous pourrez le générer manuellement.',
            [{ text: 'OK' }]
          );
        }
      }

      setShowVehicleForm(false);
      setEditingVehicle(null);
      await loadVehicles();
    } catch (error) {
      console.error('Erreur sauvegarde véhicule:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le véhicule');
    }
  };

  const handleVehicleCancel = () => {
    setShowVehicleForm(false);
    setEditingVehicle(null);
  };

  const generateQRCode = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowQRGenerator(true);
  };

  const onQRGenerated = async (qrData: VehicleQRData) => {
    if (selectedVehicle) {
      try {
        // Lier le QR code au véhicule en base
        await VehicleService.linkQRCodeToVehicle(selectedVehicle.id, qrData.vehicleId);
        
        // Mettre à jour l'état local
        const updatedVehicles = vehicles.map(v => 
          v.id === selectedVehicle.id 
            ? { ...v, qrCodeId: qrData.vehicleId }
            : v
        );
        setVehicles(updatedVehicles);
        setSelectedVehicle({ ...selectedVehicle, qrCodeId: qrData.vehicleId });
      } catch (error) {
        console.error('Erreur liaison QR code:', error);
        Alert.alert('Erreur', 'Impossible de lier le QR code au véhicule');
      }
    }
  };

  const printQRCode = async (vehicle: Vehicle) => {
    try {
      if (!vehicle.qrCodeId) {
        Alert.alert('Erreur', 'Aucun QR code généré pour ce véhicule');
      return;
    }

      // Créer un objet QRCodeData temporaire pour l'impression
      const qrData = {
        id: vehicle.qrCodeId,
        vehicleId: vehicle.qrCodeId,
        vehicleName: vehicle.name,
        ownerId: user?.id || '',
        qrString: `notifcar:${vehicle.qrCodeId}:${user?.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await PrintService.shareQRCodePDF(qrData);
    } catch (error) {
      console.error('Erreur impression:', error);
      Alert.alert('Erreur', 'Impossible d\'imprimer le QR code');
    }
  };

  const closeQRGenerator = () => {
    setShowQRGenerator(false);
    setSelectedVehicle(null);
  };

  if (showVehicleForm) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <VioletButton
              title="Retour"
              onPress={handleVehicleCancel}
              variant="outline"
              size="small"
              style={styles.backButton}
            />
            <ThemedText style={styles.headerTitle}>
              {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <VehicleForm
            onSubmit={handleVehicleSubmit}
            onCancel={handleVehicleCancel}
            initialData={editingVehicle ? {
              name: editingVehicle.name,
              brand: editingVehicle.brand,
              model: editingVehicle.model,
              year: editingVehicle.year,
              licensePlate: editingVehicle.licensePlate,
              color: editingVehicle.color,
              notes: editingVehicle.notes,
            } : undefined}
            title={editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          />
        </ScrollView>
      </View>
    );
  }

  if (showQRGenerator && selectedVehicle) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <VioletButton
              title="Retour"
              onPress={closeQRGenerator}
              variant="outline"
              size="small"
              style={styles.backButton}
            />
            <ThemedText style={styles.headerTitle}>
              QR Code - {selectedVehicle.name}
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <QRCodeGenerator
            vehicleData={{
              vehicleName: selectedVehicle.name,
              ownerId: user?.id || 'unknown',
              type: 'notifcar',
            }}
            onQRGenerated={onQRGenerated}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        style={styles.header}
        >
          <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>Mes Véhicules</ThemedText>
          <VioletButton
            title="Ajouter"
            onPress={addVehicle}
            variant="outline"
            size="small"
              style={styles.addButton}
          />
          </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
          {vehicles.length === 0 ? (
          <VioletCard variant="light" style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={primaryColor} />
            <ThemedText style={styles.emptyTitle}>
              Aucun véhicule
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Ajoutez votre premier véhicule pour commencer
                </ThemedText>
            <VioletButton
              title="Ajouter un véhicule"
              onPress={addVehicle}
              variant="primary"
              size="medium"
                  style={styles.emptyButton}
            />
          </VioletCard>
        ) : (
          vehicles.map((vehicle) => (
            <VioletCard key={vehicle.id} variant="light" style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleInfo}>
                  <ThemedText style={styles.vehicleName}>
                    {vehicle.name}
                  </ThemedText>
                  <ThemedText style={styles.vehicleDetails}>
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </ThemedText>
                  <ThemedText style={styles.vehiclePlate}>
                    {vehicle.licensePlate}
                  </ThemedText>
                  {vehicle.color && (
                    <ThemedText style={styles.vehicleColor}>
                      Couleur: {vehicle.color}
                    </ThemedText>
                  )}
                </View>
                
                <View style={styles.vehicleStatus}>
                  {vehicle.qrCodeId ? (
                    <View style={styles.statusContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={successColor} />
                      <ThemedText style={styles.statusText}>QR Code généré</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.statusContainer}>
                      <Ionicons name="qr-code-outline" size={24} color={primaryColor} />
                      <ThemedText style={styles.statusText}>QR Code requis</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.vehicleActions}>
                <View style={styles.actionRow}>
                  <VioletButton
                    title="Modifier"
                    onPress={() => editVehicle(vehicle)}
                    variant="outline"
                    size="small"
                    style={styles.actionButton}
                  />
                  {!vehicle.qrCodeId ? (
                    <VioletButton
                      title="Générer QR"
                      onPress={() => generateQRCode(vehicle)}
                      variant="primary"
                      size="small"
                      style={styles.actionButton}
                    />
                  ) : (
                    <>
                      <VioletButton
                        title="Voir QR"
                        onPress={() => generateQRCode(vehicle)}
                        variant="secondary"
                        size="small"
                        style={styles.actionButton}
                      />
                      <VioletButton
                        title="Imprimer"
                        onPress={() => printQRCode(vehicle)}
                        variant="accent"
                        size="small"
                        style={styles.actionButton}
                      />
                    </>
                  )}
                </View>
              </View>
            </VioletCard>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    minWidth: 80,
  },
  backButton: {
    minWidth: 80,
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  vehicleCard: {
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  vehicleStatus: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleColor: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
});