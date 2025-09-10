import { ThemedText } from '@/components/ThemedText';
import { PerfectVehicleForm as VehicleForm, VehicleFormData } from '@/components/ui/PerfectVehicleForm';
import { QRCodeGenerator } from '@/components/ui/QRCodeGenerator';
import { VioletButton } from '@/components/ui/VioletButton';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PrintService } from '@/lib/printService';
import { QRCodeService, VehicleQRData } from '@/lib/qrCodeService';
import { Vehicle, VehicleService } from '@/lib/vehicleService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function VehiclesScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const handleBack = () => {
    setShowQRGenerator(false);
  };
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const primaryColor = useThemeColor({}, 'primary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const successColor = useThemeColor({}, 'success');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    loadVehicles();
  }, []);

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

    // Animation des cartes
    if (vehicles.length > 0 && cardAnimations.length > 0) {
      const animations = cardAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        })
      );
      Animated.stagger(100, animations).start();
    }
  }, [vehicles, fadeAnim, slideAnim]);

  const loadVehicles = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      setLoading(true);
      const userVehicles = await VehicleService.getUserVehicles(user.id);
      setVehicles(userVehicles);
      
      // Initialiser les animations des cartes
      cardAnimations.length = 0;
      userVehicles.forEach(() => {
        cardAnimations.push(new Animated.Value(0));
      });
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
      Alert.alert('Erreur', 'Impossible de charger les véhicules');
    } finally {
      setLoading(false);
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
    console.log('QR code généré:', qrData);
    // Le QR code est maintenant directement stocké en base lors de la création du véhicule
    // Pas besoin de le lier séparément
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
            <View style={styles.vehicleFormHeaderTop}>
              <TouchableOpacity style={styles.backButton} onPress={handleVehicleCancel}>
                <View style={styles.backButtonGradient}>
                  <Ionicons name="arrow-back" size={20} color="white" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="car-sport" size={32} color="#7C3AED" />
                </LinearGradient>
              </View>
              
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.welcomeSection}>
              <ThemedText style={styles.greetingText}>
                {editingVehicle ? 'Modifier' : 'Nouveau véhicule'}
              </ThemedText>
              <ThemedText style={styles.subtitleText}>
                {editingVehicle ? 'Modifiez les informations' : 'Ajoutez un véhicule à votre flotte'}
              </ThemedText>
            </View>
          </Animated.View>
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
            <View style={styles.qrHeaderTop}>
              <TouchableOpacity style={styles.qrBackButton} onPress={handleBack}>
                <View style={styles.backButtonGradient}>
                  <Ionicons name="arrow-back" size={20} color="white" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="qr-code" size={32} color="#7C3AED" />
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.welcomeSection}>
              <ThemedText style={styles.greetingText}>
                QR Code - {selectedVehicle.name}
              </ThemedText>
              <ThemedText style={styles.subtitleText}>
                Scannez ce code pour signaler un problème
              </ThemedText>
            </View>
          </Animated.View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <QRCodeGenerator
            vehicleData={{
              vehicleName: selectedVehicle.name,
              ownerId: user?.id || 'unknown',
              type: 'notifcar',
            }}
            qrCodeFromDB={selectedVehicle.qr_code}
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
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.logoGradient}
              >
                <Ionicons name="car-sport" size={32} color="#7C3AED" />
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.greetingText}>Mes Véhicules</ThemedText>
            <ThemedText style={styles.subtitleText}>
              Gérez et protégez vos véhicules
            </ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bouton Ajouter */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButtonMain}
            onPress={addVehicle}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7C3AED', '#5B21B6', '#4C1D95']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.addButtonContent}>
                <View style={styles.addButtonIcon}>
                  <Ionicons name="add-circle" size={24} color="white" />
                </View>
                <ThemedText style={styles.addButtonText}>Ajouter un véhicule</ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
          {vehicles.length === 0 ? (
            <Animated.View
              style={[
                styles.emptyContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <ScrollView 
                contentContainerStyle={styles.emptyScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                  <LinearGradient
                    colors={['#7C3AED', '#5B21B6', '#4C1D95']}
                    style={styles.heroGradient}
                  >
                    <View style={styles.heroIconContainer}>
                      <Animated.View
                        style={[
                          styles.heroIcon,
                          {
                            transform: [{
                              scale: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1],
                              })
                            }]
                          }
                        ]}
                      >
                        <Ionicons name="car-sport" size={64} color="white" />
                      </Animated.View>
                    </View>
                    
                    <ThemedText style={styles.heroTitle}>
                      Bienvenue sur Notifcar
                    </ThemedText>
                    <ThemedText style={styles.heroSubtitle}>
                      Protégez votre véhicule avec notre système de signalisation intelligent
                    </ThemedText>
                  </LinearGradient>
                </View>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                  <ThemedText style={styles.featuresTitle}>
                    Pourquoi choisir Notifcar ?
                  </ThemedText>
                  
                  <View style={styles.featuresGrid}>
                    <View style={styles.featureCard}>
                      <LinearGradient
                        colors={['#F0FDF4', '#DCFCE7']}
                        style={styles.featureGradient}
                      >
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="qr-code" size={32} color="#16A34A" />
                        </View>
                        <ThemedText style={styles.featureTitle}>QR Code Unique</ThemedText>
                        <ThemedText style={styles.featureDescription}>
                          Chaque véhicule reçoit un QR code personnalisé pour une identification rapide
                        </ThemedText>
                      </LinearGradient>
                    </View>

                    <View style={styles.featureCard}>
                      <LinearGradient
                        colors={['#EFF6FF', '#DBEAFE']}
                        style={styles.featureGradient}
                      >
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="shield-checkmark" size={32} color="#2563EB" />
                        </View>
                        <ThemedText style={styles.featureTitle}>Protection 24/7</ThemedText>
                        <ThemedText style={styles.featureDescription}>
                          Surveillance continue de votre véhicule, jour et nuit
                        </ThemedText>
                      </LinearGradient>
                    </View>

                    <View style={styles.featureCard}>
                      <LinearGradient
                        colors={['#FDF4FF', '#F3E8FF']}
                        style={styles.featureGradient}
                      >
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="notifications" size={32} color="#9333EA" />
                        </View>
                        <ThemedText style={styles.featureTitle}>Notifications Instantanées</ThemedText>
                        <ThemedText style={styles.featureDescription}>
                          Recevez des alertes immédiates en cas de problème avec votre véhicule
                        </ThemedText>
                      </LinearGradient>
                    </View>

                    <View style={styles.featureCard}>
                      <LinearGradient
                        colors={['#FFF7ED', '#FED7AA']}
                        style={styles.featureGradient}
                      >
                        <View style={styles.featureIconContainer}>
                          <Ionicons name="chatbubbles" size={32} color="#EA580C" />
                        </View>
                        <ThemedText style={styles.featureTitle}>Communication Directe</ThemedText>
                        <ThemedText style={styles.featureDescription}>
                          Échangez directement avec les personnes qui signalent un problème
                        </ThemedText>
                      </LinearGradient>
                    </View>
                  </View>
                </View>

                {/* How it Works Section */}
                <View style={styles.howItWorksSection}>
                  <ThemedText style={styles.howItWorksTitle}>
                    Comment ça marche ?
                  </ThemedText>
                  
                  <View style={styles.stepsContainer}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <ThemedText style={styles.stepNumberText}>1</ThemedText>
                      </View>
                      <View style={styles.stepContent}>
                        <ThemedText style={styles.stepTitle}>Ajoutez votre véhicule</ThemedText>
                        <ThemedText style={styles.stepDescription}>
                          Renseignez les informations de votre véhicule
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <ThemedText style={styles.stepNumberText}>2</ThemedText>
                      </View>
                      <View style={styles.stepContent}>
                        <ThemedText style={styles.stepTitle}>Collez le QR code</ThemedText>
                        <ThemedText style={styles.stepDescription}>
                          Placez le QR code sur le pare-brise de votre véhicule
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <ThemedText style={styles.stepNumberText}>3</ThemedText>
                      </View>
                      <View style={styles.stepContent}>
                        <ThemedText style={styles.stepTitle}>Recevez les alertes</ThemedText>
                        <ThemedText style={styles.stepDescription}>
                          Soyez notifié instantanément en cas de problème
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Call to Action */}
                <View style={styles.ctaSection}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.ctaCard}
                  >
                    <View style={styles.ctaIconContainer}>
                      <LinearGradient
                        colors={['#7C3AED', '#5B21B6']}
                        style={styles.ctaIconGradient}
                      >
                        <Ionicons name="add-circle" size={32} color="white" />
                      </LinearGradient>
                    </View>
                    
                    <ThemedText style={styles.ctaTitle}>
                      Prêt à commencer ?
                    </ThemedText>
                    <ThemedText style={styles.ctaSubtitle}>
                      Ajoutez votre premier véhicule en quelques secondes
                    </ThemedText>
                    
                    <VioletButton
                      title="Ajouter mon véhicule"
                      onPress={addVehicle}
                      variant="primary"
                      size="large"
                      style={styles.ctaButton}
                    />
                  </LinearGradient>
                </View>
              </ScrollView>
            </Animated.View>
        ) : (
          vehicles.map((vehicle, index) => (
            <Animated.View 
              key={vehicle.id} 
              style={[
                styles.vehicleCard,
                cardAnimations[index] ? {
                  opacity: cardAnimations[index],
                  transform: [{
                    translateY: cardAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                } : {}
              ]}
            >
              {/* Header principal avec icône et nom */}
              <View style={styles.vehicleHeader}>
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6']}
                  style={styles.vehicleIcon}
                >
                  <Ionicons name="car-sport" size={28} color="white" />
                </LinearGradient>
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
            </Animated.View>
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  vehicleFormHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  logoContainer: {
    marginBottom: 0,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerInfo: {
    alignItems: 'center',
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
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
    fontWeight: '500',
    lineHeight: 22,
  },
  addButton: {
    minWidth: 100,
    marginRight: 8,
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  addButtonMain: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  addButtonGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
  },
  qrBackButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    padding: 8,
  },
  backButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeholder: {
    width: 80,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  // Hero Section
  heroSection: {
    marginBottom: 32,
  },
  heroGradient: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  heroIconContainer: {
    marginBottom: 24,
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Features Section
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // How it Works Section
  howItWorksSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  howItWorksTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Call to Action Section
  ctaSection: {
    paddingHorizontal: 16,
  },
  ctaCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ctaIconContainer: {
    marginBottom: 20,
  },
  ctaIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  ctaButton: {
    minWidth: 280,
    paddingVertical: 16,
  },
  vehicleCard: {
    backgroundColor: 'white',
    marginBottom: 20,
    marginHorizontal: 4,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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