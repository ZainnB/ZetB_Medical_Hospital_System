import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

export const usePatients = (role, rawMode = false) => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPatients = useCallback(async () => {
    if (role !== 'admin' && role !== 'doctor' && role !== 'receptionist') {
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/api/patients', {
        params: { raw: rawMode && role === 'admin' },
      })
      setPatients(data)
    } catch (error) {
      toast.error('Failed to fetch patients.')
    } finally {
      setLoading(false)
    }
  }, [role, rawMode])

  useEffect(() => {
    if (role === 'admin' || role === 'doctor' || role === 'receptionist') {
      fetchPatients()
    }
  }, [role, rawMode, fetchPatients])

  return { patients, loading, fetchPatients }
}

