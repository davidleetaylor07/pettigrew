import { useNavigate } from 'react-router-dom'
import { useDevices } from '../App.jsx'
import { getCfg, parseDeviceList, isConfigured } from '../store/config.js'
import { attr, num, disp, dispPower, dewPoint } from '../api/hubitat.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function aqiClass(n) {
  if (n < 50)  return 'ok'
  if (n < 100) return 'moderate'
  if (n < 150) return 'usg'
  return 'alert'
}
function aqiLabel(n) {
  if (n === null) return '—'
  if (n < 50)  return 'Good'
  if (n < 100) return 'Moderate'
  if (n < 150) return 'USG'
  if (n < 200) return 'Unhealthy'
  return 'Hazardous'
}
function aqiColor(n) {
  if (n === null) return 'var(--border-mid)'
  if (n < 50)  return 'var(--teal)'
  if (n < 100) return 'var(--amber)'
  return 'var(--crimson)'
}
function dpRisk(dp) {
  if (dp === null) return 'safe'
  if (dp < 55)  return 'safe'
  if (dp < 60)  return 'monitor'
  return 'risk'
}
function dpRiskColor(dp) {
  const r = dpRisk(dp)
  if (r === 'safe')    return 'var(--teal)'
  if (r === 'monitor') return 'var(--amber)'
  return 'var(--crimson)'
}
function stateLabel(s) {
  if (!s) return '—'
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
}
function weatherIcon(t, raining) {
  if (raining) return '🌧'
  if (t > 90) return '☀️'
  if (t > 75) return '🌤'
  if (t > 60) return '⛅'
  return '🌥'
}
function isPeakHour() {
  const now = new Date()
  const h = now.getHours()
  const day = now.getDay()
  const mon = now.getMonth() + 1 // 1-12
  return day >= 1 && day <= 5 && h >= 14 && h < 19 && mon >= 6 && mon <= 9
}

// ── WeatherHero ───────────────────────────────────────────────────────────────

function WeatherHero({ device }) {
  const temp     = num(device, 'temperature', 1)
  const hum      = num(device, 'humidity', 0)
  const feels    = num(device, 'feelsLike', 1) ?? num(device, 'apparentTemperature', 1)
  const wind     = num(device, 'windSpeed', 0)
  const uv       = num(device, 'uvIndex', 0)
  const rain     = num(device, 'precipitationRate', 2)
  const pressure = num(device, 'pressure', 2)
  const dp       = dewPoint(temp, hum)
  const raining  = rain !== null && rain > 0

  if (!device) return (
    <div className="weather-hero" style={{ opacity: 0.5 }}>
      <div className="wh-main">
        <div>
          <div className="wh-temp">—</div>
          <div className="wh-feels">Tempest not configured</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="weather-hero">
      <div className="wh-main">
        <div>
          <div className="wh-temp">
            {temp !== null ? temp.toFixed(1) : '—'}
            <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginLeft: 4 }}>°F</span>
          </div>
          {feels !== null && (
            <div className="wh-feels">Feels like {feels.toFixed(1)}°F</div>
          )}
          <div style={{ marginTop: 8 }}>
            {raining ? <span className="pill pill-blue">🌧 {rain.toFixed(2)} in/hr</span>
                     : <span className="pill pill-muted">{weatherIcon(temp, raining)} Clear</span>}
          </div>
        </div>
        <div className="wh-right">
          <div className="wh-condition">Outdoors</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {hum !== null ? `${hum}% RH` : ''}
          </div>
          {dp !== null && (
            <div style={{ marginTop: 6 }}>
              <span className="pill" style={{ borderColor: dpRiskColor(dp), color: dpRiskColor(dp), background: 'rgba(0,0,0,0.2)' }}>
                DP {dp.toFixed(1)}°
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="wh-stats">
        {wind    !== null && <div className="wh-stat"><span className="k">Wind</span><span className="v">{wind} mph</span></div>}
        {uv      !== null && <div className="wh-stat"><span className="k">UV</span><span className="v">{uv}</span></div>}
        {pressure!== null && <div className="wh-stat"><span className="k">Pressure</span><span className="v">{pressure} inHg</span></div>}
        {hum     !== null && <div className="wh-stat"><span className="k">Humidity</span><span className="v">{hum}%</span></div>}
      </div>
    </div>
  )
}

// ── AQI Ring ─────────────────────────────────────────────────────────────────

function AqiRing({ viewDevice, waveDevice }) {
  const aqi  = num(viewDevice, 'airQualityIndex', 0)
  const co2  = num(viewDevice, 'carbonDioxide', 0) ?? num(waveDevice, 'carbonDioxide', 0)
  const voc  = num(viewDevice, 'tvocLevel', 0) ?? num(waveDevice, 'tvocLevel', 0)
  const pm25 = num(viewDevice, 'pm25', 1)
  const radon = num(waveDevice, 'radon', 1)
  const color = aqiColor(aqi)

  return (
    <div className="card mb-0" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div className="aqi-ring" style={{ borderColor: color }}>
        <span className="aqi-num" style={{ color }}>{aqi !== null ? Math.round(aqi) : '—'}</span>
        <span className="aqi-lbl">AQI</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{aqiLabel(aqi)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
          <div className="stat-row" style={{ padding: '3px 0' }}>
            <span className="stat-key" style={{ fontSize: '0.72rem' }}>CO₂</span>
            <span className="stat-val" style={{ fontSize: '0.78rem' }}>
              {co2 !== null ? `${co2} ppm` : '—'}
              {co2 !== null && <span className={`pill ${co2 < 800 ? 'pill-teal' : co2 < 1000 ? 'pill-amber' : 'pill-red'}`} style={{ marginLeft: 5, fontSize: '0.5rem', padding: '1px 5px' }}>
                {co2 < 800 ? 'Good' : co2 < 1000 ? 'Mod' : 'High'}
              </span>}
            </span>
          </div>
          <div className="stat-row" style={{ padding: '3px 0' }}>
            <span className="stat-key" style={{ fontSize: '0.72rem' }}>VOC</span>
            <span className="stat-val" style={{ fontSize: '0.78rem' }}>
              {voc !== null ? voc : '—'}
              {voc !== null && <span className={`pill ${voc < 100 ? 'pill-teal' : voc < 200 ? 'pill-amber' : 'pill-red'}`} style={{ marginLeft: 5, fontSize: '0.5rem', padding: '1px 5px' }}>
                {voc < 100 ? 'Good' : voc < 200 ? 'Mod' : 'High'}
              </span>}
            </span>
          </div>
          {pm25 !== null && (
            <div className="stat-row" style={{ padding: '3px 0' }}>
              <span className="stat-key" style={{ fontSize: '0.72rem' }}>PM2.5</span>
              <span className="stat-val" style={{ fontSize: '0.78rem' }}>{pm25.toFixed(1)} μg/m³</span>
            </div>
          )}
          {radon !== null && (
            <div className="stat-row" style={{ padding: '3px 0' }}>
              <span className="stat-key" style={{ fontSize: '0.72rem' }}>Radon</span>
              <span className="stat-val" style={{ fontSize: '0.78rem' }}>{radon.toFixed(1)} pCi/L</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Power Snapshot ────────────────────────────────────────────────────────────

function PowerSnapshot({ device }) {
  const watts    = num(device, 'power', 0)
  const kwhToday = num(device, 'energy', 2)
  const ratePeak = parseFloat(getCfg('rate_peak'))    || 0.146
  const rateOff  = parseFloat(getCfg('rate_offpeak')) || 0.016
  const budget   = parseFloat(getCfg('budget_kwh'))   || 60
  const peak = isPeakHour()
  const rate = peak ? ratePeak : rateOff

  const costToday = (kwhToday && rate) ? kwhToday * rate : null
  const pct = (kwhToday && budget) ? Math.min((kwhToday / budget) * 100, 100) : 0
  const fillCls = pct > 90 ? 'alert' : pct > 70 ? 'warn' : ''

  let powerCls = 'pill-teal'
  let powerLabel = 'Normal'
  if (watts !== null) {
    if (watts > 8000)      { powerCls = 'pill-red';   powerLabel = 'High Load' }
    else if (watts > 3000) { powerCls = 'pill-amber'; powerLabel = 'Moderate' }
  }

  return (
    <div className="card">
      <div className="card-title">Power</div>
      <div className="power-header">
        <div className="big-num">
          {watts !== null ? dispPower(watts).replace(' kW','').replace(' W','') : '—'}
          <span className="unit">{watts !== null ? (watts >= 1000 ? 'kW' : 'W') : ''}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`pill ${powerCls}`}>{powerLabel}</span>
          {peak && <span className="pill pill-red" style={{ fontSize: '0.55rem' }}>⚡ On-Peak</span>}
        </div>
      </div>
      <div className="g3" style={{ marginTop: 12 }}>
        <div className="stat-cell">
          <div className="val">{kwhToday !== null ? kwhToday.toFixed(1) : '—'}</div>
          <div className="lbl">kWh Today</div>
        </div>
        <div className="stat-cell">
          <div className="val">{costToday !== null ? '$' + costToday.toFixed(2) : '—'}</div>
          <div className="lbl">Est. Cost</div>
        </div>
        <div className="stat-cell">
          <div className="val" style={{ color: peak ? 'var(--amber)' : 'var(--teal)' }}>
            {peak ? 'On-Peak' : 'Off-Peak'}
          </div>
          <div className="lbl">Rate Period</div>
        </div>
      </div>
      {budget > 0 && (
        <div className="gauge-wrap">
          <div className="gauge-label">
            <span>Daily kWh</span>
            <span>{kwhToday !== null ? `${kwhToday.toFixed(1)} / ${budget} kWh` : `0 / ${budget} kWh`}</span>
          </div>
          <div className="gauge-track">
            <div className={`gauge-fill ${fillCls}`} style={{ width: pct + '%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── HVAC Mini ─────────────────────────────────────────────────────────────────

function HvacMini({ device, label }) {
  const temp  = num(device, 'temperature', 1)
  const setpt = num(device, 'coolingSetpoint', 0) ?? num(device, 'heatingSetpoint', 0)
  const state = attr(device, 'thermostatOperatingState')
  const hum   = num(device, 'humidity', 0)
  const prog  = attr(device, 'currentProgramName')

  const stateCls = state === 'cooling' ? 'cooling' : state === 'heating' ? 'heating' : state === 'idle' ? 'idle' : 'off-state'

  return (
    <div className="card" style={{ margin: 0 }}>
      <div className="card-title">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span className="big-num-sm">{temp !== null ? temp.toFixed(1) : '—'}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>°F</span>
        {setpt !== null && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>→ {setpt}°</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {state && <span className={`pill pill-muted ${stateCls}`} style={{ textTransform: 'capitalize' }}>{stateLabel(state)}</span>}
        {hum   !== null && <span className="pill pill-blue">{hum}% RH</span>}
        {prog  && <span className="pill pill-muted">{prog}</span>}
      </div>
    </div>
  )
}

// ── Leak Summary ──────────────────────────────────────────────────────────────

function LeakSummary({ devices }) {
  const leakCfg = parseDeviceList(getCfg('dev_govee_leak'))
  if (!leakCfg.length) return null

  const sensors = leakCfg.map(({ id, name, extra }) => {
    const d = devices[id]
    const water = attr(d, 'water')
    return { id, name, loc: extra, water }
  })
  const wetOnes = sensors.filter(s => s.water === 'wet')

  if (wetOnes.length) {
    return (
      <div className="leak-alert">
        💧 LEAK DETECTED — {wetOnes.map(s => s.name + (s.loc ? ` (${s.loc})` : '')).join(' · ')}
      </div>
    )
  }
  const offline = sensors.filter(s => !s.water)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
      <span style={{ fontSize: '1.1rem' }}>✅</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 600 }}>
        All {sensors.length} leak sensors dry
        {offline.length > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>({offline.length} offline)</span>}
      </span>
    </div>
  )
}

// ── Humidity Summary (Govee network) ─────────────────────────────────────────

function HumiditySummary({ devices, outdoorDevice }) {
  const tempCfg = parseDeviceList(getCfg('dev_govee_temp'))
  if (!tempCfg.length) return null

  const outdoorDp = (() => {
    const t = num(outdoorDevice, 'temperature', 1)
    const h = num(outdoorDevice, 'humidity', 0)
    return dewPoint(t, h)
  })()

  const sensors = tempCfg.map(({ id, name }) => {
    const d = devices[id]
    const t = num(d, 'temperature', 1)
    const h = num(d, 'humidity', 0)
    const dp = dewPoint(t, h)
    return { name, t, h, dp }
  })

  return (
    <div className="card">
      <div className="card-title">Indoor Humidity</div>
      {outdoorDp !== null && (
        <div style={{ marginBottom: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Outdoor dew point: <span style={{ fontFamily: 'var(--font-data)', color: dpRiskColor(outdoorDp) }}>{outdoorDp.toFixed(1)}°F</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sensors.map(({ name, h, dp }) => {
          const pct = h !== null ? Math.min((h / 80) * 100, 100) : 0
          const riskColor = dpRiskColor(dp)
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 110, fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
              <div style={{ flex: 1 }}>
                <div className="gauge-track" style={{ height: 6 }}>
                  <div className="gauge-fill" style={{ width: pct + '%', background: riskColor, transition: 'width 0.5s' }} />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.8rem', width: 42, textAlign: 'right', color: riskColor }}>
                {h !== null ? h + '%' : '—'}
              </span>
              {dp !== null && (
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', width: 44, textAlign: 'right', color: 'var(--text-faint)' }}>
                  {dp.toFixed(0)}°dp
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── QuickNav ──────────────────────────────────────────────────────────────────

function QuickNav() {
  const navigate = useNavigate()
  return (
    <div className="quick-nav">
      <div className="qn-btn" onClick={() => navigate('/outside')}>
        <div className="qn-icon">🌳</div>
        <div className="qn-label">Outside</div>
      </div>
      <div className="qn-btn" onClick={() => navigate('/main')}>
        <div className="qn-icon">🏡</div>
        <div className="qn-label">Main</div>
      </div>
      <div className="qn-btn" onClick={() => navigate('/upstairs')}>
        <div className="qn-icon">🛏️</div>
        <div className="qn-label">Upstairs</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Overview() {
  const { devices, status } = useDevices()

  const tempest     = devices[getCfg('dev_tempest')]
  const ecobeeMain  = devices[getCfg('dev_ecobee_main')]
  const ecobeeUp    = devices[getCfg('dev_ecobee_up')]
  const emporia     = devices[getCfg('dev_emporia_main')]
  const airView     = devices[getCfg('dev_airthings_view')]
  const airWave     = devices[getCfg('dev_airthings_wave')]

  const configured = isConfigured()

  return (
    <div className="page">
      {!configured && (
        <div className="notice" style={{ marginBottom: 12 }}>
          <span>⚙</span>
          <span>Hubitat not configured — tap the ⚙ button to set your hub URL, App ID, and token.</span>
        </div>
      )}

      <WeatherHero device={tempest} />

      {(getCfg('dev_airthings_view') || getCfg('dev_airthings_wave')) && (
        <>
          <div className="section-head">Air Quality — Airthings</div>
          <AqiRing viewDevice={airView} waveDevice={airWave} />
        </>
      )}

      <div className="section-head">Power — Emporia Vue 3</div>
      <PowerSnapshot device={emporia} />

      <div className="section-head">HVAC — Ecobee</div>
      <div className="g2" style={{ marginBottom: 12 }}>
        <HvacMini device={ecobeeMain} label="Main Floor" />
        <HvacMini device={ecobeeUp}   label="Upstairs" />
      </div>

      <LeakSummary devices={devices} />
      <HumiditySummary devices={devices} outdoorDevice={tempest} />

      <div className="section-head">Floor Views</div>
      <QuickNav />
    </div>
  )
}
