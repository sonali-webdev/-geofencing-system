import { useState, useCallback } from 'react'
import AlertContext from './AlertContext'

const AlertProvider = ({ children }) => {
  const [liveAlerts, setLiveAlerts] = useState([])

  const addAlert = useCallback((alert) => {
    setLiveAlerts(prev => [alert, ...prev].slice(0, 50))
  }, [])

  const clearAlerts = useCallback(() => {
    setLiveAlerts([])
  }, [])

  return (
    <AlertContext.Provider value={{ liveAlerts, addAlert, clearAlerts }}>
      {children}
    </AlertContext.Provider>
  )
}

export default AlertProvider