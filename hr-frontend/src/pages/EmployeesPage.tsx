import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createEmployee,
  fetchDepartments,
  fetchEmployees,
  updateEmployee,
  type DepartmentResponse,
  type EmployeeResponse,
  type Role,
} from '../api/client'
import { ROLE_LABEL } from '../lib/labels'

const EMPTY_FORM = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'EMPLOYEE' as Role,
  phone: '',
  hireDate: '',
  departmentId: '',
  managerId: '',
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    try {
      const [emps, deps] = await Promise.all([fetchEmployees(), fetchDepartments()])
      setEmployees(emps)
      setDepartments(deps)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((emp) =>
      `${emp.employeeCode} ${emp.firstName} ${emp.lastName} ${emp.email} ${emp.departmentName}`
        .toLowerCase()
        .includes(q),
    )
  }, [employees, query])

  function startEdit(emp: EmployeeResponse) {
    setEditingId(emp.id)
    setForm({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      password: '',
      role: emp.role,
      phone: emp.phone ?? '',
      hireDate: emp.hireDate,
      departmentId: emp.departmentId,
      managerId: emp.managerId ?? '',
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, departmentId: form.departmentId })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      if (editingId) {
        await updateEmployee(editingId, {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          hireDate: form.hireDate,
          departmentId: form.departmentId,
          managerId: form.managerId || null,
        })
      } else {
        await createEmployee({
          ...form,
          managerId: form.managerId || null,
        })
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    }
  }

  return (
    <div className="page">
      <h1>Employés</h1>
      {error && <p className="error">{error}</p>}

      <input
        className="search-input"
        placeholder="Rechercher un employé…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <form className="card-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Modifier l’employé' : 'Nouvel employé'}</h2>
        <input
          placeholder="Matricule"
          value={form.employeeCode}
          onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
          required
          disabled={Boolean(editingId)}
        />
        <input
          placeholder="Prénom"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
        />
        <input
          placeholder="Nom"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          disabled={Boolean(editingId)}
        />
        {!editingId && (
          <input
            type="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        )}
        <input
          placeholder="Téléphone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} disabled={Boolean(editingId)}>
          <option value="EMPLOYEE">Employé</option>
          <option value="MANAGER">Manager</option>
          <option value="HR">RH</option>
        </select>
        <input
          type="date"
          value={form.hireDate}
          onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
          required
        />
        <select
          value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          required
        >
          <option value="">Département</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
          <option value="">Manager (optionnel)</option>
          {employees
            .filter((emp) => emp.id !== editingId)
            .map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
        </select>
        <div className="form-actions">
          <button type="submit">{editingId ? 'Enregistrer' : 'Créer l’employé'}</button>
          {editingId && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Département</th>
            <th>Manager</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.employeeCode}</td>
              <td>
                {emp.firstName} {emp.lastName}
              </td>
              <td>{emp.email}</td>
              <td>{ROLE_LABEL[emp.role]}</td>
              <td>{emp.departmentName}</td>
              <td>{emp.managerFullName ?? '—'}</td>
              <td>
                <button type="button" className="link-button" onClick={() => startEdit(emp)}>
                  Modifier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="hint">Aucun employé trouvé.</p>}
    </div>
  )
}
