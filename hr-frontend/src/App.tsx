import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { AuditPage } from './pages/AuditPage'
import { DepartmentsPage } from './pages/DepartmentsPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { HomePage } from './pages/HomePage'
import { LeavesPage } from './pages/LeavesPage'
import { LoginPage } from './pages/LoginPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { TeamLeavesPage } from './pages/TeamLeavesPage'
import { UsersPage } from './pages/UsersPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route
              path="/team-leaves"
              element={
                <RoleRoute roles={['MANAGER', 'HR', 'ADMIN']}>
                  <TeamLeavesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <RoleRoute roles={['HR', 'ADMIN', 'MANAGER']}>
                  <EmployeesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <RoleRoute roles={['HR', 'ADMIN']}>
                  <DepartmentsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/users"
              element={
                <RoleRoute roles={['ADMIN']}>
                  <UsersPage />
                </RoleRoute>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/audit"
              element={
                <RoleRoute roles={['HR', 'ADMIN']}>
                  <AuditPage />
                </RoleRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
