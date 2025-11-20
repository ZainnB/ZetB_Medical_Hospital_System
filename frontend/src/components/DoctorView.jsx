const DoctorView = ({ patients, loading }) => (
  <article className="view-card">
    <h2>Doctor Workspace</h2>
    <p>View anonymized patient data for medical review.</p>

    {loading ? (
      <p>Loading patients...</p>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name (Anonymized)</th>
              <th>Contact (Anonymized)</th>
              <th>Diagnosis</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.patient_id}>
                <td>{patient.patient_id}</td>
                <td>{patient.name || 'N/A'}</td>
                <td>{patient.contact || 'N/A'}</td>
                <td>{patient.diagnosis || 'pending'}</td>
                <td>
                  {patient.date_added
                    ? new Date(patient.date_added).toLocaleString()
                    : 'n/a'}
                </td>
              </tr>
            ))}
            {!patients.length && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  No patients assigned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </article>
)

export default DoctorView
