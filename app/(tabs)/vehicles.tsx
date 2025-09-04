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
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

        // Le QR code a déjà été généré automatiquement lors de la création
        // Utiliser le QR code ID existant pour générer le QR code visuel
        try {
          const qrData: VehicleQRData = {
            vehicleName: newVehicle.name,
            ownerId: user.id,
            type: 'notifcar',
          };
          
          // Le QR code ID est déjà dans newVehicle.qrCodeId
          // Pas besoin de le lier, il est déjà lié
          
          Alert.alert(
            'Succès', 
            'Véhicule ajouté avec succès ! Un QR code a été généré automatiquement.',
            [
              { text: 'OK' },
              { 
                text: 'Voir QR Code', 
                onPress: () => {
                  setSelectedVehicle(newVehicle);
                  setShowQRGenerator(true);
                }
              }
            ]
          );
        } catch (qrError) {
          console.error('Erreur affichage QR code:', qrError);
          Alert.alert(
            'Succès', 
            'Véhicule ajouté avec succès !',
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

  const shareVehicleQR = async (vehicle: Vehicle) => {
    try {
      if (!vehicle.qrCodeId) {
        Alert.alert('Erreur', 'Aucun QR code généré pour ce véhicule');
        return;
      }

      // Créer un objet QRCodeData temporaire pour le partage
      const qrData = {
        id: vehicle.qrCodeId,
        vehicleId: vehicle.qrCodeId,
        vehicleName: vehicle.name,
        ownerId: user?.id || '',
        qrString: `notifcar:${vehicle.qrCodeId}:${user?.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await QRCodeService.shareQRCode(vehicle.qrCodeId);
    } catch (error) {
      console.error('Erreur partage QR code:', error);
      Alert.alert('Erreur', 'Impossible de partager le QR code');
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
          colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
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
          colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
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
        colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
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
            <View key={vehicle.id} style={styles.vehicleCard}>
              {/* Header principal avec icône et nom */}
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleIcon}>
                  <Ionicons name="car" size={28} color="#374151" />
                </View>
                <View style={styles.vehicleMainInfo}>
                  <ThemedText style={styles.vehicleName}>{vehicle.name}</ThemedText>
                  <ThemedText style={styles.vehicleSubtitle}>
                    {vehicle.brand} {vehicle.model} • {vehicle.year}
                  </ThemedText>
                </View>
                <View style={styles.vehicleStatus}>
                  {vehicle.qrCodeId ? (
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <ThemedText style={styles.statusText}>Prêt</ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusPending]}>
                      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                      <ThemedText style={styles.statusText}>QR requis</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Détails du véhicule */}
              <View style={styles.vehicleDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="card" size={16} color="#6B7280" />
                    <ThemedText style={styles.detailLabel}>Plaque</ThemedText>
                    <ThemedText style={styles.detailValue}>{vehicle.licensePlate}</ThemedText>
                  </View>
                  {vehicle.color && (
                    <View style={styles.detailItem}>
                      <Ionicons name="color-palette" size={16} color="#6B7280" />
                      <ThemedText style={styles.detailLabel}>Couleur</ThemedText>
                      <ThemedText style={styles.detailValue}>{vehicle.color}</ThemedText>
                    </View>
                  )}
                </View>
                
                {vehicle.notes && (
                  <View style={styles.notesSection}>
                    <Ionicons name="document-text" size={16} color="#6B7280" />
                    <ThemedText style={styles.notesText} numberOfLines={2}>
                      {vehicle.notes}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Actions principales - Plus visibles */}
              <View style={styles.vehicleActions}>
                <View style={styles.primaryActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => editVehicle(vehicle)}
                  >
                    <Ionicons name="create" size={18} color="#374151" />
                    <ThemedText style={styles.actionText}>Modifier</ThemedText>
                  </TouchableOpacity>

                  {!vehicle.qrCodeId ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryAction]}
                      onPress={() => generateQRCode(vehicle)}
                    >
                      <Ionicons name="qr-code" size={18} color="white" />
                      <ThemedText style={[styles.actionText, styles.primaryActionText]}>
                        Générer QR Code
                      </ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryAction]}
                      onPress={() => {
                        setSelectedVehicle(vehicle);
                        setShowQRGenerator(true);
                      }}
                    >
                      <Ionicons name="eye" size={18} color="white" />
                      <ThemedText style={[styles.actionText, styles.primaryActionText]}>
                        Voir QR Code
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Actions secondaires pour QR code existant */}
                {vehicle.qrCodeId && (
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => shareVehicleQR(vehicle)}
                    >
                      <Ionicons name="share" size={16} color="#6B7280" />
                      <ThemedText style={styles.secondaryText}>Partager</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => printQRCode(vehicle)}
                    >
                      <Ionicons name="print" size={16} color="#6B7280" />
                      <ThemedText style={styles.secondaryText}>Imprimer</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
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
    backgroundColor: 'white',
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleMainInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  vehicleStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  vehicleDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 50,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
  vehicleActions: {
    gap: 12,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryActionText: {
    color: 'white',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});