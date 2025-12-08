const Loader = ({ message = 'Loading...', size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-slate-200 border-t-blue-600`} />
      {message && (
        <p className="mt-4 text-sm text-slate-400 animate-pulse">{message}</p>
      )}
    </div>
  )
}

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded ${className}`}
      {...props}
    />
  )
}

Loader.Skeleton = Skeleton

export default Loader

