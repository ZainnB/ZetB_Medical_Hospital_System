import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import Loader from '../ui/Loader'

const AdminAuditLogs = ({ logs, loading, filters, pagination, onFilterChange, onExport, onRefresh, onPaginationChange }) => {
  const columns = [
    { key: 'log_id', header: 'ID' },
    { key: 'user_id', header: 'User ID', render: (row) => row.user_id || 'N/A' },
    { key: 'role', header: 'Role', render: (row) => row.role || 'N/A' },
    { key: 'action', header: 'Action' },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => new Date(row.timestamp).toLocaleString()
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => (
        <div className="max-w-[300px] truncate">
          {row.details || 'N/A'}
        </div>
      )
    },
  ]

  return (
    <Card glassmorphism className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Integrity Audit Log</h2>
          <p className="text-slate-600">View and export system activity logs.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onRefresh} disabled={loading} variant="secondary">
            Refresh
          </Button>
          <Button onClick={onExport} disabled={loading}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <label>
          <span className="text-xs font-semibold text-slate-700 mb-1 block">Role</span>
          <input
            type="text"
            value={filters.role}
            onChange={(e) => onFilterChange('role', e.target.value)}
            placeholder="Filter by role"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-700 mb-1 block">User ID</span>
          <input
            type="number"
            value={filters.user_id}
            onChange={(e) => onFilterChange('user_id', e.target.value)}
            placeholder="Filter by user ID"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-700 mb-1 block">Action</span>
          <input
            type="text"
            value={filters.action}
            onChange={(e) => onFilterChange('action', e.target.value)}
            placeholder="Filter by action"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-700 mb-1 block">Date From</span>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFilterChange('date_from', e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-700 mb-1 block">Date To</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFilterChange('date_to', e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
          />
        </label>
      </div>

      {loading ? (
        <Loader message="Loading logs..." />
      ) : (
        <>
          <div className="mb-4 text-sm text-slate-600">
            Showing {logs.length} of {pagination.total} logs (Page {pagination.page})
          </div>
          <Table
            columns={columns}
            data={logs}
            emptyMessage="No logs found."
          />
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPaginationChange({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.page_size)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  page: Math.min(Math.ceil(pagination.total / pagination.page_size), pagination.page + 1),
                })
              }
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

export default AdminAuditLogs

