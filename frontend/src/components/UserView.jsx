import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import Card from './ui/Card'
import Loader from './ui/Loader'

const UserView = ({ session }) => {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data } = await api.get('/api/auth/me')
        setUserInfo(data)
      } catch (error) {
        toast.error('Failed to fetch user information')
      } finally {
        setLoading(false)
      }
    }
    fetchUserInfo()
  }, [])

  if (loading) {
    return (
      <Card glassmorphism>
        <Loader message="Loading profile..." />
      </Card>
    )
  }

  return (
    <Card glassmorphism className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">User Profile</h2>
      <p className="text-slate-600 mb-6">View your account information and activity.</p>

      {userInfo && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <strong className="text-slate-700">Username:</strong>{' '}
            <span className="text-slate-900">{userInfo.username}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <strong className="text-slate-700">Email:</strong>{' '}
            <span className="text-slate-900">{userInfo.email}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <strong className="text-slate-700">Role:</strong>{' '}
            <span className="text-slate-900">{userInfo.role}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <strong className="text-slate-700">Status:</strong>{' '}
            <span
              className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                userInfo.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {userInfo.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-slate-700">
          As a regular user, you have limited access to the system. Contact an administrator if you
          need additional permissions.
        </p>
      </div>
    </Card>
  )
}

export default UserView
