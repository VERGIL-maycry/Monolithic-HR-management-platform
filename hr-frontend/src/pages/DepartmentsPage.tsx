import { useEffect, useState, type FormEvent } from 'react'
import { createDepartment, fetchDepartments, type DepartmentResponse } from '../api/client'

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setDepartments(await fetchDepartments())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await createDepartment(name, description)
      setName('')
      setDescription('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <h1>Départements</h1>
      {error && <p className="error">{error}</p>}

      <form className="card-form" onSubmit={handleSubmit}>
        <h2>Nouveau département</h2>
        <label>
          Nom
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Création…' : 'Créer'}
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id}>
              <td>{dept.name}</td>
              <td>{dept.description || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {departments.length === 0 && <p className="hint">Aucun département pour le moment.</p>}
    </div>
  )
}
