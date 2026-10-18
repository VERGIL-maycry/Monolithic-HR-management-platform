import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '../Layout'
import { renderWithRouter } from '../../test-utils'

const authState = vi.hoisted(() => ({
  role: null as string | null,
  isAuthenticated: true,
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    role: authState.role,
    email: 'test@example.com',
    unreadCount: 0,
    loginSuccess: async () => {},
    logout: () => {},
    refreshUnread: async () => {},
  }),
  useHasAnyRole: (...roles: string[]) => {
    return authState.role != null && roles.includes(authState.role)
  },
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../api/client', () => ({
  getAccessToken: () => (authState.isAuthenticated ? 'mock-token' : null),
  getEmailFromToken: () => 'test@example.com',
  clearTokens: vi.fn(),
  setAuthExpiredHandler: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchUnreadCount: vi.fn().mockResolvedValue(0),
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

function renderLayout() {
  return renderWithRouter(
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/employees" element={<div>Employees</div>} />
        <Route path="/team-leaves" element={<div>Team Leaves</div>} />
        <Route path="/departments" element={<div>Departments</div>} />
        <Route path="/users" element={<div>Users</div>} />
        <Route path="/audit" element={<div>Audit</div>} />
      </Route>
    </Routes>,
  )
}

const ALL_NAV_LABELS = [
  'Accueil',
  'Mes congés',
  'Équipe',
  'Employés',
  'Départements',
  'Comptes',
  'Notifications',
  'Audit',
]

describe('Layout sidebar navigation', () => {
  beforeEach(() => {
    authState.role = null
    authState.isAuthenticated = true
  })

  describe('EMPLOYEE role', () => {
    beforeEach(() => {
      authState.role = 'EMPLOYEE'
    })

    it('shows only Accueil, Mes congés, Notifications', () => {
      renderLayout()
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Mes congés')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })

    it('hides Employés link', () => {
      renderLayout()
      expect(screen.queryByText('Employés')).not.toBeInTheDocument()
    })

    it('hides Équipe link', () => {
      renderLayout()
      expect(screen.queryByText('Équipe')).not.toBeInTheDocument()
    })

    it('hides Départements link', () => {
      renderLayout()
      expect(screen.queryByText('Départements')).not.toBeInTheDocument()
    })

    it('hides Comptes link', () => {
      renderLayout()
      expect(screen.queryByText('Comptes')).not.toBeInTheDocument()
    })

    it('hides Audit link', () => {
      renderLayout()
      expect(screen.queryByText('Audit')).not.toBeInTheDocument()
    })
  })

  describe('MANAGER role', () => {
    beforeEach(() => {
      authState.role = 'MANAGER'
    })

    it('shows Employés link', () => {
      renderLayout()
      expect(screen.getByText('Employés')).toBeInTheDocument()
    })

    it('shows Équipe link', () => {
      renderLayout()
      expect(screen.getByText('Équipe')).toBeInTheDocument()
    })

    it('hides Départements link', () => {
      renderLayout()
      expect(screen.queryByText('Départements')).not.toBeInTheDocument()
    })

    it('hides Comptes link', () => {
      renderLayout()
      expect(screen.queryByText('Comptes')).not.toBeInTheDocument()
    })

    it('hides Audit link', () => {
      renderLayout()
      expect(screen.queryByText('Audit')).not.toBeInTheDocument()
    })

    it('shows Accueil, Mes congés, Notifications', () => {
      renderLayout()
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Mes congés')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })
  })

  describe('HR role', () => {
    beforeEach(() => {
      authState.role = 'HR'
    })

    it('shows Employés link', () => {
      renderLayout()
      expect(screen.getByText('Employés')).toBeInTheDocument()
    })

    it('shows Équipe link', () => {
      renderLayout()
      expect(screen.getByText('Équipe')).toBeInTheDocument()
    })

    it('shows Départements link', () => {
      renderLayout()
      expect(screen.getByText('Départements')).toBeInTheDocument()
    })

    it('shows Audit link', () => {
      renderLayout()
      expect(screen.getByText('Audit')).toBeInTheDocument()
    })

    it('hides Comptes link', () => {
      renderLayout()
      expect(screen.queryByText('Comptes')).not.toBeInTheDocument()
    })
  })

  describe('ADMIN role', () => {
    beforeEach(() => {
      authState.role = 'ADMIN'
    })

    it('shows all navigation links', () => {
      renderLayout()
      for (const label of ALL_NAV_LABELS) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })

    it('shows Comptes link (admin-only)', () => {
      renderLayout()
      expect(screen.getByText('Comptes')).toBeInTheDocument()
    })
  })
})
