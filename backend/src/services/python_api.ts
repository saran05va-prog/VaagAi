/**
 * Python API Service
 * Handles communication with Python FastAPI services
 */

import axios from 'axios'

const PYTHON_API_BASE = process.env.PYTHON_API_URL || 'http://localhost:8002'

export async function pythonApiCall(endpoint: string, data: any): Promise<any> {
  const url = `${PYTHON_API_BASE}${endpoint}`

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout for ML operations
    })
    return response.data
  } catch (error) {
    console.error(`Python API call failed for ${endpoint}:`, error)
    throw error
  }
}

export default {
  pythonApiCall,
}