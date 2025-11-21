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
    console.log("[APP] useEffect (startup) running")

    const saved = window.localStorage.getItem('hospitalSession')
    console.log("[APP] saved session from localStorage =", saved)

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        console.log("[APP] parsed session =", parsed)

        if (parsed.token) {
          console.log("[APP] calling /auth/me to verify token…")
          setSession(parsed)

          api.get('/api/auth/me')
            .then(res => console.log("[APP] /auth/me success", res.data))
            .catch(err => console.log("[APP] /auth/me FAILED", err.response?.data))
        }
      } catch (err) {
        console.log("[APP] JSON parse failed")
      }
    }
  }, [])

  const handleLogin = (payload) => {
    console.log("[LOGIN] payload received", payload)
    
    const nextSession = {
      token: payload.token,
      role: payload.role,
      user_id: payload.user_id,
      username: payload.username,
    }
  
    console.log("[LOGIN] writing to localStorage =", nextSession)
    localStorage.setItem("hospitalSession", JSON.stringify(nextSession))
  
    console.log("[LOGIN] calling setSession(nextSession)")
    setSession(nextSession)
  
    console.log("[LOGIN] setSession scheduled. END of handleLogin()")
    Navigate("/");
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
