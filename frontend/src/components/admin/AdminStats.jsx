import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Loader from '../ui/Loader'
import { useActivityStats, useRetentionSettings, useConsentStats } from '../../hooks/useStats'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const AdminStats = () => {
  const [daysFilter, setDaysFilter] = useState(7)
  const [retentionDays, setRetentionDays] = useState(90)
  const [retentionEnabled, setRetentionEnabled] = useState(true)
  const chart1Ref = useRef(null)
  const chart2Ref = useRef(null)
  const chart3Ref = useRef(null)

  const { stats, loading: statsLoading } = useActivityStats(daysFilter, 60000)
  const { settings, loading: retentionLoading, updateSettings } = useRetentionSettings()
  const { stats: consentStats, loading: consentLoading } = useConsentStats(60000)

  // Update retention settings state when fetched
  useEffect(() => {
    if (settings) {
      setRetentionDays(settings.retention_days)
      setRetentionEnabled(settings.enabled)
    }
  }, [settings])

  const handleRetentionUpdate = async () => {
    try {
      await updateSettings(retentionDays, retentionEnabled)
    } catch (error) {
      // Error handled in hook
    }
  }

  const exportChart = (chartRef, filename) => {
    if (!chartRef.current) return
    const url = chartRef.current.toBase64Image('image/png', 1)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`
    link.click()
  }

  const exportDataCSV = (data, labels, filename) => {
    const rows = [['Date', 'Count']]
    labels.forEach((label, idx) => {
      rows.push([label, data[idx]])
    })
    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Chart 1: Actions per day (Line chart)
  const chart1Data = stats
    ? {
        labels: stats.days.map((d) => {
          const date = new Date(d)
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }),
        datasets: [
          {
            label: 'Actions per Day',
            data: stats.actions_per_day,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null

  // Chart 2: Actions by role (Doughnut chart)
  const chart2Data = stats
    ? {
        labels: Object.keys(stats.actions_by_role),
        datasets: [
          {
            data: Object.values(stats.actions_by_role),
            backgroundColor: [
              'rgba(220, 38, 38, 0.8)', // admin - red
              'rgba(37, 99, 235, 0.8)', // doctor - blue
              'rgba(22, 163, 74, 0.8)', // receptionist - green
              'rgba(107, 114, 128, 0.8)', // user - slate
            ],
            borderColor: [
              'rgb(220, 38, 38)',
              'rgb(37, 99, 235)',
              'rgb(22, 163, 74)',
              'rgb(107, 114, 128)',
            ],
            borderWidth: 2,
          },
        ],
      }
    : null

  // Chart 3: Actions by type (Bar chart)
  const chart3Data = stats
    ? {
        labels: Object.keys(stats.actions_by_type),
        datasets: [
          {
            label: 'Action Frequency',
            data: Object.values(stats.actions_by_type),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
  }

  const formatTimeUntil = (date) => {
    if (!date) return 'N/A'
    const now = new Date()
    const target = new Date(date)
    const diff = target - now
    if (diff <= 0) return 'Due now'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Activity Charts Section */}
      <Card glassmorphism className="animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Activity Analytics</h2>
            <p className="text-slate-600">Real-time activity statistics and trends</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={daysFilter === 7 ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDaysFilter(7)}
            >
              7 Days
            </Button>
            <Button
              variant={daysFilter === 30 ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDaysFilter(30)}
            >
              30 Days
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <Loader message="Loading activity statistics..." />
        ) : stats ? (
          <div className="space-y-8">
            {/* Chart 1: Actions per Day */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Actions per Day</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => exportChart(chart1Ref, 'actions_per_day')}
                >
                  Export Image
                </Button>
              </div>
              <div className="h-64">
                <Line ref={chart1Ref} data={chart1Data} options={chartOptions} />
              </div>
            </div>

            {/* Chart 2 and 3: Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Actions by Role */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700">Actions by Role</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => exportChart(chart2Ref, 'actions_by_role')}
                  >
                    Export
                  </Button>
                </div>
                <div className="h-64">
                  <Doughnut ref={chart2Ref} data={chart2Data} options={chartOptions} />
                </div>
              </div>

              {/* Actions by Type */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700">Actions by Type</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => exportChart(chart3Ref, 'actions_by_type')}
                  >
                    Export
                  </Button>
                </div>
                <div className="h-64">
                  <Bar ref={chart3Ref} data={chart3Data} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-12">No data available</p>
        )}
      </Card>

      {/* GDPR Compliance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Retention */}
        <Card glassmorphism className="animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Data Retention</h2>
          <p className="text-slate-600 mb-6">Configure automatic log cleanup</p>

          {retentionLoading ? (
            <Loader message="Loading settings..." />
          ) : settings ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Retention Period (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={retentionEnabled}
                  onChange={(e) => setRetentionEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700">Enable retention policy</span>
              </label>

              {settings.next_purge_date && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Next purge scheduled:</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatTimeUntil(settings.next_purge_date)}
                  </p>
                  {settings.logs_to_delete > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      {settings.logs_to_delete} logs will be deleted
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleRetentionUpdate} disabled={retentionLoading} className="w-full">
                Save Settings
              </Button>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Failed to load settings</p>
          )}
        </Card>

        {/* Consent Statistics */}
        <Card glassmorphism className="animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">GDPR Consent</h2>
          <p className="text-slate-600 mb-6">User consent tracking</p>

          {consentLoading ? (
            <Loader message="Loading consent stats..." />
          ) : consentStats ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {consentStats.consent_percentage.toFixed(1)}%
                </div>
                <p className="text-sm text-slate-600">Users with consent</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">{consentStats.total_users}</div>
                  <div className="text-xs text-slate-600 mt-1">Total Users</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {consentStats.consented_users}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Consented</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Last updated:{' '}
                  {new Date(consentStats.last_updated).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Failed to load consent stats</p>
          )}
        </Card>
      </div>
    </div>
  )
}

export default AdminStats

