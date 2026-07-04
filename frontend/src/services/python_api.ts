import axios from 'axios'

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8002'

export async function pythonApiCall(endpoint: string, data: any) {
  const response = await axios.post(`${PYTHON_API_URL}${endpoint}`, data, {
    headers: { 'Content-Type': 'application/json' }
  })
  return response.data
}