import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AlertProvider from './context/AlertProvider'  
import Navbar from './components/Navbar/Navbar'
import Dashboard from './pages/Dashboard'
import Geofences from './pages/Geofences'
import Vehicles from './pages/Vehicles'
import Alerts from './pages/Alerts'
import Violations from './pages/Violations'

function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-white">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/geofences" element={<Geofences />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/violations" element={<Violations />} />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AlertProvider>
  )
}

export default App