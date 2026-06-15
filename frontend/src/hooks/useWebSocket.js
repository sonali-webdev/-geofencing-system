import { useEffect, useRef, useState } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

export const useWebSocket = (onAlert) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const onAlertRef = useRef(onAlert)
  const MAX_RECONNECT_ATTEMPTS = 5

  useEffect(() => {
    onAlertRef.current = onAlert
  }, [onAlert])

  useEffect(() => {
    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      try {
        console.log('🔌 Connecting to WebSocket...')
        const ws = new WebSocket(`${WS_URL}/ws/alerts`)

        ws.onopen = () => {
          console.log('✅ WebSocket connected!')
          setIsConnected(true)
          setConnectionStatus('Connected')
          reconnectAttemptsRef.current = 0
        }

        ws.onmessage = (event) => {
          try {
            const alert = JSON.parse(event.data)
            console.log('🚨 Alert received:', alert)
            if (onAlertRef.current) {
              onAlertRef.current(alert)
            }
          } catch (err) {
            console.error('Error parsing alert:', err)
          }
        }

        ws.onclose = (event) => {
          console.log('❌ WebSocket disconnected:', event.code)
          setIsConnected(false)
          wsRef.current = null

          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++
            const delay = Math.min(
              1000 * reconnectAttemptsRef.current,
              5000
            )
            setConnectionStatus(`Reconnecting in ${delay / 1000}s...`)

            reconnectTimerRef.current = setTimeout(connect, delay)
          } else {
            setConnectionStatus('Connection failed')
          }
        }

        ws.onerror = () => {
          setConnectionStatus('Error')
        }

        wsRef.current = ws
      } catch (err) {
        console.error('Failed to create WebSocket:', err)
      }
    }
    connect()

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return { isConnected, connectionStatus }
}