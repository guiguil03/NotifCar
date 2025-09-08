import UltraSimpleChat from '@/components/chat/UltraSimpleChat';
import { QRDebugger } from '@/components/dev/QRDebugger';
import { ThemedText } from '@/components/ThemedText';
import { VioletButton } from '@/components/ui/VioletButton';
import { useChat } from '@/contexts/ChatContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ChatService, Conversation } from '@/lib/chatService';
import { QRCodeService } from '@/lib/qrCodeService';
import { SignalizationService } from '@/lib/signalizationService';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [scannedVehicleId, setScannedVehicleId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [targetDisplayName, setTargetDisplayName] = useState<string>('propriétaire');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [vehicleIssue, setVehicleIssue] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('normal');
  const [showQRDebugger, setShowQRDebugger] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  
  const { createConversationFromQR } = useChat();
  
  const primaryColor = useThemeColor({}, 'primary');
  // const secondaryColor = useThemeColor({}, 'secondary');
  const gradientStart = useThemeColor({}, 'gradientStart');
  // const gradientEnd = useThemeColor({}, 'gradientEnd');
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

    // Charger les conversations
    loadConversations();

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

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const conversationsData = await ChatService.getUserConversations(user.id);
        setConversations(conversationsData);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Logs de débogage pour voir ce qui est scanné
    console.log('=== SCAN QR CODE ===');
    console.log('Type:', type);
    console.log('Data scannée:', data);
    console.log('Type de data:', typeof data);
    console.log('Longueur:', data.length);
    console.log('Commence par notifcar:', data.startsWith('notifcar:'));
    console.log('Parties après split:', data.split(':'));
    console.log('========================');
    
    // Validation du QR code avec le service
    const validation = QRCodeService.validateQRCode(data);
    
    console.log('Résultat validation:', validation);
    
    if (validation.isValid && validation.vehicleId && validation.ownerId) {
      console.log('QR code valide, ouverture du modal');
      setScannedVehicleId(data); // Stocker le QR code complet

      // Récupérer un nom lisible pour le propriétaire
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, full_name, username, email')
          .eq('id', validation.ownerId)
          .maybeSingle();
        const nameCandidate =
          (profile?.display_name && String(profile.display_name).trim()) ||
          (profile?.full_name && String(profile.full_name).trim()) ||
          (profile?.username && String(profile.username).trim()) ||
          (profile?.email && String(profile.email).trim());

        if (nameCandidate && nameCandidate.length > 0) {
          setTargetDisplayName(nameCandidate);
        } else {
          setTargetDisplayName(`${validation.ownerId.slice(0, 8)}…`);
        }
      } catch {
        setTargetDisplayName(`${validation.ownerId.slice(0, 8)}…`);
      }

      setShowMessageModal(true);
    } else {
      console.log('QR code invalide, affichage de l\'alerte');
      Alert.alert(
        'QR Code invalide',
        `Ce QR code n'est pas un code NotifCar valide.\n\nDonnées scannées: "${data}"\n\nAssurez-vous de scanner un QR code généré par l'application NotifCar.`,
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleSendMessage = async () => {
    if (!scannedVehicleId || sendingMessage) return;

    setSendingMessage(true);
    try {
      // Valider le QR code et extraire l'ID du véhicule
      const qrValidation = QRCodeService.validateQRCode(scannedVehicleId);
      
      if (!qrValidation.isValid || !qrValidation.vehicleId) {
        throw new Error('QR code invalide. Assurez-vous de scanner un QR code NotifCar valide.');
      }

      // Trouver le véhicule par son ID
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, owner_id, brand, model, license_plate')
        .eq('id', qrValidation.vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Véhicule non trouvé. Le QR code semble valide mais le véhicule n\'existe plus.');
      }

      // Convertir la raison sélectionnée en format de base de données
      const reasonTypeMap: { [key: string]: string } = {
        'Stationnement gênant': 'stationnement_genant',
        'Problème technique': 'probleme_technique',
        'Accident': 'accident',
        'Véhicule abandonné': 'vehicule_abandonne',
        'Autre': 'autre'
      };

      const reasonType = reasonTypeMap[selectedReason] || 'autre';

      // Construire le message structuré pour la conversation
      let structuredMessage = '';
      
      // Ajouter la raison du scan
      if (selectedReason) {
        structuredMessage += `🚨 **Raison du scan:** ${selectedReason}\n\n`;
      }
      
      // Ajouter la raison personnalisée si fournie
      if (customReason.trim()) {
        structuredMessage += `📝 **Détails:** ${customReason.trim()}\n\n`;
      }
      
      // Ajouter le problème du véhicule
      if (vehicleIssue.trim()) {
        structuredMessage += `🚗 **Problème observé:** ${vehicleIssue.trim()}\n\n`;
      }
      
      // Ajouter le niveau d'urgence
      const urgencyEmoji = urgency === 'urgent' ? '🔴' : urgency === 'important' ? '🟡' : '🟢';
      const urgencyText = urgency === 'urgent' ? 'Urgent' : urgency === 'important' ? 'Important' : 'Normal';
      structuredMessage += `${urgencyEmoji} **Niveau d'urgence:** ${urgencyText}\n\n`;
      
      // Ajouter le message personnalisé s'il y en a un
      if (messageText.trim()) {
        structuredMessage += `💬 **Message:** ${messageText.trim()}`;
      }

      // Faire les deux actions en parallèle : créer la conversation ET enregistrer la signalisation
      const [conversation, signalization] = await Promise.all([
        // 1. Créer la conversation et envoyer le message privé
        createConversationFromQR(scannedVehicleId, structuredMessage),
        
        // 2. Enregistrer la signalisation dans la base de données
        SignalizationService.createSignalization({
          vehicle_id: vehicle.id,
          reason_type: reasonType as any,
          custom_reason: selectedReason === 'Autre' ? customReason.trim() : undefined,
          vehicle_issue: vehicleIssue.trim() || undefined,
          urgency_level: urgency as 'urgent' | 'important' | 'normal',
          custom_message: messageText.trim() || undefined,
        })
      ]);
      
      if (conversation && signalization) {
        // Lier la signalisation à la conversation
        await SignalizationService.updateSignalizationConversation(signalization.id, conversation.id);
        
        Alert.alert(
          'Signalisation créée !',
          '✅ Votre signalisation a été enregistrée dans la base de données\n📱 Un message privé a été envoyé au propriétaire du véhicule\n💬 Vous pouvez maintenant communiquer en privé',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowMessageModal(false);
                setMessageText('');
                setSelectedReason('');
                setCustomReason('');
                setVehicleIssue('');
                setUrgency('normal');
                setScannedVehicleId(null);
                setScanned(false);
              },
            },
          ]
        );
      } else {
        throw new Error('Erreur lors de la création de la signalisation ou de la conversation');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelMessage = () => {
    setShowMessageModal(false);
    setMessageText('');
    setSelectedReason('');
    setCustomReason('');
    setVehicleIssue('');
    setUrgency('normal');
    setScannedVehicleId(null);
    setScanned(false);
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const closeConversation = () => {
    setSelectedConversation(null);
    loadConversations(); // Recharger les conversations
  };

  const toggleConversations = () => {
    setShowConversations(!showConversations);
    if (!showConversations) {
      loadConversations();
    }
  };

  // Si une conversation est sélectionnée, afficher le chat
  if (selectedConversation) {
    return (
      <UltraSimpleChat
        conversation={selectedConversation}
        onBack={closeConversation}
      />
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={gradientStart} />
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
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
          colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
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
    <>
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
            colors={['rgba(30,27,75,0.9)', 'rgba(49,46,129,0.7)', 'rgba(124,58,237,0.3)', 'transparent']}
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

              {/* Bouton de débogage QR */}
              <TouchableOpacity
                style={styles.debugButtonMain}
                onPress={() => setShowQRDebugger(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF0000', '#FF4500', '#FF6B35']}
                  style={styles.debugButtonGradient}
                >
                  <Ionicons name="bug" size={32} color="white" />
                  <Text style={styles.debugButtonMainText}>🐛 DÉBOGUER QR CODE</Text>
                  <Text style={styles.debugButtonSubText}>Corriger les QR codes défectueux</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Bouton Conversations */}
            <Animated.View
              style={[
                styles.debugButtonContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity
                onPress={toggleConversations}
                style={styles.debugButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#A855F7', '#C084FC']}
                  style={styles.debugButtonGradient}
                >
                  <Ionicons name="chatbubbles" size={32} color="white" />
                  <Text style={styles.debugButtonMainText}>💬 MESSAGES</Text>
                  <Text style={styles.debugButtonSubText}>Voir les conversations ({conversations.length})</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </View>
      </CameraView>
      </View>

      {/* Modal pour envoyer un message */}
    <Modal
      visible={showMessageModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancelMessage}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContentWrapper}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelMessage} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Formulaire de contact</Text>
            <TouchableOpacity 
              onPress={Keyboard.dismiss} 
              style={styles.keyboardDismissButton}
            >
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.messageInfo}>
              <View style={styles.messageInfoIcon}>
                <Ionicons name="car" size={24} color="#7C3AED" />
              </View>
              <View style={styles.messageInfoContent}>
                <Text style={styles.messageInfoTitle}>Contact du propriétaire</Text>
                <Text style={styles.messageInfoText}>
                  Vous contactez {targetDisplayName}
                </Text>
              </View>
            </View>

            {/* Section Raison du scan */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>🚨 Pourquoi scannez-vous ce QR code ?</Text>
              
              <View style={styles.reasonOptions}>
                <TouchableOpacity
                  style={[styles.reasonOption, selectedReason === 'Stationnement gênant' && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason('Stationnement gênant')}
                >
                  <View style={[styles.reasonIcon, selectedReason === 'Stationnement gênant' && styles.reasonIconSelected]}>
                    <Ionicons name="car-outline" size={24} color={selectedReason === 'Stationnement gênant' ? 'white' : '#7C3AED'} />
                  </View>
                  <Text style={[styles.reasonText, selectedReason === 'Stationnement gênant' && styles.reasonTextSelected]}>
                    Stationnement gênant
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reasonOption, selectedReason === 'Problème technique' && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason('Problème technique')}
                >
                  <View style={[styles.reasonIcon, selectedReason === 'Problème technique' && styles.reasonIconSelected]}>
                    <Ionicons name="warning-outline" size={24} color={selectedReason === 'Problème technique' ? 'white' : '#F59E0B'} />
                  </View>
                  <Text style={[styles.reasonText, selectedReason === 'Problème technique' && styles.reasonTextSelected]}>
                    Problème technique
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reasonOption, selectedReason === 'Accident' && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason('Accident')}
                >
                  <View style={[styles.reasonIcon, selectedReason === 'Accident' && styles.reasonIconSelected]}>
                    <Ionicons name="alert-circle-outline" size={24} color={selectedReason === 'Accident' ? 'white' : '#EF4444'} />
                  </View>
                  <Text style={[styles.reasonText, selectedReason === 'Accident' && styles.reasonTextSelected]}>
                    Accident
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reasonOption, selectedReason === 'Véhicule abandonné' && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason('Véhicule abandonné')}
                >
                  <View style={[styles.reasonIcon, selectedReason === 'Véhicule abandonné' && styles.reasonIconSelected]}>
                    <Ionicons name="time-outline" size={24} color={selectedReason === 'Véhicule abandonné' ? 'white' : '#8B5CF6'} />
                  </View>
                  <Text style={[styles.reasonText, selectedReason === 'Véhicule abandonné' && styles.reasonTextSelected]}>
                    Véhicule abandonné
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reasonOption, selectedReason === 'Autre' && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason('Autre')}
                >
                  <View style={[styles.reasonIcon, selectedReason === 'Autre' && styles.reasonIconSelected]}>
                    <Ionicons name="ellipsis-horizontal-outline" size={24} color={selectedReason === 'Autre' ? 'white' : '#6B7280'} />
                  </View>
                  <Text style={[styles.reasonText, selectedReason === 'Autre' && styles.reasonTextSelected]}>
                    Autre
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedReason === 'Autre' && (
                <TextInput
                  style={styles.customInput}
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder="Précisez votre raison..."
                  placeholderTextColor="#999"
                />
              )}
            </View>

            {/* Section Problème du véhicule */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>🚗 Que se passe-t-il avec le véhicule ?</Text>
              <TextInput
                style={styles.textAreaInput}
                value={vehicleIssue}
                onChangeText={setVehicleIssue}
                placeholder="Décrivez ce que vous observez (ex: phares allumés, porte ouverte, dégâts visibles...)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Section Niveau d'urgence */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>⚡ Niveau d'urgence</Text>
              
              <View style={styles.urgencyOptions}>
                <TouchableOpacity
                  style={[styles.urgencyOption, urgency === 'urgent' && styles.urgencyOptionSelected]}
                  onPress={() => setUrgency('urgent')}
                >
                  <Text style={styles.urgencyEmoji}>🔴</Text>
                  <Text style={[styles.urgencyText, urgency === 'urgent' && styles.urgencyTextSelected]}>
                    Urgent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.urgencyOption, urgency === 'important' && styles.urgencyOptionSelected]}
                  onPress={() => setUrgency('important')}
                >
                  <Text style={styles.urgencyEmoji}>🟡</Text>
                  <Text style={[styles.urgencyText, urgency === 'important' && styles.urgencyTextSelected]}>
                    Important
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.urgencyOption, urgency === 'normal' && styles.urgencyOptionSelected]}
                  onPress={() => setUrgency('normal')}
                >
                  <Text style={styles.urgencyEmoji}>🟢</Text>
                  <Text style={[styles.urgencyText, urgency === 'normal' && styles.urgencyTextSelected]}>
                    Normal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section Message personnalisé */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>💬 Message personnalisé (optionnel)</Text>
              <TextInput
                style={styles.textAreaInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Ajoutez des détails supplémentaires..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {messageText.length}/500
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelMessage}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!selectedReason && !customReason.trim() && !vehicleIssue.trim() && !messageText.trim()) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={(!selectedReason && !customReason.trim() && !vehicleIssue.trim() && !messageText.trim()) || sendingMessage}
            >
              {sendingMessage ? (
                <Text style={styles.sendButtonText}>Envoi...</Text>
              ) : (
                <Text style={styles.sendButtonText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Modal de débogage QR */}
    <Modal
      visible={showQRDebugger}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowQRDebugger(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowQRDebugger(false)} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Débogueur QR Code</Text>
          <View style={{ width: 24 }} />
        </View>
        <QRDebugger />
      </View>
    </Modal>

    {/* Modal Conversations */}
    <Modal
      visible={showConversations}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.conversationsModalContainer}>
        <View style={styles.conversationsHeader}>
          <TouchableOpacity onPress={toggleConversations} style={styles.conversationsCloseButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.conversationsTitle}>Mes Conversations</Text>
          <View style={styles.conversationsPlaceholder} />
        </View>

        {conversations.length === 0 ? (
          <View style={styles.emptyConversationsContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyConversationsTitle}>Aucune conversation</Text>
            <Text style={styles.emptyConversationsSubtitle}>
              Scannez un QR code pour commencer une conversation
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => {
                  setShowConversations(false);
                  openConversation(item);
                }}
              >
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationVehicleName}>
                    {`${item.vehicleBrand ? item.vehicleBrand : 'Véhicule'} ${item.vehicleModel ? item.vehicleModel : ''}`.trim()}
                  </Text>
                  <Text style={styles.conversationLicensePlate}>
                    {item.vehicleLicensePlate ? item.vehicleLicensePlate : 'Plaque inconnue'}
                  </Text>
                  <Text style={styles.conversationParticipant}>
                    avec {item.otherParticipantEmail ? item.otherParticipantEmail : (item.otherParticipantId ? `${item.otherParticipantId.slice(0, 8)}...` : 'Utilisateur')}
                  </Text>
                  {item.lastMessageContent && (
                    <Text style={styles.conversationLastMessage} numberOfLines={2}>
                      {item.lastMessageContent}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.conversationsList}
          />
        )}
      </View>
    </Modal>
    </>
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
  // Styles pour le modal de message amélioré
  modalContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  modalContentWrapper: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalPlaceholder: {
    width: 40,
  },
  keyboardDismissButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInfoContent: {
    flex: 1,
    marginLeft: 16,
  },
  messageInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  messageInfoText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  messageInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 3,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.2,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  // Styles pour le bouton de test
  testButton: {
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  debugButtonContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  debugButton: {
    borderWidth: 2,
    borderColor: '#FF4500',
    shadowColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  debugButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  debugButtonMain: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  debugButtonGradient: {
    padding: 20,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugButtonMainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  debugButtonSubText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Styles pour les conversations
  conversationsModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  conversationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  conversationsCloseButton: {
    padding: 8,
  },
  conversationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  conversationsPlaceholder: {
    width: 40,
  },
  emptyConversationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyConversationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyConversationsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  conversationsList: {
    padding: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationContent: {
    flex: 1,
  },
  conversationVehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  conversationLicensePlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  conversationParticipant: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  // Styles pour le formulaire amélioré
  formSection: {
    marginBottom: 28,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonOptions: {
    gap: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reasonOptionSelected: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  reasonText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 14,
    fontWeight: '600',
  },
  reasonTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonIconSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  customInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 0,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 0,
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  urgencyOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  urgencyOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  urgencyOptionSelected: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  urgencyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  urgencyText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  urgencyTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
});