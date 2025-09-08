import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QRCodeService } from '../../lib/qrCodeService';
import { VehicleService } from '../../lib/vehicleService';

export const QRDebugger: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const { user } = useAuth();

  const loadVehicles = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour utiliser le débogueur');
      return;
    }
    
    try {
      const vehiclesData = await VehicleService.getUserVehicles();
      setVehicles(vehiclesData);
      console.log('Véhicules chargés:', vehiclesData);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
      Alert.alert('Erreur', 'Impossible de charger les véhicules. Vérifiez votre connexion.');
    }
  };

  const debugVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    
    let info = `=== DÉBOGAGE VÉHICULE ===\n`;
    info += `ID: ${vehicle.id}\n`;
    info += `Nom: ${vehicle.name}\n`;
    info += `QR Code DB: "${vehicle.qr_code}"\n`;
    info += `Longueur QR: ${vehicle.qr_code?.length || 0}\n`;
    info += `Parties QR: [${vehicle.qr_code?.split(':').join(', ') || 'Aucun'}]\n\n`;
    
    // Test de validation
    if (vehicle.qr_code) {
      const validation = QRCodeService.validateQRCode(vehicle.qr_code);
      info += `Validation: ${validation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
      if (validation.isValid) {
        info += `Vehicle ID extrait: ${validation.vehicleId}\n`;
        info += `Owner ID extrait: ${validation.ownerId}\n`;
      }
    }
    
    // Générer un nouveau QR code pour comparaison
    const newQR = QRCodeService.generateVehicleQRCode({
      vehicleName: vehicle.name,
      ownerId: vehicle.owner_id,
      type: 'notifcar'
    });
    
    info += `\n=== NOUVEAU QR CODE ===\n`;
    info += `QR généré: "${newQR.qrString}"\n`;
    info += `Longueur: ${newQR.qrString.length}\n`;
    info += `Parties: [${newQR.qrString.split(':').join(', ')}]\n`;
    
    const newValidation = QRCodeService.validateQRCode(newQR.qrString);
    info += `Validation: ${newValidation.isValid ? '✅ Valide' : '❌ Invalide'}\n`;
    
    setDebugInfo(info);
  };

  const fixVehicleQR = async (vehicle: any) => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour corriger les QR codes');
      return;
    }
    
    try {
      // Générer un nouveau QR code correct
      const newQR = QRCodeService.generateVehicleQRCode({
        vehicleName: vehicle.name,
        ownerId: vehicle.owner_id,
        type: 'notifcar'
      });
      
      // Mettre à jour en base
      const { error } = await VehicleService.updateVehicle(vehicle.id, {
        qr_code: newQR.qrString
      });
      
      if (error) {
        Alert.alert('Erreur', 'Impossible de corriger le QR code');
        return;
      }
      
      Alert.alert('Succès', 'QR code corrigé !');
      loadVehicles(); // Recharger la liste
    } catch (error) {
      console.error('Erreur correction QR:', error);
      Alert.alert('Erreur', 'Impossible de corriger le QR code');
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  if (!user?.id) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Débogueur QR Code</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ Vous devez être connecté</Text>
          <Text style={styles.errorSubText}>
            Connectez-vous pour utiliser le débogueur QR code
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Débogueur QR Code</Text>
      
      <TouchableOpacity style={styles.button} onPress={loadVehicles}>
        <Text style={styles.buttonText}>Recharger Véhicules</Text>
      </TouchableOpacity>
      
      {vehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.vehicleCard}>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <Text style={styles.vehicleInfo}>
            QR: {vehicle.qr_code ? vehicle.qr_code.substring(0, 50) + '...' : 'Aucun'}
          </Text>
          <View style={styles.vehicleActions}>
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={() => debugVehicle(vehicle)}
            >
              <Text style={styles.debugButtonText}>Déboguer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fixButton} 
              onPress={() => fixVehicleQR(vehicle)}
            >
              <Text style={styles.fixButtonText}>Corriger</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      {selectedVehicle && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Débogage: {selectedVehicle.name}</Text>
          <ScrollView style={styles.debugInfo}>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  vehicleCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 10,
  },
  debugButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4500',
    shadowColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  fixButton: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E7E34',
    shadowColor: '#28A745',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fixButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  debugSection: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugInfo: {
    maxHeight: 300,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  errorContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});
