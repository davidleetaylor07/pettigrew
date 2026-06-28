import { getCfg } from '../store/config.js'

export function isConfigured() {
  return !!(getCfg('hub_url') && getCfg('hub_app_id') && getCfg('hub_token'))
}

function apiBase() {
  return `${getCfg('hub_url').replace(/\/$/, '')}/apps/api/${getCfg('hub_app_id')}`
}

async function apiFetch(path) {
  const token = getCfg('hub_token')
  const sep = path.includes('?') ? '&' : '?'
  const url = `${apiBase()}${path}${sep}access_token=${token}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`)
  return res.json()
}

export async function fetchDevice(id) {
  if (!id) return null
  return apiFetch(`/devices/${id}`)
}

// Hubitat Maker API uses GET for commands
export async function sendCommand(deviceId, command, arg = null) {
  if (!deviceId) return null
  const path = arg != null ? `/devices/${deviceId}/${command}/${arg}` : `/devices/${deviceId}/${command}`
  return apiFetch(path)
}

// Extract an attribute's currentValue from a device object
export function attr(device, name) {
  if (!device?.attributes) return null
  const a = device.attributes.find(x => x.name === name)
  return a != null ? a.currentValue : null
}

// Parse a numeric attribute, return null if missing/NaN
export function num(device, name, decimals = null) {
  const v = attr(device, name)
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(v)
  if (isNaN(n)) return null
  return decimals != null ? parseFloat(n.toFixed(decimals)) : n
}

// Format for display — returns '—' for null
export function disp(val, decimals = 1, suffix = '') {
  if (val === null || val === undefined) return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return String(val)
  return n.toFixed(decimals) + suffix
}

// Watts → display string (auto kW)
export function dispPower(watts) {
  if (watts === null) return '—'
  if (watts >= 1000) return (watts / 1000).toFixed(2) + ' kW'
  return Math.round(watts) + ' W'
}

// Dew point approximation (F)
export function dewPoint(tempF, rh) {
  if (tempF === null || rh === null) return null
  return parseFloat((tempF - ((100 - rh) / 5)).toFixed(1))
}
