const Footer = ({ meta }) => {
  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <footer className="mt-auto bg-white/95 backdrop-blur-lg border-t border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span>⏱️</span>
            <span>Uptime: <strong>{formatUptime(meta?.uptime_seconds)}</strong></span>
          </span>
          <span className="flex items-center gap-2">
            <span>📅</span>
            <span>
              Last Sync:{' '}
              <strong>
                {meta?.last_sync_time ? new Date(meta.last_sync_time).toLocaleString() : 'Never'}
              </strong>
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer

