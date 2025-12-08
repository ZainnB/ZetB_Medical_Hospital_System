import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Sidebar from '../components/layout/Sidebar'

const DashboardLayout = ({ 
  session, 
  onLogout, 
  activeTab, 
  onTabChange, 
  children,
  meta 
}) => {
  const tabs = [
    { id: 'patients', label: 'Patients' },
    { id: 'users', label: 'Users' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'stats', label: 'Analytics & GDPR' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          role={session.role} 
        />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
      <Footer meta={meta} />
    </div>
  )
}

export default DashboardLayout

