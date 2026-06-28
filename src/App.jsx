import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { fetchDevice, isConfigured as apiIsConfigured } from './api/hubitat.js'
import { collectAllDeviceIds, isConfigured } from './store/config.js'
import Layout from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Outside from './pages/Outside.jsx'
import MainLevel from './pages/MainLevel.jsx'
import Upstairs from './pages/Upstairs.jsx'
import './styles/globals.css'

export const DeviceCtx = createContext(null)
export const useDevices = () => useContext(DeviceCtx)

export default function App() {
  const [devices, setDevices]       = useState({})
  const [status, setStatus]         = useState('idle')   // idle | loading | ok | error | unconfigured
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!isConfigured()) {
      setStatus('unconfigured')
      return
    }
    setStatus('loading')
    try {
      const ids = collectAllDeviceIds()
      if (!ids.length) {
        setStatus('ok')
        setLastUpdated(new Date())
        return
      }
      const results = await Promise.allSettled(
        ids.map(id => fetchDevice(id).then(d => [id, d]))
      )
      const map = {}
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value?.[1]) {
          map[r.value[0]] = r.value[1]
        }
      })
      setDevices(map)
      setStatus('ok')
      setLastUpdated(new Date())
    } catch {
      setStatus('error')
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(refresh, 30_000)
  }, [])

  useEffect(() => {
    refresh()
    return () => clearTimeout(timerRef.current)
  }, [refresh])

  // Helpers consumed by pages/components
  const getDevice = (id) => (id ? devices[id] ?? null : null)

  const ctx = { devices, status, lastUpdated, refresh, getDevice }

  return (
    <DeviceCtx.Provider value={ctx}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/"         element={<Overview />} />
            <Route path="/outside"  element={<Outside />} />
            <Route path="/main"     element={<MainLevel />} />
            <Route path="/upstairs" element={<Upstairs />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DeviceCtx.Provider>
  )
}
