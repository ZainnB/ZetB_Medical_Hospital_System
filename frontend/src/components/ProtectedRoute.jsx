import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, session }) => {
  if (!session?.token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default ProtectedRoute

