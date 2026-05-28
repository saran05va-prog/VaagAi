import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vaagai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      // Only redirect if not already on login/register pages
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('vaagai_token')
        localStorage.removeItem('vaagai_user_id')
        window.location.href = '/login'
      }
    }
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 30
      console.log(`Rate limited. Retrying in ${retryAfter} seconds`)
    }
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      console.error('Network error - API may be unreachable')
    }
    return Promise.reject(error)
  }
)

export default api