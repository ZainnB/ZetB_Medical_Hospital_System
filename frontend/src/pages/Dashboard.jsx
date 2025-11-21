import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import AdminView from '../components/AdminView'
import DoctorView from '../components/DoctorView'
import ReceptionView from '../components/ReceptionView'
import UserView from '../components/UserView'
import AuditLogView from '../components/AuditLogView'
import api from '../services/api'

const Dashboard = ({ session, onLogout }) => {
  console.log("[DASHBOARD] mounted with session =", session)
  const [patients, setPatients] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('patients')
  const [rawMode, setRawMode] = useState(false)
  const [meta, setMeta] = useState(null)

  const fetchMeta = async () => {
    try {
      const { data } = await api.get('/api/meta')
      setMeta(data)
    } catch (error) {
      console.error('Failed to fetch meta:', error)
    }
  }

  useEffect(() => {
    fetchMeta()
    const interval = setInterval(fetchMeta, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const fetchPatients = async () => {
    console.log("[DASHBOARD] Fetching patients, token =", session.token)
    setLoading(true)
    try {
      const { data } = await api.get('/api/patients', {
        params: { raw: rawMode && session.role === 'admin' },
      })
      setPatients(data)
    } catch (error) {
      toast.error('Failed to fetch patients.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/users')
      setUsers(data)
    } catch (error) {
      toast.error('Failed to fetch users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'patients') {
      fetchPatients()
    } else if (activeTab === 'users' && session.role === 'admin') {
      fetchUsers()
    }
  }, [activeTab, rawMode, session.role])

  const handleAnonymize = async (patientId = null) => {
    try {
      const { data } = await api.post('/api/patients/anonymize', {
        patient_id: patientId,
      })
      toast.success(data.message)
      fetchPatients()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Anonymization failed.')
    }
  }

  const handleExport = async (type = 'patients') => {
    try {
      const response = await api.get('/api/export', {
        params: { type, raw: rawMode && session.role === 'admin' },
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
      anchor.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV export downloaded')
      fetchMeta() // Update last sync time
    } catch (error) {
      toast.error('CSV export failed.')
    }
  }

  const handleAddPatient = async (patientData) => {
    try {
      await api.post('/api/patients', patientData)
      toast.success('Patient added successfully')
      fetchPatients()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add patient.')
    }
  }

  const handleUpdatePatient = async (patientId, patientData) => {
    try {
      await api.put(`/api/patients/${patientId}`, patientData)
      toast.success('Patient updated successfully')
      fetchPatients()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update patient.')
    }
  }

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await api.put(`/api/users/${userId}/role`, { role })
      toast.success('User role updated')
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user role.')
    }
  }

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const roleBadgeColor = {
    admin: '#dc2626',
    doctor: '#2563eb',
    receptionist: '#16a34a',
    user: '#6b7280',
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Hospital Management System</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <span
              style={{
                backgroundColor: roleBadgeColor[session.role] || '#6b7280',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              {session.role}
            </span>
            <span style={{ color: '#6b7280' }}>Welcome, {session.username}</span>
          </div>
        </div>
        <button className="button secondary" onClick={onLogout}>
          Logout
        </button>
      </header>

      {session.role === 'admin' && (
        <nav className="dashboard-nav">
          <button
            className={activeTab === 'patients' ? 'active' : ''}
            onClick={() => setActiveTab('patients')}
          >
            Patients
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'audit' ? 'active' : ''}
            onClick={() => setActiveTab('audit')}
          >
            Audit Logs
          </button>
        </nav>
      )}

      <main className="dashboard-main">
        {activeTab === 'patients' && (
          <>
            {session.role === 'admin' && (
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={rawMode}
                    onChange={(e) => setRawMode(e.target.checked)}
                  />
                  Show Raw Data (Decrypted)
                </label>
              </div>
            )}
            {session.role === 'admin' ? (
              <AdminView
                patients={patients}
                loading={loading}
                rawMode={rawMode}
                onAnonymize={handleAnonymize}
                onExport={() => handleExport('patients')}
                onRefresh={fetchPatients}
              />
            ) : session.role === 'doctor' ? (
              <DoctorView patients={patients} loading={loading} />
            ) : session.role === 'receptionist' ? (
              <ReceptionView
                patients={patients}
                loading={loading}
                onAddPatient={handleAddPatient}
                onUpdatePatient={handleUpdatePatient}
                onRefresh={fetchPatients}
              />
            ) : (
              <UserView session={session} />
            )}
          </>
        )}

        {activeTab === 'users' && session.role === 'admin' && (
          <div className="view-card">
            <h2>User Management</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.user_id, e.target.value)}
                        style={{ padding: '0.25rem' }}
                      >
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <button
                        className="button small"
                        onClick={() =>
                          api
                            .put(`/api/users/${user.user_id}/activate`)
                            .then(() => {
                              toast.success('User status updated')
                              fetchUsers()
                            })
                            .catch(() => toast.error('Failed to update user status'))
                        }
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && session.role === 'admin' && (
          <AuditLogView onExport={handleExport} />
        )}
      </main>

      <footer className="dashboard-footer">
        <div>
          <span>Uptime: {formatUptime(meta?.uptime_seconds)}</span>
          <span style={{ marginLeft: '1rem' }}>
            Last Sync:{' '}
            {meta?.last_sync_time
              ? new Date(meta.last_sync_time).toLocaleString()
              : 'Never'}
          </span>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
