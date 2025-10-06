import { supabase } from '../lib/supabase'

export default function Header({ onRefresh }: { onRefresh: () => void }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <header className="header">
      <h1>NotifCar Admin Dashboard</h1>
      <div className="header-actions" style={{ display: 'flex', gap: 8 }}>
        <button onClick={onRefresh} className="refresh-btn">🔄 Actualiser</button>
        <button onClick={handleSignOut} className="action-btn" style={{ background: 'var(--error)' }}>
          🚪 Déconnexion
        </button>
      </div>
    </header>
  )
}


