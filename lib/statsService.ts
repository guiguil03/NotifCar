import { supabase } from './supabase';

export interface UserStats {
  totalVehicles: number;
  totalSignalizations: number;
  totalReceivedSignalizations: number;
  totalConversations: number;
  activeSignalizations: number;
  resolvedSignalizations: number;
  averageResponseTime: number; // en heures
  lastActivity: string | null;
}

export class StatsService {
  /**
   * Récupérer les statistiques complètes d'un utilisateur
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Récupérer toutes les données en parallèle
      const [
        vehiclesResult,
        sentSignalizationsResult,
        receivedSignalizationsResult,
        conversationsResult,
        activeSignalizationsResult,
        resolvedSignalizationsResult,
        lastActivityResult
      ] = await Promise.all([
        // Nombre total de véhicules
        supabase
          .from('vehicles')
          .select('id', { count: 'exact' })
          .eq('owner_id', userId),

        // Nombre total de signalisations envoyées
        supabase
          .from('signalizations')
          .select('id', { count: 'exact' })
          .eq('reporter_id', userId),

        // Nombre total de signalisations reçues
        supabase
          .from('signalizations')
          .select('id', { count: 'exact' })
          .eq('vehicle_owner_id', userId),

        // Nombre total de conversations
        supabase
          .from('conversations')
          .select('id', { count: 'exact' })
          .or(`owner_id.eq.${userId},reporter_id.eq.${userId}`),

        // Signalisations actives envoyées
        supabase
          .from('signalizations')
          .select('id', { count: 'exact' })
          .eq('reporter_id', userId)
          .eq('status', 'active'),

        // Signalisations résolues envoyées
        supabase
          .from('signalizations')
          .select('id', { count: 'exact' })
          .eq('reporter_id', userId)
          .eq('status', 'resolved'),

        // Dernière activité (dernière signalisation ou conversation)
        supabase
          .from('signalizations')
          .select('created_at')
          .eq('reporter_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      // Calculer le temps de réponse moyen (simulation basée sur les données)
      const averageResponseTime = await this.calculateAverageResponseTime(userId);

      return {
        totalVehicles: vehiclesResult.count || 0,
        totalSignalizations: sentSignalizationsResult.count || 0,
        totalReceivedSignalizations: receivedSignalizationsResult.count || 0,
        totalConversations: conversationsResult.count || 0,
        activeSignalizations: activeSignalizationsResult.count || 0,
        resolvedSignalizations: resolvedSignalizationsResult.count || 0,
        averageResponseTime,
        lastActivity: lastActivityResult.data?.created_at || null
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  }

  /**
   * Calculer le temps de réponse moyen (simulation)
   */
  private static async calculateAverageResponseTime(userId: string): Promise<number> {
    try {
      // Récupérer les conversations avec des messages
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          messages (
            created_at,
            sender_id
          )
        `)
        .or(`owner_id.eq.${userId},reporter_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!conversations || conversations.length === 0) {
        return 0;
      }

      let totalResponseTime = 0;
      let responseCount = 0;

      conversations.forEach(conversation => {
        const messages = conversation.messages || [];
        if (messages.length < 2) return;

        // Trier les messages par date
        messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Calculer les temps de réponse entre messages de différents utilisateurs
        for (let i = 1; i < messages.length; i++) {
          const prevMessage = messages[i - 1];
          const currentMessage = messages[i];

          if (prevMessage.sender_id !== currentMessage.sender_id) {
            const responseTime = new Date(currentMessage.created_at).getTime() - new Date(prevMessage.created_at).getTime();
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      });

      if (responseCount === 0) {
        return 0;
      }

      // Convertir en heures
      return Math.round((totalResponseTime / responseCount) / (1000 * 60 * 60) * 10) / 10;
    } catch (error) {
      console.error('Erreur calcul temps de réponse:', error);
      return 0;
    }
  }

  /**
   * Récupérer les statistiques globales de l'application
   */
  static async getGlobalStats(): Promise<{
    totalUsers: number;
    totalVehicles: number;
    totalSignalizations: number;
    totalConversations: number;
  }> {
    try {
      const [
        usersResult,
        vehiclesResult,
        signalizationsResult,
        conversationsResult
      ] = await Promise.all([
        supabase.auth.admin.listUsers(),
        supabase.from('vehicles').select('id', { count: 'exact' }),
        supabase.from('signalizations').select('id', { count: 'exact' }),
        supabase.from('conversations').select('id', { count: 'exact' })
      ]);

      return {
        totalUsers: usersResult.data?.users?.length || 0,
        totalVehicles: vehiclesResult.count || 0,
        totalSignalizations: signalizationsResult.count || 0,
        totalConversations: conversationsResult.count || 0
      };
    } catch (error) {
      console.error('Erreur récupération statistiques globales:', error);
      throw new Error('Impossible de récupérer les statistiques globales');
    }
  }

  /**
   * Formater la dernière activité
   */
  static formatLastActivity(lastActivity: string | null): string {
    if (!lastActivity) return 'Aucune activité';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 jours
      return `Il y a ${Math.floor(diffInHours / 24)}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  /**
   * Calculer le pourcentage de résolution
   */
  static calculateResolutionRate(active: number, resolved: number): number {
    const total = active + resolved;
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  }
}
