# Pettigrew — Home Dashboard

**Property:** 113 Pettigrew Dr, Savannah GA 31411 (The Landings, Skidaway Island)
**Owner:** David & Laura Taylor
**Hub:** Hubitat C8 Pro
**Lighting:** Philips Hue Bridge (paired to Hubitat via native integration)
**Updated:** 2026-06-28
**File:** `src/` (Vite + React app)

---

## Overview

Multi-page React dashboard for the Pettigrew smart home. Connects to a Hubitat C8 Pro via the Maker API to display live sensor data and provide device control. Four pages mirror the physical layout: Overview, Outside, Main Level, Upstairs.

Built with Vite + React 18. No backend. Hosted on GitHub Pages with GitHub Actions CI/CD. Intended to run behind Cloudflare Access (Google OAuth) at `paradisesurfsidesc.com/home`.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + React Router 6 (HashRouter) |
| Build | Vite 5 |
| Routing | Hash-based (`/#/outside`) — works on any static host |
| Fonts | Inter (UI) + DM Mono (sensor numbers) |
| Styling | Plain CSS custom properties — no Tailwind |
| CI/CD | GitHub Actions → GitHub Pages |
| Auth | Cloudflare Access (Google OAuth) — infrastructure layer |

---

## Hub Integration

### Philips Hue — Recommended Setup

Pair the Hue Bridge to Hubitat using the **built-in Hue Bridge integration** (Apps → Add Built-In App → Philips Hue Bridge Integration). All Hue lights, rooms, and groups appear in the Maker API. The dashboard then uses a single connection for everything — no separate Hue Bridge API calls.

Steps:
1. Hubitat → Apps → + Add Built-In App → Philips Hue Bridge Integration
2. Follow pairing wizard
3. Select rooms/groups to expose
4. Note the Hubitat device IDs for each room
5. Enter them in Settings → Lighting

### Hubitat Maker API Setup

1. Hubitat → Apps → + Add Built-In App → Maker API
2. Enable CORS, select all devices you want to expose
3. Note the App ID (shown in the app URL)
4. Create a long-lived token (shown at the bottom of the Maker API app)
5. Dashboard Settings → Hubitat Connection → enter URL, App ID, Token

---

## Deployment

### Local Development

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

CORS note: If Hubitat is on `http://` and the dev server is on `http://`, requests will work. If you hit CORS issues, access the dashboard from the same network as the hub.

### GitHub Pages (Production)

Push to `main` → GitHub Actions builds and deploys automatically. The `deploy.yml` workflow in `.github/workflows/` handles it.

For Cloudflare Access:
1. Add a Cloudflare Tunnel pointing to your Hubitat LAN IP (for mobile access)
2. Configure Cloudflare Access policy (Google OAuth) on the GitHub Pages URL or custom domain
3. Jarvis terminal (local network) can use the local Hubitat IP directly

---

## First-Time Configuration

Open the dashboard → tap **⚙** → fill in each section.

All settings are saved in `localStorage` under the `ptg_` prefix.

### Connection Settings

| Field | Notes |
|-------|-------|
| Hub URL | `http://192.168.1.x` or Cloudflare Tunnel HTTPS URL |
| Maker API App ID | Number visible in the Maker API app URL |
| Access Token | From Maker API app → bottom of page |

### Device ID Format

All device IDs are Hubitat device numbers (integers). Find them in Hubitat → Devices → click a device → the ID is in the URL (`/device/edit/123`).

**Single device fields** — enter the number:
```
42
```

**Multi-device fields** (textarea) — one per line:
```
device_id|Display Name|optional_floor
```

Floor values used by the dashboard: `main`, `up`, `crawl`, `garage`

---

## Pages

### 🏠 Overview (`/`)

- Tempest weather hero (temp, feels like, dew point, wind, UV, rain)
- Airthings AQI ring + CO₂ / VOC / PM2.5 / radon
- Emporia Vue power snapshot (current draw, kWh today, est. cost, rate period)
- Ecobee × 2 mini cards (current temp, setpoint, state, humidity, program)
- Leak detector all-clear / ALERT banner
- Indoor humidity network (Govee sensor bars with dew point)
- Floor quick-nav buttons

---

### 🌳 Outside (`/outside`)

- Tempest full weather detail (all attributes)
- Hunter Pro-HC irrigation zones (on/off status, GPM per zone, stop button)
- Golf Cart Charger (Aeotec SS7 — power, charge state, toggle)
- Exterior lighting (Hue rooms tagged `garage`)
- Mailbox sensor (contact state, last event)

---

### 🏡 Main Level (`/main`)

- Ecobee Zone 1 full control (setpoint ±1°, mode buttons, fan toggle)
- Electric Water Heater (Aeotec HDS Gen5 — toggle + on-peak warning)
- UV System (lamp health via power draw)
- Door Lock (Kwikset — lock/unlock)
- Ceiling fans × 4 (speed selector, on/off)
- Hue lighting (rooms tagged `main` — level control, on/off)
- Govee climate sensors (rooms tagged `main` — temp, humidity, dew point)
- Emporia branch circuit monitoring

---

### 🛏️ Upstairs (`/upstairs`)

- Ecobee Zone 2 full control
- Upstairs dehumidifier (status inferred from power draw)
- Ceiling fans (fans 3 & 4 from config)
- Hue lighting (rooms tagged `up`)
- Govee sensors (rooms tagged `up` — temp, humidity, dew point)
- In-duct UV stub (future install)

---

## Crawlspace Sensors

Govee sensors tagged `crawl` in dev_govee_temp appear on Overview humidity summary. Tag a sensor as `crawl` to highlight it — elevated dew point (>60°F) triggers visual risk indicator.

---

## Design Tokens

| Token | Value | Use |
|-------|-------|-----|
| Background | `#111827` | Page background |
| Card | `#1F2937` | Card surface |
| Border | `#374151` | Card borders |
| Teal | `#00D4AA` | Active / good / primary |
| Amber | `#F5A623` | Warning / on-peak |
| Crimson | `#E5484D` | Alert / leak / high |
| Blue | `#60A5FA` | Cooling / water / humidity |
| Purple | `#A78BFA` | Future features |
| Font — data | DM Mono | All sensor numbers |
| Font — UI | Inter | Labels, nav, controls |

---

## localStorage Keys

All keys are prefixed `ptg_`.

| Key | Contents |
|-----|---------|
| `hub_url` | Hubitat base URL |
| `hub_app_id` | Maker API App ID |
| `hub_token` | Access token |
| `rate_offpeak` | Off-peak $/kWh (default 0.016) |
| `rate_peak` | On-peak $/kWh (default 0.146) |
| `budget_kwh` | Daily kWh budget |
| `dev_tempest` | Tempest device ID |
| `dev_ecobee_main` | Ecobee main floor ID |
| `dev_ecobee_up` | Ecobee upstairs ID |
| `dev_emporia_main` | Emporia whole-home ID |
| `dev_emporia_circuits` | Branch circuit IDs (multi-line) |
| `dev_airthings_view` | Airthings View Plus ID |
| `dev_airthings_wave` | Airthings Wave Plus ID |
| `dev_govee_temp` | Govee temp/humidity sensors (multi-line) |
| `dev_govee_leak` | Govee leak sensors (multi-line) |
| `dev_fans` | Ceiling fan device IDs (multi-line) |
| `dev_hue_rooms` | Hue room device IDs (multi-line) |
| `dev_water_heater` | Aeotec water heater switch ID |
| `dev_uv_main` | UV system module ID |
| `dev_golf_cart` | Golf cart charger switch ID |
| `dev_lock` | Kwikset lock ID |
| `dev_dehumid_crawl` | Aloair crawlspace dehumidifier ID |
| `dev_dehumid_up` | Upstairs dehumidifier ID |
| `dev_irrigation` | Hunter Pro-HC controller ID |
| `dev_irrigation_zones` | Irrigation zone device IDs (multi-line) |
| `dev_mailbox` | Mailbox sensor ID |

---

## Refresh Behavior

- Auto-refresh every **30 seconds**
- Live dot (header right): teal = connected, amber/pulse = refreshing, red = error
- Manual refresh: tap ↻ button in header
- All devices fetched in parallel — one failed device doesn't block others
- Hubitat commands (setpoint, on/off, etc.) use GET to the Maker API

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| All values show `—` | Hub not configured | Tap ⚙ and fill in URL, App ID, token |
| CORS error (console) | Dashboard on HTTPS, Hubitat on HTTP | Use Cloudflare Tunnel (HTTPS) or serve locally |
| Some sensors `—` | Wrong device ID | Check Hubitat → Devices → find the correct numeric ID |
| Token expired | Revoked in Hubitat | Regenerate in Maker API app, update Settings |
| Hue lights not showing | Not paired to Hubitat | Pair via Hubitat → Apps → Philips Hue Bridge Integration |
| Fan controls missing | Fan IDs not configured | Add Hampton Bay ZigBee module IDs in Settings → Fans |

---

## Session Log

### 2026-06-28 — Initial React build

- What changed: Full React app created from scratch — 15 files, 4 pages
  - Vite + React 18 + React Router 6 (HashRouter)
  - Hubitat Maker API client (`src/api/hubitat.js`)
  - localStorage config store (`src/store/config.js`) with full device schema
  - Settings modal with 13 sections covering all device types
  - Overview page: weather, AQI, power, HVAC ×2, leak summary, humidity network
  - Outside page: weather detail, irrigation zones, golf cart charger, exterior lighting, mailbox
  - Main Level page: Ecobee + setpoint control, water heater, UV, lock, fans, Hue lighting, circuits
  - Upstairs page: Ecobee, dehumidifier, fans, lighting, climate sensors
  - GitHub Actions deploy workflow
  - Philips Hue: paired to Hubitat via native integration (recommended path)
  - Georgia Power Smart Usage TOU rates ($0.146 peak / $0.016 off-peak) wired into power display
  - Dew point calculations on all climate sensors (mold risk indicator)
- Status: Complete — ready to configure with real Hubitat device IDs
- Next steps:
  - `npm install && npm run dev` to verify build
  - Pair Hue Bridge to Hubitat
  - Configure Maker API, get App ID + token
  - Enter all device IDs in Settings (can be done incrementally as hardware arrives)
  - Set up GitHub Actions (enable Pages in repo settings, push to main)
  - Configure Cloudflare Access + Tunnel for mobile access
