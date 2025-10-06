import { supabase } from '../lib/supabase';

// Types définis localement
type Vehicle = {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  color?: string;
  notes?: string;
  owner_id: string;
  qr_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type User = {
  id: string;
  email: string;
  created_at: string;
  email_verified: boolean;
}

export class AdminService {
  // Récupérer toutes les statistiques du dashboard
  static async getDashboardStats() {
    try {
      const [
        vehiclesResult, 
        usersResult, 
        conversationsResult, 
        messagesResult
      ] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('user_profiles').select('*'),
        supabase.from('conversations').select('*'),
        supabase.from('messages').select('*')
      ])

      // Requêtes optionnelles avec gestion d'erreur (ne stocke que les compteurs)
      let totalSignalizations = 0
      let totalNotificationTokens = 0
      let totalQRCodes = 0

      try {
        const { data } = await supabase.from('signalizations').select('id')
        totalSignalizations = data?.length || 0
      } catch (error) {
        console.log('Table signalizations non trouvée')
      }

      try {
        const { data } = await supabase.from('notification_tokens').select('id')
        totalNotificationTokens = data?.length || 0
      } catch (error) {
        console.log('Table notification_tokens non trouvée')
      }

      try {
        const { data } = await supabase.from('qr_codes').select('id')
        totalQRCodes = data?.length || 0
      } catch (error) {
        console.log('Table qr_codes non trouvée')
      }

      // Calculer les statistiques avancées
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      const newVehiclesThisWeek = vehiclesResult.data?.filter(v => 
        new Date(v.created_at) > lastWeek
      ).length || 0

      const newUsersThisMonth = usersResult.data?.filter(u => 
        new Date(u.created_at) > lastMonth
      ).length || 0

      const activeConversations = conversationsResult.data?.filter(c => c.status === 'active').length || 0
      const resolvedConversations = conversationsResult.data?.filter(c => c.status === 'resolved').length || 0

      const conversationsCount = conversationsResult.data?.length ?? 0
      return {
        totalVehicles: vehiclesResult.data?.length || 0,
        totalUsers: usersResult.data?.length || 0,
        totalConversations: conversationsCount,
        totalMessages: messagesResult.data?.length || 0,
        totalSignalizations: totalSignalizations,
        totalNotificationTokens: totalNotificationTokens,
        totalQRCodes: totalQRCodes,
        activeConversations,
        resolvedConversations,
        newVehiclesThisWeek,
        newUsersThisMonth,
        avgMessagesPerConversation: conversationsCount > 0 
          ? Math.round((messagesResult.data?.length || 0) / conversationsCount) 
          : 0
      }
    } catch (error) {
      console.error('Erreur récupération stats:', error)
      throw error
    }
  }

  // Récupérer tous les véhicules
  static async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération véhicules:', error)
      throw error
    }
  }

  // Récupérer tous les utilisateurs
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
      throw error
    }
  }

  // Récupérer toutes les conversations (sans jointures pour compatibilité schéma)
  static async getAllConversations() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération conversations:', error)
      return []
    }
  }

  // Récupérer les conversations enrichies avec emails utilisateurs et plaque
  static async getAllConversationsWithNames() {
    try {
      const conversations = await this.getAllConversations()
      if (!conversations || conversations.length === 0) return []

      // Collecter les IDs uniques
      const userIds = Array.from(new Set(
        conversations.flatMap((c: any) => [c.reporter_id, c.owner_id]).filter(Boolean)
      )) as string[]

      const vehicleIds = Array.from(new Set(
        conversations.map((c: any) => c.vehicle_id).filter(Boolean)
      )) as string[]

      // Récupérer profils
      const [usersRes, vehiclesRes] = await Promise.all([
        userIds.length > 0 
          ? supabase.from('user_profiles').select('id,email,full_name,display_name').in('id', userIds)
          : Promise.resolve({ data: [] as any[] }),
        vehicleIds.length > 0
          ? supabase.from('vehicles').select('id,license_plate').in('id', vehicleIds)
          : Promise.resolve({ data: [] as any[] })
      ])

      const users = (usersRes as any).data || []
      const vehicles = (vehiclesRes as any).data || []

      const userById = new Map<string, string>()
      users.forEach((u: any) => userById.set(u.id, u.display_name || u.full_name || u.email))

      const vehicleById = new Map<string, string>()
      vehicles.forEach((v: any) => vehicleById.set(v.id, v.license_plate))

      // Mapper conversations enrichies
      return conversations.map((c: any) => ({
        ...c,
        reporterEmail: c.reporter_id ? (userById.get(c.reporter_id) || c.reporter_id) : null,
        ownerEmail: c.owner_id ? (userById.get(c.owner_id) || c.owner_id) : null,
        vehiclePlate: c.vehicle_id ? (vehicleById.get(c.vehicle_id) || c.vehicle_id) : null,
      }))
    } catch (error) {
      console.error('Erreur enrichissement conversations:', error)
      return []
    }
  }

  // Récupérer les messages d'une conversation
  static async getConversationMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération messages:', error)
      throw error
    }
  }

  // Supprimer un véhicule
  static async deleteVehicle(vehicleId: string) {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur suppression véhicule:', error)
      throw error
    }
  }

  // Désactiver/Activer un véhicule
  static async toggleVehicleStatus(vehicleId: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: isActive })
        .eq('id', vehicleId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur mise à jour statut véhicule:', error)
      throw error
    }
  }

  // Archiver une conversation
  static async archiveConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur archivage conversation:', error)
      throw error
    }
  }

  // Récupérer les signalisations (liste simple, on joindra côté UI si besoin)
  static async getSignalizations() {
    try {
      const { data, error } = await supabase
        .from('signalizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération signalisations:', error)
      return []
    }
  }

  // Signalisations enrichies: emails et plaque
  static async getSignalizationsWithNames() {
    try {
      const signals = await this.getSignalizations()
      if (!signals || signals.length === 0) return []

      const userIds = Array.from(new Set(
        signals.map((s: any) => s.reporter_id).filter(Boolean)
      )) as string[]

      const vehicleIds = Array.from(new Set(
        signals.map((s: any) => s.vehicle_id).filter(Boolean)
      )) as string[]

      let users: any[] = []
      let vehicles: any[] = []
      try {
        if (userIds.length > 0) {
          const { data } = await supabase.from('user_profiles').select('id,email').in('id', userIds)
          users = data || []
        }
      } catch (e) {
        console.warn('Lecture user_profiles refusée par RLS (fallback à IDs)')
      }
      try {
        if (vehicleIds.length > 0) {
          const { data } = await supabase.from('vehicles').select('id,license_plate').in('id', vehicleIds)
          vehicles = data || []
        }
      } catch (e) {
        console.warn('Lecture vehicles refusée par RLS (fallback à IDs)')
      }

      const userById = new Map<string, string>()
      users.forEach((u: any) => userById.set(u.id, u.email))

      const vehicleById = new Map<string, string>()
      vehicles.forEach((v: any) => vehicleById.set(v.id, v.license_plate))

      return signals.map((s: any) => ({
        ...s,
        reporterEmail: s.reporter_id ? (userById.get(s.reporter_id) || s.reporter_id) : null,
        vehiclePlate: s.vehicle_id ? (vehicleById.get(s.vehicle_id) || s.vehicle_id) : null,
      }))
    } catch (error) {
      console.error('Erreur enrichissement signalisations:', error)
      return []
    }
  }

  // Récupérer les tokens de notification
  static async getNotificationTokens() {
    try {
      const { data, error } = await supabase
        .from('notification_tokens')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération tokens:', error)
      return []
    }
  }

  // Récupérer les statistiques par période
  static async getPeriodStats(days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const [vehiclesResult, usersResult, conversationsResult, messagesResult] = await Promise.all([
        supabase.from('vehicles').select('created_at').gte('created_at', startDate),
        supabase.from('user_profiles').select('created_at').gte('created_at', startDate),
        supabase.from('conversations').select('created_at').gte('created_at', startDate),
        supabase.from('messages').select('created_at').gte('created_at', startDate)
      ])

      // Grouper par jour
      const statsByDay: Record<string, { date: string; vehicles: number; users: number; conversations: number; messages: number }> = {}
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        statsByDay[dateStr] = {
          date: dateStr,
          vehicles: 0,
          users: 0,
          conversations: 0,
          messages: 0
        }
      }

      // Compter les données par jour
      vehiclesResult.data?.forEach((v: { created_at: string }) => {
        const date = v.created_at.split('T')[0]
        if (statsByDay[date]) statsByDay[date].vehicles++
      })

      usersResult.data?.forEach((u: { created_at: string }) => {
        const date = u.created_at.split('T')[0]
        if (statsByDay[date]) statsByDay[date].users++
      })

      conversationsResult.data?.forEach((c: { created_at: string }) => {
        const date = c.created_at.split('T')[0]
        if (statsByDay[date]) statsByDay[date].conversations++
      })

      messagesResult.data?.forEach((m: { created_at: string }) => {
        const date = m.created_at.split('T')[0]
        if (statsByDay[date]) statsByDay[date].messages++
      })

      return Object.values(statsByDay).reverse()
    } catch (error) {
      console.error('Erreur récupération stats période:', error)
      throw error
    }
  }

  // Récupérer les marques de véhicules les plus populaires
  static async getPopularBrands() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('brand')

      if (error) {
        console.error('Erreur récupération marques populaires:', error)
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      const brandCounts: Record<string, number> = {}
      data.forEach((vehicle: { brand: string | null }) => {
        const brand = vehicle.brand || 'Non spécifiée'
        brandCounts[brand] = (brandCounts[brand] || 0) + 1
      })

      return (Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => (Number(b.count) - Number(a.count)))
        .slice(0, 10)
      )
    } catch (error) {
      console.error('Erreur récupération marques populaires:', error)
      return []
    }
  }

  // Récupérer les signalisations des derniers jours
  static async getSignalizationsByDay(days: number = 7) {
    try {
      const { data, error } = await supabase
        .from('signalizations')
        .select('created_at, type, urgency')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        console.log('Table signalizations non trouvée')
        return []
      }

      // Grouper par jour
      const dailyStats: Record<string, { date: string; dayName: string; total: number; urgent: number; normal: number; types: Record<string, number> }> = {}
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
        dailyStats[dateStr] = {
          date: dateStr,
          dayName,
          total: 0,
          urgent: 0,
          normal: 0,
          types: {}
        }
      }

      // Compter les signalisations par jour
      data?.forEach((signal: { created_at: string; urgency?: string | null; type?: string | null }) => {
        const date = signal.created_at.split('T')[0]
        if (dailyStats[date]) {
          dailyStats[date].total++
          if (signal.urgency === 'urgent') {
            dailyStats[date].urgent++
          } else {
            dailyStats[date].normal++
          }
          
          // Compter par type
          const type = signal.type || 'autre'
          dailyStats[date].types[type] = (dailyStats[date].types[type] || 0) + 1
        }
      })

      return Object.values(dailyStats).reverse()
    } catch (error) {
      console.error('Erreur récupération signalisations par jour:', error)
      return []
    }
  }

  // Récupérer les statistiques d'engagement par heure
  static async getEngagementByHour(days: number = 7) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      // Grouper par heure
      const hourlyStats: Record<number, { hour: string; messages: number }> = {}
      for (let hour = 0; hour < 24; hour++) {
        hourlyStats[hour] = {
          hour: `${hour}:00`,
          messages: 0
        }
      }

      // Compter les messages par heure
      data?.forEach((message: { created_at: string }) => {
        const hour = new Date(message.created_at).getHours()
        if (hourlyStats[hour]) {
          hourlyStats[hour].messages++
        }
      })

      return Object.values(hourlyStats)
    } catch (error) {
      console.error('Erreur récupération engagement par heure:', error)
      return []
    }
  }

  // Récupérer les types de signalisations les plus fréquents
  static async getSignalizationTypes() {
    try {
      const { data, error } = await supabase
        .from('signalizations')
        .select('type, urgency')

      if (error) {
        console.log('Table signalizations non trouvée')
        return []
      }

      const typeCounts: Record<string, { total: number; urgent: number; normal: number }> = {}
      data?.forEach((signal: { type?: string | null; urgency?: string | null }) => {
        const type = signal.type || 'non_specifie'
        if (!typeCounts[type]) {
          typeCounts[type] = { total: 0, urgent: 0, normal: 0 }
        }
        typeCounts[type].total++
        if (signal.urgency === 'urgent') {
          typeCounts[type].urgent++
        } else {
          typeCounts[type].normal++
        }
      })

      return Object.entries(typeCounts)
        .map(([type, counts]) => ({
          type,
          ...counts,
          percentage: data.length > 0 ? Math.round((counts.total / data.length) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total)
    } catch (error) {
      console.error('Erreur récupération types signalisations:', error)
      return []
    }
  }

  // Récupérer les statistiques de croissance
  static async getGrowthStats() {
    try {
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)

      const [vehiclesThisWeek, vehiclesLastWeek, vehiclesThisMonth, vehiclesLastMonth] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact' }).gte('created_at', lastWeek.toISOString()),
        supabase.from('vehicles').select('id', { count: 'exact' }).gte('created_at', lastMonth.toISOString()).lt('created_at', lastWeek.toISOString()),
        supabase.from('vehicles').select('id', { count: 'exact' }).gte('created_at', lastMonth.toISOString()),
        supabase.from('vehicles').select('id', { count: 'exact' }).gte('created_at', twoMonthsAgo.toISOString()).lt('created_at', lastMonth.toISOString())
      ])

      const weeklyGrowth = (vehiclesLastWeek.count ?? 0) > 0 ? 
        Math.round((((vehiclesThisWeek.count ?? 0) - (vehiclesLastWeek.count ?? 0)) / (vehiclesLastWeek.count ?? 1)) * 100) : 0

      const monthlyGrowth = (vehiclesLastMonth.count ?? 0) > 0 ? 
        Math.round((((vehiclesThisMonth.count ?? 0) - (vehiclesLastMonth.count ?? 0)) / (vehiclesLastMonth.count ?? 1)) * 100) : 0

      return {
        weeklyGrowth,
        monthlyGrowth,
        vehiclesThisWeek: vehiclesThisWeek.count || 0,
        vehiclesThisMonth: vehiclesThisMonth.count || 0
      }
    } catch (error) {
      console.error('Erreur récupération stats croissance:', error)
      return { weeklyGrowth: 0, monthlyGrowth: 0, vehiclesThisWeek: 0, vehiclesThisMonth: 0 }
    }
  }
}
