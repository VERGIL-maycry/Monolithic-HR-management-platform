import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, useHasAnyRole } from '../auth/AuthContext'
import { ROLE_LABEL } from '../lib/labels'
import { Icon, type IconName } from './Icon'

const NAV_ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/leaves', label: 'Mes congés', icon: 'calendar' },
  { to: '/team-leaves', label: 'Équipe', icon: 'users' },
  { to: '/employees', label: 'Employés', icon: 'building' },
  { to: '/departments', label: 'Départements', icon: 'clipboard' },
  { to: '/users', label: 'Comptes', icon: 'shield' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/audit', label: 'Audit', icon: 'clipboard' },
]

export function Layout() {
  const { email, role, unreadCount, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = useHasAnyRole('ADMIN')
  const canManageTeam = useHasAnyRole('MANAGER', 'HR', 'ADMIN')
  const canManageStaff = useHasAnyRole('HR', 'ADMIN')
  const canViewEmployees = useHasAnyRole('HR', 'ADMIN', 'MANAGER')
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const visible = NAV_ITEMS.filter((item) => {
    if (['team-leaves'].includes(item.to.slice(1))) return canManageTeam
    if (item.to === '/employees') return canViewEmployees
    if (['departments', 'audit'].includes(item.to.slice(1))) return canManageStaff
    if (item.to === '/users') return isAdmin
    return true
  })

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <strong>Plateforme RH</strong>
        <button type="button" className="ghost-button menu-toggle" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? 'Fermer' : 'Menu'}
        </button>
      </header>

      {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Fermer le menu" onClick={closeMenu} />}

      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-header">
          <span className="sidebar-logo" aria-hidden="true">
            HR
          </span>
          <h2>Plateforme RH</h2>
        </div>

        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">
            {(email ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className="sidebar-user-info">
            <span className="sidebar-meta">{email}</span>
            {role && <span className="sidebar-role">{ROLE_LABEL[role]}</span>}
          </span>
        </div>

        <nav className="sidebar-nav" onClick={closeMenu}>
          {visible.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon name={icon} />
              <span>{label}</span>
              {to === '/notifications' && unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <Icon name="logout" />
          Se déconnecter
        </button>
      </aside>

      <section className="content">
        <Outlet />
      </section>
    </div>
  )
}
