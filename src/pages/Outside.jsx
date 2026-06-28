import { useDevices } from '../App.jsx'
import { getCfg, parseDeviceList } from '../store/config.js'
import { attr, num, disp, sendCommand, dewPoint } from '../api/hubitat.js'

// ── Weather Detail ────────────────────────────────────────────────────────────

function WeatherDetail({ device }) {
  const fields = [
    ['Temperature',  num(device, 'temperature', 1),    '°F'],
    ['Feels Like',   num(device, 'feelsLike', 1) ?? num(device, 'apparentTemperature', 1), '°F'],
    ['Humidity',     num(device, 'humidity', 0),        '%'],
    ['Dew Point',    dewPoint(num(device, 'temperature', 1), num(device, 'humidity', 0)), '°F'],
    ['Wind',         num(device, 'windSpeed', 0),       ' mph'],
    ['Wind Dir',     attr(device, 'windDirection'),     '°'],
    ['UV Index',     num(device, 'uvIndex', 0),         ''],
    ['Rain Rate',    num(device, 'precipitationRate', 3), ' in/hr'],
    ['Rain Today',   num(device, 'precipitationToday', 2) ?? num(device, 'precipitation', 2), ' in'],
    ['Pressure',     num(device, 'pressure', 2),        ' inHg'],
    ['Illuminance',  num(device, 'illuminance', 0),     ' lux'],
  ].filter(([, v]) => v !== null && v !== undefined)

  return (
    <div className="card">
      <div className="card-title">Tempest Weather Station</div>
      {!device ? (
        <div className="empty-state">Configure Tempest device ID in Settings</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {fields.map(([label, val, unit]) => (
            <div className="stat-row" key={label}>
              <span className="stat-key">{label}</span>
              <span className="stat-val">{val !== null ? String(val) + unit : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Irrigation ────────────────────────────────────────────────────────────────

function IrrigationSection({ controllerDevice, zoneDevices }) {
  const rainSkip = attr(controllerDevice, 'rainSkip') ?? attr(controllerDevice, 'rainDelay')
  const flowRate = num(controllerDevice, 'flowRate', 2)

  return (
    <div className="card">
      <div className="card-title">
        <span>Irrigation — Hunter Pro-HC</span>
        {rainSkip && <span className="pill pill-blue" style={{ marginLeft: 8 }}>Rain Skip</span>}
      </div>

      {flowRate !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Flow Meter:</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '1.1rem', color: 'var(--blue)', fontWeight: 600 }}>
            {flowRate.toFixed(2)} GPM
          </span>
          {flowRate > 0.5 && <span className="pill pill-blue">Active</span>}
        </div>
      )}

      {!zoneDevices.length ? (
        <div className="empty-state" style={{ padding: '20px 0' }}>
          Configure irrigation zone IDs in Settings
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zoneDevices.map(({ name, device, id }) => {
            const valve = attr(device, 'valve') ?? attr(device, 'switch')
            const flow  = num(device, 'flowRate', 2)
            const remaining = num(device, 'timeRemaining', 0)
            const isOpen = valve === 'open' || valve === 'on'
            return (
              <div key={id} className={`irr-zone ${isOpen ? 'active' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="irr-zone-name">{name}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {remaining !== null && remaining > 0 && (
                      <span className="pill pill-teal" style={{ fontSize: '0.58rem' }}>{remaining}min left</span>
                    )}
                    <span className={`pill ${isOpen ? 'pill-teal' : 'pill-muted'}`}>
                      {isOpen ? 'Running' : 'Off'}
                    </span>
                  </div>
                </div>
                {flow !== null && (
                  <span className="irr-zone-flow">{flow.toFixed(2)} GPM</span>
                )}
                {isOpen && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className="btn btn-sm btn-red" onClick={() => sendCommand(id, 'off').catch(() => {})}>Stop</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Mailbox ───────────────────────────────────────────────────────────────────

function MailboxSection({ device }) {
  if (!getCfg('dev_mailbox')) return null

  const contact = attr(device, 'contact') ?? attr(device, 'open')
  const battery = num(device, 'battery', 0)
  const lastEvent = attr(device, 'lastOpened') ?? attr(device, 'lastEvent')

  return (
    <div className="card">
      <div className="card-title">Mailbox</div>
      {!device ? (
        <div className="empty-state" style={{ padding: '12px 0' }}>Configure mailbox sensor in Settings</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '2rem' }}>{contact === 'open' ? '📬' : '📪'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: contact === 'open' ? 'var(--amber)' : 'var(--teal)' }}>
              {contact === 'open' ? 'Open' : contact === 'closed' ? 'Closed' : '—'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {lastEvent ? `Last: ${lastEvent}` : 'Waiting for event'}
            </div>
          </div>
          {battery !== null && (
            <span className="pill pill-muted" style={{ marginLeft: 'auto' }}>🔋 {battery}%</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Exterior Lighting ─────────────────────────────────────────────────────────

function ExteriorLighting({ hueRooms, devices }) {
  const exterior = hueRooms.filter(r => r.extra === 'garage' || r.name.toLowerCase().includes('exterior') || r.name.toLowerCase().includes('garage') || r.name.toLowerCase().includes('flood'))
  if (!exterior.length) return null

  return (
    <div className="card">
      <div className="card-title">Exterior Lighting</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exterior.map(({ id, name }) => {
          const d = devices[id]
          const on = attr(d, 'switch') === 'on'
          const level = num(d, 'level', 0)
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {level !== null && on && (
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.82rem', color: 'var(--amber)' }}>{level}%</span>
                )}
                <label className="toggle">
                  <input type="checkbox" checked={on} onChange={() => sendCommand(id, on ? 'off' : 'on').catch(() => {})} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Golf Cart ─────────────────────────────────────────────────────────────────

function GolfCartCard({ device }) {
  if (!getCfg('dev_golf_cart')) return null
  const on    = attr(device, 'switch') === 'on'
  const power = num(device, 'power', 0)
  const energy = num(device, 'energy', 2)

  let chargeState = '—'
  if (power !== null) {
    if (power > 800)     chargeState = 'Bulk Charging'
    else if (power > 200) chargeState = 'Absorption'
    else if (power > 10)  chargeState = 'Trickle / Complete'
    else if (on)          chargeState = 'Standby'
    else                  chargeState = 'Off'
  }

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Golf Cart Charger
        <label className="toggle">
          <input type="checkbox" checked={on} onChange={() => sendCommand(getCfg('dev_golf_cart'), on ? 'off' : 'on').catch(() => {})} />
          <span className="toggle-slider" />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {power !== null && (
          <div className="stat-cell" style={{ flex: 1 }}>
            <div className="val">{dispPower(power).replace(' W','').replace(' kW','')}</div>
            <div className="lbl">{power >= 1000 ? 'kW' : 'Watts'}</div>
          </div>
        )}
        <div className="stat-cell" style={{ flex: 2 }}>
          <div className="val" style={{ fontSize: '0.9rem' }}>{chargeState}</div>
          <div className="lbl">Charge State</div>
        </div>
        {energy !== null && (
          <div className="stat-cell" style={{ flex: 1 }}>
            <div className="val">{energy.toFixed(2)}</div>
            <div className="lbl">kWh</div>
          </div>
        )}
      </div>
    </div>
  )
}

function dispPower(w) {
  if (w === null) return '—'
  if (w >= 1000) return (w/1000).toFixed(2) + ' kW'
  return Math.round(w) + ' W'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Outside() {
  const { devices } = useDevices()

  const tempest     = devices[getCfg('dev_tempest')]
  const controller  = devices[getCfg('dev_irrigation')]
  const mailbox     = devices[getCfg('dev_mailbox')]
  const golfCart    = devices[getCfg('dev_golf_cart')]

  const zoneCfg = parseDeviceList(getCfg('dev_irrigation_zones'))
  const zoneDevices = zoneCfg.map(({ id, name }) => ({ id, name, device: devices[id] }))

  const hueCfg  = parseDeviceList(getCfg('dev_hue_rooms'))

  return (
    <div className="page">
      <WeatherDetail device={tempest} />

      <div className="section-head">Irrigation — Hunter Pro-HC</div>
      <IrrigationSection controllerDevice={controller} zoneDevices={zoneDevices} />

      <GolfCartCard device={golfCart} />

      <ExteriorLighting hueRooms={hueCfg} devices={devices} />

      <MailboxSection device={mailbox} />
    </div>
  )
}
