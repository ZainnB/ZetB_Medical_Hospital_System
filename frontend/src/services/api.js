import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

const NO_AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/mfa-verify"
];

// Request interceptor: add JWT token
api.interceptors.request.use((config) => {
  const cleanUrl = config.url.split("?")[0];

  if (NO_AUTH_ENDPOINTS.includes(cleanUrl)) {
    return config;
  }

  const stored = window.localStorage.getItem('hospitalSession')
  if (stored) {
    try {
      const { token } = JSON.parse(stored)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // Invalid session data
      window.localStorage.removeItem('hospitalSession')
    }
  }
  return config
})

// Response interceptor: handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      window.localStorage.removeItem('hospitalSession')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
