import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyBalance,
  fetchMyEmployee,
  fetchMyLeaves,
  fetchUnreadCount,
  type EmployeeResponse,
  type LeaveBalanceResponse,
  type LeaveResponse,
} from '../api/client'
import { useAuth, useHasAnyRole } from '../auth/AuthContext'
import { ROLE_LABEL } from '../lib/labels'

export function HomePage() {
  const { email, role } = useAuth()
  const canManageStaff = useHasAnyRole('HR', 'ADMIN')
  const canManageTeam = useHasAnyRole('MANAGER', 'HR', 'ADMIN')
  const canViewEmployees = useHasAnyRole('HR', 'ADMIN', 'MANAGER')
  const [profile, setProfile] = useState<EmployeeResponse | null>(null)
  const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null)
  const [leaves, setLeaves] = useState<LeaveResponse[]>([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyEmployee()
      .then(setProfile)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Profil employé introuvable')
      })

    fetchMyBalance()
      .then(setBalance)
      .catch(() => setBalance(null))

    fetchMyLeaves()
      .then(setLeaves)
      .catch(() => setLeaves([]))

    fetchUnreadCount()
      .then(setUnread)
      .catch(() => setUnread(0))
  }, [])

  const pending = leaves.filter((leave) => leave.status === 'PENDING').length
  const approved = leaves.filter((leave) => leave.status === 'APPROVED').length

  return (
    <div className="page">
      <h1>Tableau de bord</h1>
      <p className="lead">
        Bonjour <strong>{profile ? `${profile.firstName} ${profile.lastName}` : email}</strong>
        {role ? ` — ${ROLE_LABEL[role]}` : ''}.
      </p>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Solde de congés</span>
          <strong>{balance ? `${balance.remainingDays} j` : '—'}</strong>
          <small>{balance ? `${balance.usedDays} utilisés / ${balance.totalDays}` : 'Fiche employé requise'}</small>
        </article>
        <article className="stat-card">
          <span>Demandes en attente</span>
          <strong>{pending}</strong>
          <Link to="/leaves">Voir mes congés</Link>
        </article>
        <article className="stat-card">
          <span>Congés acceptés</span>
          <strong>{approved}</strong>
          <small>cette année</small>
        </article>
        <article className="stat-card">
          <span>Notifications</span>
          <strong>{unread}</strong>
          <Link to="/notifications">Boîte de réception</Link>
        </article>
      </div>

      {profile ? (
        <section className="panel">
          <h2>Mon profil</h2>
          <dl className="profile-grid">
            <dt>Matricule</dt>
            <dd>{profile.employeeCode}</dd>
            <dt>Département</dt>
            <dd>{profile.departmentName}</dd>
            <dt>Manager</dt>
            <dd>{profile.managerFullName ?? '—'}</dd>
            <dt>Téléphone</dt>
            <dd>{profile.phone ?? '—'}</dd>
            <dt>Date d’embauche</dt>
            <dd>{profile.hireDate}</dd>
          </dl>
        </section>
      ) : (
        <p className="hint">
          {error || 'Chargement du profil…'}
          {error &&
            ' Un compte admin ou RH sans fiche employé peut quand même gérer l’organisation via Employés, Départements et Audit.'}
        </p>
      )}

      <section className="quick-links">
        <Link to="/leaves" className="quick-link">
          Déposer un congé
        </Link>
        {canManageTeam && (
          <Link to="/team-leaves" className="quick-link">
            Valider l’équipe
          </Link>
        )}
        {canViewEmployees && (
          <Link to="/employees" className="quick-link">
            Gérer les employés
          </Link>
        )}
        {canManageStaff && (
          <Link to="/departments" className="quick-link">
            Départements
          </Link>
        )}
      </section>
    </div>
  )
}
