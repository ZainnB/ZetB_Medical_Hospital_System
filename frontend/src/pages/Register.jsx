import AppLayout from '../layouts/AppLayout'
import RegisterForm from '../components/auth/RegisterForm'

const Register = () => {
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <RegisterForm />
      </div>
    </AppLayout>
  )
}

export default Register
