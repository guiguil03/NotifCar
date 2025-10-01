import { supabase } from './supabase';

// Service de profil de secours qui utilise les métadonnées utilisateur
export class ProfileServiceFallback {
  /**
   * Obtenir le nom d'affichage pour les messages (version fallback)
   */
  static async getDisplayNameForMessage(userId: string): Promise<string> {
    try {
      // Essayer d'abord la table user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('public_display_name, show_real_name, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (profile) {
        if (profile.show_real_name && profile.first_name) {
          const lastName = profile.last_name ? ` ${profile.last_name.charAt(0)}.` : '';
          return `${profile.first_name}${lastName}`;
        }
        return profile.public_display_name || 'Utilisateur NotifCar';
      }
    } catch (error) {
      console.log('Table user_profiles non disponible, utilisation fallback');
    }

    // Fallback : utiliser les données auth
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) {
        // C'est l'utilisateur connecté
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          // Extraire le prénom
          const firstName = fullName.split(' ')[0];
          return firstName || 'Utilisateur NotifCar';
        }
        return user.email?.split('@')[0] || 'Utilisateur NotifCar';
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
    }

    return 'Utilisateur NotifCar';
  }

  /**
   * Vérifier si la table user_profiles existe
   */
  static async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }
}
