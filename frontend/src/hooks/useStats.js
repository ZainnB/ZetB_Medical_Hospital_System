import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

export const useActivityStats = (days = 7, pollInterval = 60000) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/stats/activity', {
        params: { days },
      })
      setStats(data)
    } catch (error) {
      toast.error('Failed to fetch activity stats')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, pollInterval)
    return () => clearInterval(interval)
  }, [fetchStats, pollInterval])

  return { stats, loading, fetchStats }
}

export const useRetentionSettings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/retention')
      setSettings(data)
    } catch (error) {
      toast.error('Failed to fetch retention settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = async (retentionDays, enabled) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/admin/retention', {
        retention_days: retentionDays,
        enabled,
      })
      setSettings(data)
      toast.success('Retention settings updated successfully')
      return data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update retention settings')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { settings, loading, fetchSettings, updateSettings }
}

export const useConsentStats = (pollInterval = 60000) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/consent-stats')
      setStats(data)
    } catch (error) {
      toast.error('Failed to fetch consent stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, pollInterval)
    return () => clearInterval(interval)
  }, [fetchStats, pollInterval])

  return { stats, loading, fetchStats }
}

