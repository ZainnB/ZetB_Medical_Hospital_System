import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

export const useAuditLogs = (shouldFetch = false) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    role: '',
    user_id: '',
    action: '',
    date_from: '',
    date_to: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total: 0,
  })
  const hasFetchedRef = useRef(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      }
      const { data } = await api.get('/api/logs', { params })
      setLogs(data.logs)
      setPagination((prev) => ({
        ...prev,
        total: data.total,
      }))
      hasFetchedRef.current = true
    } catch (error) {
      toast.error('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filters])

  useEffect(() => {
    if (shouldFetch && hasFetchedRef.current) {
      fetchLogs()
    }
  }, [pagination.page, filters, shouldFetch, fetchLogs])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  return {
    logs,
    loading,
    filters,
    pagination,
    fetchLogs,
    handleFilterChange,
    setPagination,
  }
}

