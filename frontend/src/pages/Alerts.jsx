import { useState, useEffect } from 'react'
import { Bell, Plus, X, Activity } from 'lucide-react'
import { alertAPI, geofenceAPI, vehicleAPI } from '../services/api'
import useAlerts from '../context/useAlerts'
import toast from 'react-hot-toast'

const EVENT_TYPES = ['entry', 'exit', 'both']

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [geofences, setGeofences] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { liveAlerts, clearAlerts } = useAlerts()

  const [form, setForm] = useState({
    geofence_id: '',
    vehicle_id: '',
    event_type: 'entry',
  })

  // ✅ Define BEFORE useEffect
  const fetchData = async () => {
    try {
      setLoading(true)
      const [alertsRes, geofencesRes, vehiclesRes] = await Promise.all([
        alertAPI.getAll(),
        geofenceAPI.getAll(),
        vehicleAPI.getAll(),
      ])
      setAlerts(alertsRes.data.alerts || [])
      setGeofences(geofencesRes.data.geofences || [])
      setVehicles(vehiclesRes.data.vehicles || [])
    } catch {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // ✅ useEffect AFTER
  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await alertAPI.configure(form)
      toast.success('Alert rule configured!')
      setForm({ geofence_id: '', vehicle_id: '', event_type: 'entry' })
      setShowForm(false)
      fetchData()
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to configure alert'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alerts</h1>
          <p className="text-slate-400 mt-1">
            Configure alert rules and view live notifications
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
            text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Configure Alert
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">
              New Alert Rule
            </h2>
            <button onClick={() => setShowForm(false)}>
              <X className="text-slate-400 hover:text-white" size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Geofence *
                </label>
                <select
                  value={form.geofence_id}
                  onChange={e => setForm({...form, geofence_id: e.target.value})}
                  required
                  className="w-full bg-slate-900 border border-slate-600 
                    text-white rounded-lg px-3 py-2 focus:outline-none 
                    focus:border-blue-500"
                >
                  <option value="">Select geofence...</option>
                  {geofences.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Vehicle (optional)
                </label>
                <select
                  value={form.vehicle_id}
                  onChange={e => setForm({...form, vehicle_id: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 
                    text-white rounded-lg px-3 py-2 focus:outline-none 
                    focus:border-blue-500"
                >
                  <option value="">All vehicles</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} - {v.driver_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Event Type *
                </label>
                <select
                  value={form.event_type}
                  onChange={e => setForm({...form, event_type: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 
                    text-white rounded-lg px-3 py-2 focus:outline-none 
                    focus:border-blue-500"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 
              rounded-lg text-blue-300 text-sm">
              💡 If no vehicle selected, alert triggers for ALL vehicles.
            </div>

            <button
              type="submit"
              disabled={submitting || !form.geofence_id}
              className="mt-4 bg-blue-600 hover:bg-blue-700 
                disabled:bg-slate-600 disabled:cursor-not-allowed
                text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Alert Rule'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Rules List */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-white font-semibold">
              Alert Rules ({alerts.length})
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 
                border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-slate-400">Loading...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="text-slate-600 mx-auto mb-2" size={32} />
              <p className="text-slate-400">No alert rules configured</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {alerts.map(alert => (
                <div key={alert.alert_id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {alert.geofence_name || alert.geofence_id}
                      </p>
                      <p className="text-slate-400 text-sm">
                        Vehicle: {alert.vehicle_number || 'All vehicles'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs font-bold uppercase 
                        px-2 py-1 rounded
                        ${alert.event_type === 'entry'
                          ? 'bg-green-900 text-green-400'
                          : alert.event_type === 'exit'
                          ? 'bg-red-900 text-red-400'
                          : 'bg-purple-900 text-purple-400'}`}
                      >
                        {alert.event_type}
                      </span>
                      <span className="text-xs bg-slate-700 text-slate-300 
                        px-2 py-1 rounded">
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="p-4 border-b border-slate-700 flex items-center 
            justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-green-400 animate-pulse" size={20} />
              <h2 className="text-white font-semibold">
                Live Alerts ({liveAlerts.length})
              </h2>
            </div>
            {liveAlerts.length > 0 && (
              <button
                onClick={clearAlerts}
                className="text-slate-400 hover:text-white text-xs 
                  bg-slate-700 px-2 py-1 rounded"
              >
                Clear All
              </button>
            )}
          </div>
          {liveAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="text-slate-600 mx-auto mb-2" size={32} />
              <p className="text-slate-400">No live alerts yet</p>
              <p className="text-slate-500 text-xs mt-1">
                Update a vehicle location to trigger alerts
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {liveAlerts.map((alert, index) => {
                const isRestricted =
                  alert.geofence?.category === 'restricted_zone'
                return (
                  <div
                    key={alert.event_id || index}
                    className={`p-4 ${isRestricted ? 'bg-red-900/20' : ''}`}
                  >
                    {isRestricted && (
                      <div className="text-red-400 text-xs font-bold 
                        uppercase mb-1">
                        🚨 Restricted Zone Alert!
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {alert.vehicle?.vehicle_number}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {alert.geofence?.geofence_name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {alert.vehicle?.driver_name} •{' '}
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`text-xs font-bold uppercase 
                        px-2 py-1 rounded
                        ${alert.event_type === 'entry'
                          ? 'bg-green-900 text-green-400'
                          : 'bg-red-900 text-red-400'}`}
                      >
                        {alert.event_type === 'entry'
                          ? '▶ ENTERED'
                          : '◀ EXITED'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      📍 {alert.location?.latitude?.toFixed(4)},{' '}
                      {alert.location?.longitude?.toFixed(4)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Alerts