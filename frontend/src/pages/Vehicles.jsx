import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Truck, Plus, X, Navigation } from 'lucide-react'
import L from 'leaflet'
import { vehicleAPI } from '../services/api'
import toast from 'react-hot-toast'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const VEHICLE_TYPES = ['truck', 'car', 'van', 'motorcycle']

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicleLocations, setVehicleLocations] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    vehicle_number: '',
    driver_name: '',
    vehicle_type: 'truck',
    phone: '',
  })

  const [locationForm, setLocationForm] = useState({
    latitude: '',
    longitude: '',
    timestamp: new Date().toISOString().slice(0, 16),
  })

  const fetchVehicleLocation = useCallback(async (vehicleId) => {
    try {
      const res = await vehicleAPI.getLocation(vehicleId)
      if (res.data.current_location) {
        setVehicleLocations(prev => ({
          ...prev,
          [vehicleId]: res.data
        }))
      }
    } catch {
      // No location yet
    }
  }, [])

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await vehicleAPI.getAll()
      const vehicleList = res.data.vehicles || []
      setVehicles(vehicleList)
      vehicleList.forEach(v => fetchVehicleLocation(v.id))
    } catch {
      toast.error('Failed to fetch vehicles')
    } finally {
      setLoading(false)
    }
  }, [fetchVehicleLocation])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const handleRegisterVehicle = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await vehicleAPI.create(form)
      toast.success(`Vehicle ${form.vehicle_number} registered!`)
      setForm({
        vehicle_number: '',
        driver_name: '',
        vehicle_type: 'truck',
        phone: '',
      })
      setShowForm(false)
      fetchVehicles()
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to register vehicle'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateLocation = async (e) => {
    e.preventDefault()
    if (!selectedVehicle) return
    try {
      setSubmitting(true)
      const res = await vehicleAPI.updateLocation({
        vehicle_id: selectedVehicle.id,
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude),
        timestamp: new Date(locationForm.timestamp).toISOString(),
      })
      const geofences = res.data.current_geofences || []
      if (geofences.length > 0) {
        toast.success(
          `Location updated! Inside: ${geofences.map(g => g.geofence_name).join(', ')}`,
          { duration: 5000 }
        )
      } else {
        toast.success('Location updated! Outside all geofences.')
      }
      setShowLocationForm(false)
      fetchVehicleLocation(selectedVehicle.id)
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update location'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const vehiclesWithLocations = vehicles.filter(v => vehicleLocations[v.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vehicles</h1>
          <p className="text-slate-400 mt-1">
            Register and track vehicles in real-time
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Register Vehicle
        </button>
      </div>

      {/* Register Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">
              Register New Vehicle
            </h2>
            <button onClick={() => setShowForm(false)}>
              <X className="text-slate-400 hover:text-white" size={20} />
            </button>
          </div>
          <form onSubmit={handleRegisterVehicle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  value={form.vehicle_number}
                  onChange={e => setForm({...form, vehicle_number: e.target.value})}
                  placeholder="e.g. KA-01-AB-1234"
                  required
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  value={form.driver_name}
                  onChange={e => setForm({...form, driver_name: e.target.value})}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={form.vehicle_type}
                  onChange={e => setForm({...form, vehicle_type: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                >
                  {VEHICLE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="e.g. +1234567890"
                  required
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 bg-blue-600 hover:bg-blue-700
                disabled:bg-slate-600 text-white px-6 py-2
                rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Registering...' : 'Register Vehicle'}
            </button>
          </form>
        </div>
      )}

      {showLocationForm && selectedVehicle && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">
              Update Location: {selectedVehicle.vehicle_number}
            </h2>
            <button onClick={() => setShowLocationForm(false)}>
              <X className="text-slate-400 hover:text-white" size={20} />
            </button>
          </div>
          <form onSubmit={handleUpdateLocation}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationForm.latitude}
                  onChange={e => setLocationForm({
                    ...locationForm, latitude: e.target.value
                  })}
                  placeholder="e.g. 37.7749"
                  required
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationForm.longitude}
                  onChange={e => setLocationForm({
                    ...locationForm, longitude: e.target.value
                  })}
                  placeholder="e.g. -122.4194"
                  required
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Timestamp *
                </label>
                <input
                  type="datetime-local"
                  value={locationForm.timestamp}
                  onChange={e => setLocationForm({
                    ...locationForm, timestamp: e.target.value
                  })}
                  className="w-full bg-slate-900 border border-slate-600
                    text-white rounded-lg px-3 py-2 focus:outline-none
                    focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-900 rounded-lg">
              <p className="text-slate-400 text-xs mb-2">
                💡 Quick test coordinates:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Inside Zone', lat: '37.7799', lng: '-122.4144' },
                  { label: 'Outside Zone', lat: '37.7600', lng: '-122.4000' },
                  { label: 'City Center', lat: '37.7749', lng: '-122.4194' },
                ].map(({ label, lat, lng }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setLocationForm({
                      ...locationForm,
                      latitude: lat,
                      longitude: lng,
                    })}
                    className="text-xs bg-slate-700 hover:bg-slate-600
                      text-slate-300 px-2 py-1 rounded"
                  >
                    {label} ({lat}, {lng})
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 bg-green-600 hover:bg-green-700
                disabled:bg-slate-600 text-white px-6 py-2
                rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Updating...' : '📍 Update Location'}
            </button>
          </form>
        </div>
      )}

      {/* Vehicles Map */}
      {vehiclesWithLocations.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-white font-semibold">Vehicle Locations</h2>
          </div>
          <div style={{ height: '350px' }}>
            <MapContainer
              center={[
                vehicleLocations[vehiclesWithLocations[0].id]
                  ?.current_location?.latitude || 37.7749,
                vehicleLocations[vehiclesWithLocations[0].id]
                  ?.current_location?.longitude || -122.4194,
              ]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {vehiclesWithLocations.map(vehicle => {
                const locData = vehicleLocations[vehicle.id]
                const loc = locData?.current_location
                if (!loc) return null
                return (
                  <Marker
                    key={vehicle.id}
                    position={[loc.latitude, loc.longitude]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{vehicle.vehicle_number}</p>
                        <p>Driver: {vehicle.driver_name}</p>
                        <p>Type: {vehicle.vehicle_type}</p>
                        {locData.current_geofences?.length > 0 && (
                          <p className="text-green-600">
                            Inside: {locData.current_geofences
                              .map(g => g.geofence_name).join(', ')}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">
            Vehicles ({vehicles.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500
              border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="text-slate-600 mx-auto mb-2" size={32} />
            <p className="text-slate-400">No vehicles registered yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Click Register Vehicle to add one
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {vehicles.map(vehicle => {
              const locData = vehicleLocations[vehicle.id]
              return (
                <div
                  key={vehicle.id}
                  className="p-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600/20 p-2 rounded-lg">
                        <Truck className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {vehicle.vehicle_number}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {vehicle.driver_name} • {vehicle.vehicle_type} • {vehicle.phone}
                        </p>
                        {locData?.current_geofences?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {locData.current_geofences.map(g => (
                              <span
                                key={g.geofence_id}
                                className="text-xs bg-green-900 text-green-400
                                  px-2 py-0.5 rounded-full"
                              >
                                📍 {g.geofence_name}
                              </span>
                            ))}
                          </div>
                        )}
                        {locData?.current_location && (
                          <p className="text-slate-500 text-xs mt-0.5">
                            Last: {locData.current_location.latitude.toFixed(4)},{' '}
                            {locData.current_location.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400 bg-green-900
                        px-2 py-1 rounded-full">
                        {vehicle.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setShowLocationForm(true)
                          setShowForm(false)
                        }}
                        className="flex items-center gap-1 bg-green-600
                          hover:bg-green-700 text-white px-3 py-1.5
                          rounded-lg text-sm transition-colors"
                      >
                        <Navigation size={14} />
                        Update Location
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Vehicles