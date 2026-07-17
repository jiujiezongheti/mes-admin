import axios from 'axios'
import { refreshToken } from '@/api/auth'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

function getPayload(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (res) => {
    if (res.data.code !== 0) {
      return Promise.reject(new Error(res.data.message))
    }
    return res.data
  },
  async (err) => {
    if (err.response?.status !== 401) {
      return Promise.reject(err)
    }

    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return Promise.reject(err)
    }

    const payload = getPayload(token)
    if (!payload || payload.refresh_exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(err)
    }

    if (!isRefreshing) {
      isRefreshing = true
      try {
        const res = await refreshToken()
        const newToken = res.data.token as string
        localStorage.setItem('token', newToken)
        if (res.data.permissions) {
          localStorage.setItem('permissions', JSON.stringify(res.data.permissions))
        }
        isRefreshing = false
        pendingQueue.forEach((cb) => cb(newToken))
        pendingQueue = []
        err.config.headers.Authorization = `Bearer ${newToken}`
        return request(err.config)
      } catch {
        isRefreshing = false
        pendingQueue = []
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }

    return new Promise((resolve) => {
      pendingQueue.push((newToken: string) => {
        err.config.headers.Authorization = `Bearer ${newToken}`
        resolve(request(err.config))
      })
    })
  },
)

export default request
