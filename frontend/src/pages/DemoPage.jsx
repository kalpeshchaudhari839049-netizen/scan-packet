import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SAMPLE_LABELS } from '../utils/sampleLabels.js'
import { createClientReport } from '../utils/clientCompliance.js'
import { saveReport } from '../utils/reportApi.js'
import { useLanguage } from '../language/useLanguage.js'

export default function DemoPage() {
  const { t } = useLanguage()
  const demos = SAMPLE_LABELS
  const [running, setRunning] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const runDemo = async demo => {
    setRunning(demo.id)
    setError(null)
    try {
      const result = createClientReport({ text: demo.text, isFood: demo.isFood, confidence: 0.99, filename: demo.title })
      result.is_demo = true
      await saveReport(result)
      navigate(`/result/${result.id}`)
    } catch (runError) {
      setError(runError.message || 'Demo failed')
    } finally {
      setRunning(null)
    }
  }

  const DEMO_ICONS = ['🍜', '🌶', '🧴']

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>{t('demo')}</h1>
        <p className="text-muted">Try the browser-based checker with 3 bundled sample label text blocks.</p>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(52,120,246,0.12), rgba(52,120,246,0.05))',
        border: '1px solid rgba(52,120,246,0.25)',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        marginBottom: 28,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22 }}>💡</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue-light)', marginBottom: 4 }}>How Demo Mode Works</div>
          <div className="text-sm text-muted">
            Each sample runs through the same local extraction and rules as a scanned image. No backend or OCR model download is needed for these sample text blocks.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(224,64,64,0.12)', border: '1px solid rgba(224,64,64,0.3)', borderRadius: 8, color: 'var(--red-light)', fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {demos.map((demo, i) => (
            <div key={demo.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: demo.isFood ? 'rgba(24,168,112,0.14)' : 'rgba(52,120,246,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {DEMO_ICONS[i] || '📦'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{demo.title}</div>
                  <span className="text-xs text-muted">Sample text fixture · verdict calculated at runtime</span>
                </div>
              </div>

              <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>{demo.text}</p>

              <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span style={{ background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-soft)' }}>
                  {demo.isFood ? '🥗 Food' : '🧴 Non-Food'}
                </span>
                <span style={{ background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-soft)' }}>
                  ID: {demo.id}
                </span>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => runDemo(demo)}
                disabled={running === demo.id}
              >
                {running === demo.id ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Running…</>
                ) : (
                  <>🎯 Run This Demo</>
                )}
              </button>
            </div>
          ))}
        </div>

      {/* What happens section */}
      <div className="card" style={{ marginTop: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>What happens when you run a demo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { step: '01', icon: '📋', title: 'Sample text loaded', desc: 'A bundled fixture enters the local extraction pipeline' },
            { step: '02', icon: '⚖', title: 'Rule engine fires', desc: 'Active Legal Metrology and FSSAI rules are evaluated live against the fields' },
            { step: '03', icon: '📊', title: 'Verdict computed', desc: 'COMPLIANT / NON_COMPLIANT / NEEDS_REVIEW with per-rule evidence' },
            { step: '04', icon: '🗄', title: 'Saved to history', desc: 'Stored in local browser history and visible in the dashboard' },
          ].map(c => (
            <div key={c.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>{c.step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.icon} {c.title}</div>
                <div className="text-xs text-muted" style={{ marginTop: 3, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
