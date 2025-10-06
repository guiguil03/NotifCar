import { useState } from 'react'
import '../App.css'
import { supabase } from '../lib/supabase'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-title">🔐 Connexion Admin</div>
        <div className="login-subtitle">Accédez à votre dashboard NotifCar</div>
        <div className="form-grid">
          <label>
            <div className="form-label">Email</div>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <div className="form-label">Mot de passe</div>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div style={{ color: 'var(--error)', fontSize: 14 }}>{error}</div>}
          <div className="login-actions">
            <a className="link-muted" href="#" onClick={(e) => e.preventDefault()}>Mot de passe oublié ?</a>
            <button type="submit" className="action-btn" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}


