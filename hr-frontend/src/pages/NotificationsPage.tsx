import { useEffect, useState } from 'react'
import { fetchNotifications, markNotificationRead, type NotificationResponse } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { formatDate } from '../lib/labels'

export function NotificationsPage() {
  const { refreshUnread } = useAuth()
  const [items, setItems] = useState<NotificationResponse[]>([])
  const [error, setError] = useState('')

  async function load() {
    try {
      setItems(await fetchNotifications())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function markRead(id: string) {
    try {
      await markNotificationRead(id)
      await load()
      await refreshUnread()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible')
    }
  }

  return (
    <div className="page">
      <h1>Notifications</h1>
      {error && <p className="error">{error}</p>}
      <ul className="notice-list">
        {items.map((item) => (
          <li key={item.id} className={item.read ? 'read' : 'unread'}>
            <strong>{item.title}</strong>
            <p>{item.message}</p>
            <small>{formatDate(item.createdAt)}</small>
            {!item.read && (
              <button type="button" className="link-button" onClick={() => markRead(item.id)}>
                Marquer comme lue
              </button>
            )}
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="hint">Aucune notification.</p>}
    </div>
  )
}
