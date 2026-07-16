import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

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
  (err) => {
    return Promise.reject(err)
  },
)

export default request
