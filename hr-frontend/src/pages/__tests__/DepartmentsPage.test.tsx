import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { DepartmentsPage } from '../DepartmentsPage'
import { renderWithRouter } from '../../test-utils'

// ── Auth state (minimal — DepartmentsPage doesn't use auth hooks) ────────────
const authState = vi.hoisted(() => ({
  role: 'HR' as string | null,
  isAuthenticated: true,
}))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    role: authState.role,
    email: 'hr@example.com',
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
  departments: [] as Array<Record<string, unknown>>,
  apiError: null as Error | null,
}))

const createDepartmentFn = vi.hoisted(() => vi.fn())

vi.mock('../../api/client', () => ({
  getAccessToken: () => 'mock-token',
  getEmailFromToken: () => 'hr@example.com',
  clearTokens: vi.fn(),
  setAuthExpiredHandler: vi.fn(),
  fetchCurrentUser: vi.fn(),
  fetchUnreadCount: vi.fn().mockResolvedValue(0),
  fetchDepartments: vi.fn().mockImplementation(() => {
    if (apiReturn.apiError) return Promise.reject(apiReturn.apiError)
    return Promise.resolve(apiReturn.departments)
  }),
  createDepartment: createDepartmentFn,
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_DEPARTMENTS = [
  { id: 'd1', name: 'Ressources Humaines', description: 'Gestion du personnel' },
  { id: 'd2', name: 'Informatique', description: 'Développement et infra' },
  { id: 'd3', name: 'Comptabilité', description: null },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderDepartments() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<DepartmentsPage />} />
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
describe('DepartmentsPage', () => {
  beforeEach(() => {
    authState.role = 'HR'
    apiReturn.departments = MOCK_DEPARTMENTS
    apiReturn.apiError = null
    createDepartmentFn.mockReset()
  })

  describe('rendering', () => {
    it('shows page heading', () => {
      renderDepartments()
      expect(screen.getByText('Départements')).toBeInTheDocument()
    })

    it('shows create form', () => {
      renderDepartments()
      expect(screen.getByText('Nouveau département')).toBeInTheDocument()
      expect(screen.getByLabelText('Nom')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
    })

    it('shows table headers', async () => {
      renderDepartments()
      await waitForData()
      expect(screen.getByText('Nom', { selector: 'th' })).toBeInTheDocument()
      expect(screen.getByText('Description', { selector: 'th' })).toBeInTheDocument()
    })
  })

  describe('departments table', () => {
    it('displays all departments', async () => {
      renderDepartments()
      await waitForData()
      expect(screen.getByText('Ressources Humaines')).toBeInTheDocument()
      expect(screen.getByText('Informatique')).toBeInTheDocument()
      expect(screen.getByText('Comptabilité')).toBeInTheDocument()
    })

    it('shows descriptions', async () => {
      renderDepartments()
      await waitForData()
      expect(screen.getByText('Gestion du personnel')).toBeInTheDocument()
      expect(screen.getByText('Développement et infra')).toBeInTheDocument()
    })

    it('shows dash for null description', async () => {
      renderDepartments()
      await waitForData()
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows 3 data rows', async () => {
      renderDepartments()
      await waitForData()
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(4) // 1 header + 3 data
    })

    it('shows empty state when no departments', async () => {
      apiReturn.departments = []
      renderDepartments()
      await waitForData()
      expect(screen.getByText('Aucun département pour le moment.')).toBeInTheDocument()
    })
  })

  describe('create department', () => {
    it('submits a new department', async () => {
      const user = userEvent.setup()
      createDepartmentFn.mockResolvedValue({ id: 'new', name: 'Marketing', description: 'Pub' })
      renderDepartments()
      await waitForData()

      await user.type(screen.getByLabelText('Nom'), 'Marketing')
      await user.type(screen.getByLabelText('Description'), 'Pub')
      await user.click(screen.getByRole('button', { name: 'Créer' }))

      expect(createDepartmentFn).toHaveBeenCalledWith('Marketing', 'Pub')
    })

    it('clears form after successful creation', async () => {
      const user = userEvent.setup()
      createDepartmentFn.mockResolvedValue({ id: 'new', name: 'Marketing', description: null })
      renderDepartments()
      await waitForData()

      await user.type(screen.getByLabelText('Nom'), 'Marketing')
      await user.type(screen.getByLabelText('Description'), 'Pub')
      await user.click(screen.getByRole('button', { name: 'Créer' }))

      await waitFor(() => {
        expect(screen.getByLabelText('Nom')).toHaveValue('')
        expect(screen.getByLabelText('Description')).toHaveValue('')
      })
    })

    it('reloads departments after successful creation', async () => {
      const user = userEvent.setup()
      createDepartmentFn.mockResolvedValue({ id: 'new', name: 'Marketing', description: null })
      renderDepartments()
      await waitForData()

      // Remove one department to verify the list refreshes with new data
      apiReturn.departments = [
        { id: 'd1', name: 'Ressources Humaines', description: 'Gestion du personnel' },
        { id: 'd2', name: 'Informatique', description: 'Développement et infra' },
        { id: 'd3', name: 'Comptabilité', description: null },
        { id: 'new', name: 'Marketing', description: null },
      ]

      await user.type(screen.getByLabelText('Nom'), 'Marketing')
      await user.click(screen.getByRole('button', { name: 'Créer' }))

      await waitFor(() => {
        expect(screen.getByText('Marketing')).toBeInTheDocument()
        // Count = 1 header + 4 data rows
        expect(screen.getAllByRole('row')).toHaveLength(5)
      })
    })

    it('shows error when creation fails', async () => {
      const user = userEvent.setup()
      createDepartmentFn.mockRejectedValue(new Error('Nom déjà utilisé'))
      renderDepartments()
      await waitForData()

      await user.type(screen.getByLabelText('Nom'), 'Doublon')
      await user.click(screen.getByRole('button', { name: 'Créer' }))

      await waitFor(() => {
        expect(screen.getByText('Nom déjà utilisé')).toBeInTheDocument()
      })
    })

    it('disables button while saving', async () => {
      const user = userEvent.setup()
      let resolveCreate: (v: unknown) => void
      createDepartmentFn.mockImplementation(
        () => new Promise((resolve) => { resolveCreate = resolve }),
      )
      renderDepartments()
      await waitForData()

      await user.type(screen.getByLabelText('Nom'), 'Marketing')
      const btn = screen.getByRole('button', { name: 'Créer' })
      await user.click(btn)

      await waitFor(() => {
        expect(btn).toBeDisabled()
        expect(btn).toHaveTextContent('Création…')
      })

      resolveCreate!({ id: 'new', name: 'Marketing', description: null })
      await waitFor(() => {
        expect(btn).not.toBeDisabled()
        expect(btn).toHaveTextContent('Créer')
      })
    })

    it('does not submit if name is empty (required field)', async () => {
      const user = userEvent.setup()
      renderDepartments()
      await waitForData()

      // Name field is required — clicking submit without filling it
      // should not call createDepartment (browser validation blocks it)
      await user.click(screen.getByRole('button', { name: 'Créer' }))
      expect(createDepartmentFn).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('shows error when initial load fails', async () => {
      apiReturn.apiError = new Error('Serveur indisponible')
      renderDepartments()
      await waitFor(() => {
        expect(screen.getByText('Serveur indisponible')).toBeInTheDocument()
      })
    })

    it('hides error on successful reload', async () => {
      apiReturn.apiError = new Error('Erreur temporaire')
      renderDepartments()
      await waitFor(() => {
        expect(screen.getByText('Erreur temporaire')).toBeInTheDocument()
      })

      // Fix the error and trigger a create (which calls load())
      apiReturn.apiError = null
      createDepartmentFn.mockResolvedValue({ id: 'new', name: 'Test', description: null })
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Nom'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Créer' }))

      await waitFor(() => {
        expect(screen.queryByText('Erreur temporaire')).not.toBeInTheDocument()
      })
    })
  })
})
