import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin && !fullName) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return;
    }

    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, fullName);

      if (error) {
        Alert.alert('Erreur', error.message);
      } else if (isLogin) {
        // Connexion réussie, rediriger vers l'accueil
        router.replace('/(tabs)');
      } else {
        // Inscription réussie
        Alert.alert(
          'Succès',
          'Compte créé ! Vérifiez votre email pour confirmer votre inscription.'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre email d\'abord');
      return;
    }

    const { error } = await resetPassword(email);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert(
        'Email envoyé',
        'Un lien de réinitialisation a été envoyé à votre adresse email.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo */}
        <ThemedView style={[styles.header, { backgroundColor: primaryColor }]}>
          <ThemedView style={[styles.logoContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="car-sport" size={60} color="white" />
          </ThemedView>
          <ThemedText style={styles.logo}>Notifcar</ThemedText>
          <ThemedText style={styles.slogan}>Votre véhicule vous parle, écoutez-le</ThemedText>
        </ThemedView>

        {/* Formulaire d'authentification */}
        <ThemedView style={styles.formContainer}>
          <ThemedView style={[styles.formCard, { backgroundColor: cardColor, borderColor }]}>
            <ThemedText style={styles.formTitle}>
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </ThemedText>

            {!isLogin && (
              <ThemedView style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={primaryColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { borderColor, color: textColor }]}
                  placeholder="Nom complet"
                  placeholderTextColor={textColor + '80'}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </ThemedView>
            )}

            <ThemedView style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={primaryColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="Email"
                placeholderTextColor={textColor + '80'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={primaryColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="Mot de passe"
                placeholderTextColor={textColor + '80'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </ThemedView>

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: primaryColor }]}
              onPress={handleAuth}
              disabled={loading}
            >
              <ThemedText style={styles.authButtonText}>
                {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer le compte')}
              </ThemedText>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <ThemedText style={[styles.forgotPasswordText, { color: primaryColor }]}>
                  Mot de passe oublié ?
                </ThemedText>
              </TouchableOpacity>
            )}

            <ThemedView style={styles.switchContainer}>
              <ThemedText style={styles.switchText}>
                {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <ThemedText style={[styles.switchButton, { color: primaryColor }]}>
                  {isLogin ? 'Créer un compte' : 'Se connecter'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Footer avec informations */}
        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            En vous connectant, vous acceptez nos conditions d&apos;utilisation
          </ThemedText>
          <ThemedText style={styles.footerSubtext}>
            Notifcar v1.0.0 - Sécurisé par Supabase
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  formCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 50,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  authButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    opacity: 0.7,
  },
  switchButton: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 10,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
