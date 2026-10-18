import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, loginSuccess } = useAuth()
  const [ready, setReady] = useState(Boolean(role) || !isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || role) {
      setReady(true)
      return
    }
    let cancelled = false
    loginSuccess().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, role, loginSuccess])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!ready) {
    return <p className="page-status">Chargement…</p>
  }

  return children
}
