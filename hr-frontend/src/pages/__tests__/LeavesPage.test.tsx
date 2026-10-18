import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { LeavesPage } from '../LeavesPage'
import { renderWithRouter } from '../../test-utils'

// ── Auth state ───────────────────────────────────────────────────────────────
const authState = vi.hoisted(() => ({
  role: 'EMPLOYEE' as string | null,
  isAuthenticated: true,
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    role: authState.role,
    email: 'alice@example.com',
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

// ── API mock state ───────────────────────────────────────────────────────────
const apiReturn = vi.hoisted(() => ({
  leaves: [] as Array<Record<string, unknown>>,
  balance: null as Record<string, unknown> | null,
  apiError: null as Error | null,
}))

const createLeaveFn = vi.hoisted(() => vi.fn())
const cancelLeaveFn = vi.hoisted(() => vi.fn())

vi.mock('../../api/client', () => ({
  getAccessToken: () => 'mock-token',
  getEmailFromToken: () => 'alice@example.com',
  clearTokens: vi.fn(),
  setAuthExpiredHandler: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchUnreadCount: vi.fn().mockResolvedValue(0),
  fetchMyLeaves: vi.fn().mockImplementation(() => {
    if (apiReturn.apiError) return Promise.reject(apiReturn.apiError)
    return Promise.resolve(apiReturn.leaves)
  }),
  fetchMyBalance: vi.fn().mockImplementation(() => {
    if (apiReturn.apiError) return Promise.reject(apiReturn.apiError)
    return Promise.resolve(apiReturn.balance)
  }),
  createLeave: createLeaveFn,
  cancelLeave: cancelLeaveFn,
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

// ── Mock data ────────────────────────────────────────────────────────────────
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
    type: 'PAID_LEAVE',
    reason: 'Vacances au ski',
    status: 'APPROVED',
    createdAt: '2026-02-20T10:00:00',
    managerComment: 'Bonnes vacances !',
  },
  {
    id: 'l2',
    employeeId: 'emp-1',
    employeeFullName: 'Alice Martin',
    employeeCode: 'EMP001',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    days: 2,
    type: 'SICK_LEAVE',
    reason: 'Grippe',
    status: 'PENDING',
    createdAt: '2026-07-01T08:00:00',
    managerComment: null,
  },
  {
    id: 'l3',
    employeeId: 'emp-1',
    employeeFullName: 'Alice Martin',
    employeeCode: 'EMP001',
    startDate: '2026-01-15',
    endDate: '2026-01-16',
    days: 1,
    type: 'PAID_LEAVE',
    reason: null,
    status: 'REJECTED',
    createdAt: '2026-01-10T09:00:00',
    managerComment: 'Période chargée',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderLeaves() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<LeavesPage />} />
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
describe('LeavesPage', () => {
  beforeEach(() => {
    authState.role = 'EMPLOYEE'
    authState.isAuthenticated = true
    apiReturn.leaves = MOCK_LEAVES
    apiReturn.balance = MOCK_BALANCE
    apiReturn.apiError = null
    createLeaveFn.mockReset()
    cancelLeaveFn.mockReset()
  })

  describe('rendering', () => {
    it('shows page heading', () => {
      renderLeaves()
      expect(screen.getByText('Mes congés')).toBeInTheDocument()
    })

    it('shows balance card with correct data', async () => {
      renderLeaves()
      await waitForData()
      expect(screen.getByText('Solde 2026')).toBeInTheDocument()
      expect(screen.getByText('18 / 25 jours')).toBeInTheDocument()
      expect(screen.getByText('7 jour(s) déjà utilisés')).toBeInTheDocument()
    })

    it('hides balance card when balance is null', async () => {
      apiReturn.balance = null
      renderLeaves()
      await waitForData()
      expect(screen.queryByText(/Solde/)).not.toBeInTheDocument()
    })

    it('shows leave request form fields', () => {
      renderLeaves()
      expect(screen.getByText('Nouvelle demande')).toBeInTheDocument()
      expect(screen.getByLabelText('Début')).toBeInTheDocument()
      expect(screen.getByLabelText('Fin')).toBeInTheDocument()
      expect(screen.getByLabelText('Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Motif')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Déposer/ })).toBeInTheDocument()
    })
  })

  describe('leaves table', () => {
    it('renders 3 data rows', async () => {
      renderLeaves()
      await waitForData()
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(4) // 1 header + 3 data
    })

    it('shows manager comments (or dash for null)', async () => {
      renderLeaves()
      await waitForData()
      expect(screen.getByText('Bonnes vacances !')).toBeInTheDocument()
      expect(screen.getByText('Période chargée')).toBeInTheDocument()
      // l2 has null managerComment → shows '—'
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows leave type labels in table rows', async () => {
      renderLeaves()
      await waitForData()
      // "Congé payé" appears in dropdown option AND in table (2 rows)
      const paidLeaveElements = screen.getAllByText('Congé payé')
      expect(paidLeaveElements.length).toBeGreaterThanOrEqual(2) // option + table rows
      const maladieElements = screen.getAllByText('Maladie')
      expect(maladieElements.length).toBeGreaterThanOrEqual(2) // option + table
    })

    it('shows status badges', async () => {
      renderLeaves()
      await waitForData()
      expect(screen.getByText('Acceptée')).toBeInTheDocument()
      expect(screen.getByText('En attente')).toBeInTheDocument()
      expect(screen.getByText('Refusée')).toBeInTheDocument()
    })

    it('shows date ranges', async () => {
      renderLeaves()
      await waitForData()
      expect(screen.getByText(/2026-03-01.*2026-03-05/)).toBeInTheDocument()
      expect(screen.getByText(/2026-07-10.*2026-07-12/)).toBeInTheDocument()
    })

    it('shows empty state when no leaves', async () => {
      apiReturn.leaves = []
      renderLeaves()
      await waitForData()
      expect(screen.getByText('Aucune demande pour le moment.')).toBeInTheDocument()
    })
  })

  describe('cancel functionality', () => {
    it('shows cancel button only for PENDING leaves', async () => {
      renderLeaves()
      await waitForData()
      const cancelButtons = screen.getAllByText('Annuler')
      expect(cancelButtons).toHaveLength(1)
    })

    it('calls cancelLeave when cancel is clicked', async () => {
      const user = userEvent.setup()
      cancelLeaveFn.mockResolvedValue(undefined)
      renderLeaves()
      await waitForData()

      await user.click(screen.getByText('Annuler'))
      expect(cancelLeaveFn).toHaveBeenCalledWith('l2')
    })

    it('shows error when cancel fails', async () => {
      const user = userEvent.setup()
      cancelLeaveFn.mockRejectedValue(new Error('Annulation refusée'))
      renderLeaves()
      await waitForData()

      await user.click(screen.getByText('Annuler'))

      await waitFor(() => {
        expect(screen.getByText('Annulation refusée')).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('submits a new leave request', async () => {
      const user = userEvent.setup()
      createLeaveFn.mockResolvedValue({ id: 'new-leave' })
      renderLeaves()
      await waitForData()

      await user.type(screen.getByLabelText('Début'), '2026-08-01')
      await user.type(screen.getByLabelText('Fin'), '2026-08-05')
      await user.type(screen.getByLabelText('Motif'), 'Congé été')
      await user.click(screen.getByRole('button', { name: /Déposer/ }))

      expect(createLeaveFn).toHaveBeenCalledWith({
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        type: 'PAID_LEAVE',
        reason: 'Congé été',
      })
    })

    it('clears form after successful submission', async () => {
      const user = userEvent.setup()
      createLeaveFn.mockResolvedValue({ id: 'new-leave' })
      renderLeaves()
      await waitForData()

      await user.type(screen.getByLabelText('Début'), '2026-08-01')
      await user.type(screen.getByLabelText('Fin'), '2026-08-05')
      await user.click(screen.getByRole('button', { name: /Déposer/ }))

      await waitFor(() => {
        expect(screen.getByLabelText('Début')).toHaveValue('')
        expect(screen.getByLabelText('Fin')).toHaveValue('')
        expect(screen.getByLabelText('Motif')).toHaveValue('')
      })
    })

    it('shows error when submission fails', async () => {
      const user = userEvent.setup()
      createLeaveFn.mockRejectedValue(new Error('Dates invalides'))
      renderLeaves()
      await waitForData()

      await user.type(screen.getByLabelText('Début'), '2026-08-01')
      await user.type(screen.getByLabelText('Fin'), '2026-08-05')
      await user.click(screen.getByRole('button', { name: /Déposer/ }))

      await waitFor(() => {
        expect(screen.getByText('Dates invalides')).toBeInTheDocument()
      })
    })

    it('disables button while saving', async () => {
      const user = userEvent.setup()
      let resolveSubmit: (v: unknown) => void
      createLeaveFn.mockImplementation(
        () => new Promise((resolve) => { resolveSubmit = resolve }),
      )
      renderLeaves()
      await waitForData()

      await user.type(screen.getByLabelText('Début'), '2026-08-01')
      await user.type(screen.getByLabelText('Fin'), '2026-08-05')
      const btn = screen.getByRole('button', { name: /Déposer/ })
      await user.click(btn)

      await waitFor(() => {
        expect(btn).toBeDisabled()
        expect(btn).toHaveTextContent('Envoi…')
      })

      resolveSubmit!({ id: 'new-leave' })
      await waitFor(() => {
        expect(btn).not.toBeDisabled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error when initial load fails', async () => {
      apiReturn.apiError = new Error('Serveur indisponible')
      renderLeaves()
      await waitFor(() => {
        expect(screen.getByText('Serveur indisponible')).toBeInTheDocument()
      })
    })
  })
})
