export default function Sidebar({ activeTab, setActiveTab, stats }: { activeTab: string, setActiveTab: (t: any) => void, stats: any }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Navigation</h2>
      </div>
      <nav className="nav">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <span className="nav-icon">📊</span>
          Vue d'ensemble
        </button>
        <button className={activeTab === 'vehicles' ? 'active' : ''} onClick={() => setActiveTab('vehicles')}>
          <span className="nav-icon">🚗</span>
          Véhicules ({stats?.totalVehicles || 0})
        </button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          <span className="nav-icon">👥</span>
          Utilisateurs ({stats?.totalUsers || 0})
        </button>
        <button className={activeTab === 'conversations' ? 'active' : ''} onClick={() => setActiveTab('conversations')}>
          <span className="nav-icon">💬</span>
          Conversations ({stats?.totalConversations || 0})
        </button>
        <button className={activeTab === 'signalizations' ? 'active' : ''} onClick={() => setActiveTab('signalizations')}>
          <span className="nav-icon">🚨</span>
          Signalisations ({stats?.totalSignalizations || 0})
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
          <span className="nav-icon">📈</span>
          Analytics
        </button>
        <button className={activeTab === 'charts' ? 'active' : ''} onClick={() => setActiveTab('charts')}>
          <span className="nav-icon">📊</span>
          Graphiques
        </button>
      </nav>
    </div>
  )
}


