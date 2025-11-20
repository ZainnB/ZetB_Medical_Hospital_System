import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import toast from 'react-hot-toast'

import './App.css'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import api from './services/api'

const EMPTY_SESSION = { token: null, role: null, user_id: null, username: null }

function App() {
  const [session, setSession] = useState(EMPTY_SESSION)

  useEffect(() => {
    const saved = window.localStorage.getItem('hospitalSession')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.token) {
          setSession(parsed)
          // Verify token is still valid
          api.get('/api/auth/me').catch(() => {
            // Token invalid, clear session
            window.localStorage.removeItem('hospitalSession')
            setSession(EMPTY_SESSION)
          })
        }
      } catch {
        window.localStorage.removeItem('hospitalSession')
      }
    }
  }, [])

  const handleLogin = (payload) => {
    const nextSession = {
      token: payload.token || payload.access_token,
      role: payload.role,
      user_id: payload.user_id,
      username: payload.username,
    }
    window.localStorage.setItem('hospitalSession', JSON.stringify(nextSession))
    setSession(nextSession)
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      // Ignore errors on logout
    }
    window.localStorage.removeItem('hospitalSession')
    setSession(EMPTY_SESSION)
    toast.success('Logged out successfully')
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            session.token ? (
              <Dashboard session={session} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
