import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

import api from '../services/api'

const MFAModal = ({ tempToken, userEmail, onSuccess, onCancel }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/mfa-verify', {
        temp_token: tempToken,
        code: code,
      })
      // Store session
      const sessionData = {
        token: data.access_token,
        role: data.role,
        user_id: data.user_id,
        username: data.username,
      }
      window.localStorage.setItem("hospitalSession", JSON.stringify(sessionData))
      onSuccess(sessionData)
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid MFA code. Please try again.'
      toast.error(message)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      // Note: In a real implementation, you'd need to store the original credentials
      // For now, we'll just show a message
      toast.error('Please restart the login process to resend the code')
      onCancel()
    } catch (error) {
      toast.error('Failed to resend code')
    }
  }

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown === 0) return;

    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);


  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Multi-Factor Authentication</h2>
        <p>We've sent a 6-digit code to {userEmail}</p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          The code will expire in 5 minutes.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Enter Code
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(value)
              }}
              placeholder="000000"
              required
              maxLength={6}
              style={{
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                fontFamily: 'monospace',
              }}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="button" type="submit" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default MFAModal

