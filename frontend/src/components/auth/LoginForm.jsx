import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../ui/Button'
import Card from '../ui/Card'
import MFAModal from './MFAModal'

const LoginForm = ({ onLogin }) => {
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
    onLogin(sessionData)
    toast.success(`Welcome! Logged in as ${sessionData.role}`)
  }

  const handleMFACancel = () => {
    setMfaRequired(false)
    setTempToken(null)
  }

  return (
    <>
      <Card className="max-w-md mx-auto animate-slide-up" glassmorphism>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Hospital Dashboard Login
        </h1>
        <h3 className="text-slate-600 mb-8">Enter your credentials to continue</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-2 block">Username or Email</span>
            <input
              name="username_or_email"
              type="text"
              value={credentials.username_or_email}
              onChange={handleChange}
              placeholder="Enter registered Username or Email"
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-2 block">Password</span>
            <input
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter Password"
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Authenticating...' : 'Login'}
          </Button>
        </form>

        <p className="mt-8 text-center text-slate-600">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 font-semibold hover:underline">
            Register here
          </a>
        </p>

        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm font-semibold mb-2 text-slate-900">Try with Demo Credentials:</p>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li><strong>Admin:</strong> admin / Admin123!</li>
            <li><strong>Doctor:</strong> Dr_Usama / Doctor123!</li>
            <li><strong>Receptionist:</strong> recep_Aarij / Recep123!</li>
            <li><strong>User:</strong> user_Zain / User123!</li>
          </ul>
        </div>
      </Card>

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

export default LoginForm

