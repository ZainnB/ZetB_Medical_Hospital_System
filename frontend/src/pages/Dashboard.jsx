import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import DashboardLayout from '../layouts/DashboardLayout'
import AdminPatients from '../components/admin/AdminPatients'
import AdminUsers from '../components/admin/AdminUsers'
import AdminAuditLogs from '../components/admin/AdminAuditLogs'
import AdminStats from '../components/admin/AdminStats'
import DoctorDashboard from '../components/doctor/DoctorDashboard'
import ReceptionistDashboard from '../components/receptionist/ReceptionistDashboard'
import UserView from '../components/UserView'
import ConsentBanner from '../components/gdpr/ConsentBanner'
import { usePatients } from '../hooks/usePatients'
import { useUsers } from '../hooks/useUsers'
import { useAuditLogs } from '../hooks/useAuditLogs'

const Dashboard = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState('patients')
  const [rawMode, setRawMode] = useState(false)
  const [meta, setMeta] = useState(null)
  
  const { patients, loading: patientsLoading, fetchPatients } = usePatients(session.role, rawMode)
  const { users, loading: usersLoading, fetchUsers } = useUsers()
  const { logs, loading: logsLoading, filters, pagination, fetchLogs, handleFilterChange, setPagination } = useAuditLogs(session.role === 'admin' && activeTab === 'audit')

  // Fetch users only when admin tab is active
  useEffect(() => {
    if (session.role === 'admin' && activeTab === 'users') {
      fetchUsers()
    }
  }, [session.role, activeTab, fetchUsers])

  // Fetch audit logs only when admin audit tab is active
  useEffect(() => {
    if (session.role === 'admin' && activeTab === 'audit') {
      fetchLogs()
    }
  }, [session.role, activeTab, fetchLogs])

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
    const interval = setInterval(fetchMeta, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleAnonymize = async (patientId = null) => {
    try {
      const { data } = await api.post('/api/patients/anonymize', {
        patient_id: patientId,
      })
      toast.success(data.message || 'Patient anonymized successfully')
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
      fetchMeta()
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

  const renderContent = () => {
    if (session.role === 'admin') {
      if (activeTab === 'patients') {
        return (
          <AdminPatients
            patients={patients}
            loading={patientsLoading}
            rawMode={rawMode}
            onToggleRawMode={setRawMode}
            onAnonymize={handleAnonymize}
            onExport={() => handleExport('patients')}
            onRefresh={fetchPatients}
          />
        )
      } else if (activeTab === 'users') {
        return (
          <AdminUsers
            users={users}
            loading={usersLoading}
            onRefresh={fetchUsers}
          />
        )
      } else if (activeTab === 'audit') {
        return (
          <AdminAuditLogs
            logs={logs}
            loading={logsLoading}
            filters={filters}
            pagination={pagination}
            onFilterChange={handleFilterChange}
            onExport={() => handleExport('logs')}
            onRefresh={fetchLogs}
            onPaginationChange={setPagination}
          />
        )
      } else if (activeTab === 'stats') {
        return <AdminStats />
      }
    } else if (session.role === 'doctor') {
      return <DoctorDashboard patients={patients} loading={patientsLoading} />
    } else if (session.role === 'receptionist') {
      return (
        <ReceptionistDashboard
          patients={patients}
          loading={patientsLoading}
          onAddPatient={handleAddPatient}
          onUpdatePatient={handleUpdatePatient}
          onRefresh={fetchPatients}
        />
      )
    } else {
      return <UserView session={session} />
    }
  }

  return (
    <>
      <DashboardLayout
        session={session}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        meta={meta}
      >
        {renderContent()}
      </DashboardLayout>
      <ConsentBanner session={session} />
    </>
  )
}

export default Dashboard
