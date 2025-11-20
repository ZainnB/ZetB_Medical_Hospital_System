import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

const AuditLogView = ({ onExport }) => {
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

  const fetchLogs = async () => {
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
    } catch (error) {
      toast.error('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleExport = () => {
    onExport('logs')
  }

  return (
    <article className="view-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2>Integrity Audit Log</h2>
          <p>View and export system activity logs.</p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={fetchLogs} disabled={loading}>
            Refresh
          </button>
          <button className="button" onClick={handleExport} disabled={loading}>
            Export CSV
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <label>
          Role
          <input
            type="text"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            placeholder="Filter by role"
          />
        </label>
        <label>
          User ID
          <input
            type="number"
            value={filters.user_id}
            onChange={(e) => handleFilterChange('user_id', e.target.value)}
            placeholder="Filter by user ID"
          />
        </label>
        <label>
          Action
          <input
            type="text"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            placeholder="Filter by action"
          />
        </label>
        <label>
          Date From
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </label>
        <label>
          Date To
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {logs.length} of {pagination.total} logs (Page {pagination.page})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id}>
                    <td>{log.log_id}</td>
                    <td>{log.user_id || 'N/A'}</td>
                    <td>{log.role || 'N/A'}</td>
                    <td>{log.action}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.details || 'N/A'}
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              className="button small"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.page_size)}
            </span>
            <button
              className="button small"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(Math.ceil(prev.total / prev.page_size), prev.page + 1),
                }))
              }
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </article>
  )
}

export default AuditLogView

