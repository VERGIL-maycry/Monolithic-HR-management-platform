import { useEffect, useState } from 'react'
import {
  approveLeave,
  fetchTeamLeaves,
  rejectLeave,
  type LeaveResponse,
  type LeaveStatus,
} from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { LEAVE_TYPE_LABEL } from '../lib/labels'

const FILTERS: { value: LeaveStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Acceptées' },
  { value: 'REJECTED', label: 'Refusées' },
  { value: 'CANCELED', label: 'Annulées' },
]

export function TeamLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveResponse[]>([])
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [filter, setFilter] = useState<LeaveStatus | 'ALL'>('PENDING')

  async function load(status: LeaveStatus | 'ALL' = filter) {
    try {
      setLeaves(await fetchTeamLeaves(status === 'ALL' ? undefined : status))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }

  useEffect(() => {
    void load(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function review(id: string, approved: boolean) {
    try {
      if (approved) {
        await approveLeave(id, comment)
      } else {
        await rejectLeave(id, comment)
      }
      setComment('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className="page">
      <h1>Demandes de l’équipe</h1>

      <div className="filter-row">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ? 'chip active' : 'chip'}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label>
        Commentaire (optionnel)
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Motif d’acceptation ou de refus"
        />
      </label>
      {error && <p className="error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Employé</th>
            <th>Dates</th>
            <th>Type</th>
            <th>Motif</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id}>
              <td>
                {leave.employeeFullName}
                <div className="muted">{leave.employeeCode}</div>
              </td>
              <td>
                {leave.startDate} → {leave.endDate} ({leave.days} j)
              </td>
              <td>{LEAVE_TYPE_LABEL[leave.type]}</td>
              <td>{leave.reason || '—'}</td>
              <td>
                <StatusBadge status={leave.status} />
              </td>
              <td>
                {leave.status === 'PENDING' && (
                  <div className="form-actions">
                    <button type="button" onClick={() => review(leave.id, true)}>
                      Accepter
                    </button>
                    <button type="button" className="ghost-button" onClick={() => review(leave.id, false)}>
                      Refuser
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leaves.length === 0 && <p className="hint">Aucune demande pour ce filtre.</p>}
    </div>
  )
}
