import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { TeamLeavesPage } from '../TeamLeavesPage'
import { renderWithRouter } from '../../test-utils'

// ── Auth state ───────────────────────────────────────────────────────────────
const authState = vi.hoisted(() => ({
  role: 'MANAGER' as string | null,
  isAuthenticated: true,
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    role: authState.role,
    email: 'manager@example.com',
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

// ── API mock ─────────────────────────────────────────────────────────────────
const apiReturn = vi.hoisted(() => ({
  leaves: [] as Array<Record<string, unknown>>,
  apiError: null as Error | null,
}))

const approveLeaveFn = vi.hoisted(() => vi.fn())
const rejectLeaveFn = vi.hoisted(() => vi.fn())
const fetchTeamLeavesFn = vi.hoisted(() =>
  vi.fn().mockImplementation((status?: string) => {
    if (apiReturn.apiError) return Promise.reject(apiReturn.apiError)
    if (status) {
      return Promise.resolve(
        apiReturn.leaves.filter((l) => l.status === status),
      )
    }
    return Promise.resolve(apiReturn.leaves)
  }),
)

vi.mock('../../api/client', () => ({
  getAccessToken: () => 'mock-token',
  getEmailFromToken: () => 'manager@example.com',
  clearTokens: vi.fn(),
  setAuthExpiredHandler: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchUnreadCount: vi.fn().mockResolvedValue(0),
  fetchTeamLeaves: fetchTeamLeavesFn,
  approveLeave: approveLeaveFn,
  rejectLeave: rejectLeaveFn,
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LEAVES = [
  {
    id: 'l1',
    employeeId: 'emp-1',
    employeeFullName: 'Alice Martin',
    employeeCode: 'EMP001',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    days: 5,
    type: 'PAID_LEAVE',
    reason: 'Vacances été',
    status: 'PENDING',
    createdAt: '2026-07-20T10:00:00',
    managerComment: null,
  },
  {
    id: 'l2',
    employeeId: 'emp-2',
    employeeFullName: 'Bob Dupont',
    employeeCode: 'EMP002',
    startDate: '2026-07-15',
    endDate: '2026-07-16',
    days: 2,
    type: 'SICK_LEAVE',
    reason: 'Grippe',
    status: 'APPROVED',
    createdAt: '2026-07-10T08:00:00',
    managerComment: 'Get well soon',
  },
  {
    id: 'l3',
    employeeId: 'emp-3',
    employeeFullName: 'Claire Bernard',
    employeeCode: 'EMP003',
    startDate: '2026-06-01',
    endDate: '2026-06-03',
    days: 3,
    type: 'UNPAID_LEAVE',
    reason: 'Raisons perso',
    status: 'REJECTED',
    createdAt: '2026-05-25T09:00:00',
    managerComment: 'Période critique',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderTeamLeaves() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<TeamLeavesPage />} />
    </Routes>,
    { initialEntries: ['/'] },
  )
}

async function waitForData() {
  await waitFor(() => {
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('TeamLeavesPage', () => {
  beforeEach(() => {
    authState.role = 'MANAGER'
    apiReturn.leaves = MOCK_LEAVES
    apiReturn.apiError = null
    approveLeaveFn.mockReset()
    rejectLeaveFn.mockReset()
    fetchTeamLeavesFn.mockClear()
    fetchTeamLeavesFn.mockImplementation((status?: string) => {
      if (apiReturn.apiError) return Promise.reject(apiReturn.apiError)
      if (status) {
        return Promise.resolve(
          apiReturn.leaves.filter((l) => l.status === status),
        )
      }
      return Promise.resolve(apiReturn.leaves)
    })
  })

  describe('rendering', () => {
    it('shows page heading', () => {
      renderTeamLeaves()
      expect(screen.getByText('Demandes de l\u2019équipe')).toBeInTheDocument()
    })

    it('shows all 5 filter buttons', () => {
      renderTeamLeaves()
      expect(screen.getByRole('button', { name: 'Toutes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'En attente' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Acceptées' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Refusées' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Annulées' })).toBeInTheDocument()
    })

    it('defaults to PENDING filter (En attente)', async () => {
      renderTeamLeaves()
      await waitForData()
      expect(screen.getByRole('button', { name: 'En attente' })).toHaveClass('active')
    })

    it('shows comment input', () => {
      renderTeamLeaves()
      expect(screen.getByPlaceholderText(/Motif/)).toBeInTheDocument()
    })
  })

  describe('leaves table under PENDING filter (default)', () => {
    it('shows only PENDING leaves (Alice Martin)', async () => {
      renderTeamLeaves()
      await waitForData()
      expect(screen.getByText('Alice Martin')).toBeInTheDocument()
      expect(screen.getByText('EMP001')).toBeInTheDocument()
      // Bob and Claire should NOT be visible
      expect(screen.queryByText('Bob Dupont')).not.toBeInTheDocument()
      expect(screen.queryByText('Claire Bernard')).not.toBeInTheDocument()
    })

    it('shows leave details for pending leaves', async () => {
      renderTeamLeaves()
      await waitForData()
      expect(screen.getByText('Congé payé')).toBeInTheDocument()
      expect(screen.getByText('Vacances été')).toBeInTheDocument()
      expect(screen.getByText(/2026-08-01.*2026-08-05.*5 j/)).toBeInTheDocument()
    })

    it('shows Accepter and Refuser for PENDING leaves', async () => {
      renderTeamLeaves()
      await waitForData()
      expect(screen.getByText('Accepter')).toBeInTheDocument()
      expect(screen.getByText('Refuser')).toBeInTheDocument()
    })
  })

  describe('leaves table under "Toutes" filter', () => {
    it('shows all leaves across statuses', async () => {
      const user = userEvent.setup()
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByRole('button', { name: 'Toutes' }))

      await waitFor(() => {
        expect(screen.getByText('Alice Martin')).toBeInTheDocument()
        expect(screen.getByText('Bob Dupont')).toBeInTheDocument()
        expect(screen.getByText('Claire Bernard')).toBeInTheDocument()
      })
    })

    it('shows all leave type labels', async () => {
      const user = userEvent.setup()
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByRole('button', { name: 'Toutes' }))

      await waitFor(() => {
        expect(screen.getByText('Congé payé')).toBeInTheDocument()
        expect(screen.getByText('Maladie')).toBeInTheDocument()
        expect(screen.getByText('Sans solde')).toBeInTheDocument()
      })
    })

    it('shows all reasons', async () => {
      const user = userEvent.setup()
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByRole('button', { name: 'Toutes' }))

      await waitFor(() => {
        expect(screen.getByText('Vacances été')).toBeInTheDocument()
        expect(screen.getByText('Grippe')).toBeInTheDocument()
        expect(screen.getByText('Raisons perso')).toBeInTheDocument()
      })
    })
  })

  describe('approve/reject actions', () => {
    it('calls approveLeave when Accepter is clicked', async () => {
      const user = userEvent.setup()
      approveLeaveFn.mockResolvedValue({ id: 'l1' })
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByText('Accepter'))
      expect(approveLeaveFn).toHaveBeenCalledWith('l1', '')
    })

    it('calls rejectLeave when Refuser is clicked', async () => {
      const user = userEvent.setup()
      rejectLeaveFn.mockResolvedValue({ id: 'l1' })
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByText('Refuser'))
      expect(rejectLeaveFn).toHaveBeenCalledWith('l1', '')
    })

    it('sends comment with approve', async () => {
      const user = userEvent.setup()
      approveLeaveFn.mockResolvedValue({ id: 'l1' })
      renderTeamLeaves()
      await waitForData()

      await user.type(screen.getByPlaceholderText(/Motif/), 'Approuvé')
      await user.click(screen.getByText('Accepter'))

      expect(approveLeaveFn).toHaveBeenCalledWith('l1', 'Approuvé')
    })

    it('sends comment with reject', async () => {
      const user = userEvent.setup()
      rejectLeaveFn.mockResolvedValue({ id: 'l1' })
      renderTeamLeaves()
      await waitForData()

      await user.type(screen.getByPlaceholderText(/Motif/), 'Refusé')
      await user.click(screen.getByText('Refuser'))

      expect(rejectLeaveFn).toHaveBeenCalledWith('l1', 'Refusé')
    })

    it('clears comment after successful action', async () => {
      const user = userEvent.setup()
      approveLeaveFn.mockResolvedValue({ id: 'l1' })
      renderTeamLeaves()
      await waitForData()

      await user.type(screen.getByPlaceholderText(/Motif/), 'OK')
      await user.click(screen.getByText('Accepter'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Motif/)).toHaveValue('')
      })
    })

    it('shows error when approve fails', async () => {
      const user = userEvent.setup()
      approveLeaveFn.mockRejectedValue(new Error('Action refusée'))
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByText('Accepter'))

      await waitFor(() => {
        expect(screen.getByText('Action refusée')).toBeInTheDocument()
      })
    })

    it('shows error when reject fails', async () => {
      const user = userEvent.setup()
      rejectLeaveFn.mockRejectedValue(new Error('Action refusée'))
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByText('Refuser'))

      await waitFor(() => {
        expect(screen.getByText('Action refusée')).toBeInTheDocument()
      })
    })
  })

  describe('filtering', () => {
    it('calls fetchTeamLeaves with status when filter is selected', async () => {
      const user = userEvent.setup()
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByRole('button', { name: 'Acceptées' }))

      await waitFor(() => {
        expect(fetchTeamLeavesFn).toHaveBeenCalledWith('APPROVED')
      })
    })

    it('calls fetchTeamLeaves without status for "Toutes"', async () => {
      const user = userEvent.setup()
      renderTeamLeaves()
      await waitForData()

      await user.click(screen.getByRole('button', { name: 'Acceptées' }))
      await user.click(screen.getByRole('button', { name: 'Toutes' }))

      await waitFor(() => {
        expect(fetchTeamLeavesFn).toHaveBeenCalledWith(undefined)
      })
    })

    it('highlights active filter button', async () => {
      const user = userEvent.setup()
      renderTeamLeaves()
      await waitForData()

      expect(screen.getByRole('button', { name: 'En attente' })).toHaveClass('active')

      await user.click(screen.getByRole('button', { name: 'Acceptées' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acceptées' })).toHaveClass('active')
        expect(screen.getByRole('button', { name: 'En attente' })).not.toHaveClass('active')
      })
    })
  })

  describe('empty state', () => {
    it('shows empty message when no leaves match filter', async () => {
      apiReturn.leaves = []
      renderTeamLeaves()
      await waitForData()
      expect(screen.getByText('Aucune demande pour ce filtre.')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('shows error when initial load fails', async () => {
      apiReturn.apiError = new Error('Serveur indisponible')
      renderTeamLeaves()
      await waitFor(() => {
        expect(screen.getByText('Serveur indisponible')).toBeInTheDocument()
      })
    })
  })
})
