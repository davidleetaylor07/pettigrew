import { useDevices } from '../App.jsx'
import { getCfg, parseDeviceList } from '../store/config.js'
import { attr, num, sendCommand, dewPoint } from '../api/hubitat.js'

// ── HVAC Full Card (same pattern as Main) ────────────────────────────────────

function HvacCard({ device, deviceId, label }) {
  const temp      = num(device, 'temperature', 1)
  const coolSetpt = num(device, 'coolingSetpoint', 0)
  const heatSetpt = num(device, 'heatingSetpoint', 0)
  const state     = attr(device, 'thermostatOperatingState') ?? '—'
  const mode      = attr(device, 'thermostatMode') ?? '—'
  const fan       = attr(device, 'thermostatFanMode') ?? '—'
  const hum       = num(device, 'humidity', 0)
  const prog      = attr(device, 'currentProgramName')

  const stateColor = state === 'cooling' ? 'var(--blue)' : state === 'heating' ? 'var(--crimson)' : state === 'idle' ? 'var(--teal)' : 'var(--text-muted)'
  const setpt = mode === 'heat' ? heatSetpt : coolSetpt

  const sendSetpt = (delta) => {
    const cmd = mode === 'heat' ? 'setHeatingSetpoint' : 'setCoolingSetpoint'
    sendCommand(deviceId, cmd, setpt + delta).catch(() => {})
  }

  return (
    <div className="card hvac-card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {prog && <span className="pill pill-muted">{prog}</span>}
      </div>

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

      {deviceId && setpt !== null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {mode === 'heat' ? 'Heat Setpoint' : 'Cool Setpoint'}
          </div>
          <div className="setpoint-row">
            <button className="setpoint-btn" onClick={() => sendSetpt(-1)}>−</button>
            <span className="setpoint-val">{setpt}°</span>
            <button className="setpoint-btn" onClick={() => sendSetpt(+1)}>+</button>
          </div>
        </div>
      )}

      <div className="hvac-meta-grid">
        <div className="hvac-meta-item"><div className="k">Mode</div><div className="v" style={{ textTransform: 'capitalize' }}>{mode}</div></div>
        <div className="hvac-meta-item"><div className="k">Fan</div><div className="v" style={{ textTransform: 'capitalize' }}>{fan}</div></div>
      </div>

      {deviceId && (
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['cool','heat','auto','off'].map(m => (
            <button key={m} className={`btn btn-sm ${mode === m ? 'btn-teal' : ''}`} style={{ textTransform: 'capitalize' }} onClick={() => sendCommand(deviceId, 'setThermostatMode', m).catch(() => {})}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dehumidifier Card ─────────────────────────────────────────────────────────

function DehumidCard({ deviceId, device, name }) {
  if (!deviceId) return null
  const power  = num(device, 'power', 0)
  const energy = num(device, 'energy', 2)
  const on     = power !== null ? power > 50 : null  // infer from draw

  return (
    <div className="card">
      <div className="card-title">{name}</div>
      <div className="g3">
        <div className="stat-cell">
          <div className="val" style={{ color: on === true ? 'var(--teal)' : on === false ? 'var(--crimson)' : 'var(--text-muted)' }}>
            {on === null ? '—' : on ? 'Running' : 'Off / Idle'}
          </div>
          <div className="lbl">State</div>
        </div>
        {power !== null && (
          <div className="stat-cell">
            <div className="val">{power >= 1000 ? (power/1000).toFixed(1) : power}</div>
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
    </div>
  )
}

// ── Lighting ─────────────────────────────────────────────────────────────────

function LightingSection({ hueRooms, devices, floor }) {
  const rooms = hueRooms.filter(r => r.extra === floor)
  if (!rooms.length) return null

  return (
    <div className="card">
      <div className="card-title">Lighting — Philips Hue</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rooms.map(({ id, name }) => {
          const d     = devices[id]
          const on    = attr(d, 'switch') === 'on'
          const level = num(d, 'level', 0)
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

// ── Fans (upstairs) ───────────────────────────────────────────────────────────

function FanCard({ id, name, device }) {
  const on    = attr(device, 'switch') === 'on'
  const speed = attr(device, 'speed') ?? attr(device, 'fanSpeed') ?? '—'
  return (
    <div className="card fan-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="fan-room">{name}</span>
        <label className="toggle">
          <input type="checkbox" checked={on} onChange={() => sendCommand(id, on ? 'off' : 'on').catch(() => {})} />
          <span className="toggle-slider" />
        </label>
      </div>
      {on && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          Speed: <span style={{ fontFamily: 'var(--font-data)', color: 'var(--teal)' }}>{speed}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
        {['low','medium','high'].map(s => (
          <button key={s} className={`btn btn-xs ${speed === s ? 'btn-teal' : ''}`} style={{ textTransform: 'capitalize' }} onClick={() => sendCommand(id, 'setSpeed', s).catch(() => {})}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Climate Grid ──────────────────────────────────────────────────────────────

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

// ── UV HVAC Stub ──────────────────────────────────────────────────────────────

function UvHvacStub() {
  return (
    <div className="card" style={{ opacity: 0.6 }}>
      <div className="card-title">In-Duct UV — Air Handler</div>
      <div className="empty-state" style={{ padding: '10px 0', fontSize: '0.78rem' }}>
        Future install — stub ready
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Upstairs() {
  const { devices } = useDevices()

  const ecobeeUpId  = getCfg('dev_ecobee_up')
  const dehumidUpId = getCfg('dev_dehumid_up')

  const hueCfg  = parseDeviceList(getCfg('dev_hue_rooms'))
  const tempCfg = parseDeviceList(getCfg('dev_govee_temp')).filter(r => r.extra === 'up')
  const fanCfg  = parseDeviceList(getCfg('dev_fans')).filter((_, i) => i >= 2) // fans 3 & 4 assumed upstairs

  return (
    <div className="page">
      <div className="section-head">HVAC — Zone 2</div>
      <HvacCard
        device={devices[ecobeeUpId]}
        deviceId={ecobeeUpId}
        label="Upstairs (1.5-ton York)"
      />

      {dehumidUpId && (
        <>
          <div className="section-head">Dehumidifier</div>
          <DehumidCard
            deviceId={dehumidUpId}
            device={devices[dehumidUpId]}
            name="Upstairs Dehumidifier"
          />
        </>
      )}

      {fanCfg.length > 0 && (
        <>
          <div className="section-head">Ceiling Fans</div>
          {fanCfg.map(({ id, name }) => (
            <FanCard key={id} id={id} name={name} device={devices[id]} />
          ))}
        </>
      )}

      <LightingSection hueRooms={hueCfg} devices={devices} floor="up" />

      {tempCfg.length > 0 && (
        <>
          <div className="section-head">Climate Sensors</div>
          <ClimateGrid goveeDevices={tempCfg} devices={devices} />
        </>
      )}

      <div className="section-head">Future</div>
      <UvHvacStub />
    </div>
  )
}
