import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLocalReports, clearLocalReports } from '../utils/localHistory.js'
import { useLanguage } from '../language/useLanguage.js'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const STATUS_COLOR = {
  COMPLIANT: '#18a870',
  NON_COMPLIANT: '#e04040',
  NEEDS_REVIEW: '#f09828',
}
const STATUS_LABEL = { COMPLIANT: 'Compliant', NON_COMPLIANT: 'Non-Compliant', NEEDS_REVIEW: 'Needs Review' }

const RULE_LABELS = {
  'LM-001': 'Product Name', 'LM-002': 'Net Quantity', 'LM-003': 'Qty Unit',
  'LM-004': 'MRP Present', 'LM-005': 'MRP Format', 'LM-006': 'Mfr Name',
  'LM-007': 'PIN Code', 'LM-008': 'Mfg Date', 'LM-009': 'Expiry Date',
  'LM-010': 'Consumer Care', 'LM-011': 'Country of Origin',
  'FS-001': 'FSSAI Present', 'FS-002': 'FSSAI Format', 'FS-003': 'Ingredients',
  'FS-004': 'Veg Symbol', 'FS-005': 'Best Before', 'FS-006': 'Nutrition Info',
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  useEffect(() => {
    const loadHistory = () => {
      try {
        const allReports = getLocalReports()
        const counts = { COMPLIANT: 0, NON_COMPLIANT: 0, NEEDS_REVIEW: 0 }
        const failedRules = new Map()
        for (const item of allReports) {
          counts[item.overall_status] = (counts[item.overall_status] || 0) + 1
          for (const rule of item.rule_results || []) {
            if (rule.status !== 'FAIL') continue
            const current = failedRules.get(rule.rule_id) || { rule_id: rule.rule_id, name: rule.name, count: 0 }
            current.count += 1
            failedRules.set(rule.rule_id, current)
          }
        }
        const filtered = statusFilter ? allReports.filter(item => item.overall_status === statusFilter) : allReports
        setData({
          items: filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
          total: filtered.length,
          stats: counts,
          top_failed_rules: [...failedRules.values()].sort((a, b) => b.count - a.count).slice(0, 5),
        })
        setError(null)
      } catch (historyError) {
        setError(historyError.message)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
    window.addEventListener('code-alpha-history-updated', loadHistory)
    window.addEventListener('storage', loadHistory)
    return () => {
      window.removeEventListener('code-alpha-history-updated', loadHistory)
      window.removeEventListener('storage', loadHistory)
    }
  }, [page, statusFilter])

  const handleClearHistory = () => {
    if (!window.confirm('Clear all locally saved scan history? This cannot be undone.')) return
    clearLocalReports()
    setPage(0)
  }

  const pieData = data ? Object.entries(data.stats || {}).map(([k, v]) => ({
    name: STATUS_LABEL[k] || k, value: v, color: STATUS_COLOR[k] || '#7a91ab'
  })) : []

  const barData = (data?.top_failed_rules || []).map(r => ({
    rule: RULE_LABELS[r.rule_id] || r.rule_id,
    count: r.count,
  }))

  const total = data?.total || 0

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>{t('dashboard')}</h1>
        <p className="text-muted">History of all scans, compliance trend, and top failing rules.</p>
      </div>

      {/* Stat cards */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Scans', value: data.total, icon: '📷', color: 'var(--blue)' },
            { label: 'Compliant', value: data.stats?.COMPLIANT || 0, icon: '✅', color: 'var(--green)' },
            { label: 'Non-Compliant', value: data.stats?.NON_COMPLIANT || 0, icon: '❌', color: 'var(--red)' },
            { label: 'Needs Review', value: data.stats?.NEEDS_REVIEW || 0, icon: '⚠️', color: 'var(--orange)' },
          ].map(c => (
            <div key={c.label} className="card card-sm" style={{ borderTop: `3px solid ${c.color}` }}>
              <div style={{ fontSize: 28 }}>{c.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1.1, marginTop: 8 }}>{c.value}</div>
              <div className="text-muted text-sm">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {data && (pieData.length > 0 || barData.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Pie chart */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Compliance Distribution</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>No data yet</div>
            )}
          </div>

          {/* Bar chart - top failed rules */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Failing Rules</div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis type="number" tick={{ fill: 'var(--text-soft)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="rule" tick={{ fill: 'var(--text-soft)', fontSize: 11 }} width={110} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} />
                  <Bar dataKey="count" fill="var(--red)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>No failures recorded yet</div>
            )}
          </div>
        </div>
      )}

      {error && <div className="error-banner" role="alert">{error}</div>}

      {/* Filter + Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Scan History</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'COMPLIANT', 'NON_COMPLIANT', 'NEEDS_REVIEW'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setLoading(true); setStatusFilter(s); setPage(0) }}
              >
                {s === '' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={handleClearHistory} disabled={!total}>{t('clearHistory')}</button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : !data?.items?.length ? (
          <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>
            No scans found. <Link to="/" style={{ color: 'var(--blue-light)' }}>Upload a label</Link> to get started.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['ID', 'File', 'Date', 'Type', 'Status', 'Score', 'OCR Conf', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '10px 10px', color: 'var(--muted)', fontFamily: 'monospace' }}>#{item.id}</td>
                      <td style={{ padding: '10px 10px', maxWidth: 180 }} className="truncate">{item.filename}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-soft)' }}>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '10px 10px' }}>{item.is_food ? '🥗 Food' : '🧴 Non-Food'}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span className={`status-badge status-${item.overall_status}`} style={{ fontSize: 11, padding: '3px 9px' }}>
                          {STATUS_LABEL[item.overall_status] || item.overall_status || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${(item.compliance_score || 0) * 100}%`, height: '100%', background: STATUS_COLOR[item.overall_status] || 'var(--blue)', borderRadius: 99 }} />
                          </div>
                          <span>{((item.compliance_score || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-soft)' }}>{((item.ocr_confidence || 0) * 100).toFixed(0)}%</td>
                      <td style={{ padding: '10px 10px' }}>
                        <Link to={`/result/${item.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}>View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13 }}>
              <span className="text-muted">
                Showing {total ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); setPage(p => Math.max(0, p - 1)) }} disabled={page === 0}>← Prev</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); setPage(p => p + 1) }} disabled={(page + 1) * PAGE_SIZE >= total}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
