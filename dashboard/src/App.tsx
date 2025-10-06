import { useEffect, useState } from 'react'
import './App.css'
import {
  BrandsPieChart,
  EngagementChart,
  GrowthChart,
  SignalizationsChart,
  SignalizationTypesChart
} from './components/Charts'
import ConversationsTable from './components/ConversationsTable'
import Header from './components/Header'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import SignalizationsTable from './components/SignalizationsTable'
import { supabase } from './lib/supabase'
import { AdminService } from './services/adminService'

// Types définis localement pour éviter les problèmes d'import
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

type Conversation = {
  id: string;
  vehicle_id: string | null;
  reporter_id: string | null;
  owner_id: string | null;
  status: 'active' | 'resolved' | 'archived' | string;
  created_at: string;
}

interface DashboardStats {
  totalVehicles: number
  totalUsers: number
  totalConversations: number
  totalMessages: number
  totalSignalizations: number
  totalNotificationTokens: number
  totalQRCodes: number
  activeConversations: number
  resolvedConversations: number
  newVehiclesThisWeek: number
  newUsersThisMonth: number
  avgMessagesPerConversation: number
}

function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [signalizations, setSignalizations] = useState<unknown[]>([])
  const [notificationTokens, setNotificationTokens] = useState<unknown[]>([])
  const [popularBrands, setPopularBrands] = useState<unknown[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [signalizationsByDay, setSignalizationsByDay] = useState<unknown[]>([])
  const [signalizationTypes, setSignalizationTypes] = useState<unknown[]>([])
  const [engagementByHour, setEngagementByHour] = useState<unknown[]>([])
  const [growthStats, setGrowthStats] = useState<Record<string, unknown>>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'users' | 'conversations' | 'signalizations' | 'analytics' | 'charts'>('overview')
  const [, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setSessionReady(true)
      if (session) {
        loadDashboardData()
      }
    })
    // Initial check
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
      setSessionReady(true)
      if (data.session) {
        loadDashboardData()
      }
    })
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, vehiclesData, usersData] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getAllVehicles(),
        AdminService.getAllUsers()
      ])
      
      setStats(statsData)
      setVehicles(vehiclesData)
      setUsers(usersData)

      // Charger les données optionnelles
      try {
        const signalizationsData = await AdminService.getSignalizationsWithNames()
        setSignalizations(signalizationsData)
      } catch (_error) {
        console.log('Signalizations non disponibles')
        setSignalizations([])
      }

      try {
        const tokensData = await AdminService.getNotificationTokens()
        setNotificationTokens(tokensData)
      } catch (_error) {
        console.log('Tokens non disponibles')
        setNotificationTokens([])
      }

      try {
        const convData = await AdminService.getAllConversationsWithNames()
        setConversations(convData)
      } catch (_error) {
        console.log('Conversations non disponibles')
        setConversations([])
      }

      try {
        const brandsData = await AdminService.getPopularBrands()
        setPopularBrands(brandsData)
      } catch (_error) {
        console.log('Brands non disponibles')
        setPopularBrands([])
      }

      // Charger les données pour les graphiques
      try {
        const [signalsByDay, signalTypes, engagement, growth] = await Promise.all([
          AdminService.getSignalizationsByDay(7),
          AdminService.getSignalizationTypes(),
          AdminService.getEngagementByHour(7),
          AdminService.getGrowthStats()
        ])
        setSignalizationsByDay(signalsByDay)
        setSignalizationTypes(signalTypes)
        setEngagementByHour(engagement)
        setGrowthStats(growth)
      } catch (_error) {
        console.log('Données graphiques non disponibles')
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await AdminService.deleteVehicle(vehicleId)
        await loadDashboardData() // Recharger les données
        alert('Véhicule supprimé avec succès')
      } catch (_error) {
        alert('Erreur lors de la suppression')
      }
    }
  }

  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: boolean) => {
    try {
      await AdminService.toggleVehicleStatus(vehicleId, !currentStatus)
      await loadDashboardData() // Recharger les données
    } catch (_error) {
      alert('Erreur lors de la mise à jour')
    }
  }

  if (!sessionReady) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement…</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login onSuccess={() => loadDashboardData()} />
  }

  return (
    <div className="dashboard">
      <Header onRefresh={loadDashboardData} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      <main className="main">
        {activeTab === 'overview' && stats && (
          <div className="overview">
            <h2> Statistiques Générales</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🚗</div>
                <div className="stat-info">
                  <h3>{stats.totalVehicles}</h3>
                  <p>Véhicules enregistrés</p>
                  <small>+{stats.newVehiclesThisWeek} cette semaine</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>Utilisateurs actifs</p>
                  <small>+{stats.newUsersThisMonth} ce mois</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <h3>{stats.totalConversations}</h3>
                  <p>Conversations totales</p>
                  <small>{stats.activeConversations} actives</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.resolvedConversations}</h3>
                  <p>Conversations résolues</p>
                  <small>{stats.avgMessagesPerConversation} msg/conv</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📨</div>
                <div className="stat-info">
                  <h3>{stats.totalMessages}</h3>
                  <p>Messages échangés</p>
                  <small>Communication active</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-info">
                  <h3>{stats.totalSignalizations}</h3>
                  <p>Signalisations</p>
                  <small>Signalements reçus</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📱</div>
                <div className="stat-info">
                  <h3>{stats.totalNotificationTokens}</h3>
                  <p>Tokens notifications</p>
                  <small>Appareils connectés</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔗</div>
                <div className="stat-info">
                  <h3>{stats.totalQRCodes}</h3>
                  <p>QR Codes générés</p>
                  <small>Codes uniques</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="vehicles">
            <h2> Gestion des Véhicules</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Marque/Modèle</th>
                    <th>Année</th>
                    <th>Plaque</th>
                    <th>Propriétaire</th>
                    <th>Statut</th>
                    <th>Date création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.brand} {vehicle.model}</td>
                      <td>{vehicle.year}</td>
                      <td>{vehicle.license_plate}</td>
                      <td>{vehicle.owner_id.substring(0, 8)}...</td>
                      <td>
                        <span className={`status ${vehicle.is_active ? 'active' : 'inactive'}`}>
                          {vehicle.is_active ? '✅ Actif' : '❌ Inactif'}
                        </span>
                      </td>
                      <td>{new Date(vehicle.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <button 
                          onClick={() => handleToggleVehicleStatus(vehicle.id, vehicle.is_active)}
                          className="action-btn"
                        >
                          {vehicle.is_active ? '🔄 Désactiver' : '✅ Activer'}
                        </button>
                        <button 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="action-btn delete"
                        >
                          🗑️ Supprimer
        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users">
            <h2> Gestion des Utilisateurs</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>ID</th>
                    <th>Vérifié</th>
                    <th>Date inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.id.substring(0, 8)}...</td>
                      <td>
                        <span className={`status ${user.email_verified ? 'verified' : 'unverified'}`}>
                          {user.email_verified ? '✅ Vérifié' : '❌ Non vérifié'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'conversations' && (
          <ConversationsTable conversations={conversations} />
        )}

        {activeTab === 'signalizations' && (
          <SignalizationsTable signalizations={signalizations} />
        )}

        {activeTab === 'analytics' && (
          <div className="analytics">
            <h2>📊 Analytics et Insights</h2>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>🏆 Marques Populaires</h3>
                <div className="brands-list">
                  {popularBrands.map((brand, index) => (
                    <div key={index} className="brand-item">
                      <span className="brand-name">{brand.brand}</span>
                      <span className="brand-count">{brand.count} véhicules</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <h3>📱 Notifications</h3>
                <div className="notification-stats">
                  <div className="stat-item">
                    <span>Tokens actifs:</span>
                    <strong>{notificationTokens.length}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Appareils connectés:</span>
                    <strong>{stats?.totalNotificationTokens || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>💬 Engagement</h3>
                <div className="engagement-stats">
                  <div className="stat-item">
                    <span>Messages par conversation:</span>
                    <strong>{stats?.avgMessagesPerConversation || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Taux de résolution:</span>
                    <strong>
                      {(stats?.totalConversations ?? 0) > 0 ? 
                        Math.round(((stats?.resolvedConversations ?? 0) / (stats?.totalConversations ?? 1)) * 100) : 0
                      }%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>📈 Croissance</h3>
                <div className="growth-stats">
                  <div className="stat-item">
                    <span>Nouveaux véhicules (7j):</span>
                    <strong>+{stats?.newVehiclesThisWeek || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Nouveaux utilisateurs (30j):</span>
                    <strong>+{stats?.newUsersThisMonth || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts">
            <h2>📈 Graphiques et Visualisations</h2>
            
            <div className="charts-grid">
              <div className="chart-section">
                <SignalizationsChart data={signalizationsByDay} />
              </div>
              
              <div className="chart-section">
                <SignalizationTypesChart data={signalizationTypes} />
              </div>
              
              <div className="chart-section">
                <BrandsPieChart data={popularBrands} />
              </div>
              
              <div className="chart-section">
                <EngagementChart data={engagementByHour} />
              </div>
              
              <div className="chart-section">
                <GrowthChart data={growthStats} />
              </div>
            </div>

            {/* Section d'insights avancés */}
            <div className="insights-section">
              <h3>🔍 Insights Avancés</h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-icon">🚨</div>
                  <div className="insight-content">
                    <h4>Signalisations Récentes</h4>
                    <p>
                      {signalizationsByDay.length > 0 
                        ? `${signalizationsByDay.reduce((sum, day) => sum + day.total, 0)} signalisations sur 7 jours`
                        : 'Aucune donnée disponible'
                      }
                    </p>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">⏰</div>
                  <div className="insight-content">
                    <h4>Heure de Pic</h4>
                    <p>
                      {engagementByHour.length > 0 
                        ? `Heure la plus active: ${engagementByHour.reduce((max, hour) => 
                            hour.messages > max.messages ? hour : max
                          ).hour}`
                        : 'Aucune donnée disponible'
                      }
                    </p>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">📊</div>
                  <div className="insight-content">
                    <h4>Croissance</h4>
                    <p>
                      {growthStats.weeklyGrowth !== undefined 
                        ? `Croissance hebdomadaire: ${growthStats.weeklyGrowth}%`
                        : 'Calcul en cours...'
                      }
        </p>
      </div>
                </div>

                <div className="insight-card">
                  <div className="insight-icon">🏆</div>
                  <div className="insight-content">
                    <h4>Marque Leader</h4>
                    <p>
                      {popularBrands.length > 0 
                        ? `${popularBrands[0].brand} avec ${popularBrands[0].count} véhicules`
                        : 'Aucune donnée disponible'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App