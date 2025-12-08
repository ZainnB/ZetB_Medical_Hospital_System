import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import Loader from '../ui/Loader'

const AdminUsers = ({ users, loading, onRefresh }) => {
  const [updating, setUpdating] = useState({})

  const handleUpdateRole = async (userId, role) => {
    setUpdating((prev) => ({ ...prev, [userId]: true }))
    try {
      await api.put(`/api/users/${userId}/role`, { role })
      toast.success('User role updated')
      onRefresh()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user role.')
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleToggleActive = async (userId, currentStatus) => {
    setUpdating((prev) => ({ ...prev, [userId]: true }))
    try {
      await api.put(`/api/users/${userId}/activate`)
      toast.success('User status updated')
      onRefresh()
    } catch (error) {
      toast.error('Failed to update user status')
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const columns = [
    { key: 'user_id', header: 'ID' },
    { 
      key: 'username', 
      header: 'Username',
      render: (row) => <strong>{row.username}</strong>
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleUpdateRole(row.user_id, e.target.value)}
          disabled={updating[row.user_id]}
          className="px-3 py-1.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
        >
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="user">User</option>
        </select>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleToggleActive(row.user_id, row.is_active)}
          disabled={updating[row.user_id]}
        >
          {row.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      )
    },
  ]

  return (
    <Card glassmorphism className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">User Management</h2>
          <p className="text-slate-600">Manage user roles and status.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader message="Loading users..." />
        </div>
      ) : (
        <Table
          columns={columns}
          data={users}
          emptyMessage="No users found"
        />
      )}
    </Card>
  )
}

export default AdminUsers

