import { useEffect, useState, type FormEvent } from 'react'
import {
  cancelLeave,
  createLeave,
  fetchMyBalance,
  fetchMyLeaves,
  type LeaveBalanceResponse,
  type LeaveResponse,
  type LeaveType,
} from '../api/client'
import { StatusBadge } from '../components/StatusBadge'
import { LEAVE_TYPE_LABEL } from '../lib/labels'

export function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveResponse[]>([])
  const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState<LeaveType>('PAID_LEAVE')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [list, solde] = await Promise.all([fetchMyLeaves(), fetchMyBalance()])
      setLeaves(list)
      setBalance(solde)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les congés')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createLeave({ startDate, endDate, type, reason })
      setStartDate('')
      setEndDate('')
      setReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demande impossible')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelLeave(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annulation impossible')
    }
  }

  return (
    <div className="page">
      <h1>Mes congés</h1>

      {balance && (
        <div className="balance-card">
          <div>
            <span>Solde {balance.year}</span>
            <strong>
              {balance.remainingDays} / {balance.totalDays} jours
            </strong>
          </div>
          <small>{balance.usedDays} jour(s) déjà utilisés</small>
        </div>
      )}

      <form className="card-form" onSubmit={handleSubmit}>
        <h2>Nouvelle demande</h2>
        <label>
          Début
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          Fin
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
            <option value="PAID_LEAVE">Congé payé</option>
            <option value="UNPAID_LEAVE">Sans solde</option>
            <option value="SICK_LEAVE">Maladie</option>
          </select>
        </label>
        <label>
          Motif
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optionnel" />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Envoi…' : 'Déposer la demande'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Dates</th>
            <th>Jours</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Commentaire</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id}>
              <td>
                {leave.startDate} → {leave.endDate}
              </td>
              <td>{leave.days}</td>
              <td>{LEAVE_TYPE_LABEL[leave.type]}</td>
              <td>
                <StatusBadge status={leave.status} />
              </td>
              <td>{leave.managerComment ?? '—'}</td>
              <td>
                {leave.status === 'PENDING' && (
                  <button type="button" className="link-button" onClick={() => handleCancel(leave.id)}>
                    Annuler
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leaves.length === 0 && <p className="hint">Aucune demande pour le moment.</p>}
    </div>
  )
}
