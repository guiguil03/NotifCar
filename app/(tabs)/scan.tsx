import { ThemedText } from '@/components/ThemedText';
import { VioletButton } from '@/components/ui/VioletButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { QRCodeService } from '@/lib/qrCodeService';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  
  const primaryColor = useThemeColor({}, 'primary');
  // const secondaryColor = useThemeColor({}, 'secondary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  // const gradientLight = useThemeColor({}, 'gradientLight');
  const alertColor = useThemeColor({}, 'alert');

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }

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

    // Animation de pulsation pour le cadre de scan
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [permission, requestPermission, fadeAnim, slideAnim, pulseAnim]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Validation du QR code avec le service
    const validation = QRCodeService.validateQRCode(data);
    
    if (validation.isValid && validation.vehicleId && validation.ownerId) {
      Alert.alert(
        'QR Code NotifCar détecté !',
        `Véhicule ID: ${validation.vehicleId}\nPropriétaire: ${validation.ownerId}\n\nQue souhaitez-vous faire ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => setScanned(false),
          },
          {
            text: 'Notifier',
            onPress: () => {
              Alert.alert(
                'Notification envoyée !',
                'Le propriétaire du véhicule a été notifié de votre message.',
                [
                  {
                    text: 'OK',
                    onPress: () => setScanned(false),
                  },
                ]
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'QR Code invalide',
        'Ce QR code n\'est pas un code NotifCar valide.\n\nAssurez-vous de scanner un QR code généré par l\'application NotifCar.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={gradientStart} />
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <Animated.View
              style={[
                styles.loadingIcon,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <Ionicons name="camera" size={48} color="white" />
            </Animated.View>
            <ThemedText style={styles.loadingText}>
              Initialisation de la caméra...
            </ThemedText>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={gradientStart} />
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          style={styles.permissionContainer}
        >
          <Animated.View
            style={[
              styles.permissionContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.permissionIcon}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.permissionIconGradient}
              >
                <Ionicons name="camera-outline" size={40} color={gradientStart} />
              </LinearGradient>
            </View>
            
            <ThemedText style={styles.permissionTitle}>
              Autorisation requise
            </ThemedText>
            <ThemedText style={styles.permissionText}>
              Notifcar a besoin d&apos;accéder à votre caméra pour scanner les QR codes des véhicules.
            </ThemedText>
            
            <VioletButton
              title="Autoriser la caméra"
              onPress={requestPermission}
              variant="outline"
              size="large"
              style={styles.permissionButton}
            />
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        flash={flashOn ? 'on' : 'off'}
      >
        {/* Overlay avec design sophistiqué */}
        <View style={styles.overlay}>
          {/* Header avec gradient */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
            style={styles.headerGradient}
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
              <TouchableOpacity style={styles.backButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.backButtonGradient}
                >
                  <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </LinearGradient>
              </TouchableOpacity>
              
              <ThemedText style={styles.headerTitle}>Scanner QR Code</ThemedText>
              
              <TouchableOpacity
                style={styles.flashButton}
                onPress={() => setFlashOn(!flashOn)}
              >
                <LinearGradient
                  colors={flashOn ? [alertColor, '#FB923C'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.flashButtonGradient}
                >
                  <Ionicons 
                    name={flashOn ? "flash" : "flash-off"} 
                    size={24} 
                    color={flashOn ? "white" : "#1F2937"} 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>

          {/* Zone de scan avec design premium */}
          <View style={styles.scanArea}>
            <Animated.View
              style={[
                styles.scanFrame,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              {/* Cadre de scan avec gradient */}
              <LinearGradient
                colors={['transparent', 'rgba(249, 115, 22, 0.1)', 'transparent']}
                style={styles.scanFrameGradient}
              >
                <View style={styles.cornerContainer}>
                  <View style={[styles.corner, styles.topLeft, { borderColor: alertColor }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: alertColor }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: alertColor }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: alertColor }]} />
                </View>
              </LinearGradient>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.scanInstruction,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
                style={styles.instructionGradient}
              >
                <Ionicons name="qr-code" size={20} color="white" />
                <ThemedText style={styles.instructionText}>
                  Positionnez le QR code dans le cadre
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Footer avec instructions sophistiquées */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            style={styles.footerGradient}
          >
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.instructionCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.instructionCardGradient}
                >
                  <View style={[styles.instructionIcon, { backgroundColor: primaryColor }]}>
                    <Ionicons name="information-circle" size={20} color="white" />
                  </View>
                  <View style={styles.instructionContent}>
                    <ThemedText style={styles.instructionTitle}>
                      Comment scanner ?
                    </ThemedText>
                    <ThemedText style={styles.instructionDescription}>
                      Scannez le QR code Notifcar apposé sur le pare-brise du véhicule
                    </ThemedText>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  flashButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  flashButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  scanFrameGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    position: 'relative',
  },
  cornerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanInstruction: {
    marginTop: 40,
  },
  instructionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerGradient: {
    paddingTop: 20,
  },
  footer: {
    padding: 20,
  },
  instructionCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  instructionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1F2937',
  },
  instructionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionIcon: {
    marginBottom: 30,
  },
  permissionIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  permissionButton: {
    marginTop: 20,
  },
});