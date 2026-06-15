import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
})

export const geofenceAPI = {
  create: (data) => api.post('/geofences', data),
 
  getAll: (category = '') => {
    const params = category ? { category } : {}
    return api.get('/geofences', { params })
  },
}

export const vehicleAPI = {
  create: (data) => api.post('/vehicles', data),
  getAll: () => api.get('/vehicles'),
  updateLocation: (data) => api.post('/vehicles/location', data),
  getLocation: (vehicleId) => api.get(`/vehicles/location/${vehicleId}`),
}

export const alertAPI = {
  configure: (data) => api.post('/alerts/configure', data),
  
  getAll: (geofenceId = '', vehicleId = '') => {
    const params = {}
    if (geofenceId) params.geofence_id = geofenceId
    if (vehicleId) params.vehicle_id = vehicleId
    return api.get('/alerts', { params })
  },
}

export const violationAPI = {
  getHistory: (filters = {}) => {
    const params = {}
    if (filters.vehicleId) params.vehicle_id = filters.vehicleId
    if (filters.geofenceId) params.geofence_id = filters.geofenceId
    if (filters.startDate) params.start_date = filters.startDate
    if (filters.endDate) params.end_date = filters.endDate
    if (filters.limit) params.limit = filters.limit
    return api.get('/violations/history', { params })
  },
}

export default api