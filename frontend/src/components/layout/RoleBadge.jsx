const RoleBadge = ({ role, className = '' }) => {
  const roleColors = {
    admin: 'bg-red-600',
    doctor: 'bg-blue-600',
    receptionist: 'bg-green-600',
    user: 'bg-slate-600',
  }
  
  const baseClasses = 'px-3 py-1.5 rounded-lg text-white text-xs font-bold uppercase tracking-wider shadow-md'
  
  return (
    <span className={`${baseClasses} ${roleColors[role] || 'bg-slate-600'} ${className}`}>
      {role}
    </span>
  )
}

export default RoleBadge

