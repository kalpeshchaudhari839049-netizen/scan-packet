import { clearLocalReports, getLocalReports, saveLocalReport } from './localHistory.js'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export const hasReportApi = Boolean(API_BASE)

async function request(path, options) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, options)
  } catch (error) {
    throw new Error(`Cannot reach the report service: ${error.message}`)
  }
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // Keep the HTTP status as the explicit error when the response isn't JSON.
    }
    throw new Error(`Report service request failed: ${detail}`)
  }
  return response.json()
}

export async function saveReport(report) {
  saveLocalReport(report)
  if (!hasReportApi) return
  await request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
}

export async function getReport(reportId) {
  const local = getLocalReports().find(report => report.id === reportId)
  if (local) return local
  if (hasReportApi) return request(`/api/reports/${encodeURIComponent(reportId)}`)
  return null
}

export async function getReports({ status = '', limit = 10, offset = 0 } = {}) {
  if (hasReportApi) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) params.set('status', status)
    return request(`/api/reports?${params}`)
  }

  const reports = getLocalReports()
  const stats = { COMPLIANT: 0, NON_COMPLIANT: 0, NEEDS_REVIEW: 0 }
  const failedRules = new Map()
  for (const report of reports) {
    stats[report.overall_status] = (stats[report.overall_status] || 0) + 1
    for (const rule of report.rule_results || []) {
      if (rule.status !== 'FAIL') continue
      const current = failedRules.get(rule.rule_id) || {
        rule_id: rule.rule_id,
        name: rule.name,
        count: 0,
      }
      current.count += 1
      failedRules.set(rule.rule_id, current)
    }
  }
  const filtered = status
    ? reports.filter(report => report.overall_status === status)
    : reports
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    stats,
    top_failed_rules: [...failedRules.values()]
      .sort((left, right) => right.count - left.count)
      .slice(0, 5),
  }
}

export async function clearReports() {
  clearLocalReports()
  if (hasReportApi) await request('/api/reports', { method: 'DELETE' })
  window.dispatchEvent(new CustomEvent('code-alpha-history-updated'))
}
