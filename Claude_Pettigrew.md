# Claude_Pettigrew.md
## Pettigrew Smart Home Dashboard — Hubitat C8 Pro Integration Spec
**Project:** Pettigrew Home Automation Dashboard
**Address:** 113 Pettigrew Dr, Savannah GA 31411 (The Landings, Skidaway Island)
**Property:** 3,030 sqft · 4 bed / 4 bath · Built 1981 · Slab · Water view · 0.39 acres · HOA $154/mo
**Hub:** Hubitat C8 Pro (new install)
**Owner:** David & Laura Taylor
**Last Updated:** 2026-06-27
**Status:** In Development — Ecobee ordered (Costco), Hubitat C8 Pro ordered (Prime Day $159.95), hardware acquisition active

---

## 1. Project Overview

Smart home command center for the Pettigrew residence. Primary missions:
1. **Air quality & humidity monitoring** — Airthings + Govee sensor network, room-by-room
2. **Power monitoring & bill reduction** — Emporia Vue 3, current bill $15–20/day ($450–600/month)
3. **Leak detection** — Govee leak sensors at all water risk points
4. **Full device control** — HVAC, lighting, water heater, dehumidifiers, irrigation, skylights, exterior floods

Dashboard served via GitHub Pages + Cloudflare Access (Google OAuth gate) on Jarvis terminal (RPi 5 + SunFounder 10") and mobile. Architecture: Outside / Main Level / Upstairs floor navigation with landing overview page.

**Future:** Whole-house audio + Jarvis voice/lighting control interface.

---

## 2. Confirmed Decisions

| # | Decision | Resolution |
|---|---|---|
| HVAC | Nest × 2 → Replace | **Ecobee Premium Plus Pack × 2 — ORDERED (Costco $229 ea, 4 SmartSensors included)** |
| HVAC units | Rheem + York confirmed | **Rheem RP1460BJ1NA (4-ton, 2021, main floor) + York YHJF18S41S1A (1.5-ton, upstairs) — both single stage heat pumps, R410A** |
| HVAC wiring | C-wire check needed | **Photograph existing Nest wiring before removal — confirm O/B, W1, C terminals at each location** |
| Power monitor | Emporia Vue 3 | **Confirmed — order next** |
| Water heater — electric | Z-Wave control | **Aeotec Heavy Duty Smart Switch Gen5 (240V/40A)** |
| Water heater — gas | No control | **Leave as-is — no viable remote control path** |
| Pool | None | **No pool — well pump / irrigation pump only** |
| Dehumidifiers | Two units | **Aloair (crawlspace post-repair) + standard unit (upstairs)** |
| UV — whole house | Monitor only | **Z-Wave appliance module, energy draw = lamp health** |
| UV — HVAC upstairs | Future stub | **In-duct UV for air handler — install TBD** |
| Irrigation controller | B-Hyve → Replace | **Hunter Pro-HC PHC-600i (indoor, 6-zone) — confirmed** |
| Irrigation — Hydrawise | Cloud platform | **PHC-600i runs Hydrawise — Hubitat driver: tomwpublic/hubitat_hydrawise** |
| Flow meter | Hunter HC (installed) | **Works natively with Pro-HC — reads via Hydrawise API into Hubitat** |
| Exterior lighting | Cree WiFi bulbs | **Bulbs not fixtures — Tuya pairing test needed; check model on bulb base** |
| Govee sensors | Three networks | **Temp/humidity + Leak detectors + Lamp controllers — all via Govee Integration V2 (HPM)** |
| Ceiling fans | 4 × 52" fans | **DL-6101T RF remotes (303MHz) — Hampton Bay ZigBee canopy module × 4 (~$20 ea, Home Depot)** |
| Smart lock | Garage/laundry door | **Kwikset Halo or SmartCode 888 (Z-Wave Plus) — Hubitat Lock Manager** |
| Skylight blinds | Vendor TBD | **Z-Wave or Zigbee required — Somfy inclined motor or Lutron Serena; automation spec in §19** |
| Golf cart charger | Shared garage outlet | **Aeotec Smart Switch 7 (120V Z-Wave) — isolated energy monitoring** |
| GA Power rate | TOU confirmed available | **Smart Usage: on-peak $0.146/kWh (2–7pm M-F Jun–Sep), off-peak $0.016/kWh, demand $12.44/kW** |
| Dashboard host | paradisesurfsidesc.com/home | **Cloudflare Access (Google OAuth) — Jarvis terminal + mobile** |
| Future audio/lighting | Jarvis interface | **Stub — whole-house audio + unified lighting control** |

---

## 3. System Architecture

```
Hubitat C8 Pro (hub — Z-Wave + Zigbee + LAN + Cloud integrations)
│
├── HVAC — Ecobee SmartThermostat Premium × 2
│   ├── Zone 1: Main floor/living
│   ├── Zone 2: Upstairs/bedrooms
│   ├── SmartSensors: 4 total (2 per Costco bundle)
│   └── Driver: Ecobee Suite Manager (SANdood — HPM)
│
├── Power Monitor — Emporia Vue 3
│   ├── Outside clamp unit ($149) — whole-home L1/L2
│   ├── Inside branch expander ($99) — per-circuit
│   └── Driver: amithalp/hubitat-emporia-vue (HPM)
│
├── Govee Sensor Network A — Temp/Humidity
│   ├── Sensors: Room-by-room WiFi/BT hygrometers
│   ├── Driver: Govee Integration V2 (mavrrick58 — HPM)
│   └── Integration: Govee Cloud API (v2, Dec 2023+)
│
├── Govee Sensor Network B — Leak Detectors
│   ├── Locations: Under sinks, water heater, washing machine, crawlspace
│   ├── Driver: Govee Integration V2 (same app)
│   └── Alert: Immediate push + Jarvis TTS on any wet event
│
├── Electric Water Heater
│   └── Aeotec Heavy Duty Smart Switch Gen5 (Z-Wave, 240V/40A, energy monitoring)
│
├── UV System — Whole House (Main)
│   └── Z-Wave appliance module (energy monitoring — draw drop = lamp failure)
│
├── Dehumidifiers
│   ├── Aloair — crawlspace (post-hurricane repair; currently downstairs)
│   └── Standard unit — upstairs
│       Both monitored via Emporia Vue branch circuits
│
├── Airthings (Primary AQ sensors)
│   ├── Wave Plus — bedroom (radon priority)
│   └── View Plus — main living (PM2.5 + display)
│
├── Irrigation — Hunter Pro-HC (replaces B-Hyve)
│   ├── Hubitat driver: Hunter Pro-HC community driver (HPM)
│   ├── Hunter Flow Meter: INSTALLED — works natively with Pro-HC
│   │   → GPM per zone, master valve control, leak detection built-in
│   │   → B-Hyve did NOT support Hunter flow meters (confirmed)
│   │   → Rachio also incompatible with Hunter meters (requires Rachio-brand sensor)
│   │   → Hunter Pro-HC is the correct and lowest-cost path
│   └── Pump circuit monitored via Emporia Vue (secondary confirmation)
│
├── Exterior Lighting — Cree WiFi Flood Lights ⚠
│   ├── These are WiFi (NOT Z-Wave/Zigbee) — no native Hubitat driver
│   ├── Confirmed community thread: no direct Cree WiFi integration exists
│   ├── Integration paths:
│   │   A. Tuya Cloud Driver (if Cree floods use Tuya chip — some PAR38 confirmed)
│   │   B. Flash with Tasmota (if hardware allows — local LAN control)
│   │   C. Replace with Kasa EP40 outdoor smart plugs + dumb floods (clean Z-Wave alt)
│   │   D. Keep in Cree app only — no Hubitat integration (status quo)
│   └── Recommendation: Test Tuya pairing first; if fails, replace with Kasa or Z-Wave
│
├── Skylight Shades (motorized)
│   └── Z-Wave or Zigbee driver TBD — confirm protocol on existing motors
│
├── Mailbox Sensor (Long-Range)
│   ├── Preferred: ZWLR contact/tilt (C8 Pro 700-series, ~1 mile LOS)
│   └── Fallback: Dragino LDS02 LoRaWAN → TTN → MQTT → Hubitat
│
├── Tempest Weather Station
│   ├── Driver: WeatherFlow-Tempest community driver (HPM)
│   └── Provides: Outdoor temp, humidity, wind, UV, rain, pressure (local UDP)
│
└── Dashboard
    ├── GitHub Pages (static React build)
    ├── Cloudflare Access (Google OAuth gate — David + Laura)
    └── Pulls from Hubitat Maker API (local + remote via Cloudflare tunnel)
        Jarvis Pi (RPi 5 + SunFounder 10") + mobile browser
```

---

## 4. Device Inventory

### 4.1 Ecobee SmartThermostat Premium × 2
**Model:** EB-STATE6VP-01 · **Driver:** Ecobee Suite Manager (HPM)

| Attribute | Use |
|---|---|
| `temperature` | Current zone temp |
| `thermostatSetpoint` | Target setpoint (Hubitat-controlled) |
| `thermostatOperatingState` | cooling / heating / idle / fan |
| `humidity` | Zone RH |
| `currentProgramName` | Hold / Schedule / Away / Sleep |
| `equipmentStatus` | Runtime tracking |

**Core rules:** Minimum 20-min cooling cycle, dehumidification boost, presence-based away setback, pre-arrival recovery. See §5.

### 4.2 Emporia Vue 3
| Circuit | Load | Alert |
|---|---|---|
| HVAC Zone 1 | 2–4 kW | >4.5 kW sustained |
| HVAC Zone 2 | 2–4 kW | >4.5 kW sustained |
| Electric Water Heater | 4–5.5 kW | Off 2–7pm per schedule |
| Irrigation Pump | 1–2 kW | Alert if running outside schedule |
| Aloair Dehumidifier | 0.6–1.1 kW | Alert if off during high-humidity |
| Upstairs Dehumidifier | 0.3–0.7 kW | Monitor runtime |
| UV System | 0.05–0.08 kW | Alert if draw = 0 during scheduled ON |
| LG Washer/Dryer | 0.8–2 kW | Display only |
| Exterior Floods | 0.1–0.4 kW | Display only |
| Always-on baseline | ~0.4–0.8 kW | Flag if baseline creeps |

### 4.3 Govee Sensor Network A — Temp/Humidity
**Driver:** Govee Integration V2 (mavrrick58, HPM) — Govee Cloud API v2
**Poll interval:** ~2 min (cloud API)

| Location | Sensor | Key metrics |
|---|---|---|
| Master bedroom | H5179 / H5104 | Temp, RH, battery |
| Guest bedroom 2 | H5179 / H5104 | Temp, RH |
| Guest bedroom 3 | H5179 / H5104 | Temp, RH |
| Guest bedroom 4 | H5179 / H5104 | Temp, RH |
| Living room | H5179 / H5104 | Temp, RH |
| Kitchen | H5179 / H5104 | Temp, RH |
| Crawlspace | H5179 / H5104 | Temp, RH (critical — post-hurricane) |
| Garage | H5179 / H5104 | Temp, RH |

**Note:** Govee V2 API (Dec 2023) added broad device support including H5106 air quality. Confirm exact model numbers for full attribute list.

### 4.4 Govee Sensor Network B — Leak Detectors
**Same Govee Integration V2 app**

| Location | Priority |
|---|---|
| Under kitchen sink | High |
| Under master bath sink | High |
| Under guest bath sinks (×2) | High |
| Electric water heater base | Critical |
| LG washer/dryer area | High |
| Crawlspace (multiple) | Critical — post-hurricane |
| HVAC air handler drip pans | High |

**Alert:** Any wet event → immediate push + Jarvis TTS "Water leak detected at [location]" + dashboard ALERT state.

### 4.5 Electric Water Heater — Aeotec Heavy Duty Switch Gen5
- Z-Wave Plus · 240V / 40A · Built-in energy monitoring
- Same device as Paradise Beach House — consistent platform
- Schedule: OFF 2pm–7pm · Pre-heat 5am · Vacation: OFF if away > 4h

### 4.6 UV System — Whole House
- Z-Wave appliance module with energy monitoring
- Lamp baseline: ~55–80W. Draw < 10W during scheduled ON = lamp failure
- Runtime counter virtual device — alert at 10,000h (~14 months continuous)

### 4.7 Dehumidifiers
| Unit | Location | Status | Notes |
|---|---|---|---|
| Aloair | Crawlspace (after hurricane repair) | Currently downstairs | Commercial-grade, 600–1,100W |
| Standard | Upstairs | Permanent | Monitor RH + draw |

### 4.8 Hunter Pro-HC Irrigation Controller (replaces B-Hyve)
**Why Hunter Pro-HC over alternatives:**
- Hunter Flow Meter already installed → works natively, zero additional cost
- B-Hyve: no Hunter flow meter support (confirmed)
- Rachio 3: incompatible with Hunter meters, requires Rachio-brand sensor ($50 extra)
- Hunter Pro-HC: ~$150–180, flow meter just works

| Element | Detail |
|---|---|
| Driver | Hunter Pro-HC community driver (HPM) |
| Zones | 5 confirmed zones |
| Flow meter | Hunter — natively supported, GPM readable per zone |
| Flow attributes | `flowRate` (GPM), `cumulativeFlow` (gallons), `leakAlert` |
| Master valve | Supported — isolates pump on leak detection |
| Hubitat attributes | Zone on/off, schedule, flow rate, leak status, rain skip |
| Pump monitoring | Emporia Vue circuit (secondary confirmation of pump state) |

**Flow meter capabilities unlocked:**
- GPM reading per zone → detect partially blocked heads (low flow) or broken heads (high flow)
- Leak detection: flow detected with no zone active → master valve closes, alert fires
- Cumulative gallons per zone → water budget tracking on dashboard
- Seasonal adjustment via Hubitat weather (Tempest integration)

### 4.9 Exterior Lighting — Cree WiFi Floods ⚠
**Integration status: UNRESOLVED**
- No native Hubitat driver for Cree WiFi floods confirmed in community
- Tuya Cloud Driver confirmed working with Cree PAR38 bulbs when paired via Tuya app instead of Cree app — test this path first
- If Tuya chip confirmed: Tuya Cloud Driver (HPM) → Hubitat control
- If not: Replace with Kasa EP40 outdoor smart plugs (local LAN, excellent Hubitat driver) + dumb flood heads
- **Action:** Check Cree flood model number → determine chip → test Tuya pairing

### 4.10 Tempest Weather Station
- **Driver:** WeatherFlow-Tempest (HPM) — local UDP, no cloud dependency
- Attributes: `temperature`, `humidity`, `windSpeed`, `windDirection`, `uvIndex`, `precipitation`, `pressure`, `feelsLike`
- Replaces all stub weather data on dashboard

### 4.11 Skylight Shades
- Protocol TBD (confirm Z-Wave vs Zigbee vs proprietary on existing motors)
- Control: Open %, Close %, position hold
- Dashboard: Per-skylight slider + preset buttons (Open / 50% / Close)

### 4.12 Mailbox Sensor
- ZWLR preferred (C8 Pro 700-series, ~1 mile LOS)
- Events: Open → push + TTS + flag; 8pm reminder; 72h no-event alert

---

## 5. Rule Machine Automations

### 5.1 HVAC — Primary Bill Lever
```
Minimum run time:
  IF HVAC starts cooling → block setpoint raise for 20 min (prevents short cycling)

Dehumidification boost:
  IF indoor RH > 58% AND HVAC idle → drop setpoint 2°F for 30 min

Away setback (presence-based):
  IF all presence away AND time < 3pm → Zone1=82°, Zone2=84°
  IF all presence away AND time ≥ 3pm → Zone1=80°, Zone2=82° (pre-cool)

Pre-arrival recovery:
  IF first presence arriving (ETA 30 min) → Zone1=74°, Zone2=72°

Peak hour fan assist:
  IF time 2pm–7pm AND HVAC idle AND RH > 55% → fan=ON (circulate, no compressor)
```

### 5.2 Electric Water Heater
```
Peak avoidance:    2:00 PM → OFF · 7:00 PM → ON
Pre-heat:          5:00 AM → ON
Irrigation lock:   IF irrigation next run < 30 min → OFF (avoid simultaneous load)
Vacation:          IF all away > 4h AND after noon → OFF
Return:            IF first arrival → ON
```

### 5.3 Leak Detection — Govee
```
IF ANY Govee leak sensor = wet →
  Push ALERT "💧 Water leak at [sensor name]"
  Jarvis TTS "Water leak detected at [location] — check immediately"
  Dashboard: LEAK ALERT banner (crimson, full-width)
  IF leak at water heater AND water heater = ON → Water Heater switch OFF
```

### 5.4 UV System Monitoring
```
IF UV switch ON AND draw < 10W for 5 min → Push "⚠ UV lamp failure"
IF UV runtime counter > 10,000h → Push "UV lamp replacement due"
```

### 5.5 Dehumidifier Monitoring (cross-reference with Govee RH)
```
IF Govee crawlspace RH > 65% AND Aloair circuit draw < 50W → Push "Aloair may be off/failed"
IF Govee upstairs RH > 62% AND upstairs dehumidifier draw < 30W → Push "Upstairs dehumidifier check"
```

### 5.6 Power Anomaly
```
IF whole-home > 12 kW sustained 10 min → Push "High power usage"
IF whole-home > 8 kW between midnight–6am → Push "Unusual overnight load"
IF daily kWh at 6pm pace projects > $18 → Push "On track for high bill day"
```

### 5.7 Irrigation — Hunter Pro-HC + Flow Meter
```
// Pump confirmation (primary via flow meter, secondary via Emporia)
IF zone active AND flowRate = 0 GPM for 2 min →
  Push "⚠ Irrigation pump not running — check pump/valve"
  Close master valve (protect pump from dry run)

// Broken/blown head detection (high flow)
IF zone active AND flowRate > [zone baseline + 25%] →
  Push "⚠ High flow on [zone] — possible broken head"
  Log event with timestamp and GPM

// Blocked head detection (low flow)
IF zone active AND flowRate < [zone baseline - 25%] →
  Push "Low flow on [zone] — check for blocked heads"

// Leak detection — no zone active but flow detected
IF all zones OFF AND flowRate > 0.5 GPM for 3 min →
  Close master valve immediately
  Push ALERT "💧 Irrigation leak detected — master valve closed"
  Jarvis TTS "Irrigation leak — water shutoff activated"
  Dashboard: LEAK flag on Outside page

// Zone baseline learning (set manually after first season)
// Zone 1 Front Lawn:   ~3.2 GPM baseline
// Zone 2 Side Beds E:  ~2.1 GPM baseline
// Zone 3 Side Beds W:  ~2.1 GPM baseline
// Zone 4 Backyard:     ~4.0 GPM baseline
// Zone 5 Garden Beds:  ~1.8 GPM baseline

// Peak rate interlock
IF irrigation scheduled between 2pm–7pm →
  Delay run to 7:01 PM

// Weather interlock (Tempest)
IF Tempest rain today > 0.25" → Skip run
IF Tempest humidity > 80% → Skip run

// Water budget dashboard
Every zone run → log gallons consumed (flowRate × runtime)
Daily total gallons → display on Outside page dashboard tile

// Pump circuit cross-check (Emporia)
IF zone active AND pump circuit draw < 200W AND flowRate = 0 →
  Confirm pump failure (both sensors agree) → escalate alert
```

### 5.8 Mailbox
```
IF open → Push + TTS + Mail Flag ON
IF Mail Flag ON at 8pm → reminder push
IF no event 72h weekday → Push "Check mailbox sensor"
```

### 5.9 Exterior Lights (pending Cree integration resolution)
```
IF sunset → Exterior floods ON
IF sunrise → Exterior floods OFF
IF motion (future sensor) → Exterior floods ON for 10 min
IF away mode → Exterior floods ON at sunset, OFF at midnight
```

---

## 6. Dashboard Architecture

### 6.1 Hosting
- **Repo:** GitHub Pages (static React build, CI/CD via GitHub Actions)
- **Auth:** Cloudflare Access → Google OAuth (David + Laura accounts)
- **Tunnel:** Cloudflare Tunnel → Hubitat Maker API (local LAN for Jarvis, tunnel for mobile)
- **Jarvis display:** RPi 5 + SunFounder 10" — local kiosk mode, always-on

### 6.2 Page Structure
```
/ (Landing — Overview)
  ├── Tempest weather hero
  ├── AQI ring (Airthings)
  ├── Power snapshot ($today, kW now, projected)
  ├── HVAC zones × 2
  ├── Leak detector status (all-clear or ALERT)
  ├── Govee RH network summary
  └── Quick-jump floor buttons

/outside
  ├── Tempest full detail
  ├── Hunter Pro-HC irrigation (zones, flow GPM, next run, rain skip)
  ├── Flow meter data (GPM per zone, daily gallons, leak status)
  ├── Irrigation pump draw (Emporia — secondary)
  ├── Exterior floods (Cree — pending integration)
  └── Mailbox sensor

/main
  ├── Ecobee Zone 1 (full control)
  ├── Electric water heater (toggle + schedule)
  ├── Lighting control (per-room toggles + dimmer)
  ├── Skylight shades (per-skylight slider)
  ├── Govee temp/RH — main level rooms
  ├── UV system status
  └── Emporia — main level circuits

/upstairs
  ├── Ecobee Zone 2 (full control)
  ├── Upstairs dehumidifier (status + draw)
  ├── Govee temp/RH — upstairs rooms
  ├── Lighting control (per-room)
  └── UV HVAC — future stub (in-duct air handler)
```

### 6.3 Design Tokens
```
Background:  #111827   Card: #1F2937   Border: #4B5563
Teal:        #00D4AA   (good / active)
Amber:       #F5A623   (warning)
Crimson:     #E5484D   (alert / leak)
Blue:        #60A5FA   (water / humidity)
Purple:      #A78BFA   (shades / future)
Font-data:   DM Mono   (all sensor numbers)
Font-UI:     Inter     (labels, nav, controls)
```

---

## 7. Hardware — Full Inventory

| Item | Purpose | Cost | Status |
|---|---|---|---|
| Hubitat C8 Pro | Hub | $149 | ✅ In hand |
| Ecobee Premium Plus Pack × 2 | HVAC (4 SmartSensors) | $458 | ✅ Ordered |
| Emporia Vue 3 (clamps) | Whole-home power | $149 | 🛒 Order |
| Emporia Vue branch expander | Per-circuit | $99 | 🛒 Order |
| Aeotec Heavy Duty Switch Gen5 | Electric water heater | $60 | 🛒 Order |
| Z-Wave appliance module | UV system monitoring | $40 | 🛒 Order |
| Airthings Wave Plus | Bedroom AQ + radon | $229 | 📋 Planned |
| Airthings View Plus | Main living AQ + display | $299 | 📋 Planned |
| ZWLR mailbox sensor | Long-range mailbox | $30–50 | 📋 Test ZWLR first |
| Kasa EP40 outdoor plugs × N | Exterior floods (if Cree fails) | $20 ea | 📋 Contingency |
| Hunter Pro-HC controller | Replace B-Hyve, unlock flow meter | $150–180 | 🛒 Order |
| RPi 5 + SunFounder 10" | Jarvis terminal | $175 | 📋 Planned |

**Committed:** ~$667 · **Full build:** ~$1,700–2,000
**Estimated monthly savings:** $100–200 (HVAC control + WH scheduling)
**Payback:** ~10–18 months

---

## 8. Future — Whole-House Audio + Jarvis Lighting Control

**Scope:** Full voice and touch control of audio zones + all lighting via Jarvis terminal and Hubitat.

**Audio candidates:**
- Sonos (Hubitat native integration — best path)
- Denon HEOS (community driver exists)
- SnapCast + Raspberry Pi endpoints (fully local, budget)

**Lighting control future state:**
- Replace Cree WiFi floods with Z-Wave/Zigbee outdoor fixtures
- Add Z-Wave dimmer switches for all interior zones
- Jarvis voice: "Jarvis, dim living room to 40%" → Hubitat Rule Machine → switches
- Scene control: Movie / Dinner / Away / Morning / Night modes

**Jarvis integration points (future):**
- Wake word detection → Claude API → Hubitat Maker API command
- Dashboard touch → Hubitat command
- TTS announcements (current) → bidirectional voice (future)

---

## 9. Open Items

| # | Item | Action |
|---|---|---|
| 1 | Cree WiFi floods | Check model number → test Tuya pairing → decide replace or integrate |
| 2 | Govee sensor models | Confirm exact model numbers for V2 API attribute mapping |
| 3 | Skylight shades | Confirm protocol (Z-Wave vs Zigbee vs proprietary) on existing motors |
| 4 | Hunter Pro-HC install | Order controller · replace B-Hyve · re-wire zones · pair to Hubitat · set zone flow baselines after first full run |
| 5 | Mailbox ZWLR | Test range with compatible sensor before ordering |
| 6 | Ecobee C-wire | Confirm C-wire present at both thermostat locations before install |
| 7 | Emporia Vue | Schedule electrician for CT clamp install on main panel |
| 8 | Georgia Power rate | Check for TOU rate option — amplifies water heater scheduling savings |
| 9 | Crawlspace dehumidifier | Confirm timeline for hurricane damage repair → Aloair relocation |
| 10 | Govee leak detectors | Audit all water risk locations — confirm full coverage |

---

## 10. Related Projects

- **Jarvis Terminal** — RPi 5 + SunFounder 10" + Node.js + Cloudflare Worker (Claude_Jarvis.md — TBD)
- **Paradise Beach House** — Separate Hubitat; water shutoff, Emporia Vue 3, Hurricane Mode (Claude_Paradise.md)
- **Family Operations Portal** — Cloudflare Pages + Google OAuth; property manager, home inventory

---

## 11. Next Steps (Ordered)

- [x] Order Ecobee × 2 (Costco — done)
- [ ] Order Hunter Pro-HC controller (~$150–180) — replaces B-Hyve, unlocks flow meter
- [ ] Determine Cree flood model → test Tuya pairing
- [ ] Order Emporia Vue 3 + branch expander
- [ ] Order Aeotec Heavy Duty Switch (electric WH)
- [ ] Order Z-Wave appliance module (UV monitoring)
- [ ] Confirm Govee sensor model numbers → verify V2 API support
- [ ] Audit leak detector coverage — order any gaps
- [ ] Pair Hubitat C8 Pro → configure Maker API + install HPM
- [ ] Install HPM packages: Ecobee Suite, Emporia Vue, Govee V2, Hunter Pro-HC, Tempest
- [ ] Confirm C-wire at both thermostat locations → install Ecobee
- [ ] Schedule electrician: Emporia CT clamps + Aeotec WH switch
- [ ] Install Hunter Pro-HC · re-wire irrigation zones · verify flow meter reads
- [ ] Run each zone manually → record GPM baseline per zone
- [ ] Install UV monitoring module
- [ ] Build Rule Machine automations (HVAC runtime + WH scheduling + flow meter rules first)
- [ ] Deploy Jarvis React dashboard (GitHub Pages + Cloudflare Access)
- [ ] Order Airthings Wave Plus + View Plus
- [ ] Test ZWLR mailbox sensor range

---

*Source of truth for Pettigrew Hubitat project. Update after each build session.*

---

## 12. Irrigation Zone Calibration

### Target parameters (Savannah GA summer)
- **Weekly water target:** 1.0–1.5 inches (sandy coastal soil — use higher end in peak summer)
- **Runs per week:** 3 (Mon / Wed / Fri early morning)
- **Per-run target:** 0.33–0.50 inches
- **Run window:** Before 2pm (avoid peak electric rate hours)

### Zone baseline table (fill in after first Pro-HC install)
| Zone | Name | Baseline GPM | Catch Test (in/15min) | Precip Rate (in/hr) | Calculated Run Time |
|---|---|---|---|---|---|
| 1 | Front Lawn | 3.2 GPM | 0.38" | 0.40 in/hr | 52 min |
| 2 | Side Beds E | 2.1 GPM | 0.28" | 0.28 in/hr | 70 min |
| 3 | Side Beds W | 2.1 GPM | 0.30" | 0.30 in/hr | 66 min |
| 4 | Backyard | 4.0 GPM | 0.42" | 0.42 in/hr | 47 min |
| 5 | Garden Beds | 1.8 GPM | 0.22" | 0.25 in/hr | 68 min |
| 6 | Zone 6 | — | — | — | — |

*Values above are stubs — record actuals after first full run and catch test*

### Run time formula
```
Run time (min) = (Target per run ÷ Precipitation rate) × 60

Example:
Target = 0.33" per run
Precip rate = 0.40 in/hr
Run time = (0.33 ÷ 0.40) × 60 = 49.5 → round to 50 min
```

### Catch test procedure (do once per season)
1. Place 4–6 straight-sided cans (tuna cans) randomly across the zone
2. Run zone for exactly 15 minutes
3. Measure water depth in each can in inches
4. Average all readings → multiply by 4 = precipitation rate (in/hr)
5. Record baseline GPM from Hydrawise app during the same run
6. Calculate run time from formula above
7. Enter values into Hydrawise zone settings

### Flow meter alert thresholds (Rule Machine)
```
Zero flow alert:  Zone active + flowRate = 0 GPM for 2 min → alert + close master valve
High flow alert:  Zone active + flowRate > (baseline × 1.8) for 60 sec → alert (broken head)
Low flow alert:   Zone active + flowRate < (baseline × 0.6) → alert (blocked head)
Leak detection:   All zones OFF + flowRate > 0.5 GPM for 3 min → close master valve + ALERT
```

### Hydrawise weather integration
- Connect Tempest to Hydrawise via Weather Underground PWS ID
- Set rain skip threshold: 0.5" today or forecast
- Enable Predictive Watering — Hydrawise adjusts run times via ET calculation from Tempest data
- No separate rain sensor needed — Tempest replaces it entirely


---

## 13. Georgia Power Rate Plans

### Smart Usage (TOU) — **Recommended**
Georgia Power offers several TOU rate plans. Smart Usage is the most relevant for Pettigrew:

| Period | Rate | When |
|---|---|---|
| **On-Peak** | $0.146/kWh | June–Sept · Mon–Fri · 2pm–7pm |
| **Off-Peak** | $0.016/kWh | All other hours + weekends + holidays |
| **Demand charge** | $12.44/kW | Highest single usage hour per month |

**Key implications for Pettigrew automation:**
- On-peak rate is **9× higher** than off-peak — shifting loads out of 2pm–7pm window is high value
- Demand charge means a single hour of simultaneous large loads (HVAC + WH + golf cart charger + oven) can spike the monthly bill significantly
- 12-month commitment required · $30 activation fee

**Also available:** Overnight Advantage (adds super off-peak 11pm–7am at even lower rate — good if golf cart charges overnight) and Nights & Weekends.

**Action:** Call Georgia Power or use Rate Advisor tool at georgiapower.com to compare your actual usage pattern against each plan. If currently on standard residential rate, Smart Usage likely saves money given your load profile.

### Hubitat Rule Machine — load shifting rules (Smart Usage)
```
// Water heater peak avoidance
IF time = 2:00 PM AND rate_plan = Smart_Usage → Water Heater OFF
IF time = 7:00 PM → Water Heater ON

// Golf cart charger peak avoidance
IF time = 2:00 PM → Golf Cart Charger OFF (Aeotec switch)
IF time = 7:00 PM → Golf Cart Charger ON

// Irrigation peak avoidance
IF irrigation scheduled between 2pm–7pm → delay to 7:01pm

// Demand spike prevention
IF whole-home draw > 8kW AND time between 2pm–7pm →
  Push alert "Peak demand spike — consider turning off non-essential loads"
  // Optional: auto-raise HVAC setpoint 2°F to reduce compressor load

// Golf cart charge complete detection
IF golf cart charger draw drops below 200W (trickle) →
  Push "🔋 Golf cart charging complete"
  // Optional: auto-shutoff after 30 min at trickle
```

---

## 14. Power Monitoring — Full Circuit Plan

### Emporia Vue 3 circuit assignments
| CT # | Circuit | Load | Alert |
|---|---|---|---|
| Mains L1 | Whole home L1 | — | — |
| Mains L2 | Whole home L2 | — | — |
| 1 | HVAC Zone 1 (main) | 2–4 kW | >4.5kW sustained |
| 2 | HVAC Zone 2 (upstairs) | 2–4 kW | >4.5kW sustained |
| 3 | Electric water heater | 4–5.5 kW | Scheduled off 2–7pm |
| 4 | Well pump / irrigation | 1–2 kW | See §14 well pump rules |
| 5 | Aloair dehumidifier | 0.6–1.1 kW | Off during high-RH = alert |
| 6 | Upstairs dehumidifier | 0.3–0.7 kW | Monitor runtime |
| 7 | UV system | 0.05–0.08 kW | Draw=0 during on = lamp failure |
| 8 | LG washer/dryer | 0.8–2 kW | Display only |
| 9 | Exterior lighting | 0.1–0.4 kW | Display only |
| 10 | Spare | — | — |

### Golf cart charger — Aeotec Smart Switch 7 (dedicated)
- **Device:** Aeotec Smart Switch 7 (120V, Z-Wave, energy monitoring)
- **Location:** Garage outlet serving golf cart charger
- **Why dedicated switch vs Emporia CT:** Shared circuit — isolates charger draw exactly
- **Charge profile monitoring:**
  - High draw phase: 800–1,500W (bulk charge)
  - Taper phase: 200–500W (absorption)
  - Trickle/complete: <200W
  - Rule: drop below 200W for 15 min → "Charge complete" push

---

## 15. Well Pump / Irrigation Pump Rules

**Critical context:** Well pump requires ~3 minutes to prime. No flow within 5 minutes of zone activation = pump failure. Dry running destroys pump seals rapidly.

```
// Primary protection rule — NO FLOW AFTER 5 MINUTES
IF irrigation zone active AND flowRate = 0 GPM sustained 5 min →
  IMMEDIATELY: Close all irrigation zones (Hydrawise API command)
  IMMEDIATELY: Push ALERT "⛔ Well pump failure — irrigation shut off"
  Jarvis TTS: "Irrigation emergency — well pump not priming — zones closed"
  Dashboard: PUMP ALERT banner (crimson)
  Log event with timestamp

// Secondary confirmation (Emporia Vue cross-check)
IF irrigation zone active AND well pump circuit draw < 200W sustained 5 min →
  Cross-reference with flow meter
  IF both agree (no flow + no draw) → escalate to pump failure alert
  IF draw present but no flow → possible flow meter fault — push "Check flow meter"

// Normal prime confirmation
IF irrigation zone active AND flowRate > 0 GPM within 5 min → 
  Log "Pump primed successfully" (no notification)

// Low pressure warning (pre-failure indicator)
IF irrigation zone active AND flowRate < (baseline × 0.5) sustained 3 min →
  Push "⚠ Low flow — well pressure may be dropping"

// Post-shutdown lockout
After pump failure alert:
  Require manual reset via dashboard before irrigation can run again
  Push reminder every 2h until reset: "Irrigation locked — check well pump"
```

---

## 16. Govee Ecosystem — Full Device Inventory

All devices integrate via **Govee Integration V2** (mavrrick58 — HPM). Same app, different device types. Govee Cloud API v2.

### Govee devices confirmed
| Type | Network | Integration |
|---|---|---|
| Temp/humidity sensors | Hub A | Govee V2 → Hubitat |
| Leak detectors | Hub B | Govee V2 → Hubitat |
| Lamp controllers | TBD | Govee V2 → Hubitat (confirm model) |

### Govee lamp controllers
- Likely Govee H5080 or similar smart plug with energy monitoring
- Confirm model number — V2 API support varies
- Use cases: UV system monitoring (energy draw = lamp health), golf cart charger (secondary to Aeotec)
- If energy monitoring confirmed: can supplement Emporia Vue for fine-grained tracking

---

## 17. Kwikset Smart Lock — Garage/Laundry Door

| Element | Detail |
|---|---|
| Location | Garage → laundry room interior door |
| Recommended model | Kwikset Halo or SmartCode 888 (Z-Wave Plus) |
| Protocol | Z-Wave — native Hubitat driver |
| Use cases | Remote lock/unlock, auto-lock timer, presence-based lock/unlock |
| Integration | Hubitat Lock Manager app (HPM) — code management, user access log |

**Rules:**
```
// Auto-lock
IF door unlocked for 5 min AND no motion at door → Lock

// Presence-based
IF David presence arriving → Unlock (optional — review security preference)

// Vacation mode
IF all presence away > 4h → Verify locked, push status confirmation

// Tamper alert
IF lock tamper detected → Push immediate alert
```

---

## 18. Cree Smart Bulbs — Clarification

**These are bulbs, not fixture floods.** Integration path differs from fixture-mount WiFi floods.

| Question | Detail |
|---|---|
| Socket type | Standard E26 in recessed cans or fixture? |
| Current app | Cree app, Google Home, or Alexa? |
| Chip | Likely Tuya or proprietary — check via pairing method |

**Integration paths:**
- If currently in Cree app → test Tuya pairing (remove from Cree app, add via Tuya Smart app)
- If Tuya chip confirmed → Tuya Cloud Driver (HPM) → Hubitat
- If proprietary → replace with Zigbee or Z-Wave bulbs (Sengled Zigbee are excellent, ~$10/bulb)
- If in recessed cans → easiest long-term replacement: Inovelli Z-Wave switch + dumb bulbs (best control)

**Action:** Check model number on bulb base. Cree + [model] + Tuya search will confirm chip.


---

## 19. Automated Skylight Blinds

### Vendor selection criteria
**Protocol requirement:** Z-Wave or Zigbee only — no WiFi. Must integrate natively into Hubitat Rule Machine for full automation.

**Critical hardware requirement:** Motor must support overhead/inclined installation. Standard motors are not rated for skylight angles. Confirm with vendor before ordering.

| Vendor | Protocol | Skylight-rated | Hubitat | Price/shade | Notes |
|---|---|---|---|---|---|
| **Somfy** | Z-Wave / RTS | ✅ Yes — specific inclined motors | Community driver | $250–450 | Best skylight-specific product line |
| **Lutron Serena** | Z-Wave | ✅ Yes | Native driver | $300–500 | Best Hubitat integration, needs Lutron bridge |
| **Zemismart** | Zigbee | Verify per model | Community driver | $80–150 | Budget option — confirm overhead rating |
| IKEA Fyrtur | Zigbee | ❌ No | Native | $100–130 | Standard windows only — not for skylights |

**Recommendation:** Somfy with Z-Wave motor for skylight-specific reliability, or Lutron Serena if budget allows for best Hubitat integration. Confirm inclined motor model number before ordering.

**Skylight inventory (Pettigrew — 3 confirmed):**
- Living Room skylight
- Master Bath skylight
- Kitchen skylight
- TBD if additional skylights exist

---

### Automation logic — full rule set

#### Presence modes (Hubitat modes)
```
Home     = any presence detected
Away     = all presence absent > 15 min
Sleep    = time between 10pm–7am AND home
Morning  = time between 7am–10am AND home
```

---

#### Summer rules (June–September)

**When HOME:**
```
// Morning — welcome light
IF mode = Morning AND Tempest UV < 4 →
  Open skylights to 100%

// Mid-morning — start monitoring
IF time = 10:00 AM AND Tempest UV > 4 →
  Close skylights to 50% (partial — maintain some light)

// Peak solar — comfort protection
IF Tempest UV index > 6 AND time between 10am–4pm →
  Close skylights to 20% (block heat, allow ambient light)

// HVAC feedback — heat load winning
IF HVAC main OR upstairs runtime > 3h continuous →
  Close skylights to 0% (eliminate overhead solar gain)
  Push "Skylights closed — HVAC heat load high"

// Late afternoon — cooling begins
IF time = 4:00 PM AND Tempest UV < 5 →
  Open skylights to 60%

// Evening — full open
IF time = 6:30 PM →
  Open skylights to 100%

// Night — one decision at sunset, hold until morning
// Use Tempest overnight LOW forecast, not current temp
// If overnight low <= 76° → open for passive cooling all night
// If overnight low >= 77° → close and keep AC'd air in all night
// No mid-night checks — motors stay still once decision is made

IF time = sunset AND Tempest overnightLow <= 76° →
  Open skylights to 100%
  Hold open until sunrise (no further checks)

IF time = sunset AND Tempest overnightLow >= 77° →
  Close skylights to 0%
  Hold closed until sunrise (no further checks)

// Pre-dawn — close before sun hits the glass (summer only)
IF time = 6:00 AM AND skylights = open AND season = Summer →
  Close skylights to 0% (trap cool air before morning heat builds)
```

**When AWAY (summer):**
```
// Peak hours — closed for efficiency
IF mode = Away AND time between 9am–7pm →
  Close skylights to 0%

// Same sunset decision logic as home — use overnight forecast
IF mode = Away AND time = sunset AND Tempest overnightLow <= 76° →
  Open skylights to 80% (passive cooling, slightly conservative when away)
  Hold until sunrise

IF mode = Away AND time = sunset AND Tempest overnightLow >= 77° →
  Close skylights to 0%
  Hold until sunrise

// Pre-dawn close
IF mode = Away AND time = 6:00 AM AND season = Summer →
  Close skylights to 0%
```

---

#### Winter rules (November–March)

**When HOME:**
```
// Morning — open at sunrise for light and solar gain
IF time = sunrise AND season = Winter →
  Open skylights to 100%

// Hold open all day regardless of UV or clouds — light and passive heat
// Close at sunset — one decision, hold all night to retain heat
IF time = sunset AND season = Winter →
  Close skylights to 0%
  Hold closed until sunrise (no overnight checks needed in winter)
```

**When AWAY (winter):**
```
// Same as home — open at sunrise, close at sunset
// Passive solar gain while away, retain heat overnight
IF mode = Away AND time = sunrise AND season = Winter →
  Open skylights to 100%

IF mode = Away AND time = sunset AND season = Winter →
  Close skylights to 0%
  Hold closed until sunrise
```

---

#### Weather safety rules (always active — override everything)
```
// Rain — immediate close regardless of mode or season
IF Tempest rain rate > 0 → Close skylights to 0% IMMEDIATELY
IF Tempest rain detected (any) → Close skylights to 0% IMMEDIATELY

// Wind — close before storm
IF Tempest wind gust > 20 mph → Close skylights to 0%
IF Tempest wind gust > 15 mph → Close skylights to 30% (partial protection)

// Lightning
IF Tempest lightning detected within 10 miles → Close skylights to 0%

// Pressure drop (storm approaching)
IF Tempest pressure < 1005 hPa AND trend = falling →
  Close skylights to 0%
  Push "Skylights closed — storm approaching"

// Safety recovery
IF Tempest rain = 0 AND wind gust < 12 mph sustained 15 min →
  Restore skylights to last scheduled position
```

---

#### HVAC coordination rules
```
// Cooling assist — close skylights to reduce load
IF Ecobee main OR upstairs operating state = cooling AND
   outdoor temp > 85° AND time between 10am–6pm →
  Close skylights to 10%

// Heating assist (winter) — open for solar gain
IF Ecobee main OR upstairs operating state = heating AND
   Tempest UV > 3 AND time between 9am–3pm →
  Open skylights to 100%

// Dehumidification — close to reduce humidity infiltration
IF Airthings indoor humidity > 62% AND Tempest outdoor humidity > 75% →
  Close skylights to 0%
```

---

#### Sleep / overnight rules
```
// Sleep mode inherits the sunset decision — no separate sleep rule needed
// Whatever position was set at sunset stays all night
// The sunset rule already used overnight forecast to make the right call

// Only exception: weather safety always overrides
IF Tempest rain detected during night →
  Close skylights to 0% IMMEDIATELY (silent close, resume at sunrise)
```

---

#### Manual override handling
```
// If manually adjusted, respect override for 2 hours
// then resume automation
IF skylight position manually changed →
  Set "manual override" flag
  Pause automation for 2h
  After 2h → resume normal schedule
  Push "Skylight automation resumed"
```

---

### Dashboard integration
- Skylight position shown per-unit on Outside → Lighting tab (sliders)
- Status badge: Auto / Manual Override / Weather-closed
- One-tap presets: All Open / All 50% / All Closed
- Color indicator: teal (open), amber (partial), dim (closed), crimson (weather-closed)

### Shopping list addition
| Item | Purpose | Est. Cost |
|---|---|---|
| Somfy motorized skylight blinds × 3 (or more TBD) | Automated overhead shades | $250–450 each |
| Somfy Z-Wave interface (if RTS motors) | Hubitat integration | $80–120 |
| OR Lutron Serena skylight shades × 3 | Premium option | $300–500 each |
| Lutron Smart Bridge Pro (if Lutron) | Required for Hubitat | $80 |


---

## 20. Indoor/Outdoor Air Quality & Humidity Comparison

### Background — mold risk context
Hurricane damage history at Pettigrew means mold prevention is a primary system goal,
not a secondary comfort feature. Sustained indoor humidity above 60% + warm temperatures
creates active mold growth conditions, particularly in the crawlspace and any areas that
had water intrusion. VOC monitoring via Airthings provides an early warning signal —
mold off-gasses volatile organic compounds before visible growth appears.

---

### Dew point — the right metric for mold risk

Relative humidity (%) is misleading because it changes with temperature.
Dew point (°F) measures actual moisture content in the air independent of temperature.

```
Dew point calculation (approximate):
DP = T - ((100 - RH) / 5)
where T = temperature °F, RH = relative humidity %

Example:
Outside: 91°F, 74% RH → Dew point = 91 - (26/5) = 91 - 5.2 = 85.8°F
Inside:  74°F, 55% RH → Dew point = 74 - (45/5) = 74 - 9.0 = 65.0°F
→ Outside air is dramatically more moisture-laden
→ Opening skylights imports 20°F worth of extra dew point
```

**Mold risk thresholds by indoor dew point:**
| Dew Point | Risk Level | Action |
|---|---|---|
| < 50°F | Safe | No action |
| 50–55°F | Monitor | Watch trend |
| 55–60°F | Elevated | Increase dehumidifier runtime |
| > 60°F | High risk | Alert + aggressive dehumidification |
| > 65°F sustained | Critical | Alert + HVAC override + check crawlspace |

---

### Sensor comparison matrix

| Location | Sensor | Temp | RH | Dew Point | VOC | Notes |
|---|---|---|---|---|---|---|
| Outdoor | Tempest | ✅ | ✅ | Calculated | ❌ | Ground truth reference |
| Main living | Airthings View Plus | ✅ | ✅ | Calculated | ✅ | Primary AQ sensor |
| Bedroom | Airthings Wave Plus | ✅ | ✅ | Calculated | ✅ | Radon + AQ |
| Living room | Govee | ✅ | ✅ | Calculated | ❌ | Room-level detail |
| Kitchen | Govee | ✅ | ✅ | Calculated | ❌ | Room-level detail |
| Dining | Govee | ✅ | ✅ | Calculated | ❌ | Room-level detail |
| Master bed | Govee | ✅ | ✅ | Calculated | ❌ | Room-level detail |
| Bedroom 2/3 | Govee | ✅ | ✅ | Calculated | ❌ | Room-level detail |
| Upstairs | Ecobee SmartSensor | ✅ | ✅ | Calculated | ❌ | HVAC zone reference |
| Main floor | Ecobee SmartSensor | ✅ | ✅ | Calculated | ❌ | HVAC zone reference |
| Crawlspace | Govee (critical) | ✅ | ✅ | Calculated | ❌ | **Highest mold risk zone** |
| Garage | Govee | ✅ | ✅ | Calculated | ❌ | Secondary monitoring |

**Dew point calculation in Hubitat:**
Rule Machine can calculate dew point using a virtual device + custom expression:
```
dewPoint = temperature - ((100 - humidity) / 5)
```
Create virtual humidity sensor devices for each zone with calculated dew point attribute.
Display dew point alongside RH on dashboard for meaningful comparison.

---

### Rule Machine — mold risk and air quality rules

#### Dew point differential rules (outdoor vs indoor)
```
// Calculate outdoor dew point from Tempest
outsideDewPoint = Tempest.temp - ((100 - Tempest.humidity) / 5)

// Calculate indoor dew point (primary — Airthings)
insideDewPoint = Airthings.temp - ((100 - Airthings.humidity) / 5)

// Key differential rule for skylight automation
IF outsideDewPoint > insideDewPoint + 3 →
  Set flag "outside_wetter_than_inside" = TRUE
  // Skylight open rule blocked when this flag is active
  // Opening skylights would import moisture

IF outsideDewPoint <= insideDewPoint →
  Set flag "outside_wetter_than_inside" = FALSE
  // Outside is drier — opening skylights is safe or beneficial
```

#### Skylight dew point override (add to weather safety rules)
```
// CRITICAL: Block skylights from opening if outside air is more humid
// This prevents importing moisture on hot muggy Savannah nights
// even if the temperature would otherwise suggest opening them

IF flag "outside_wetter_than_inside" = TRUE →
  Block skylight open commands (override sunset rule)
  If skylights currently open → Close to 0%
  Push "Skylights closed — outside air more humid than inside"

// Example: 9pm, 76°F outside (would normally open skylights)
// But outside RH = 88%, dew point = 73°F
// Inside dew point = 62°F
// → Skylights stay CLOSED — opening would import 11°F of dew point
```

#### Indoor mold risk alerts
```
// Crawlspace — highest priority (hurricane damage history)
IF crawlspace RH > 60% sustained 1h →
  Push "⚠ Crawlspace humidity elevated: {value}% — check Aloair"
IF crawlspace RH > 65% sustained 2h →
  Push ALERT "🚨 Crawlspace humidity critical — mold risk"
  Jarvis TTS "Crawlspace humidity alert — check dehumidifier"
IF crawlspace dewPoint > 60°F →
  Push ALERT "🚨 Crawlspace dew point in mold risk zone"

// Any room — sustained elevated humidity
IF any Govee sensor RH > 62% sustained 3h →
  Push "⚠ Elevated humidity in {room}: {value}%"
IF any Govee sensor RH > 68% sustained 1h →
  Push ALERT "🚨 High humidity in {room} — check for water source"

// Airthings VOC spike — early mold indicator
IF Airthings VOC > 250 ppb AND indoor RH > 58% →
  Push ALERT "⚠ VOC elevated with high humidity — possible mold indicator"
  Push "Check recently wet areas: crawlspace, bathrooms, HVAC drip pans"
IF Airthings VOC > 400 ppb →
  Push ALERT "🚨 High VOC detected — investigate source immediately"

// Upstairs dehumidifier failure during high humidity
IF upstairs RH > 62% AND upstairs dehumidifier draw < 30W →
  Push ALERT "Upstairs dehumidifier may have failed — RH {value}%"

// Crawlspace Aloair failure
IF crawlspace RH > 65% AND Aloair circuit draw < 50W →
  Push ALERT "🚨 Aloair dehumidifier may be off — crawlspace at risk"
```

#### HVAC coordination for dehumidification
```
// Force longer cooling cycles for dehumidification
// Short cycles cool the air but don't remove enough moisture
IF indoor RH > 58% AND HVAC cooling runtime < 20 min →
  Block setpoint raise for 25 min (force complete dehumidification cycle)

// Fan assist for circulation when humidity is elevated
IF indoor RH > 60% AND HVAC state = idle →
  Set HVAC fan = ON for 20 min (circulate air through coils)

// Dehumidification boost — drop setpoint to force longer run
IF Airthings humidity > 60% AND HVAC idle AND outdoor temp > 70° →
  Lower setpoint 2°F for 30 min
  Restore after 30 min
```

---

### Dashboard — indoor/outdoor comparison panel

**New dashboard section: Humidity & Air Quality Comparison**

Display side-by-side for immediate situational awareness:

```
┌─────────────────────────────────────────────────────────────┐
│  OUTDOOR (Tempest)          INDOOR (Airthings + Govee)      │
│  Temp: 91°F                 Avg temp: 74°F                  │
│  RH:   74%                  Avg RH:   55%                   │
│  Dew:  83°F  ←————————————  Dew:  65°F                     │
│  ⚠ Outside air wetter by 18°F dew point                    │
│  → Skylights blocked from opening                           │
├─────────────────────────────────────────────────────────────┤
│  ROOM-BY-ROOM HUMIDITY          MOLD RISK                   │
│  Crawlspace  ████████  68%  ⚠   ELEVATED                   │
│  Master Bed  ██████    57%  ✓   Safe                        │
│  Living Rm   ██████    55%  ✓   Safe                        │
│  Kitchen     ██████    53%  ✓   Safe                        │
│  Upstairs    ███████   61%  ⚠   Monitor                     │
└─────────────────────────────────────────────────────────────┘
```

**Mold risk indicator colors:**
- ✅ Teal: Dew point < 55°F — safe
- ⚠ Amber: Dew point 55–60°F — monitor
- 🚨 Crimson: Dew point > 60°F — active risk

---

### Seasonal context for Savannah GA

**Summer (June–September):**
- Outdoor dew points routinely 70–78°F — among highest in continental US
- Outdoor air is almost always wetter than well-conditioned indoor air
- Skylights should rarely open overnight in summer — the dew point rule will block them
- HVAC dehumidification is working against a very high outdoor moisture load
- Crawlspace is highest risk — ground moisture + warm temps + hurricane damage areas

**Spring / Fall:**
- Outdoor dew point drops to 55–65°F range
- More opportunities for beneficial ventilation
- Still monitor crawlspace — temperature swings cause condensation

**Winter:**
- Outdoor dew point drops to 35–50°F
- Outside air is significantly drier than inside
- Opening windows/skylights briefly actually helps reduce indoor humidity
- Skylights closed overnight per winter rules — still appropriate for heat retention


---

## 21. HVAC System Details

### Confirmed equipment
| Zone | Brand | Model | Tons | Type | Refrigerant | MFD | Notes |
|---|---|---|---|---|---|---|---|
| Main floor | Rheem | RP1460BJ1NA | 4-ton | Single stage heat pump | R410A | 12/2021 | Miami-Dade hurricane rated |
| Upstairs | York | YHJF18S41S1A | 1.5-ton | Single stage heat pump | R410A | TBD | Heat pump |

**Both units are single stage** — compressor runs at 100% or off. No Y2 terminal, no dual-stage wiring needed on Ecobee.

### Ecobee wiring (both zones)
Standard heat pump wiring — confirm against existing Nest photos before removal:
```
R   → 24V power (red)
C   → Common (blue or black — verify present)
Y1  → Compressor / cooling (yellow)
G   → Fan (green)
O/B → Reversing valve (orange — O for Rheem, confirm York)
W1  → Auxiliary/emergency heat strips (white — if present)
```

**Critical before install:**
- Kill power at breaker AND disconnect at air handler
- Photograph all Nest wiring terminals before removing
- Label each wire with tape before disconnecting
- Check C-wire present — if absent, use Ecobee Power Extender Kit (included)
- Confirm O vs B reversing valve convention — Rheem typically uses O (energized in cooling)

### Single stage implications for Rule Machine
```
// Minimum runtime enforcement (critical for dehumidification)
// Single stage = 100% or off — short cycles don't remove humidity
IF HVAC starts cooling → block setpoint raise for 20 min minimum
IF indoor RH > 60% → extend minimum runtime to 25 min

// Demand charge protection (GA Power Smart Usage)
// Prevent HVAC + water heater + golf cart from running simultaneously during peak
IF time between 2pm–7pm AND HVAC running AND water heater ON →
  Water heater OFF until HVAC cycle completes

// Fan circulation between cycles
IF HVAC state = idle AND indoor RH > 58% →
  Run fan only (G terminal) for 15 min to circulate through coils
```

---

## 22. Ceiling Fans — Hampton Bay ZigBee Integration

### Hardware confirmed
| Fan | Location | Remote Model | RF Freq | Size |
|---|---|---|---|---|
| Fan 1 | TBD | DL-6101T (FCC: Y7ZDL6101T) | 303.856 MHz | 52" |
| Fan 2 | TBD | DL-6101T (same model) | 303.856 MHz | 52" |
| Fan 3 | TBD | DL-6101T (same model) | 303.856 MHz | 52" |
| Fan 4 | TBD | DL-6101T (same model) | 303.856 MHz | 52" |

All remotes are same model with different pairing codes — irrelevant after canopy module install.

### Integration path — Hampton Bay ZigBee Canopy Module
**Home Depot SKU:** 1001747450 (~$20 each)
**Protocol:** Zigbee 3.0 — native Hubitat driver
**Why not Bond Bridge:** 303MHz is less common RF frequency, compatibility uncertain. ZigBee canopy module is guaranteed, cheaper ($80 total vs $99 Bridge), fully local, and each module strengthens Zigbee mesh.

**Install per fan (20 min each):**
1. Kill power at breaker
2. Remove canopy cover (2–3 screws)
3. Disconnect existing DL-6101T RF receiver module
4. Wire ZigBee module: line (black), neutral (white), fan (blue), light (red or as labeled)
5. Restore power — module blinks to indicate pairing mode
6. Pair to Hubitat Zigbee → appears as fan + light device
7. Label device by room in Hubitat

**Zigbee mesh benefit:** 4 fans spread across main floor and upstairs = 4 ZigBee repeaters = excellent mesh coverage for Govee sensors and future ZigBee devices.

### Fan automation rules
```
// Presence — off when away
IF mode = Away → All fans OFF

// Arrival — restore based on time of day
IF first presence arrives AND time between 7am–10pm → Fans ON at medium
IF first presence arrives AND time between 10pm–7am → Fans ON at low

// HVAC coordination — distribute conditioned air
IF HVAC main state = cooling → Main floor fans ON at medium (downdraft, counterclockwise)
IF HVAC upstairs state = cooling → Upstairs fans ON at medium
IF HVAC state = idle for > 10 min → Fans OFF (don't circulate warm air)

// Humidity assist — increase air circulation when RH elevated
IF indoor RH > 60% AND HVAC state = cooling →
  Fans ON at high (increase air movement across coils)
IF indoor RH > 65% →
  Fans ON at high regardless of HVAC state

// Sleep mode — quiet low speed
IF mode = Sleep AND home → Bedroom fans at low
IF mode = Sleep AND away → All fans OFF

// Seasonal direction reminder (manual — motors don't auto-reverse)
// Summer: counterclockwise (downdraft) — creates wind chill effect
// Winter: clockwise (updraft) at low speed — pushes warm ceiling air down
// Reminder push on Nov 1: "Reverse fan direction for winter"
// Reminder push on Apr 1: "Reverse fan direction for summer"

// Morning routine
IF time = 7:00 AM AND home → Living room + kitchen fans ON at low
IF time = 10:00 PM AND home → All fans OFF or low (sleep prep)
```

---

## 23. Updated Hardware Shopping List

### Ordered / In hand
| Item | Purpose | Cost | Status |
|---|---|---|---|
| Hubitat C8 Pro | Hub | $159.95 | ✅ Ordered (Prime Day) |
| Ecobee Premium Plus Pack × 2 | HVAC (4 SmartSensors) | $458 | ✅ Ordered (Costco) |
| Hunter Pro-HC PHC-600i | Irrigation controller (6-zone, indoor) | ~$278 | ✅ Confirmed |

### Order next — immediate priority
| Item | Purpose | Cost | Where |
|---|---|---|---|
| Hampton Bay ZigBee Canopy Module × 4 | Ceiling fans | ~$80 | Home Depot (SKU 1001747450) |
| Emporia Vue 3 (main clamps) | Whole-home power | $149 | Amazon |
| Emporia Vue branch expander | Per-circuit monitoring | $99 | Amazon |
| Aeotec Heavy Duty Switch Gen5 | Electric water heater (240V) | $60 | Amazon |
| Aeotec Smart Switch 7 × 2 | UV system + golf cart charger | $80 | Amazon |
| Kwikset Halo Z-Wave | Garage/laundry lock | $129 | Amazon/Home Depot |

### Planned
| Item | Purpose | Cost | Notes |
|---|---|---|---|
| Airthings Wave Plus | Bedroom AQ + radon | $229 | After core build stable |
| Airthings View Plus | Main living AQ + display | $299 | After core build stable |
| ZWLR mailbox sensor | Long-range mailbox | $30–50 | Test ZWLR range first |
| Skylight blinds × 3+ | Automated shades | $250–500 ea | Somfy or Lutron — vendor TBD |
| Raspberry Pi 5 + SunFounder 10" | Jarvis terminal | $175 | Dashboard display |
| Ecowitt WH51 soil sensors | Zone moisture (optional) | $15 ea | After irrigation stable |

### Total
| Category | Cost |
|---|---|
| Ordered/confirmed | ~$896 |
| Order next | ~$597 |
| Planned (excl. skylights) | ~$733 |
| Skylight blinds (est. 3 zones) | $750–1,500 |
| **Full build estimate** | **~$2,976–3,726** |

---

## 24. Next Steps — Updated Priority Order

### Immediate (this week)
- [ ] Photograph existing Nest wiring at both thermostat locations before removal
- [ ] Order Hampton Bay ZigBee canopy modules × 4 (Home Depot)
- [ ] Order Emporia Vue 3 + branch expander
- [ ] Order Aeotec Heavy Duty Switch (electric WH)
- [ ] Order Aeotec Smart Switch 7 × 2 (UV + golf cart)
- [ ] Order Kwikset Halo Z-Wave lock
- [ ] Check Cree bulb model numbers — test Tuya pairing path

### Install sequence (once hardware arrives)
1. **Pair Hubitat C8 Pro** — configure Maker API, install HPM
2. **Install Ecobee × 2** — confirm C-wire at both locations first
3. **Install Hampton Bay ZigBee modules** in all 4 fans
4. **Schedule electrician** — Emporia Vue CT clamps + Aeotec WH switch (one trip)
5. **Install Hunter Pro-HC PHC-600i** — photograph B-Hyve wiring first, re-wire zones, pair to Hubitat via Hydrawise
6. **Run each irrigation zone** — record baseline GPM per zone
7. **Install Kwikset lock** — garage/laundry door
8. **Install UV monitoring module**
9. **Build Rule Machine automations** — HVAC runtime + WH scheduling first, then fans, then irrigation flow rules
10. **Deploy dashboard** — GitHub → paradisesurfsidesc.com/home via Cloudflare Pages
11. **Install Airthings sensors** — after core build stable
12. **Evaluate skylight blind vendors** — Somfy vs Lutron

### Check Georgia Power rate plan
- [ ] Log in to Georgia Power account
- [ ] Run Rate Advisor tool with last 12 months of usage
- [ ] Compare current rate vs Smart Usage vs Overnight Advantage
- [ ] If Smart Usage saves money — enroll (12-month commitment, $30 fee)

