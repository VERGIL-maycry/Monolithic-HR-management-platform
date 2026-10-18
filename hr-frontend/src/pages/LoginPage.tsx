import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Icon } from '../components/Icon'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@hr.com', password: 'admin123' },
  { label: 'RH', email: 'rh@entreprise.com', password: 'rh123456' },
  { label: 'Manager', email: 'karim.manager@entreprise.com', password: 'manager123' },
  { label: 'Employé', email: 'sara.employe@entreprise.com', password: 'employe123' },
]

const HIGHLIGHTS = [
  {
    title: 'Congés simplifiés',
    text: 'Déposez vos demandes et suivez leurs validations en temps réel.',
    icon: 'calendar' as const,
  },
  {
    title: 'Vue équipe',
    text: 'Les managers valident les demandes en un clic.',
    icon: 'users' as const,
  },
  {
    title: 'Organisation claire',
    text: 'Employés, départements et audit toujours à jour.',
    icon: 'building' as const,
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loginSuccess } = useAuth()
  const [email, setEmail] = useState('admin@hr.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      await loginSuccess()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-split">
        {/* ── Branded panel ── */}
        <aside className="login-brand">
          <div className="login-brand-header">
            <span className="sidebar-logo" aria-hidden="true">
              HR
            </span>
            <span className="login-brand-name">Plateforme RH</span>
          </div>

          <h1 className="login-brand-title">
            La gestion RH,
            <br />
            <em>enfin simple.</em>
          </h1>
          <p className="login-brand-text">
            Un seul espace pour vos employés, congés et validations — pensé pour les équipes comme pour la direction.
          </p>

          <ul className="login-brand-list">
            {HIGHLIGHTS.map(({ icon, title, text }) => (
              <li key={title}>
                <span className="brand-icon">
                  <Icon name={icon} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </li>
            ))}
          </ul>

          <p className="login-brand-footer">© {new Date().getFullYear()} Plateforme RH</p>
        </aside>

        {/* ── Form panel ── */}
        <section className="login-form-panel">
          <div className="login-card">
            <p className="eyebrow">Espace collaborateur</p>
            <h2>Connexion</h2>
            <p className="login-subtitle">
              Connectez-vous pour gérer les employés, congés et validations.
            </p>

            <form onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                Mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="demo-accounts">
              <p>Comptes de démonstration</p>
              <p className="muted">
                Seul <strong>admin@hr.com</strong> est créé au démarrage du backend. Les autres comptes se créent
                depuis Employés ou Comptes.
              </p>
              <div className="demo-buttons">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(account.password)
                      setError('')
                    }}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
