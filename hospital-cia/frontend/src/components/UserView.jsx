import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

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
      <article className="view-card">
        <p>Loading profile...</p>
      </article>
    )
  }

  return (
    <article className="view-card">
      <h2>User Profile</h2>
      <p>View your account information and activity.</p>

      {userInfo && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Username:</strong> {userInfo.username}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Email:</strong> {userInfo.email}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Role:</strong> {userInfo.role}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> {userInfo.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          As a regular user, you have limited access to the system. Contact an administrator if you need
          additional permissions.
        </p>
      </div>
    </article>
  )
}

export default UserView

