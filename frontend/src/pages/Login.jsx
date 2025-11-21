import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import api from '../services/api'
import MFAModal from '../components/MFAModal'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username_or_email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [tempToken, setTempToken] = useState(null)
  const [userEmail, setUserEmail] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/login', credentials)
      
      if (data.mfa_required && data.temp_token) {
        setTempToken(data.temp_token)
        setMfaRequired(true)
        // Mask email for display
        const email = credentials.username_or_email.includes('@')
          ? credentials.username_or_email
          : 'your email'
        setUserEmail(email.replace(/(.{2})(.*)(@.*)/, '$1***$3'))
        toast.success('MFA code sent to your email')
      } else {
        toast.error('Unexpected response from server')
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please check your credentials.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleMFASuccess = (sessionData) => {
    setMfaRequired(false)
    console.log("recieved and sending forward", sessionData)
    onLogin(sessionData)
    toast.success(`Welcome! Logged in as ${sessionData.role}`)
  }

  const handleMFACancel = () => {
    setMfaRequired(false)
    setTempToken(null)
  }

  return (
    <>
      <section className="auth-card">
        <h1>Hospital Dashboard Login</h1>
        <p>Enter your credentials to continue</p>

        <form onSubmit={handleSubmit}>
          <label>
            Username or Email
            <input
              name="username_or_email"
              type="text"
              value={credentials.username_or_email}
              onChange={handleChange}
              placeholder="admin or admin@hospital.local"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account?{' '}
          <a href="/register" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            Register here
          </a>
        </p>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Demo Credentials:</p>
          <ul style={{ fontSize: '0.875rem', margin: 0, paddingLeft: '1.5rem' }}>
            <li>admin / Admin123!</li>
            <li>dr_smith / Doctor123!</li>
            <li>recep_jane / Recep123!</li>
            <li>user1 / User123!</li>
          </ul>
        </div>
      </section>

      {mfaRequired && (
        <MFAModal
          tempToken={tempToken}
          userEmail={userEmail}
          onSuccess={handleMFASuccess}
          onCancel={handleMFACancel}
        />
      )}
    </>
  )
}

export default Login
