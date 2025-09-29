import { FirebaseAnalyticsService } from '@/lib/firebaseAnalytics';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fonction pour sauvegarder les données utilisateur localement
  const saveUserDataLocally = async (user: User | null) => {
    try {
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      
      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          lastSeen: Date.now(),
        };
        
        if (Platform.OS === 'web') {
          localStorage.setItem('user_data', JSON.stringify(userData));
        } else {
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        }
      } else {
        if (Platform.OS === 'web') {
          localStorage.removeItem('user_data');
        } else {
          await AsyncStorage.removeItem('user_data');
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde données utilisateur:', error);
    }
  };

  // Fonction pour récupérer les données utilisateur locales
  const loadUserDataLocally = async () => {
    try {
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      const userData = Platform.OS === 'web' 
        ? localStorage.getItem('user_data')
        : await AsyncStorage.getItem('user_data');
      
      if (userData) {
        const parsed = JSON.parse(userData);
        // Vérifier que les données ne sont pas trop anciennes (7 jours)
        if (Date.now() - parsed.lastSeen < 7 * 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
      return null;
    }
  };

  // Fonction pour rafraîchir la session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Erreur rafraîchissement session:', error);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await saveUserDataLocally(data.session.user);
      }
    } catch (error) {
      console.error('Erreur rafraîchissement session:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Charger les données utilisateur en cache
        const cachedUser = await loadUserDataLocally();
        if (cachedUser && mounted) {
          console.log('Données utilisateur chargées depuis le cache');
        }

        // 2. Récupérer la session Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Erreur récupération session:', error);
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await saveUserDataLocally(session.user);
            
            // Log Analytics pour session existante
            FirebaseAnalyticsService.logEvent('session_restored', {
              user_id: session.user.id,
              method: 'auto_login'
            });
          }
          
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Sauvegarder les données utilisateur
        await saveUserDataLocally(session?.user ?? null);
        
        // Log Analytics selon l'événement
        if (event === 'SIGNED_IN' && session?.user) {
          FirebaseAnalyticsService.logLogin('email');
          FirebaseAnalyticsService.setUserId(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          FirebaseAnalyticsService.logEvent('user_logout');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'notifcar://reset-password',
    });
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    isInitialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
