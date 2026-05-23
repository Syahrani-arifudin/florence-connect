import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
}

// ── Master Data ──────────────────────────
export const masterAPI = {
  getJadwal: () => api.get('/jadwal'),
  getDivisi: () => api.get('/divisi'),
}

// ── Pendaftaran ───────────────────────────
export const pendaftaranAPI = {
  submit: (data) => api.post('/pendaftaran', data),
  status: ()     => api.get('/pendaftaran/status'),
}

// ── Admin ─────────────────────────────────
export const adminAPI = {
  dashboard:     ()       => api.get('/admin/dashboard'),
  getPendaftar:  (params) => api.get('/admin/pendaftar', { params }),
  updateStatus:  (id, data) => api.patch(`/admin/pendaftar/${id}/status`, data),
}

export default api
