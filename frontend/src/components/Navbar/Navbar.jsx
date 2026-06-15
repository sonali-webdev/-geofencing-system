import { Link, useLocation } from 'react-router-dom'
import {
  Map,
  Truck,
  Bell,
  AlertTriangle,
  LayoutDashboard,
  Activity
} from 'lucide-react'
import useAlerts from '../../context/useAlerts'
import { useWebSocket } from '../../hooks/useWebSocket'
import toast from 'react-hot-toast'

const Navbar = () => {
  const location = useLocation()
  const { addAlert, liveAlerts } = useAlerts()

  const handleAlert = (alert) => {
    addAlert(alert)

    const isRestricted = alert.geofence?.category === 'restricted_zone'

    toast.custom(
      (t) => (
        <div className={`
          ${t.visible ? 'animate-enter' : 'animate-leave'}
          max-w-sm w-full shadow-lg rounded-lg pointer-events-auto
          ${isRestricted
            ? 'bg-red-900 border border-red-500'
            : 'bg-slate-800 border border-slate-600'
          }
          p-4
        `}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className={isRestricted ? 'text-red-400' : 'text-yellow-400'}
              size={20}
            />
            <span className={`
              font-bold text-sm uppercase tracking-wide
              ${isRestricted ? 'text-red-400' : 'text-yellow-400'}
            `}>
              {isRestricted ? '🚨 RESTRICTED ZONE!' : '📍 Geofence Alert'}
            </span>
          </div>

          <div className="text-white text-sm space-y-1">
            <p>
              <span className="text-slate-400">Vehicle: </span>
              <span className="font-semibold">
                {alert.vehicle?.vehicle_number}
              </span>
            </p>
            <p>
              <span className="text-slate-400">Driver: </span>
              {alert.vehicle?.driver_name}
            </p>
            <p>
              <span className="text-slate-400">Zone: </span>
              {alert.geofence?.geofence_name}
            </p>
            <p>
              <span className={`
                font-bold uppercase px-2 py-0.5 rounded text-xs
                ${alert.event_type === 'entry'
                  ? 'bg-green-700 text-green-200'
                  : 'bg-red-700 text-red-200'
                }
              `}>
                {alert.event_type === 'entry' ? '▶ ENTERED' : '◀ EXITED'}
              </span>
            </p>
          </div>

          <p className="text-slate-500 text-xs mt-2">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ),
      {
        duration: isRestricted ? 8000 : 5000,
        position: 'top-right',
      }
    )
  }

  const { isConnected, connectionStatus } = useWebSocket(handleAlert)

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/geofences', label: 'Geofences', icon: Map },
    { path: '/vehicles', label: 'Vehicles', icon: Truck },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/violations', label: 'Violations', icon: AlertTriangle },
  ]

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Map className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">
                GeoTrack
              </h1>
              <p className="text-slate-400 text-xs">
                Real-time Tracking
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon size={16} />
                  {label}
                  {label === 'Alerts' && liveAlerts.length > 0 && (
                    <span className="bg-red-500 text-white text-xs
                      rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {liveAlerts.length}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-2">
            <Activity
              size={16}
              className={isConnected ? 'text-green-400' : 'text-red-400'}
            />
            <span className={`text-xs font-medium hidden sm:block
              ${isConnected ? 'text-green-400' : 'text-red-400'}
            `}>
              {connectionStatus}
            </span>
            <div className={`
              w-2 h-2 rounded-full
              ${isConnected
                ? 'bg-green-400 animate-pulse'
                : 'bg-red-400'
              }
            `} />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navLinks.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                  font-medium whitespace-nowrap transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navbar