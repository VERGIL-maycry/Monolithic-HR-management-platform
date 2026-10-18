import { useEffect, useMemo, useState } from 'react'
import { fetchAuditLogs, type AuditLogResponse } from '../api/client'
import { formatDate } from '../lib/labels'

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Chargement impossible')
      })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((log) =>
      `${log.userEmail} ${log.action} ${log.detail}`.toLowerCase().includes(q),
    )
  }, [logs, query])

  return (
    <div className="page">
      <h1>Journal d’audit</h1>
      {error && <p className="error">{error}</p>}
      <input
        className="search-input"
        placeholder="Filtrer par utilisateur, action ou détail…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Détail</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((log) => (
            <tr key={log.id}>
              <td>{formatDate(log.timestamp)}</td>
              <td>{log.userEmail}</td>
              <td>{log.action}</td>
              <td>{log.detail}</td>
              <td>{log.ipAddress ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="hint">Aucun événement d’audit.</p>}
    </div>
  )
}
