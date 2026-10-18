const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  return `${base}${path}`
}

export type Role = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  tokenType?: string
}

export type UserResponse = {
  id: string
  email: string
  role: Role
  enabled: boolean
}

export type EmployeeResponse = {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  role: Role
  phone: string | null
  hireDate: string
  departmentId: string
  departmentName: string
  managerId: string | null
  managerFullName: string | null
}

export type DepartmentResponse = {
  id: string
  name: string
  description: string | null
}

export type LeaveType = 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'SICK_LEAVE'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'

export type LeaveResponse = {
  id: string
  employeeId: string
  employeeFullName: string
  employeeCode: string
  startDate: string
  endDate: string
  days: number
  type: LeaveType
  reason: string | null
  status: LeaveStatus
  createdAt: string
  managerComment: string | null
}

export type LeaveBalanceResponse = {
  id: string
  employeeId: string
  employeeFullName: string
  year: number
  totalDays: number
  usedDays: number
  remainingDays: number
}

export type NotificationResponse = {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export type AuditLogResponse = {
  id: string
  userEmail: string
  action: string
  detail: string
  ipAddress: string | null
  timestamp: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type AuthExpiredHandler = () => void
let onAuthExpired: AuthExpiredHandler | null = null

export function setAuthExpiredHandler(handler: AuthExpiredHandler | null) {
  onAuthExpired = handler
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveTokens(auth: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getEmailFromToken(): string | null {
  const token = getAccessToken()
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return json.sub ?? null
  } catch {
    return null
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string }
    if (body.message) return body.message
  } catch {
    /* ignore */
  }
  if (response.status === 401) return 'Identifiants invalides ou session expirée'
  if (response.status === 403) return 'Accès refusé'
  if (response.status === 0 || response.status >= 500) return 'Le serveur est indisponible'
  return `Erreur ${response.status}`
}

function isAuthPath(path: string) {
  return path.startsWith('/api/auth/')
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const response = await fetch(apiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return false

    const data = (await response.json()) as AuthResponse
    saveTokens(data)
    return true
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function expireSession() {
  clearTokens()
  onAuthExpired?.()
}

export async function apiFetch(path: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path), { ...options, headers })
  } catch {
    throw new ApiError('Impossible de joindre l’API. Démarrez le backend sur le port 8080.', 0)
  }

  if (response.status === 401 && retry && !isAuthPath(path)) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetch(path, options, false)
    }
    expireSession()
  }

  return response
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options)
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  let response: Response
  try {
    response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new ApiError('Impossible de joindre l’API. Démarrez le backend sur le port 8080.', 0)
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status)
  }

  const data: AuthResponse = await response.json()
  saveTokens(data)
  return data
}

export function fetchCurrentUser() {
  return apiJson<UserResponse>('/api/users/me')
}

export function createUser(body: { email: string; password: string; role: Role }) {
  return apiJson<UserResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchMyEmployee() {
  return apiJson<EmployeeResponse>('/api/employees/me')
}

export function fetchEmployees() {
  return apiJson<EmployeeResponse[]>('/api/employees')
}

export function createEmployee(body: {
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
  phone: string
  hireDate: string
  departmentId: string
  managerId: string | null
}) {
  return apiJson<EmployeeResponse>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateEmployee(
  id: string,
  body: {
    firstName: string
    lastName: string
    phone: string
    hireDate: string
    departmentId: string
    managerId: string | null
  },
) {
  return apiJson<EmployeeResponse>(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function fetchDepartments() {
  return apiJson<DepartmentResponse[]>('/api/departments')
}

export function createDepartment(name: string, description: string) {
  return apiJson<DepartmentResponse>('/api/departments', {
    method: 'POST',
    body: JSON.stringify({ name, description: description || null }),
  })
}

export function fetchMyLeaves() {
  return apiJson<LeaveResponse[]>('/api/leaves/me')
}

export function fetchMyBalance() {
  return apiJson<LeaveBalanceResponse>('/api/leaves/balance/me')
}

export function fetchTeamLeaves(status?: LeaveStatus) {
  const query = status ? `?status=${status}` : ''
  return apiJson<LeaveResponse[]>(`/api/leaves/team${query}`)
}

export function createLeave(body: {
  startDate: string
  endDate: string
  type: LeaveType
  reason: string
}) {
  return apiJson<LeaveResponse>('/api/leaves', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      reason: body.reason.trim() ? body.reason.trim() : null,
    }),
  })
}

export function approveLeave(id: string, comment: string) {
  return apiJson<LeaveResponse>(`/api/leaves/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment: comment.trim() || null }),
  })
}

export function rejectLeave(id: string, comment: string) {
  return apiJson<LeaveResponse>(`/api/leaves/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment: comment.trim() || null }),
  })
}

export function cancelLeave(id: string) {
  return apiJson<LeaveResponse>(`/api/leaves/${id}/cancel`, { method: 'POST' })
}

export function fetchNotifications() {
  return apiJson<NotificationResponse[]>('/api/notifications/me')
}

export function fetchUnreadCount() {
  return apiJson<number>('/api/notifications/me/unread-count')
}

export function markNotificationRead(id: string) {
  return apiJson<NotificationResponse>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export function fetchAuditLogs() {
  return apiJson<AuditLogResponse[]>('/api/audit/all')
}
