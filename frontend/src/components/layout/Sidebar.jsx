const Sidebar = ({ tabs, activeTab, onTabChange, role }) => {
  if (role !== 'admin') return null
  
  return (
    <aside className="w-64 bg-white/95 backdrop-blur-lg border-r border-slate-200 shadow-lg">
      <nav className="p-4">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-slate-700 hover:bg-slate-100 hover:translate-x-1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar

