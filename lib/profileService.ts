import { FirebaseAnalyticsService } from './firebaseAnalytics';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  phone_number?: string;
  email?: string;
  preferred_language: string;
  timezone: string;
  avatar_url?: string;
  cover_image_url?: string;
  public_display_name: string;
  show_real_name: boolean;
  show_phone: boolean;
  show_email: boolean;
  notification_preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    new_message_sound: boolean;
    urgent_only: boolean;
  };
  profile_completed: boolean;
  is_verified: boolean;
  verification_date?: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  phone_number?: string;
  email?: string;
  preferred_language?: string;
  timezone?: string;
  avatar_url?: string;
  cover_image_url?: string;
  show_real_name?: boolean;
  show_phone?: boolean;
  show_email?: boolean;
  notification_preferences?: Partial<UserProfile['notification_preferences']>;
}

export class ProfileService {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Erreur récupération profil utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupérer le profil d'un utilisateur par son ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erreur récupération profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur récupération profil utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupérer les informations publiques d'un utilisateur (pour les messages)
   */
  static async getPublicUserInfo(userId: string): Promise<{
    id: string;
    public_display_name: string;
    avatar_url?: string;
    show_real_name: boolean;
    first_name?: string;
    last_name?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, public_display_name, avatar_url, show_real_name, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erreur récupération infos publiques:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur récupération infos publiques:', error);
      return null;
    }
  }

  /**
   * Créer ou mettre à jour le profil utilisateur
   */
  static async updateProfile(profileData: UpdateProfileData): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Vérifier si le profil existe
      const existingProfile = await this.getUserProfile(user.id);

      let result;
      if (existingProfile) {
        // Mettre à jour le profil existant
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Créer un nouveau profil
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            ...profileData,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Log analytics
      FirebaseAnalyticsService.logProfileUpdated();
      
      return result;
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un nom d'utilisateur est disponible
   */
  static async isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username);

      // Exclure l'utilisateur actuel si fourni
      if (currentUserId) {
        query = query.neq('user_id', currentUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur vérification username:', error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Erreur vérification username:', error);
      return false;
    }
  }

  /**
   * Mettre à jour les préférences de notification
   */
  static async updateNotificationPreferences(
    preferences: Partial<UserProfile['notification_preferences']>
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Récupérer les préférences actuelles
      const currentProfile = await this.getUserProfile(user.id);
      if (!currentProfile) return false;

      const updatedPreferences = {
        ...currentProfile.notification_preferences,
        ...preferences,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update({
          notification_preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      FirebaseAnalyticsService.logEvent('notification_preferences_updated', {
        user_id: user.id,
        preferences: Object.keys(preferences),
      });

      return true;
    } catch (error) {
      console.error('Erreur mise à jour préférences notifications:', error);
      return false;
    }
  }

  /**
   * Marquer l'utilisateur comme vu récemment
   */
  static async updateLastSeen(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Erreur mise à jour last seen:', error);
    }
  }

  /**
   * Supprimer le profil utilisateur
   */
  static async deleteProfile(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      FirebaseAnalyticsService.logEvent('profile_deleted', {
        user_id: user.id,
      });

      return true;
    } catch (error) {
      console.error('Erreur suppression profil:', error);
      return false;
    }
  }

  /**
   * Rechercher des utilisateurs par nom
   */
  static async searchUsers(query: string, limit: number = 10): Promise<Array<{
    id: string;
    public_display_name: string;
    avatar_url?: string;
    username?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, public_display_name, avatar_url, username')
        .or(`public_display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error);
      return [];
    }
  }

  /**
   * Obtenir le nom d'affichage pour les messages
   */
  static async getDisplayNameForMessage(userId: string): Promise<string> {
    try {
      const profile = await this.getPublicUserInfo(userId);
      
      if (!profile) {
        return 'Utilisateur NotifCar';
      }

      if (profile.show_real_name && profile.first_name) {
        const lastName = profile.last_name ? ` ${profile.last_name.charAt(0)}.` : '';
        return `${profile.first_name}${lastName}`;
      }

      return profile.public_display_name || 'Utilisateur NotifCar';
    } catch (error) {
      console.error('Erreur récupération nom affichage:', error);
      return 'Utilisateur NotifCar';
    }
  }
}
