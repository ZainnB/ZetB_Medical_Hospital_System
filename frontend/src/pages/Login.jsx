import AppLayout from '../layouts/AppLayout'
import LoginForm from '../components/auth/LoginForm'

const Login = ({ onLogin }) => {
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoginForm onLogin={onLogin} />
      </div>
    </AppLayout>
  )
}

export default Login
