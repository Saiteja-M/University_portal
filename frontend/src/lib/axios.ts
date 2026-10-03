import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem(
      'university-auth',
    )

    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)

        const token = parsed?.state?.token

        if (token) {
          config.headers.Authorization = `Token ${token}`
        }
      } catch {
        // Ignore malformed local storage data.
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)