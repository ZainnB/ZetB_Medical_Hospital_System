import Card from '../ui/Card'
import Table from '../ui/Table'
import Loader from '../ui/Loader'

const DoctorDashboard = ({ patients, loading }) => {
  const columns = [
    { key: 'patient_id', header: 'Patient ID' },
    { key: 'name', header: 'Name (Anonymized)', render: (row) => row.name || 'N/A' },
    { key: 'contact', header: 'Contact (Anonymized)', render: (row) => row.contact || 'N/A' },
    { key: 'diagnosis', header: 'Diagnosis', render: (row) => row.diagnosis || 'pending' },
    {
      key: 'date_added',
      header: 'Date Added',
      render: (row) =>
        row.date_added ? new Date(row.date_added).toLocaleString() : 'n/a'
    },
  ]

  return (
    <Card glassmorphism className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Doctor Workspace</h2>
      <p className="text-slate-600 mb-6">View anonymized patient data for medical review.</p>

      {loading ? (
        <Loader message="Loading patients..." />
      ) : (
        <Table
          columns={columns}
          data={patients}
          emptyMessage="No patients assigned."
        />
      )}
    </Card>
  )
}

export default DoctorDashboard

