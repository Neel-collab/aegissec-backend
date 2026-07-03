import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE })

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aegis_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Bypass-Tunnel-Reminder'] = 'true'
  return config
})

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aegis_token')
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/face-login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/api/v1/auth/login', form)
  },
  register: (data: { email: string; full_name: string; password: string; department?: string }) =>
    api.post('/api/v1/auth/register', data),
  verifyMFA: (user_id: string, otp: string) =>
    api.post('/api/v1/auth/verify-mfa', { user_id, otp }),
  forgotPassword: (email: string) =>
    api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (user_id: string, otp: string, new_password: string) =>
    api.post('/api/v1/auth/reset-password', { user_id, otp, new_password }),
  getMe: () => api.get('/api/v1/auth/me'),
  updateMe: (data: object) => api.put('/api/v1/auth/me', data),
  changePassword: (current_password: string, new_password: string) =>
    api.put('/api/v1/auth/me/change-password', { current_password, new_password }),
  toggleMFA: () => api.put('/api/v1/auth/me/toggle-mfa'),
  enrollFace: (user_id: string, image_base64: string) =>
    api.post('/api/v1/auth/enroll-face', { user_id, image_base64 }),
  faceLogin: (email: string, image_base64: string) =>
    api.post('/api/v1/auth/face-login', { email, image_base64 }),
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/api/v1/dashboard/stats'),
}

// ── Incidents ────────────────────────────────────────────────────────────────
export const incidentsAPI = {
  getAll: (params?: object) => api.get('/api/v1/incidents/', { params }),
  getOne: (id: string) => api.get(`/api/v1/incidents/${id}`),
  create: (data: object) => api.post('/api/v1/incidents/', data),
  update: (id: string, data: object) => api.put(`/api/v1/incidents/${id}`, data),
}

// ── Threats ──────────────────────────────────────────────────────────────────
export const threatsAPI = {
  getAll: (params?: object) => api.get('/api/v1/threats/', { params }),
  getOne: (id: string) => api.get(`/api/v1/threats/${id}`),
  create: (data: object) => api.post('/api/v1/threats/', data),
  update: (id: string, data: object) => api.put(`/api/v1/threats/${id}`, data),
  getStats: () => api.get('/api/v1/threats/stats/summary'),
}

// ── Assets ───────────────────────────────────────────────────────────────────
export const assetsAPI = {
  getAll: (params?: object) => api.get('/api/v1/assets/', { params }),
  getOne: (id: string) => api.get(`/api/v1/assets/${id}`),
  create: (data: object) => api.post('/api/v1/assets/', data),
  update: (id: string, data: object) => api.put(`/api/v1/assets/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/assets/${id}`),
  getStats: () => api.get('/api/v1/assets/stats/summary'),
}

// ── Compliance ───────────────────────────────────────────────────────────────
export const complianceAPI = {
  getAll: () => api.get('/api/v1/compliance/'),
  getOne: (id: string) => api.get(`/api/v1/compliance/${id}`),
  updateControl: (framework_id: string, control_id: string, data: object) =>
    api.put(`/api/v1/compliance/${framework_id}/controls/${control_id}`, data),
}

// ── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  analyzeURL: (url: string) => api.post('/api/v1/ai/analyze-url', { url }),
  analyzeNetwork: (features: number[]) => api.post('/api/v1/ai/analyze-network', { features }),
  chat: (message: string, history: object[]) =>
    api.post('/api/v1/assistant/chat', { message, history }),
}
