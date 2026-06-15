import { useState, useEffect } from 'react'
import { AlertTriangle, Filter, RefreshCw } from 'lucide-react'
import { violationAPI, vehicleAPI, geofenceAPI } from '../services/api'
import toast from 'react-hot-toast'

const Violations = () => {
  const [violations, setViolations] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [vehicles, setVehicles] = useState([])
  const [geofences, setGeofences] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    vehicleId: '',
    geofenceId: '',
    startDate: '',
    endDate: '',
    limit: 50,
  })

  useEffect(() => {
    fetchFilterData()
    fetchViolations()
  }, [])

  const fetchFilterData = async () => {
    try {
      const [vehiclesRes, geofencesRes] = await Promise.all([
        vehicleAPI.getAll(),
        geofenceAPI.getAll(),
      ])
      setVehicles(vehiclesRes.data.vehicles || [])
      setGeofences(geofencesRes.data.geofences || [])
    } catch (err) {
      console.error('Error fetching filter data:', err)
    }
  }

  const fetchViolations = async (currentFilters = filters) => {
    try {
      setLoading(true)
      const res = await violationAPI.getHistory(currentFilters)
      setViolations(res.data.violations || [])
      setTotalCount(res.data.total_count || 0)
    } catch (err) {
      toast.error('Failed to fetch violations')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchViolations(filters)
  }

  const resetFilters = () => {
    const reset = {
      vehicleId: '',
      geofenceId: '',
      startDate: '',
      endDate: '',
      limit: 50,
    }
    setFilters(reset)
    fetchViolations(reset)
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Violations History</h1>
          <p className="text-slate-400 mt-1">
            Historical geofence entry and exit events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">
            Total: <span className="text-white font-bold">{totalCount}</span>
          </span>
          <button
            onClick={() => fetchViolations()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 
              text-white px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-slate-400" size={16} />
          <h2 className="text-white font-medium">Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={filters.vehicleId}
            onChange={e => handleFilterChange('vehicleId', e.target.value)}
            className="bg-slate-900 border border-slate-600 text-white 
              rounded-lg px-3 py-2 text-sm focus:outline-none 
              focus:border-blue-500"
          >
            <option value="">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number}
              </option>
            ))}
          </select>

          <select
            value={filters.geofenceId}
            onChange={e => handleFilterChange('geofenceId', e.target.value)}
            className="bg-slate-900 border border-slate-600 text-white 
              rounded-lg px-3 py-2 text-sm focus:outline-none 
              focus:border-blue-500"
          >
            <option value="">All Geofences</option>
            {geofences.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={filters.startDate}
            onChange={e => handleFilterChange('startDate', 
              e.target.value ? new Date(e.target.value).toISOString() : ''
            )}
            className="bg-slate-900 border border-slate-600 text-white 
              rounded-lg px-3 py-2 text-sm focus:outline-none 
              focus:border-blue-500"
          />

          <input
            type="datetime-local"
            value={filters.endDate}
            onChange={e => handleFilterChange('endDate',
              e.target.value ? new Date(e.target.value).toISOString() : ''
            )}
            className="bg-slate-900 border border-slate-600 text-white 
              rounded-lg px-3 py-2 text-sm focus:outline-none 
              focus:border-blue-500"
          />

          <select
            value={filters.limit}
            onChange={e => handleFilterChange('limit', parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-600 text-white 
              rounded-lg px-3 py-2 text-sm focus:outline-none 
              focus:border-blue-500"
          >
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
            <option value={500}>500 records</option>
          </select>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white 
              px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="bg-slate-700 hover:bg-slate-600 text-white 
              px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">
            Showing {violations.length} of {totalCount} violations
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 
              border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-slate-400">Loading violations...</p>
          </div>
        ) : violations.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="text-slate-600 mx-auto mb-2" size={32} />
            <p className="text-slate-400">No violations found</p>
            <p className="text-slate-500 text-sm mt-1">
              Try updating vehicle locations to generate violations
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 text-sm 
                      font-medium px-4 py-3">Vehicle</th>
                    <th className="text-left text-slate-400 text-sm 
                      font-medium px-4 py-3">Geofence</th>
                    <th className="text-left text-slate-400 text-sm 
                      font-medium px-4 py-3">Event</th>
                    <th className="text-left text-slate-400 text-sm 
                      font-medium px-4 py-3">Location</th>
                    <th className="text-left text-slate-400 text-sm 
                      font-medium px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {violations.map(violation => (
                    <tr
                      key={violation.id}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium text-sm">
                          {violation.vehicle_number}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {violation.vehicle_id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">
                          {violation.geofence_name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {violation.geofence_id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`
                          text-xs font-bold uppercase px-2 py-1 rounded
                          ${violation.event_type === 'entry'
                            ? 'bg-green-900 text-green-400'
                            : 'bg-red-900 text-red-400'
                          }
                        `}>
                          {violation.event_type === 'entry' 
                            ? '▶ ENTERED' 
                            : '◀ EXITED'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300 text-xs font-mono">
                          {violation.latitude?.toFixed(6)},
                          {violation.longitude?.toFixed(6)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300 text-sm">
                          {new Date(violation.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-700">
              {violations.map(violation => (
                <div key={violation.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">
                      {violation.vehicle_number}
                    </p>
                    <span className={`
                      text-xs font-bold uppercase px-2 py-1 rounded
                      ${violation.event_type === 'entry'
                        ? 'bg-green-900 text-green-400'
                        : 'bg-red-900 text-red-400'
                      }
                    `}>
                      {violation.event_type}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {violation.geofence_name}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(violation.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Violations