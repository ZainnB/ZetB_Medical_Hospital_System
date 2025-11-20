import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import api from '../services/api'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return false
    }
    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter')
      return false
    }
    if (!/\d/.test(formData.password)) {
      toast.error('Password must contain at least one digit')
      return false
    }
    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await api.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Register</h1>
      <p>Create a new account</p>

      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
            minLength={3}
            maxLength={100}
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit)"
            required
            minLength={8}
          />
        </label>
        <label>
          Confirm Password
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            required
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
          Login here
        </a>
      </p>
    </section>
  )
}

export default Register

