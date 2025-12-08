import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/users')
      setUsers(data)
    } catch (error) {
      toast.error('Failed to fetch users.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { users, loading, fetchUsers }
}
