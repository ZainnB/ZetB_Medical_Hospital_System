import { useEffect } from 'react'
const AdminView = ({ patients, loading, rawMode, onToggleRawMode, onAnonymize, onExport, onRefresh }) => {
  useEffect(() => {
    const event = new CustomEvent("admin-raw-mode-change", { detail: rawMode });
    window.dispatchEvent(event);
  }, [rawMode]);
  return (
    <article className="view-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2>Administrator Controls</h2>
          <p>Full visibility with anonymization and export powers.</p>
          <div className="raw-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={rawMode}
                onChange={(e) => onToggleRawMode(e.target.checked)}
              />
              <span>Show Raw Data (Decrypted)</span>
            </label>
          </div>
        </div>
        <div className="toolbar">
          <button className="button" onClick={onRefresh} disabled={loading}>
            {loading ? "⟳ Refreshing..." : "⟳ Refresh"}
          </button>
          <button
            className="button"
            onClick={() => onAnonymize(null)}
            disabled={loading || !patients.length}
          >
            🔒 Anonymize All
          </button>
          <button className="button" onClick={onExport} disabled={loading}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⟳</p>
          <p>Loading patient records...</p>
        </div>
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
                  <td><strong>{patient.patient_id}</strong>
                  </td>
                  <td>{patient.name || "N/A"}</td>
                  <td>{patient.contact || "N/A"}</td>
                  <td style={{ maxWidth: "250px", whiteSpace: "pre-wrap" }}>{patient.diagnosis || "N/A"}</td>
                  <td>{patient.date_added ? new Date(patient.date_added).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <button
                      className="button small"
                      onClick={() => onAnonymize(patient.patient_id)}
                      disabled={loading}
                      title="Anonymize this patient record"
                    >
                      🔒 Anonymize
                    </button>
                  </td>
                </tr>
              ))}
              {!patients.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
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
