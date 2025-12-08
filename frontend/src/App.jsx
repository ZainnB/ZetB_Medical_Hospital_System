import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { authService } from './services/authService'
import api from './services/api'

function App() {
  const [session, setSession] = useState(authService.EMPTY_SESSION)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = authService.getSession()
    if (saved) {
      setSession(saved)
      api.get('/api/auth/me')
        .then(() => console.log("[APP] /auth/me success"))
        .catch(() => console.log("[APP] /auth/me FAILED"))
    }
  }, [])

  const handleLogin = (payload) => {
    const nextSession = {
      token: payload.token,
      role: payload.role,
      user_id: payload.user_id,
      username: payload.username,
    }
    authService.saveSession(nextSession)
    setSession(nextSession)
    navigate("/")
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      // Ignore errors on logout
    }
    authService.clearSession()
    setSession(authService.EMPTY_SESSION)
    toast.success('Logged out successfully')
  }

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute session={session}>
            <Dashboard session={session} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
