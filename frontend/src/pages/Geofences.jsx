import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from 'react-leaflet'
import { Map, Plus, X, Filter } from 'lucide-react'
import { geofenceAPI } from '../services/api'
import toast from 'react-hot-toast'

const CATEGORY_COLORS = {
  delivery_zone: '#3b82f6',
  restricted_zone: '#ef4444',
  toll_zone: '#f59e0b',
  customer_area: '#10b981',
}

const CATEGORIES = [
  'delivery_zone',
  'restricted_zone',
  'toll_zone',
  'customer_area'
]

const MapClickHandler = ({ isDrawing, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onMapClick([e.latlng.lat, e.latlng.lng])
      }
    }
  })
  return null
}

const Geofences = () => {
  const [geofences, setGeofences] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'delivery_zone',
    coordinates: [],
  })

  // ✅ Define function BEFORE useEffect
  const fetchGeofences = async () => {
    try {
      setLoading(true)
      const res = await geofenceAPI.getAll(filterCategory)
      setGeofences(res.data.geofences || [])
    } catch {
      toast.error('Failed to fetch geofences')
    } finally {
      setLoading(false)
    }
  }

  // ✅ useEffect AFTER function
  useEffect(() => {
    fetchGeofences()
  }, [filterCategory])

  const handleMapClick = (coord) => {
    setForm(prev => ({
      ...prev,
      coordinates: [...prev.coordinates, coord]
    }))
  }

  const undoLastPoint = () => {
    setForm(prev => ({
      ...prev,
      coordinates: prev.coordinates.slice(0, -1)
    }))
  }

  const closePolygon = () => {
    if (form.coordinates.length < 3) {
      toast.error('Need at least 3 points!')
      return
    }
    const first = form.coordinates[0]
    setForm(prev => ({
      ...prev,
      coordinates: [...prev.coordinates, first]
    }))
    setIsDrawing(false)
    toast.success('Polygon closed! Fill form and submit.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.coordinates.length < 4) {
      toast.error('Draw at least 3 points and close the polygon!')
      return
    }

    const first = form.coordinates[0]
    const last = form.coordinates[form.coordinates.length - 1]
    let coords = form.coordinates
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords = [...form.coordinates, first]
    }

    try {
      setSubmitting(true)
      await geofenceAPI.create({
        name: form.name,
        description: form.description,
        category: form.category,
        coordinates: coords,
      })
      toast.success(`Geofence "${form.name}" created!`)
      setForm({
        name: '',
        description: '',
        category: 'delivery_zone',
        coordinates: [],
      })
      setShowForm(false)
      setIsDrawing(false)
      fetchGeofences()
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to create geofence'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category: 'delivery_zone',
      coordinates: [],
    })
    setIsDrawing(false)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Geofences</h1>
          <p className="text-slate-400 mt-1">
            Create and manage virtual boundary zones
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
            text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Create Geofence
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">
              Create New Geofence
            </h2>
            <button onClick={resetForm}>
              <X className="text-slate-400 hover:text-white" size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Downtown Delivery Zone"
                  className="w-full bg-slate-900 border border-slate-600 
                    text-white rounded-lg px-3 py-2 focus:outline-none 
                    focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-600 
                    text-white rounded-lg px-3 py-2 focus:outline-none 
                    focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 
                    text-white rounded-lg px-3 py-2 focus:outline-none 
                    focus:border-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drawing Controls */}
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-slate-300 text-sm font-medium mb-3">
                  Draw on Map
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isDrawing ? (
                    <button
                      type="button"
                      onClick={() => setIsDrawing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white 
                        px-3 py-1.5 rounded-lg text-sm"
                    >
                      ✏️ Start Drawing
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsDrawing(false)}
                        className="bg-slate-600 hover:bg-slate-700 text-white 
                          px-3 py-1.5 rounded-lg text-sm"
                      >
                        ⏸️ Pause
                      </button>
                      <button
                        type="button"
                        onClick={undoLastPoint}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white 
                          px-3 py-1.5 rounded-lg text-sm"
                      >
                        ↩️ Undo
                      </button>
                      <button
                        type="button"
                        onClick={closePolygon}
                        className="bg-green-600 hover:bg-green-700 text-white 
                          px-3 py-1.5 rounded-lg text-sm"
                      >
                        ✅ Close Polygon
                      </button>
                    </>
                  )}
                  {form.coordinates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({...form, coordinates: []})}
                      className="bg-red-600 hover:bg-red-700 text-white 
                        px-3 py-1.5 rounded-lg text-sm"
                    >
                      🗑️ Clear
                    </button>
                  )}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  {isDrawing && (
                    <p className="text-blue-400">
                      🖱️ Click on map to add points...
                    </p>
                  )}
                  <p>Points added: {form.coordinates.length}</p>
                  {form.coordinates.length >= 4 && (
                    <p className="text-green-400">✅ Polygon ready!</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name || form.coordinates.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700 
                  disabled:bg-slate-600 disabled:cursor-not-allowed 
                  text-white py-2 rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Geofence'}
              </button>
            </div>

            {/* Map for Drawing */}
            <div className="h-80 rounded-lg overflow-hidden border border-slate-600">
              <MapContainer
                center={[37.7749, -122.4194]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <MapClickHandler
                  isDrawing={isDrawing}
                  onMapClick={handleMapClick}
                />
                {form.coordinates.length >= 3 && (
                  <Polygon
                    positions={form.coordinates}
                    pathOptions={{
                      color: CATEGORY_COLORS[form.category],
                      fillOpacity: 0.3,
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={16} />
          <span className="text-slate-400 text-sm">Filter:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3 py-1 rounded-full text-xs font-medium
              ${filterCategory === ''
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium
                ${filterCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* All Geofences Map */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">All Geofences Map</h2>
        </div>
        <div style={{ height: '400px' }}>
          <MapContainer
            center={[37.7749, -122.4194]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {geofences.map(geofence => (
              <Polygon
                key={geofence.id}
                positions={geofence.coordinates}
                pathOptions={{
                  color: CATEGORY_COLORS[geofence.category] || '#3b82f6',
                  fillOpacity: 0.3,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{geofence.name}</p>
                    <p className="text-gray-600">{geofence.category}</p>
                    {geofence.description && <p>{geofence.description}</p>}
                  </div>
                </Popup>
              </Polygon>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Geofences List */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">
            Geofences ({geofences.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 
              border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        ) : geofences.length === 0 ? (
          <div className="p-8 text-center">
            <Map className="text-slate-600 mx-auto mb-2" size={32} />
            <p className="text-slate-400">No geofences found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {geofences.map(geofence => (
              <div
                key={geofence.id}
                className="p-4 flex items-center justify-between 
                  hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[geofence.category]
                    }}
                  />
                  <div>
                    <p className="text-white font-medium">{geofence.name}</p>
                    {geofence.description && (
                      <p className="text-slate-400 text-sm">
                        {geofence.description}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs">
                      {geofence.coordinates?.length} points •
                      Created {new Date(geofence.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full
                    ${geofence.category === 'restricted_zone'
                      ? 'bg-red-900 text-red-400'
                      : geofence.category === 'delivery_zone'
                      ? 'bg-blue-900 text-blue-400'
                      : geofence.category === 'toll_zone'
                      ? 'bg-yellow-900 text-yellow-400'
                      : 'bg-green-900 text-green-400'}`}
                  >
                    {geofence.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-green-400 bg-green-900 
                    px-2 py-1 rounded-full">
                    {geofence.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Geofences