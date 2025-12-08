import { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import Loader from '../ui/Loader'

const ReceptionistDashboard = ({ patients, loading, onAddPatient, onUpdatePatient, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    diagnosis: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingPatient) {
      onUpdatePatient(editingPatient.patient_id, formData)
      setEditingPatient(null)
    } else {
      onAddPatient(formData)
    }
    setFormData({ name: '', contact: '', diagnosis: '' })
    setShowAddForm(false)
  }

  const handleEdit = (patient) => {
    setEditingPatient(patient)
    setFormData({
      name: patient.name || '',
      contact: patient.contact || '',
      diagnosis: patient.diagnosis || '',
    })
    setShowAddForm(true)
  }

  const columns = [
    { key: 'patient_id', header: 'ID' },
    { key: 'diagnosis', header: 'Diagnosis', render: (row) => row.diagnosis || 'n/a' },
    {
      key: 'date_added',
      header: 'Date Added',
      render: (row) =>
        row.date_added ? new Date(row.date_added).toLocaleDateString() : 'n/a'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => handleEdit(row)} disabled={loading}>
          Edit
        </Button>
      )
    },
  ]

  return (
    <Card glassmorphism className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Reception Toolkit</h2>
          <p className="text-slate-600">Add and manage patient records. Sensitive fields are hidden for privacy.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onRefresh} disabled={loading} variant="secondary">
            Refresh
          </Button>
          <Button
            onClick={() => {
              setShowAddForm(true)
              setEditingPatient(null)
              setFormData({ name: '', contact: '', diagnosis: '' })
            }}
            disabled={loading}
          >
            Add Patient
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {editingPatient ? 'Edit Patient' : 'Add New Patient'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label>
                <span className="text-sm font-semibold text-slate-700 mb-2 block">Name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </label>
              <label>
                <span className="text-sm font-semibold text-slate-700 mb-2 block">Contact</span>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </label>
            </div>
            <label>
              <span className="text-sm font-semibold text-slate-700 mb-2 block">Diagnosis</span>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-vertical"
              />
            </label>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {editingPatient ? 'Update' : 'Add'} Patient
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingPatient(null)
                  setFormData({ name: '', contact: '', diagnosis: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Loader message="Loading patients..." />
      ) : (
        <Table
          columns={columns}
          data={patients}
          emptyMessage="No patients yet."
        />
      )}
    </Card>
  )
}

export default ReceptionistDashboard

