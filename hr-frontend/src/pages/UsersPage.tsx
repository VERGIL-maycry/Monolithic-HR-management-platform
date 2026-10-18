import { useState, type FormEvent } from 'react'
import { createUser, type Role } from '../api/client'

export function UsersPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('HR')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const user = await createUser({ email, password, role })
      setSuccess(`Compte créé : ${user.email} (${user.role})`)
      setEmail('')
      setPassword('')
      setRole('HR')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <h1>Comptes utilisateurs</h1>
      <p className="lead">
        Créez un compte sans fiche employé (administrateur ou RH). Pour un collaborateur avec congés et
        département, utilisez plutôt la page Employés.
      </p>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <form className="card-form" onSubmit={handleSubmit}>
        <h2>Nouveau compte</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          Rôle
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="HR">RH</option>
            <option value="ADMIN">Administrateur</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employé</option>
          </select>
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Création…' : 'Créer le compte'}
        </button>
      </form>
    </div>
  )
}
