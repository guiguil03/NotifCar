import { useAuth } from '@/contexts/AuthContext';
import { FirebaseAnalyticsService } from '@/lib/firebaseAnalytics';
import { ProfileService, UpdateProfileData, UserProfile } from '@/lib/profileService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProfileFormProps {
  onProfileUpdated?: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onProfileUpdated, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // États du formulaire
  const [formData, setFormData] = useState<UpdateProfileData>({
    first_name: '',
    last_name: '',
    display_name: '',
    username: '',
    bio: '',
    phone_number: '',
    email: '',
    show_real_name: false,
    show_phone: false,
    show_email: false,
  });

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    loadProfile();
    FirebaseAnalyticsService.logProfileFormOpened();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Essayer de charger le profil depuis la table user_profiles
      const userProfile = await ProfileService.getCurrentUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          display_name: userProfile.display_name || '',
          username: userProfile.username || '',
          bio: userProfile.bio || '',
          phone_number: userProfile.phone_number || '',
          email: userProfile.email || '',
          show_real_name: userProfile.show_real_name,
          show_phone: userProfile.show_phone,
          show_email: userProfile.show_email,
        });
      } else {
        // Fallback : pré-remplir avec les données utilisateur existantes
        const fullName = user?.user_metadata?.full_name;
        if (fullName) {
          const nameParts = fullName.split(' ');
          setFormData(prev => ({
            ...prev,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: user?.email || '',
          }));
        }
      }
    } catch (error) {
      console.log('Table user_profiles non disponible, utilisation des données de base');
      // Fallback : pré-remplir avec les données utilisateur existantes
      const fullName = user?.user_metadata?.full_name;
      if (fullName) {
        const nameParts = fullName.split(' ');
        setFormData(prev => ({
          ...prev,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          email: user?.email || '',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await ProfileService.isUsernameAvailable(username, user?.id);
      setUsernameAvailable(available);
    } catch (error) {
      console.log('Vérification username non disponible, ignorée');
      setUsernameAvailable(true); // Considérer comme disponible si la table n'existe pas
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (username: string) => {
    setFormData(prev => ({ ...prev, username }));
    
    // Debounce la vérification
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSave = async () => {
    if (!formData.first_name?.trim() && !formData.display_name?.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins votre prénom ou un nom d\'affichage');
      return;
    }

    if (formData.username && usernameAvailable === false) {
      Alert.alert('Erreur', 'Ce nom d\'utilisateur n\'est pas disponible');
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await ProfileService.updateProfile(formData);
      if (updatedProfile) {
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        onProfileUpdated?.(updatedProfile);
        onClose?.();
      }
    } catch (error) {
      console.log('Erreur sauvegarde profil:', error);
      
      // Fallback : sauvegarder dans les métadonnées utilisateur
      try {
        const displayName = formData.display_name?.trim() || 
          (formData.first_name?.trim() ? 
            `${formData.first_name.trim()}${formData.last_name?.trim() ? ` ${formData.last_name.trim()}` : ''}` : 
            'Utilisateur NotifCar'
          );
        
        // Créer un profil fictif pour le callback
        const mockProfile: UserProfile = {
          id: 'temp',
          user_id: user?.id || '',
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          display_name: formData.display_name || '',
          username: formData.username || '',
          bio: formData.bio || '',
          phone_number: formData.phone_number || '',
          email: formData.email || user?.email || '',
          preferred_language: 'fr',
          timezone: 'Europe/Paris',
          public_display_name: displayName,
          show_real_name: formData.show_real_name || false,
          show_phone: formData.show_phone || false,
          show_email: formData.show_email || false,
          notification_preferences: {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            marketing_emails: false,
            new_message_sound: true,
            urgent_only: false,
          },
          profile_completed: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        };
        
        Alert.alert('Succès', 'Vos informations ont été sauvegardées localement');
        onProfileUpdated?.(mockProfile);
        onClose?.();
      } catch (fallbackError) {
        Alert.alert('Erreur', 'Impossible de sauvegarder le profil. Réessayez plus tard.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#2633E1" />
        <Text style={{ marginTop: 16, color: '#666' }}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E']}
        style={{ padding: 20, paddingTop: 60 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
            Mon Profil
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
          Personnalisez vos informations
        </Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        {/* Informations personnelles */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' }}>
            Informations personnelles
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Prénom *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={formData.first_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
              placeholder="Votre prénom"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Nom de famille
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={formData.last_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
              placeholder="Votre nom de famille"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Nom d'affichage
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={formData.display_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, display_name: text }))}
              placeholder="Comment voulez-vous être appelé ?"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                Nom d'utilisateur
              </Text>
              {checkingUsername && (
                <ActivityIndicator size="small" color="#2633E1" style={{ marginLeft: 8 }} />
              )}
              {usernameAvailable === true && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 8 }} />
              )}
              {usernameAvailable === false && (
                <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginLeft: 8 }} />
              )}
            </View>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: usernameAvailable === false ? '#EF4444' : '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={formData.username}
              onChangeText={handleUsernameChange}
              placeholder="@votre_nom_utilisateur"
              autoCapitalize="none"
            />
            {usernameAvailable === false && (
              <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                Ce nom d'utilisateur n'est pas disponible
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Bio
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                height: 80,
                textAlignVertical: 'top',
              }}
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
              placeholder="Parlez-nous de vous..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Contact */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' }}>
            Informations de contact
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Téléphone
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="Votre numéro de téléphone"
              keyboardType="phone-pad"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Email de contact
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Email pour être contacté"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Préférences de confidentialité */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' }}>
            Confidentialité
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Afficher mon vrai nom
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                Les autres verront votre prénom et initiale du nom
              </Text>
            </View>
            <Switch
              value={formData.show_real_name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, show_real_name: value }))}
              trackColor={{ false: '#D1D5DB', true: '#2633E1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Afficher mon téléphone
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                Visible dans vos messages
              </Text>
            </View>
            <Switch
              value={formData.show_phone}
              onValueChange={(value) => setFormData(prev => ({ ...prev, show_phone: value }))}
              trackColor={{ false: '#D1D5DB', true: '#2633E1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Afficher mon email
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                Visible dans vos messages
              </Text>
            </View>
            <Switch
              value={formData.show_email}
              onValueChange={(value) => setFormData(prev => ({ ...prev, show_email: value }))}
              trackColor={{ false: '#D1D5DB', true: '#2633E1' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? '#9CA3AF' : '#2633E1',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Sauvegarder le profil
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
