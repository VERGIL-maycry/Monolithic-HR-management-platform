import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'
import { renderWithRouter } from '../../test-utils'

const authState = vi.hoisted(() => ({
  role: null as string | null,
  isAuthenticated: true,
}))

// Stable references so useEffect deps don't change each render
const loginSuccess = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const noopLogout = vi.hoisted(() => vi.fn())
const noopRefresh = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    role: authState.role,
    email: 'test@example.com',
    unreadCount: 0,
    loginSuccess,
    logout: noopLogout,
    refreshUnread: noopRefresh,
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

function renderWithProtectedRoute() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>,
    { initialEntries: ['/'] },
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.role = null
    authState.isAuthenticated = true
    loginSuccess.mockClear()
  })

  it('renders children when user is authenticated and role is loaded', async () => {
    authState.isAuthenticated = true
    authState.role = 'HR'
    renderWithProtectedRoute()
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('redirects to /login when user is not authenticated', () => {
    authState.isAuthenticated = false
    authState.role = null
    renderWithProtectedRoute()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('shows loading state when authenticated but role is not yet loaded', () => {
    authState.isAuthenticated = true
    authState.role = null
    loginSuccess.mockImplementation(async () => {
      // Simulate role still being null (loginSuccess didn't resolve the role)
    })
    renderWithProtectedRoute()
    // While loginSuccess is pending, loading should show
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children for ADMIN role', async () => {
    authState.isAuthenticated = true
    authState.role = 'ADMIN'
    renderWithProtectedRoute()
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('renders children for EMPLOYEE role', async () => {
    authState.isAuthenticated = true
    authState.role = 'EMPLOYEE'
    renderWithProtectedRoute()
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('renders children for MANAGER role', async () => {
    authState.isAuthenticated = true
    authState.role = 'MANAGER'
    renderWithProtectedRoute()
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
