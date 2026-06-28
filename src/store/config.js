const PREFIX = 'ptg_'

export function getCfg(key) {
  return localStorage.getItem(PREFIX + key) ?? ''
}

export function setCfg(key, value) {
  const v = (value ?? '').trim()
  if (!v) localStorage.removeItem(PREFIX + key)
  else localStorage.setItem(PREFIX + key, v)
}

export function isConfigured() {
  return !!(getCfg('hub_url') && getCfg('hub_app_id') && getCfg('hub_token'))
}

// Parse multi-line entries: "id|Name|Extra"
export function parseDeviceList(raw) {
  return (raw || '').split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const p = l.split('|')
      return { id: p[0]?.trim() || '', name: p[1]?.trim() || '', extra: p[2]?.trim() || '' }
    })
}

// Collect all device IDs currently configured (for bulk fetch)
export function collectAllDeviceIds() {
  const ids = new Set()
  const singles = [
    'dev_tempest', 'dev_ecobee_main', 'dev_ecobee_up',
    'dev_emporia_main', 'dev_airthings_view', 'dev_airthings_wave',
    'dev_water_heater', 'dev_uv_main', 'dev_golf_cart',
    'dev_irrigation', 'dev_mailbox', 'dev_lock',
    'dev_dehumid_crawl', 'dev_dehumid_up',
  ]
  singles.forEach(k => { const v = getCfg(k); if (v) ids.add(v) })

  const multis = [
    'dev_emporia_circuits', 'dev_govee_temp', 'dev_govee_leak',
    'dev_fans', 'dev_hue_rooms', 'dev_irrigation_zones',
  ]
  multis.forEach(k => {
    parseDeviceList(getCfg(k)).forEach(d => { if (d.id) ids.add(d.id) })
  })
  return [...ids]
}

// Settings form schema — drives SettingsModal rendering
export const SETTINGS_SECTIONS = [
  {
    key: 'connection', label: 'Hubitat Connection',
    fields: [
      { key: 'hub_url',    label: 'Hub URL',         type: 'url',      hint: 'http://192.168.x.x — no trailing slash', placeholder: 'http://192.168.1.100' },
      { key: 'hub_app_id', label: 'Maker API App ID', type: 'number',  placeholder: '1' },
      { key: 'hub_token',  label: 'Access Token',     type: 'password', placeholder: '••••••••••••' },
    ],
  },
  {
    key: 'energy', label: 'Energy Rates (Georgia Power Smart Usage)',
    fields: [
      { key: 'rate_offpeak', label: 'Off-Peak Rate ($/kWh)',  type: 'number', placeholder: '0.016', hint: 'All hours except 2–7pm M–F Jun–Sep' },
      { key: 'rate_peak',    label: 'On-Peak Rate ($/kWh)',   type: 'number', placeholder: '0.146', hint: 'Mon–Fri 2–7pm, Jun–Sep' },
      { key: 'budget_kwh',   label: 'Daily kWh Budget',       type: 'number', placeholder: '60' },
    ],
  },
  {
    key: 'weather', label: 'Weather Station',
    fields: [
      { key: 'dev_tempest', label: 'Tempest Device ID', type: 'number', placeholder: '1', hint: 'WeatherFlow-Tempest driver (HPM)' },
    ],
  },
  {
    key: 'hvac', label: 'HVAC — Ecobee',
    fields: [
      { key: 'dev_ecobee_main', label: 'Ecobee Main Floor Device ID', type: 'number', placeholder: '2' },
      { key: 'dev_ecobee_up',   label: 'Ecobee Upstairs Device ID',   type: 'number', placeholder: '3' },
    ],
  },
  {
    key: 'power', label: 'Power Monitor — Emporia Vue 3',
    fields: [
      { key: 'dev_emporia_main',     label: 'Whole-Home Device ID', type: 'number', placeholder: '4' },
      { key: 'dev_emporia_circuits', label: 'Branch Circuit Devices', type: 'textarea', placeholder: '10|HVAC Zone 1\n11|HVAC Zone 2\n12|Water Heater\n13|Irrigation Pump\n14|Aloair Crawlspace\n15|Upstairs Dehumid\n16|UV System', hint: 'device_id|Circuit Name per line' },
    ],
  },
  {
    key: 'airquality', label: 'Air Quality — Airthings',
    fields: [
      { key: 'dev_airthings_view', label: 'View Plus Device ID (Main Living)', type: 'number', placeholder: '5', hint: 'PM2.5 + VOC + CO₂ + radon' },
      { key: 'dev_airthings_wave', label: 'Wave Plus Device ID (Bedroom)',     type: 'number', placeholder: '6', hint: 'Radon + VOC + CO₂' },
    ],
  },
  {
    key: 'climate', label: 'Climate Sensors — Govee Temp/Humidity',
    fields: [
      { key: 'dev_govee_temp', label: 'Temp/Humidity Sensors', type: 'textarea', placeholder: '20|Living Room|main\n21|Kitchen|main\n22|Master Bed|main\n23|Guest Bed 2|main\n24|Guest Bed 3|main\n25|Garage|main\n26|Upstairs Hall|up\n27|Crawlspace|crawl', hint: 'device_id|Display Name|floor (main/up/crawl/garage) per line' },
    ],
  },
  {
    key: 'leak', label: 'Leak Sensors — Govee',
    fields: [
      { key: 'dev_govee_leak', label: 'Leak Sensor Devices', type: 'textarea', placeholder: '30|Kitchen Sink|Under Sink\n31|Master Bath|Under Sink\n32|Guest Bath 1|Under Sink\n33|Guest Bath 2|Under Sink\n34|Water Heater|Base\n35|Washer|Laundry Room\n36|Crawlspace A|Crawlspace\n37|Crawlspace B|Crawlspace\n38|HVAC Main Drip|Air Handler', hint: 'device_id|Name|Location per line — reads water attribute (wet/dry)' },
    ],
  },
  {
    key: 'fans', label: 'Ceiling Fans — Hampton Bay ZigBee',
    fields: [
      { key: 'dev_fans', label: 'Fan Devices', type: 'textarea', placeholder: '40|Living Room\n41|Master Bedroom\n42|Guest Bedroom\n43|Kitchen/Dining', hint: 'device_id|Room Name per line' },
    ],
  },
  {
    key: 'lighting', label: 'Lighting — Philips Hue (via Hubitat)',
    fields: [
      { key: 'dev_hue_rooms', label: 'Hue Rooms/Groups', type: 'textarea', placeholder: '50|Living Room|main\n51|Kitchen|main\n52|Master Bedroom|main\n53|Dining Room|main\n54|Upstairs Hall|up\n55|Bedroom 2|up\n56|Garage|garage', hint: 'device_id|Room Name|floor (main/up/garage) per line' },
    ],
  },
  {
    key: 'devices', label: 'Smart Devices',
    fields: [
      { key: 'dev_water_heater',  label: 'Water Heater Switch ID (Aeotec HDS Gen5)', type: 'number', placeholder: '60' },
      { key: 'dev_uv_main',       label: 'UV System Module ID',                        type: 'number', placeholder: '61' },
      { key: 'dev_golf_cart',     label: 'Golf Cart Charger ID (Aeotec SS7)',          type: 'number', placeholder: '62' },
      { key: 'dev_lock',          label: 'Door Lock ID (Kwikset Z-Wave)',              type: 'number', placeholder: '63' },
      { key: 'dev_dehumid_crawl', label: 'Crawlspace Dehumidifier ID (Aloair)',        type: 'number', placeholder: '64', hint: 'Monitored via Emporia — reads power attribute' },
      { key: 'dev_dehumid_up',    label: 'Upstairs Dehumidifier ID',                  type: 'number', placeholder: '65' },
    ],
  },
  {
    key: 'outside', label: 'Outside — Irrigation & Mailbox',
    fields: [
      { key: 'dev_irrigation',       label: 'Hunter Pro-HC Controller ID',  type: 'number', placeholder: '70' },
      { key: 'dev_irrigation_zones', label: 'Irrigation Zone Devices',       type: 'textarea', placeholder: '71|Front Lawn\n72|Side Beds E\n73|Side Beds W\n74|Backyard\n75|Garden Beds', hint: 'device_id|Zone Name per line' },
      { key: 'dev_mailbox',          label: 'Mailbox Sensor ID (ZWLR)',      type: 'number', placeholder: '80' },
    ],
  },
]
