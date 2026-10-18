import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { RoleRoute } from '../RoleRoute'
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

function renderWithRoleRoute(allowedRoles: string[]) {
  return renderWithRouter(
    <Routes>
      <Route
        path="/"
        element={
          <RoleRoute roles={allowedRoles as never[]}>
            <div>Protected Content</div>
          </RoleRoute>
        }
      />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>,
  )
}

describe('RoleRoute', () => {
  beforeEach(() => {
    authState.role = null
    authState.isAuthenticated = true
  })

  it('renders children when user has an allowed role', () => {
    authState.role = 'HR'
    renderWithRoleRoute(['HR', 'ADMIN'])
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to / when user role is not in the allowed list', () => {
    authState.role = 'EMPLOYEE'
    renderWithRoleRoute(['HR', 'ADMIN'])
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to / when user role is null', () => {
    authState.role = null
    renderWithRoleRoute(['HR', 'ADMIN'])
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows MANAGER access when MANAGER is in the roles list', () => {
    authState.role = 'MANAGER'
    renderWithRoleRoute(['MANAGER', 'HR', 'ADMIN'])
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('denies MANAGER access when MANAGER is not in the roles list', () => {
    authState.role = 'MANAGER'
    renderWithRoleRoute(['HR', 'ADMIN'])
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows ADMIN access', () => {
    authState.role = 'ADMIN'
    renderWithRoleRoute(['ADMIN'])
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('allows any role when multiple roles are specified', () => {
    authState.role = 'EMPLOYEE'
    renderWithRoleRoute(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'])
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
