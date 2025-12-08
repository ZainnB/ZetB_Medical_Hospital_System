import RoleBadge from './RoleBadge'
import Button from '../ui/Button'

const Header = ({ session, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Hospital Management System
            </h1>
            <div className="flex items-center gap-4">
              <RoleBadge role={session.role} />
              <span className="text-slate-600 font-medium">
                Welcome, <span className="text-slate-900 font-semibold">{session.username}</span>
              </span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header

