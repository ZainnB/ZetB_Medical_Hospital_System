import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../ui/Button'

const ConsentBanner = ({ session }) => {
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Only check consent if we have a valid session
    if (!session?.token) {
      setChecking(false)
      return
    }

    const checkConsent = async () => {
      try {
        const { data } = await api.get('/api/consent/status')
        // Only show banner if user has NOT consented
        setShowBanner(!data.has_consented)
      } catch (error) {
        // If endpoint fails, don't show banner (fail silently)
        console.error('Failed to check consent status:', error)
        setShowBanner(false)
      } finally {
        setChecking(false)
      }
    }

    checkConsent()
  }, [session?.token])

  const handleAccept = async () => {
    setLoading(true)
    try {
      await api.post('/api/consent/accept', { accepted: true })
      setShowBanner(false)
      toast.success('Thank you for your consent')
    } catch (error) {
      toast.error('Failed to save consent preference')
      console.error('Failed to accept consent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      await api.post('/api/consent/accept', { accepted: false })
      setShowBanner(false)
      toast.info('Consent preference saved')
    } catch (error) {
      toast.error('Failed to save consent preference')
      console.error('Failed to decline consent:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything while checking or if banner shouldn't show
  if (checking || !showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl p-4 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">GDPR Cookie Consent</h3>
          <p className="text-sm text-blue-100">
            We use cookies and process personal data to provide our services. By clicking "Accept",
            you consent to our data processing practices. You can withdraw consent at any time from
            your profile settings.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDecline}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConsentBanner
