import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ApiError,
  clearTokens,
  fetchCurrentUser,
  fetchUnreadCount,
  getAccessToken,
  getEmailFromToken,
  setAuthExpiredHandler,
  type Role,
  type UserResponse,
} from '../api/client'

type AuthContextValue = {
  isAuthenticated: boolean
  email: string | null
  role: Role | null
  unreadCount: number
  loginSuccess: () => Promise<void>
  logout: () => void
  refreshUnread: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [user, setUser] = useState<UserResponse | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const logout = useCallback(() => {
    clearTokens()
    setToken(null)
    setUser(null)
    setUnreadCount(0)
  }, [])

  const refreshUnread = useCallback(async () => {
    if (!getAccessToken()) {
      setUnreadCount(0)
      return
    }
    try {
      setUnreadCount(await fetchUnreadCount())
    } catch {
      setUnreadCount(0)
    }
  }, [])

  const loginSuccess = useCallback(async () => {
    setToken(getAccessToken())
    try {
      setUser(await fetchCurrentUser())
      await refreshUnread()
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
        if (err.status === 401) logout()
        else setUser(null)
        return
      }
      setUser(null)
    }
  }, [logout, refreshUnread])

  useEffect(() => {
    setAuthExpiredHandler(logout)
    return () => setAuthExpiredHandler(null)
  }, [logout])

  useEffect(() => {
    if (getAccessToken()) {
      void loginSuccess()
    }
  }, [loginSuccess])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      email: user?.email ?? getEmailFromToken(),
      role: user?.role ?? null,
      unreadCount,
      loginSuccess,
      logout,
      refreshUnread,
    }),
    [token, user, unreadCount, loginSuccess, logout, refreshUnread],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

export function useHasAnyRole(...roles: Role[]) {
  const { role } = useAuth()
  return role != null && roles.includes(role)
}
