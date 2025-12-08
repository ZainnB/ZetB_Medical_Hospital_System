import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../ui/Button'
import Card from '../ui/Card'

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
      toast.error('Please restart the login process to resend the code')
      onCancel()
    } catch (error) {
      toast.error('Failed to resend code')
    }
  }

  useEffect(() => {
    if (resendCooldown === 0) return
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onCancel}
    >
      <Card
        className="max-w-md w-[90%] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-slate-900">Multi-Factor Authentication</h2>
        <p className="text-slate-700 mb-2">We've sent a 6-digit code to {userEmail}</p>
        <p className="text-sm text-slate-500 mb-6">The code will expire in 5 minutes.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-2 block">Enter Code</span>
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
              className="w-full px-4 py-4 text-2xl text-center font-mono tracking-[0.5rem] border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading || code.length !== 6} className="flex-1">
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </p>
      </Card>
    </div>
  )
}

export default MFAModal

