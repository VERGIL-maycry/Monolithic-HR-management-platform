import type { LeaveStatus } from '../api/client'
import { LEAVE_STATUS_LABEL } from '../lib/labels'

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{LEAVE_STATUS_LABEL[status]}</span>
}
