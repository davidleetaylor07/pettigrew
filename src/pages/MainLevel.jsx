import { useState } from 'react'
import { useDevices } from '../App.jsx'
import { getCfg, parseDeviceList } from '../store/config.js'
import { attr, num, sendCommand, dewPoint } from '../api/hubitat.js'

// ── HVAC Full Card ────────────────────────────────────────────────────────────

function HvacCard({ device, deviceId, label }) {
  const temp     = num(device, 'temperature', 1)
  const coolSetpt = num(device, 'coolingSetpoint', 0)
  const heatSetpt = num(device, 'heatingSetpoint', 0)
  const state    = attr(device, 'thermostatOperatingState') ?? '—'
  const mode     = attr(device, 'thermostatMode') ?? '—'
  const fan      = attr(device, 'thermostatFanMode') ?? '—'
  const hum      = num(device, 'humidity', 0)
  const prog     = attr(device, 'currentProgramName')

  const stateColor = state === 'cooling' ? 'var(--blue)' : state === 'heating' ? 'var(--crimson)' : state === 'idle' ? 'var(--teal)' : 'var(--text-muted)'

  const sendSetpt = async (target, delta) => {
    const newVal = target + delta
    const cmd = mode === 'heat' ? 'setHeatingSetpoint' : 'setCoolingSetpoint'
    await sendCommand(deviceId, cmd, newVal).catch(() => {})
  }
  const sendMode = (m) => sendCommand(deviceId, 'setThermostatMode', m).catch(() => {})
  const sendFan  = (f) => sendCommand(deviceId, 'setThermostatFanMode', f).catch(() => {})

  const setpt = mode === 'heat' ? heatSetpt : coolSetpt

  return (
    <div className="card hvac-card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {prog && <span className="pill pill-muted">{prog}</span>}
      </div>

      {/* Current temp + state */}
      <div className="hvac-temp-row">
        <span className="hvac-temp-big" style={{ color: stateColor }}>
          {temp !== null ? temp.toFixed(1) : '—'}
          <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>°F</span>
        </span>
        {hum !== null && <span className="pill pill-blue">{hum}% RH</span>}
        <span className="pill" style={{ color: stateColor, borderColor: stateColor, background: 'rgba(0,0,0,0.2)', textTransform: 'capitalize' }}>
          {state}
        </span>
      </div>

      {/* Setpoint control */}
      {deviceId && setpt !== null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {mode === 'heat' ? 'Heat Setpoint' : 'Cool Setpoint'}
          </div>
          <div className="setpoint-row">
            <button className="setpoint-btn" onClick={() => sendSetpt(setpt, -1)}>−</button>
            <span className="setpoint-val">{setpt}°</span>
            <button className="setpoint-btn" onClick={() => sendSetpt(setpt, +1)}>+</button>
          </div>
        </div>
      )}

      {/* Mode + Fan toggles */}
      <div className="hvac-meta-grid">
        <div className="hvac-meta-item">
          <div className="k">Mode</div>
          <div className="v" style={{ textTransform: 'capitalize' }}>{mode}</div>
        </div>
        <div className="hvac-meta-item">
          <div className="k">Fan</div>
          <div className="v" style={{ textTransform: 'capitalize' }}>{fan}</div>
        </div>
      </div>

      {deviceId && (
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['cool','heat','auto','off'].map(m => (
            <button key={m} className={`btn btn-sm ${mode === m ? 'btn-teal' : ''}`} style={{ textTransform: 'capitalize' }} onClick={() => sendMode(m)}>
              {m}
            </button>
          ))}
          <button className={`btn btn-sm ${fan === 'on' ? 'btn-teal' : ''}`} onClick={() => sendFan(fan === 'on' ? 'auto' : 'on')}>
            Fan {fan === 'on' ? 'On' : 'Auto'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Water Heater ──────────────────────────────────────────────────────────────

function WaterHeaterCard({ device, deviceId }) {
  if (!deviceId) return null
  const on    = attr(device, 'switch') === 'on'
  const power = num(device, 'power', 0)
  const energy = num(device, 'energy', 2)

  function isPeakHour() {
    const now = new Date()
    const h = now.getHours()
    const day = now.getDay()
    const mon = now.getMonth() + 1
    return day >= 1 && day <= 5 && h >= 14 && h < 19 && mon >= 6 && mon <= 9
  }

  const peak = isPeakHour()

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Electric Water Heater</span>
        <label className="toggle">
          <input type="checkbox" checked={on} onChange={() => sendCommand(deviceId, on ? 'off' : 'on').catch(() => {})} />
          <span className="toggle-slider" />
        </label>
      </div>
      <div className="g3">
        <div className="stat-cell">
          <div className="val" style={{ color: on ? 'var(--teal)' : 'var(--text-muted)' }}>{on ? 'On' : 'Off'}</div>
          <div className="lbl">State</div>
        </div>
        {power !== null && (
          <div className="stat-cell">
            <div className="val">{power >= 1000 ? (power/1000).toFixed(1) : Math.round(power)}</div>
            <div className="lbl">{power >= 1000 ? 'kW' : 'Watts'}</div>
          </div>
        )}
        {energy !== null && (
          <div className="stat-cell">
            <div className="val">{energy.toFixed(2)}</div>
            <div className="lbl">kWh</div>
          </div>
        )}
      </div>
      {peak && on && (
        <div className="notice" style={{ marginTop: 10 }}>
          <span>⚠</span>
          <span>On-peak hours (2–7pm) — consider turning off to save $</span>
        </div>
      )}
    </div>
  )
}

// ── Ceiling Fan ───────────────────────────────────────────────────────────────

function FanCard({ id, name, device }) {
  const on    = attr(device, 'switch') === 'on'
  const speed = attr(device, 'speed') ?? attr(device, 'fanSpeed') ?? '—'
  const lightOn = attr(device, 'colorTemperature') !== undefined  // has light if CT attribute exists
  const lightLevel = num(device, 'level', 0)

  const setSpeed = (s) => sendCommand(id, s === 'off' ? 'off' : 'setSpeed', s !== 'off' ? s : null).catch(() => {})
  const toggle   = () => sendCommand(id, on ? 'off' : 'on').catch(() => {})

  return (
    <div className="card fan-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="fan-room">{name}</span>
        <label className="toggle">
          <input type="checkbox" checked={on} onChange={toggle} />
          <span className="toggle-slider" />
        </label>
      </div>
      {on && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'capitalize' }}>
          Speed: <span style={{ fontFamily: 'var(--font-data)', color: 'var(--teal)' }}>{speed}</span>
        </div>
      )}
      <div className="fan-controls">
        {['low','medium-low','medium','medium-high','high'].map(s => (
          <button key={s} className={`btn btn-xs ${speed === s ? 'btn-teal' : ''}`} onClick={() => setSpeed(s)} style={{ textTransform: 'capitalize' }}>
            {s.replace('medium-', 'M-')}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Lighting (Hue rooms) ──────────────────────────────────────────────────────

function LightingSection({ hueRooms, devices, floor }) {
  const rooms = hueRooms.filter(r => r.extra === floor || (!r.extra && floor === 'main'))
  if (!rooms.length) return null

  return (
    <div className="card">
      <div className="card-title">Lighting — Philips Hue</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rooms.map(({ id, name }) => {
          const d = devices[id]
          const on    = attr(d, 'switch') === 'on'
          const level = num(d, 'level', 0)
          const ct    = num(d, 'colorTemperature', 0)
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text)' }}>{name}</span>
              {on && level !== null && (
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.78rem', color: 'var(--amber)' }}>{level}%</span>
              )}
              {on && (
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn btn-xs" onClick={() => sendCommand(id, 'setLevel', Math.max(0, (level ?? 50) - 20)).catch(() => {})}>−</button>
                  <button className="btn btn-xs" onClick={() => sendCommand(id, 'setLevel', Math.min(100, (level ?? 50) + 20)).catch(() => {})}>+</button>
                </div>
              )}
              <label className="toggle">
                <input type="checkbox" checked={on} onChange={() => sendCommand(id, on ? 'off' : 'on').catch(() => {})} />
                <span className="toggle-slider" />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Climate Sensors ───────────────────────────────────────────────────────────

function ClimateGrid({ goveeDevices, devices }) {
  if (!goveeDevices.length) return null
  return (
    <div className="card">
      <div className="card-title">Temperature & Humidity</div>
      <div className="climate-grid">
        {goveeDevices.map(({ id, name }) => {
          const d  = devices[id]
          const t  = num(d, 'temperature', 1)
          const h  = num(d, 'humidity', 0)
          const dp = dewPoint(t, h)
          const tempCls = t === null ? '' : t < 65 ? 'cool' : t > 78 ? 'hot' : t > 74 ? 'warm' : ''
          const riskCls = dp !== null && dp > 60 ? 'risk' : ''
          return (
            <div key={id} className={`climate-cell ${tempCls} ${riskCls}`}>
              <div className="cc-room">{name}</div>
              <div className="cc-temp">{t !== null ? t.toFixed(1) + '°' : '—'}</div>
              {h !== null && <div className="cc-hum">{h}% RH</div>}
              {dp !== null && <div className="cc-dp">dp {dp.toFixed(1)}°</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── UV System ────────────────────────────────────────────────────────────────

function UvCard({ device, deviceId }) {
  if (!deviceId) return null
  const on    = attr(device, 'switch') === 'on'
  const power = num(device, 'power', 1)
  const lampOk = power !== null ? power > 10 : null

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        UV System (Whole House)
        {on && lampOk === false && <span className="pill pill-red">⚠ Lamp Failure</span>}
        {on && lampOk === true  && <span className="pill pill-teal">Lamp OK</span>}
      </div>
      <div className="g2">
        <div className="stat-cell">
          <div className="val" style={{ color: on ? 'var(--teal)' : 'var(--text-muted)' }}>{on ? 'On' : 'Off'}</div>
          <div className="lbl">State</div>
        </div>
        {power !== null && (
          <div className="stat-cell">
            <div className="val">{power.toFixed(1)}</div>
            <div className="lbl">Watts</div>
          </div>
        )}
      </div>
      {on && lampOk === false && (
        <div className="notice error" style={{ marginTop: 10, fontSize: '0.75rem' }}>
          UV lamp may have failed — draw is below 10W during active period
        </div>
      )}
    </div>
  )
}

// ── Emporia Branch Circuits ───────────────────────────────────────────────────

function CircuitBar({ name, device }) {
  const power = num(device, 'power', 0)
  return (
    <div className="stat-row">
      <span className="stat-key" style={{ fontSize: '0.75rem' }}>{name}</span>
      <span className="stat-val">{power !== null ? (power >= 1000 ? (power/1000).toFixed(1) + ' kW' : power + ' W') : '—'}</span>
    </div>
  )
}

function CircuitsSection({ circuitDevices, devices }) {
  if (!circuitDevices.length) return null
  return (
    <div className="card">
      <div className="card-title">Circuit Monitoring — Emporia Vue</div>
      {circuitDevices.map(({ id, name }) => (
        <CircuitBar key={id} name={name} device={devices[id]} />
      ))}
    </div>
  )
}

// ── Door Lock ────────────────────────────────────────────────────────────────

function LockCard({ device, deviceId }) {
  if (!deviceId) return null
  const locked = attr(device, 'lock') === 'locked'
  const battery = num(device, 'battery', 0)

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Garage Door Lock
        {battery !== null && <span className="pill pill-muted">🔋 {battery}%</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: '2rem' }}>{locked ? '🔒' : '🔓'}</span>
        <div>
          <div style={{ fontWeight: 700, color: locked ? 'var(--teal)' : 'var(--crimson)' }}>
            {locked ? 'Locked' : 'Unlocked'}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button className={`btn btn-sm ${locked ? '' : 'btn-teal'}`} onClick={() => sendCommand(deviceId, locked ? 'unlock' : 'lock').catch(() => {})}>
              {locked ? 'Unlock' : 'Lock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MainLevel() {
  const { devices } = useDevices()

  const ecobeeMainId  = getCfg('dev_ecobee_main')
  const whId          = getCfg('dev_water_heater')
  const uvId          = getCfg('dev_uv_main')
  const lockId        = getCfg('dev_lock')

  const fanCfg    = parseDeviceList(getCfg('dev_fans'))
  const hueCfg    = parseDeviceList(getCfg('dev_hue_rooms'))
  const circCfg   = parseDeviceList(getCfg('dev_emporia_circuits'))
  const tempCfg   = parseDeviceList(getCfg('dev_govee_temp')).filter(r => r.extra === 'main' || !r.extra)

  return (
    <div className="page">
      <div className="section-head">HVAC — Zone 1</div>
      <HvacCard
        device={devices[ecobeeMainId]}
        deviceId={ecobeeMainId}
        label="Main Floor (4-ton Rheem)"
      />

      <div className="section-head">Devices</div>
      <WaterHeaterCard device={devices[whId]} deviceId={whId} />
      <UvCard device={devices[uvId]} deviceId={uvId} />
      <LockCard device={devices[lockId]} deviceId={lockId} />

      {fanCfg.length > 0 && (
        <>
          <div className="section-head">Ceiling Fans</div>
          {fanCfg.map(({ id, name }) => (
            <FanCard key={id} id={id} name={name} device={devices[id]} />
          ))}
        </>
      )}

      <LightingSection hueRooms={hueCfg} devices={devices} floor="main" />

      {tempCfg.length > 0 && (
        <>
          <div className="section-head">Climate Sensors</div>
          <ClimateGrid goveeDevices={tempCfg} devices={devices} />
        </>
      )}

      {circCfg.length > 0 && (
        <>
          <div className="section-head">Circuit Monitoring</div>
          <CircuitsSection circuitDevices={circCfg} devices={devices} />
        </>
      )}
    </div>
  )
}
