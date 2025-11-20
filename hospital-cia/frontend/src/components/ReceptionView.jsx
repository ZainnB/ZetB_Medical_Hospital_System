import { useState } from 'react'
import toast from 'react-hot-toast'

const ReceptionView = ({ patients, loading, onAddPatient, onUpdatePatient, onRefresh }) => {
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

  return (
    <article className="view-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2>Reception Toolkit</h2>
          <p>Add and manage patient records. Sensitive fields are hidden for privacy.</p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={onRefresh} disabled={loading}>
            Refresh
          </button>
          <button
            className="button"
            onClick={() => {
              setShowAddForm(true)
              setEditingPatient(null)
              setFormData({ name: '', contact: '', diagnosis: '' })
            }}
            disabled={loading}
          >
            Add Patient
          </button>
        </div>
      </div>

      {showAddForm && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem',
          }}
        >
          <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Name
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Contact
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </label>
            </div>
            <label>
              Diagnosis
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="button" type="submit" disabled={loading}>
                {editingPatient ? 'Update' : 'Add'} Patient
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingPatient(null)
                  setFormData({ name: '', contact: '', diagnosis: '' })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading patients...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Diagnosis</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.patient_id}>
                  <td>{patient.patient_id}</td>
                  <td>{patient.diagnosis || 'n/a'}</td>
                  <td>
                    {patient.date_added
                      ? new Date(patient.date_added).toLocaleDateString()
                      : 'n/a'}
                  </td>
                  <td>
                    <button
                      className="button small"
                      onClick={() => handleEdit(patient)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!patients.length && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No patients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export default ReceptionView
