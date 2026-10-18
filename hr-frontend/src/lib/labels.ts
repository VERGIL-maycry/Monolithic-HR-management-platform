import type { LeaveStatus, LeaveType, Role } from '../api/client'

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrateur',
  HR: 'RH',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employé',
}

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  PAID_LEAVE: 'Congé payé',
  UNPAID_LEAVE: 'Sans solde',
  SICK_LEAVE: 'Maladie',
}

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Acceptée',
  REJECTED: 'Refusée',
  CANCELED: 'Annulée',
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: value.includes('T') ? 'short' : undefined,
  })
}
