const Card = ({ children, className = '', glassmorphism = false, ...props }) => {
  const baseClasses = 'rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl'
  
  const styleClasses = glassmorphism
    ? 'bg-white/80 backdrop-blur-lg border border-white/20'
    : 'bg-white border border-slate-200'
  
  return (
    <div className={`${baseClasses} ${styleClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card

