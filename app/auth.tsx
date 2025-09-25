import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

// const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<null | 'fullName' | 'email' | 'password' | 'confirmPassword'>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; fullName?: string }>({});

  const { signIn, signUp } = useAuth();
  const primaryColor = useThemeColor({}, 'primary');
  // const secondaryColor = useThemeColor({}, 'secondary');
  // const errorColor = useThemeColor({}, 'error');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScaleAnim, formSlideAnim]);

  const handleAuth = async () => {
    const nextErrors: typeof errors = {};

    // validations simples
    if (!email.trim()) {
      nextErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Email invalide';
    }

    if (!password.trim()) {
      nextErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      nextErrors.password = '6 caractères minimum';
    }

    if (!isLogin) {
      if (!fullName.trim()) nextErrors.fullName = 'Nom requis';
      if (confirmPassword !== password) nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        router.replace('/(tabs)');
      } else {
        await signUp(email, password, fullName);
        router.replace('/onboarding');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setErrors({});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Background avec gradient */}
      <LinearGradient
        colors={['#2633E1', '#1E9B7E', '#26C29E', '#7DDAC5']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* En-tête épuré */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: logoScaleAnim }
                ]
              }
            ]}
          >
            <ThemedText style={styles.appTitle}>Notifcar</ThemedText>
            <ThemedText style={styles.appSubtitle}>
              {isLogin ? 'Connexion sécurisée' : 'Créer un compte'}
            </ThemedText>
          </Animated.View>

          {/* Segmented toggle login / signup */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentButton, isLogin ? styles.segmentActive : undefined]}
              onPress={() => !isLogin && toggleAuthMode()}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.segmentText, isLogin ? styles.segmentTextActive : undefined]}>Connexion</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, !isLogin ? styles.segmentActive : undefined]}
              onPress={() => isLogin && toggleAuthMode()}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.segmentText, !isLogin ? styles.segmentTextActive : undefined]}>Inscription</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Formulaire */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlideAnim }]
              }
            ]}
          >
            <View style={styles.formCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.formGradient}
              >
                <View style={styles.inputContainer}>
                  {/* Nom complet */}
                  {!isLogin && (
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="person" size={20} color={primaryColor} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          focusedField === 'fullName' ? styles.inputFocused : undefined,
                          errors.fullName ? styles.inputError : undefined,
                        ]}
                        placeholder="Nom complet"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        onFocus={() => setFocusedField('fullName')}
                        onBlur={() => setFocusedField(null)}
                      />
                      {errors.fullName ? <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText> : null}
                    </View>
                  )}

                  {/* Email */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIcon}>
                      <Ionicons name="mail" size={20} color={primaryColor} />
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'email' ? styles.inputFocused : undefined,
                        errors.email ? styles.inputError : undefined,
                      ]}
                      placeholder="Adresse email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                    {errors.email ? <ThemedText style={styles.errorText}>{errors.email}</ThemedText> : null}
                  </View>

                  {/* Mot de passe */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIcon}>
                      <Ionicons name="lock-closed" size={20} color={primaryColor} />
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'password' ? styles.inputFocused : undefined,
                        errors.password ? styles.inputError : undefined,
                      ]}
                      placeholder="Mot de passe"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                    {errors.password ? <ThemedText style={styles.errorText}>{errors.password}</ThemedText> : null}
                  </View>

                  {/* Confirmation */}
                  {!isLogin && (
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="lock-closed" size={20} color={primaryColor} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          focusedField === 'confirmPassword' ? styles.inputFocused : undefined,
                          errors.confirmPassword ? styles.inputError : undefined,
                        ]}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor="#9CA3AF"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                      {errors.confirmPassword ? <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText> : null}
                    </View>
                  )}
                </View>

                {/* Bouton principal */}
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#2633E1', '#2633E1']}
                    style={styles.authButtonGradient}
                  >
                    {loading ? (
                      <Animated.View style={styles.loadingContainer}>
                        <Ionicons name="refresh" size={20} color="white" />
                        <ThemedText style={styles.authButtonText}>
                          {isLogin ? 'Connexion...' : 'Création...'}
                        </ThemedText>
                      </Animated.View>
                    ) : (
                      <>
                        <Ionicons 
                          name={isLogin ? 'log-in' : 'person-add'} 
                          size={20} 
                          color="white" 
                        />
                        <ThemedText style={styles.authButtonText}>
                          {isLogin ? 'Se connecter' : 'Créer un compte'}
                        </ThemedText>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Lien toggle */}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={toggleAuthMode}
                >
                  <ThemedText style={styles.toggleButtonText}>
                    {isLogin 
                      ? 'Pas encore de compte ? Créer un compte' 
                      : 'Déjà un compte ? Se connecter'
                    }
                  </ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 20,
    position: 'relative',
    top: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    position: 'relative',
    top: 20,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 6,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
  segmentTextActive: {
    color: 'white',
  },
  formContainer: {
    marginBottom: 12,
  },
  formCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  formGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    paddingLeft: 52,
    paddingRight: 52,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFocused: {
    borderColor: '#2633E1',
    shadowColor: '#2633E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    position: 'absolute',
    left: 16,
    bottom: -20,
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  authButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 12,
  },
  authButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});