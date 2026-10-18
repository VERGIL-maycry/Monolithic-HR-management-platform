import { Navigate } from 'react-router-dom'
import { useHasAnyRole } from '../auth/AuthContext'
import type { Role } from '../api/client'

export function RoleRoute({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const allowed = useHasAnyRole(...roles)
  if (!allowed) {
    return <Navigate to="/" replace />
  }
  return children
}
