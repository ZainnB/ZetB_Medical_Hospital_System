import { useEffect } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import Loader from '../ui/Loader'

const AdminPatients = ({ patients, loading, rawMode, onToggleRawMode, onAnonymize, onExport, onRefresh }) => {
  useEffect(() => {
    const event = new CustomEvent("admin-raw-mode-change", { detail: rawMode })
    window.dispatchEvent(event)
  }, [rawMode])

  const columns = [
    { key: 'patient_id', header: 'ID', render: (row) => <strong>{row.patient_id}</strong> },
    { 
      key: 'name', 
      header: `Name ${rawMode ? '(Raw)' : '(Anonymized)'}`,
      render: (row) => row.name || 'N/A'
    },
    { 
      key: 'contact', 
      header: `Contact ${rawMode ? '(Raw)' : '(Anonymized)'}`,
      render: (row) => row.contact || 'N/A'
    },
    { 
      key: 'diagnosis', 
      header: 'Diagnosis',
      render: (row) => (
        <div className="max-w-[250px] whitespace-pre-wrap">
          {row.diagnosis || 'N/A'}
        </div>
      )
    },
    { 
      key: 'date_added', 
      header: 'Date Added',
      render: (row) => row.date_added ? new Date(row.date_added).toLocaleDateString() : 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onAnonymize(row.patient_id)}
          disabled={loading}
        >
          🔒 Anonymize
        </Button>
      )
    },
  ]

  return (
    <Card glassmorphism className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Administrator Controls</h2>
          <p className="text-slate-600 mb-4">Full visibility with anonymization and export powers.</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rawMode}
              onChange={(e) => onToggleRawMode(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-700">Show Raw Data (Decrypted)</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onRefresh} disabled={loading} variant="secondary">
            {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
          </Button>
          <Button
            onClick={() => onAnonymize(null)}
            disabled={loading || !patients.length}
            variant="danger"
          >
            🔒 Anonymize All
          </Button>
          <Button onClick={onExport} disabled={loading}>
            📥 Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading patient records..." />
      ) : (
        <Table
          columns={columns}
          data={patients}
          emptyMessage="No patient records found."
        />
      )}
    </Card>
  )
}

export default AdminPatients

