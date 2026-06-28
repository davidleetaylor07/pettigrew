import { useState, useEffect } from 'react'
import { getCfg, setCfg, SETTINGS_SECTIONS } from '../store/config.js'

export default function SettingsModal({ open, onClose, onSave }) {
  const [values, setValues] = useState({})
  const [activeSection, setActiveSection] = useState('connection')

  useEffect(() => {
    if (open) {
      const all = {}
      SETTINGS_SECTIONS.forEach(s => s.fields.forEach(f => { all[f.key] = getCfg(f.key) }))
      setValues(all)
    }
  }, [open])

  const set = (key, val) => setValues(v => ({ ...v, [key]: val }))

  const save = () => {
    Object.entries(values).forEach(([k, v]) => setCfg(k, v))
    onSave()
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', height: 'min(93dvh, 700px)' }}>

        <div className="modal-header">
          <span className="modal-title">Settings</span>
          <button className="header-icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '10px 18px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {SETTINGS_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                padding: '6px 10px', borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
                border: '1px solid', borderBottom: 'none', cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
                background: activeSection === s.key ? '#1a2537' : 'transparent',
                color: activeSection === s.key ? 'var(--teal)' : 'var(--text-faint)',
                borderColor: activeSection === s.key ? 'var(--border)' : 'transparent',
              }}
            >
              {s.label.split(' — ')[0]}
            </button>
          ))}
        </div>

        {/* Fields for active section */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {SETTINGS_SECTIONS.filter(s => s.key === activeSection).map(section => (
            <div key={section.key}>
              <div className="form-section">{section.label}</div>
              {section.fields.map(field => (
                <div className="form-group" key={field.key}>
                  <label className="form-label">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="form-textarea"
                      value={values[field.key] ?? ''}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ''}
                      rows={5}
                    />
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      className="form-input"
                      value={values[field.key] ?? ''}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ''}
                      autoComplete="off"
                    />
                  )}
                  {field.hint && <div className="form-hint">{field.hint}</div>}
                </div>
              ))}
            </div>
          ))}

          {activeSection === 'connection' && (
            <div className="notice info" style={{ marginTop: 8, fontSize: '0.75rem' }}>
              <span>ℹ</span>
              <span>
                Pair Philips Hue Bridge to Hubitat (built-in integration) so all Hue lights appear in the Maker API —
                the dashboard then uses one connection for everything.
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-teal" onClick={save}>Save & Refresh</button>
        </div>
      </div>
    </div>
  )
}
