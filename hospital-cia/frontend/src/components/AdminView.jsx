const AdminView = ({ patients, loading, rawMode, onAnonymize, onExport, onRefresh }) => {
  return (
    <article className="view-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2>Administrator Controls</h2>
          <p>Full visibility with anonymization + export powers.</p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={onRefresh} disabled={loading}>
            Refresh
          </button>
          <button
            className="button"
            onClick={() => onAnonymize(null)}
            disabled={loading || !patients.length}
          >
            Anonymize All
          </button>
          <button className="button" onClick={onExport} disabled={loading}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading patients...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name {rawMode ? '(Raw)' : '(Anonymized)'}</th>
                <th>Contact {rawMode ? '(Raw)' : '(Anonymized)'}</th>
                <th>Diagnosis</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.patient_id}>
                  <td>{patient.patient_id}</td>
                  <td>{patient.name || 'N/A'}</td>
                  <td>{patient.contact || 'N/A'}</td>
                  <td>{patient.diagnosis || 'n/a'}</td>
                  <td>
                    {patient.date_added
                      ? new Date(patient.date_added).toLocaleDateString()
                      : 'n/a'}
                  </td>
                  <td>
                    <button
                      className="button small"
                      onClick={() => onAnonymize(patient.patient_id)}
                      disabled={loading}
                    >
                      Anonymize
                    </button>
                  </td>
                </tr>
              ))}
              {!patients.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No patient records found.
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

export default AdminView
