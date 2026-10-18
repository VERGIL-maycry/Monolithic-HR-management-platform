import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { HomePage } from '../HomePage'
import { renderWithRouter } from '../../test-utils'

// ── Auth state ───────────────────────────────────────────────────────────────
const authState = vi.hoisted(() => ({
  role: null as string | null,
  email: 'alice@example.com',
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    role: authState.role,
    email: authState.email,
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

// ── API mock return values (read lazily via mockImplementation) ───────────────
const apiReturn = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  profileError: null as Error | null,
  balance: null as Record<string, unknown> | null,
  leaves: [] as Array<Record<string, unknown>>,
  unreadCount: 0,
}))

vi.mock('../../api/client', () => ({
  getAccessToken: () => 'mock-token',
  getEmailFromToken: () => authState.email,
  clearTokens: vi.fn(),
  setAuthExpiredHandler: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchUnreadCount: vi.fn().mockImplementation(() => Promise.resolve(apiReturn.unreadCount)),
  fetchMyEmployee: vi.fn().mockImplementation(() => {
    if (apiReturn.profileError) return Promise.reject(apiReturn.profileError)
    return Promise.resolve(apiReturn.profile)
  }),
  fetchMyBalance: vi.fn().mockImplementation(() => Promise.resolve(apiReturn.balance)),
  fetchMyLeaves: vi.fn().mockImplementation(() => Promise.resolve(apiReturn.leaves)),
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

// ── Helper ───────────────────────────────────────────────────────────────────
function renderHome() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/leaves" element={<div>Leaves Page</div>} />
      <Route path="/team-leaves" element={<div>Team Leaves Page</div>} />
      <Route path="/employees" element={<div>Employees Page</div>} />
      <Route path="/departments" element={<div>Departments Page</div>} />
      <Route path="/notifications" element={<div>Notifications Page</div>} />
    </Routes>,
    { initialEntries: ['/'] },
  )
}

/** Wait for profile to load (all API calls fire in parallel in useEffect) */
async function waitForProfile() {
  await waitFor(() => {
    expect(screen.getByText('Mon profil')).toBeInTheDocument()
  })
}

const MOCK_PROFILE = {
  id: 'emp-1',
  employeeCode: 'EMP001',
  firstName: 'Alice',
  lastName: 'Martin',
  email: 'alice@example.com',
  role: 'HR' as const,
  phone: '06 12 34 56 78',
  hireDate: '2023-06-15',
  departmentId: 'dept-1',
  departmentName: 'Ressources Humaines',
  managerId: null,
  managerFullName: null,
}

const MOCK_BALANCE = {
  id: 'bal-1',
  employeeId: 'emp-1',
  employeeFullName: 'Alice Martin',
  year: 2026,
  totalDays: 25,
  usedDays: 7,
  remainingDays: 18,
}

const MOCK_LEAVES = [
  {
    id: 'l1',
    employeeId: 'emp-1',
    employeeFullName: 'Alice Martin',
    employeeCode: 'EMP001',
    startDate: '2026-03-01',
    endDate: '2026-03-05',
    days: 5,
    type: 'PAID_LEAVE' as const,
    reason: 'Vacances',
    status: 'APPROVED' as const,
    createdAt: '2026-02-20T10:00:00',
    managerComment: null,
  },
  {
    id: 'l2',
    employeeId: 'emp-1',
    employeeFullName: 'Alice Martin',
    employeeCode: 'EMP001',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    days: 2,
    type: 'SICK_LEAVE' as const,
    reason: 'Grippe',
    status: 'PENDING' as const,
    createdAt: '2026-07-01T08:00:00',
    managerComment: null,
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────
describe('HomePage', () => {
  beforeEach(() => {
    authState.role = 'HR'
    authState.email = 'alice@example.com'
    apiReturn.profile = MOCK_PROFILE
    apiReturn.profileError = null
    apiReturn.balance = MOCK_BALANCE
    apiReturn.leaves = MOCK_LEAVES
    apiReturn.unreadCount = 3
  })

  describe('greeting', () => {
    it('shows profile name when profile is loaded', async () => {
      renderHome()
      await waitForProfile()
      expect(screen.getByText(/Alice Martin/)).toBeInTheDocument()
    })

    it('shows role label next to greeting', async () => {
      renderHome()
      await waitForProfile()
      expect(screen.getByText(/RH/)).toBeInTheDocument()
    })

    it('falls back to email when profile fails to load', async () => {
      apiReturn.profileError = new Error('Not found')
      renderHome()
      await waitFor(() => {
        expect(screen.getByText(/alice@example.com/)).toBeInTheDocument()
      })
    })

    it('shows error message when profile fetch fails', async () => {
      apiReturn.profileError = new Error('Not found')
      renderHome()
      await waitFor(() => {
        expect(screen.getByText(/Not found/)).toBeInTheDocument()
      })
    })

    it('shows hint text for admin/HR without employee profile', async () => {
      apiReturn.profileError = new Error('Not found')
      renderHome()
      await waitFor(() => {
        expect(screen.getByText(/Un compte admin ou RH/)).toBeInTheDocument()
      })
    })
  })

  describe('stat cards', () => {
    it('shows remaining leave balance', async () => {
      renderHome()
      await waitForProfile()
      expect(screen.getByText('18 j')).toBeInTheDocument()
    })

    it('shows used/total balance breakdown', async () => {
      renderHome()
      await waitForProfile()
      expect(screen.getByText('7 utilisés / 25')).toBeInTheDocument()
    })

    it('shows pending leaves count', async () => {
      renderHome()
      await waitForProfile()
      const pendingCard = screen.getByText('Demandes en attente').closest('article')!
      expect(pendingCard).toHaveTextContent('1')
    })

    it('shows approved leaves count', async () => {
      renderHome()
      await waitForProfile()
      const approvedCard = screen.getByText('Congés acceptés').closest('article')!
      expect(approvedCard).toHaveTextContent('1')
    })

    it('shows unread notification count', async () => {
      renderHome()
      await waitForProfile()
      const notifCard = screen.getByText('Notifications').closest('article')!
      expect(notifCard).toHaveTextContent('3')
    })

    it('shows dash for balance when profile is missing', async () => {
      apiReturn.profileError = new Error('Not found')
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument()
      })
    })
  })

  describe('profile section', () => {
    it('shows profile details when loaded', async () => {
      renderHome()
      await waitForProfile()
      expect(screen.getByText('EMP001')).toBeInTheDocument()
      expect(screen.getByText('Ressources Humaines')).toBeInTheDocument()
      expect(screen.getByText('06 12 34 56 78')).toBeInTheDocument()
      expect(screen.getByText('2023-06-15')).toBeInTheDocument()
    })

    it('shows dash for null manager', async () => {
      renderHome()
      await waitForProfile()
      const managerSection = screen.getByText('Manager').parentElement!
      expect(managerSection).toHaveTextContent('—')
    })

    it('shows manager name when assigned', async () => {
      apiReturn.profile = { ...MOCK_PROFILE, managerFullName: 'Bob Dupont' }
      renderHome()
      await waitForProfile()
      expect(screen.getByText('Bob Dupont')).toBeInTheDocument()
    })

    it('hides profile section when profile fails to load', async () => {
      apiReturn.profileError = new Error('Not found')
      renderHome()
      await waitFor(() => {
        expect(screen.queryByText('Mon profil')).not.toBeInTheDocument()
      })
    })
  })

  describe('quick links', () => {
    it('always shows "Déposer un congé"', async () => {
      renderHome()
      await waitForProfile()
      expect(screen.getByText('Déposer un congé')).toBeInTheDocument()
    })

    describe('EMPLOYEE role', () => {
      beforeEach(() => { authState.role = 'EMPLOYEE' })

      it('hides team/employee/departments links', async () => {
        renderHome()
        await waitForProfile()
        expect(screen.queryByRole('link', { name: /équip/ })).not.toBeInTheDocument()
        expect(screen.queryByText('Gérer les employés')).not.toBeInTheDocument()
        expect(screen.queryByText('Départements')).not.toBeInTheDocument()
      })
    })

    describe('MANAGER role', () => {
      beforeEach(() => { authState.role = 'MANAGER' })

      it('shows team and employee links, hides departments', async () => {
        renderHome()
        await waitForProfile()
        expect(screen.getByRole('link', { name: /équip/ })).toBeInTheDocument()
        expect(screen.getByText('Gérer les employés')).toBeInTheDocument()
        expect(screen.queryByText('Départements')).not.toBeInTheDocument()
      })
    })

    describe('HR role', () => {
      beforeEach(() => { authState.role = 'HR' })

      it('shows all quick links', async () => {
        renderHome()
        await waitForProfile()
        expect(screen.getByRole('link', { name: /équip/ })).toBeInTheDocument()
        expect(screen.getByText('Gérer les employés')).toBeInTheDocument()
        expect(screen.getByText('Départements')).toBeInTheDocument()
      })
    })

    describe('ADMIN role', () => {
      beforeEach(() => { authState.role = 'ADMIN' })

      it('shows all quick links', async () => {
        renderHome()
        await waitForProfile()
        expect(screen.getByRole('link', { name: /équip/ })).toBeInTheDocument()
        expect(screen.getByText('Gérer les employés')).toBeInTheDocument()
        expect(screen.getByText('Départements')).toBeInTheDocument()
      })
    })
  })
})
