const STATUS_ICON = { PASS: '✅', FAIL: '❌', NEEDS_REVIEW: '⚠️', SKIPPED: '⏭' }
const SEVERITY = {
  critical: { color: 'var(--red-light)', background: 'rgba(224,64,64,0.14)' },
  major: { color: 'var(--orange-light)', background: 'rgba(240,152,40,0.14)' },
  minor: { color: 'var(--blue-light)', background: 'rgba(52,120,246,0.14)' },
}

export default function RuleChecklist({ rules, onRuleHover = () => {} }) {
  if (!rules || rules.length === 0)
    return <div className="empty-state text-muted text-sm">No rule results match this filter.</div>

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {rules.map((rule, index) => {
        const severity = SEVERITY[rule.severity] || SEVERITY.minor
        const needsFix = rule.status === 'FAIL' || rule.status === 'NEEDS_REVIEW'
        return (
          <details
            key={rule.rule_id}
            className="rule-item"
            style={{ padding: '0 16px', background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
          >
            <summary
              onMouseEnter={() => onRuleHover(rule)}
              onFocus={() => onRuleHover(rule)}
              aria-label={`${rule.name}: ${rule.status}. Expand details`}
              style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '14px 0', cursor: 'pointer' }}
            >
              <span className={`rule-status-icon ${rule.status}`} aria-hidden="true">{STATUS_ICON[rule.status] || '❓'}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{rule.name}</strong>
                  <span style={{ fontSize: 10, textTransform: 'capitalize', fontWeight: 700, color: severity.color, background: severity.background, borderRadius: 4, padding: '2px 7px' }}>
                    {rule.severity || 'Minor'}
                  </span>
                </span>
              </span>
              <span className={`status-badge status-${rule.status}`} style={{ fontSize: 11, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                {rule.status === 'NEEDS_REVIEW' ? 'Review' : rule.status === 'SKIPPED' ? 'Skipped' : rule.status}
              </span>
            </summary>
            <div style={{ padding: '0 0 14px 38px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 5 }}>{rule.message}</div>
              {rule.extracted_value && (
                <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6, display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
                  Evidence: <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{rule.extracted_value}</span>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>⚖ {rule.legal_source}</div>
              {needsFix && (
                <div className="how-to-fix" style={{ marginTop: 8 }}>
                  <strong>How to fix:</strong> {rule.how_to_fix || rule.message}
                </div>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}
