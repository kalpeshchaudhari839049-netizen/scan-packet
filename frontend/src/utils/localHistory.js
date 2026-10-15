const HISTORY_KEY = 'code-alpha-scan-history'

export function saveLocalReport(report) {
  const current = getLocalReports()
  const savedReport = { ...report, image_url: '' }
  const next = [savedReport, ...current.filter(item => item.id !== report.id)].slice(0, 50)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    sessionStorage.setItem(`report_${report.id}`, JSON.stringify(report))
  } catch (error) {
    throw new Error(`The report was analyzed, but local browser storage could not save it: ${error.message}`)
  }
  window.dispatchEvent(new CustomEvent('code-alpha-history-updated'))
}

export function getLocalReports() {
  const value = localStorage.getItem(HISTORY_KEY)
  if (!value) return []
  try {
    const reports = JSON.parse(value)
    if (!Array.isArray(reports)) throw new Error('History data is not a list.')
    return reports
  } catch (error) {
    throw new Error(`Saved scan history could not be read: ${error.message}`)
  }
}

export function clearLocalReports() {
  localStorage.removeItem(HISTORY_KEY)
  window.dispatchEvent(new CustomEvent('code-alpha-history-updated'))
}
