import { useState, useEffect } from 'react'
import { 
  Map, 
  Truck, 
  Bell, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react'
import { geofenceAPI, vehicleAPI, alertAPI, violationAPI } from '../services/api'
import useAlerts from '../context/useAlerts'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalGeofences: 0,
    totalVehicles: 0,
    totalAlerts: 0,
    totalViolations: 0,
  })
  const [recentViolations, setRecentViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const { liveAlerts } = useAlerts()

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [geofencesRes, vehiclesRes, alertsRes, violationsRes] = 
        await Promise.all([
          geofenceAPI.getAll(),
          vehicleAPI.getAll(),
          alertAPI.getAll(),
          violationAPI.getHistory({ limit: 5 }),
        ])
      setStats({
        totalGeofences: geofencesRes.data.geofences?.length || 0,
        totalVehicles: vehiclesRes.data.vehicles?.length || 0,
        totalAlerts: alertsRes.data.alerts?.length || 0,
        totalViolations: violationsRes.data.total_count || 0,
      })
      setRecentViolations(violationsRes.data.violations || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Geofences',
      value: stats.totalGeofences,
      icon: Map,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Registered Vehicles',
      value: stats.totalVehicles,
      icon: Truck,
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      title: 'Alert Rules',
      value: stats.totalAlerts,
      icon: Bell,
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    {
      title: 'Total Violations',
      value: stats.totalViolations,
      icon: AlertTriangle,
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Real-time overview of your geofencing system
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ title, value, icon: Icon, bg, border, iconColor }) => (
            <div
              key={title}
              className={`${bg} ${border} border rounded-xl p-6 
                transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={iconColor} size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-green-400 text-xs">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Violations */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" size={20} />
            <h2 className="text-white font-semibold text-lg">
              Recent Violations
            </h2>
          </div>
          {recentViolations.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="text-slate-600 mx-auto mb-2" size={32} />
              <p className="text-slate-500">No violations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="flex items-center justify-between 
                    bg-slate-900 rounded-lg p-3"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {violation.vehicle_number}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {violation.geofence_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`
                      text-xs font-bold uppercase px-2 py-1 rounded
                      ${violation.event_type === 'entry'
                        ? 'bg-green-900 text-green-400'
                        : 'bg-red-900 text-red-400'}
                    `}>
                      {violation.event_type}
                    </span>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(violation.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-green-400 animate-pulse" size={20} />
            <h2 className="text-white font-semibold text-lg">
              Live Alert Feed
            </h2>
            {liveAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs 
                rounded-full px-2 py-0.5">
                {liveAlerts.length}
              </span>
            )}
          </div>
          {liveAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="text-slate-600 mx-auto mb-2" size={32} />
              <p className="text-slate-500">Waiting for live alerts...</p>
              <p className="text-slate-600 text-xs mt-1">
                Alerts appear here when vehicles cross geofences
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {liveAlerts.map((alert, index) => (
                <div
                  key={alert.event_id || index}
                  className={`rounded-lg p-3 border
                    ${alert.geofence?.category === 'restricted_zone'
                      ? 'bg-red-900/30 border-red-700'
                      : 'bg-slate-900 border-slate-700'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {alert.vehicle?.vehicle_number}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {alert.geofence?.geofence_name}
                      </p>
                    </div>
                    <span className={`
                      text-xs font-bold uppercase px-2 py-1 rounded
                      ${alert.event_type === 'entry'
                        ? 'bg-green-900 text-green-400'
                        : 'bg-red-900 text-red-400'}
                    `}>
                      {alert.event_type}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard