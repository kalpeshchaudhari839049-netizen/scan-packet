import { useState } from 'react'
import { CLIENT_RULES } from '../rules/clientRules.js'
import { useLanguage } from '../language/useLanguage.js'

const RULES = CLIENT_RULES.map(rule => ({
  id: rule.id,
  name: rule.name,
  severity: rule.severity,
  classification: rule.applies === 'food' ? 'food' : 'any',
  checks: [{ field: rule.field, operator: rule.checkType || 'presence' }],
  guidance: rule.fix,
  legal_source: rule.source,
}))

const SEVERITY_COLOR = {
  critical: 'var(--red)', high: 'var(--red)', major: 'var(--orange)', medium: 'var(--orange)',
  minor: 'var(--blue)', low: 'var(--blue)',
}
const SEVERITY_BG = {
  critical: 'rgba(224,64,64,0.12)', high: 'rgba(224,64,64,0.12)',
  major: 'rgba(240,152,40,0.12)', medium: 'rgba(240,152,40,0.12)',
  minor: 'rgba(52,120,246,0.10)', low: 'rgba(52,120,246,0.10)',
}

function RuleGroup({ title, rules: groupRules, icon }) {
  if (groupRules.length === 0) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h2>
        <span style={{ marginLeft: 6, background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 99, padding: '2px 10px', fontSize: 12, color: 'var(--text-soft)' }}>{groupRules.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groupRules.map(rule => {
          const checks = rule.checks || []
          const id = rule.id || rule.rule_id
          const severity = rule.severity || 'medium'
          const foodOnly = rule.food_only ?? rule.classification === 'food'
          const description = rule.description || rule.guidance || rule.name
          const checkTypes = rule.check_type || [...new Set(checks.map(check => check.operator))].join(' · ') || 'presence'
          return (
            <div key={id} className="card card-sm" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '10px 14px', alignItems: 'start' }}>
              <div style={{
                padding: '4px 10px',
                borderRadius: 8,
                background: SEVERITY_BG[severity] || 'var(--surface-2)',
                color: SEVERITY_COLOR[severity] || 'var(--text)',
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}>{id}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{rule.name}</div>
                <div className="text-muted text-sm" style={{ marginBottom: 6 }}>{description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 6, color: 'var(--text-soft)' }}>
                    ⚖ {rule.legal_source}
                  </span>
                  <span style={{ background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 6, color: 'var(--text-soft)', textTransform: 'capitalize' }}>
                    Check: {checkTypes}
                  </span>
                  {foodOnly && (
                    <span style={{ background: 'rgba(24,168,112,0.12)', padding: '2px 8px', borderRadius: 6, color: 'var(--green)' }}>
                      🥗 Food Only
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                padding: '4px 10px',
                borderRadius: 8,
                background: SEVERITY_BG[severity] || 'var(--surface-2)',
                color: SEVERITY_COLOR[severity] || 'var(--text)',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}>{severity}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RulesPage() {
  const { t } = useLanguage()
  const [rules] = useState(RULES)
  const loading = false
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | food | non-food

  const filtered = rules.filter(r => {
    const matchSearch = !search ||
      String(r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(r.id || r.rule_id || '').toLowerCase().includes(search.toLowerCase()) ||
      String(r.legal_source || '').toLowerCase().includes(search.toLowerCase())
    const isFoodOnly = r.food_only ?? r.classification === 'food'
    const matchFilter =
      filter === 'all' ||
      (filter === 'food' && isFoodOnly) ||
      (filter === 'non-food' && !isFoodOnly)
    return matchSearch && matchFilter
  })

  const lmRules = filtered.filter(rule => (rule.classification || 'any') !== 'food')
  const fsRules = filtered.filter(rule => (rule.classification || 'any') === 'food')

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>{t('rules')}</h1>
        <p className="text-muted">All active compliance rules with legal sources. Read-only reference.</p>
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="🔍 Search rules…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="tab-bar" style={{ width: 'auto' }}>
          {[['all', 'All Rules'], ['food', 'Food Only'], ['non-food', 'Non-Food']].map(([k, l]) => (
            <button key={k} className={`tab-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <span className="text-muted text-sm">{filtered.length} rules</span>
      </div>

      {/* Severity legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['critical', '🔴 Critical'], ['major', '🟠 Major'], ['minor', '🔵 Minor']].map(([s, l]) => (
          <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 8, background: SEVERITY_BG[s], color: SEVERITY_COLOR[s], fontWeight: 600 }}>{l}</span>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <RuleGroup icon="⚖" title="Legal Metrology (Packaged Commodities) Rules, 2011" rules={lmRules} />
          <RuleGroup icon="🍽" title="FSSAI Labelling & Display Regulations, 2020" rules={fsRules} />
          {filtered.length === 0 && (
            <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>
              No rules match your search.
            </div>
          )}
        </>
      )}
    </div>
  )
}
