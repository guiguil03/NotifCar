import { useAuth } from '@/contexts/AuthContext';
import { FirebaseAnalyticsService } from '@/lib/firebaseAnalytics';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SimpleProfileFormProps {
  onProfileUpdated?: () => void;
  onClose?: () => void;
}

export const SimpleProfileForm: React.FC<SimpleProfileFormProps> = ({ onProfileUpdated, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // États du formulaire simplifié
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showRealName, setShowRealName] = useState(false);

  useEffect(() => {
    loadProfile();
    FirebaseAnalyticsService.logProfileFormOpened();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Essayer de charger le profil existant
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, display_name, show_real_name')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setDisplayName(profile.display_name || '');
        setShowRealName(profile.show_real_name || false);
      } else {
        // Pré-remplir avec les données existantes
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          const nameParts = fullName.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }
      }
    } catch (error) {
      console.log('Profil non trouvé, création d\'un nouveau');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() && !displayName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins votre prénom ou un nom d\'affichage');
      return;
    }

    setSaving(true);
    try {
      // Créer ou mettre à jour le profil
      const profileData = {
        user_id: user?.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        display_name: displayName.trim() || null,
        show_real_name: showRealName,
        email: user?.email,
        updated_at: new Date().toISOString(),
      };

      // Générer le nom public
      let publicDisplayName = '';
      if (displayName.trim()) {
        publicDisplayName = displayName.trim();
      } else if (firstName.trim()) {
        const lastInitial = lastName.trim() ? ` ${lastName.trim().charAt(0)}.` : '';
        publicDisplayName = `${firstName.trim()}${lastInitial}`;
      } else {
        publicDisplayName = 'Utilisateur NotifCar';
      }

      profileData.public_display_name = publicDisplayName;
      profileData.profile_completed = publicDisplayName !== 'Utilisateur NotifCar';

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      FirebaseAnalyticsService.logProfileUpdated();
      Alert.alert('Succès', 'Votre nom a été sauvegardé !');
      onProfileUpdated?.();
      onClose?.();
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez plus tard.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#2633E1" />
        <Text style={{ marginTop: 16, color: '#666' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E']}
        style={{ padding: 20, paddingTop: 60 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
            Personnaliser mon nom
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
          Comment voulez-vous apparaître dans les messages ?
        </Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        {/* Informations de base */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' }}>
            Vos informations
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Prénom
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Votre prénom"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Nom de famille (optionnel)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Votre nom de famille"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Ou un nom d'affichage personnalisé
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ex: Jean, JD, Jean D., etc."
            />
          </View>

          {/* Préférence d'affichage */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Afficher mon nom complet
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                Si activé, votre prénom et initiale du nom seront visibles
              </Text>
            </View>
            <Switch
              value={showRealName}
              onValueChange={setShowRealName}
              trackColor={{ false: '#D1D5DB', true: '#2633E1' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Aperçu */}
        <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
            Aperçu dans les messages :
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
            {displayName.trim() 
              ? `"Message de ${displayName.trim()}"`
              : firstName.trim()
              ? `"Message de ${firstName.trim()}${lastName.trim() ? ` ${lastName.trim().charAt(0)}.` : ''}"`
              : '"Message concernant votre véhicule"'
            }
          </Text>
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
              Sauvegarder
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
