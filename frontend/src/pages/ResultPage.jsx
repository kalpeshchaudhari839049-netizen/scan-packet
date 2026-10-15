import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ScoreRing from '../components/ScoreRing.jsx'
import RuleChecklist from '../components/RuleChecklist.jsx'
import FieldEditor from '../components/FieldEditor.jsx'
import { createClientReport } from '../utils/clientCompliance.js'
import { saveLocalReport, getLocalReports } from '../utils/localHistory.js'
import { DISCLAIMER } from '../rules/clientRules.js'
import { jsPDF } from 'jspdf'
import { useLanguage } from '../language/useLanguage.js'

function readCachedReport(reportId) {
  try {
    const cached = sessionStorage.getItem(`report_${reportId}`)
    if (cached) return JSON.parse(cached)
    return getLocalReports().find(item => item.id === reportId) || null
  } catch {
    return null
  }
}

const STATUS_ICON = { COMPLIANT: '✅', NON_COMPLIANT: '❌', NEEDS_REVIEW: '⚠️' }

export default function ResultPage() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [initialReport] = useState(() => readCachedReport(id))
  const [report, setReport] = useState(initialReport)
  const [loading] = useState(false)
  const [tab, setTab] = useState('fields')  // 'fields' | 'rules' | 'rawtext'
  const [editedFields, setEditedFields] = useState(initialReport?.extracted_fields || {})
  const [revalMsg, setRevalMsg] = useState(null)
  const [editedText, setEditedText] = useState(initialReport?.raw_text || '')
  const [isFood, setIsFood] = useState(initialReport?.is_food ?? true)
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(false)
  const textAreaRef = useRef(null)
  const [selectionText, setSelectionText] = useState('')

  useEffect(() => {
    if (tab !== 'rawtext' || !selectionText || !textAreaRef.current) return
    const start = editedText.toLowerCase().indexOf(selectionText.toLowerCase())
    if (start >= 0) {
      textAreaRef.current.focus()
      textAreaRef.current.setSelectionRange(start, start + selectionText.length)
      const style = window.getComputedStyle(textAreaRef.current)
      const lineHeight = Number.parseFloat(style.lineHeight) || 20
      const lineIndex = editedText.slice(0, start).split('\n').length - 1
      textAreaRef.current.scrollTop = Math.max(0, lineIndex * lineHeight - 50)
    }
  }, [tab, selectionText, editedText])

  const handleFieldChange = (key, value) => {
    const aliases = {
      fssai_number: ['fssai_license'],
      manufacture_date: ['manufacturing_date'],
      manufacturer_pin: ['pin_code', 'manufacturer_pin_code'],
      expiry_date: ['best_before'],
      best_before: ['expiry_date'],
      nutritional_info: ['nutrition_info'],
      nutrition_info: ['nutritional_info'],
    }
    setEditedFields(prev => {
      const updated = { ...prev }
      for (const field of [key, ...(aliases[key] || [])]) {
        updated[field] = {
          ...prev[field],
          value,
          confidence: 1,
          matched_text: prev[field]?.matched_text || '',
        }
      }
      return updated
    })
  }

  const handleRevalidate = () => {
    setRevalMsg(null)
    try {
      const result = createClientReport({
        id: report.id,
        text: editedText,
        isFood,
        confidence: report.ocr_confidence,
        fields: editedFields,
        filename: report.filename,
      })
      const updated = { ...result, image_url: report.image_url || '' }
      saveLocalReport(updated)
      setReport(updated)
      setEditedFields(updated.extracted_fields)
      setRevalMsg({ type: 'success', text: 'Checks complete. Verdict updated.' })
    } catch (error) {
      setRevalMsg({ type: 'error', text: error.message })
    }
  }

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance_report_${id}.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const handleDownloadPdf = () => {
    const pdf = new jsPDF()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let y = 20
    const addLine = (line, size = 10) => {
      pdf.setFontSize(size)
      const wrapped = pdf.splitTextToSize(String(line), 175)
      if (y + wrapped.length * 5 > pageHeight - 18) {
        pdf.addPage()
        y = 20
      }
      pdf.text(wrapped, 18, y)
      y += wrapped.length * 5 + 2
    }
    pdf.setFillColor(52, 120, 246)
    pdf.roundedRect(18, 11, 12, 12, 2, 2, 'F')
    pdf.setFontSize(9)
    pdf.setTextColor(255, 255, 255)
    pdf.text('CA', 20.2, 18.5)
    pdf.setFontSize(18)
    pdf.setTextColor(22, 56, 94)
    pdf.text('Code Alpha', 34, y)
    y += 9
    pdf.setTextColor(30, 40, 55)
    addLine('Packaged Commodities Compliance Report', 13)
    addLine(`Generated: ${new Date().toLocaleString()}`)
    addLine(`Product: ${editedFields.product_name?.value || report.filename}`)
    addLine(`Verdict: ${report.overall_status.replaceAll('_', ' ')}`)
    addLine(`Compliance score: ${Math.round(report.compliance_score * 100)}%`)
    addLine(`Category: ${isFood ? 'Food' : 'Non-food'}`)
    y += 3
    addLine('Extracted fields', 13)
    Object.entries(editedFields).forEach(([key, field]) => {
      if (field?.value !== '' && field?.value != null) addLine(`${key.replaceAll('_', ' ')}: ${field.value} (confidence ${Math.round((field.confidence || 0) * 100)}%)`)
    })
    y += 3
    addLine('Rule results', 13)
    report.rule_results.forEach(rule => addLine(`${rule.status} — ${rule.name} [${rule.severity}]. Evidence: ${rule.extracted_value || 'Not detected'}. ${rule.legal_source}`))
    y += 3
    addLine(DISCLAIMER, 9)
    pdf.save(`code-alpha-report-${id}.pdf`)
  }

  const copySummary = async () => {
    const summary = [
      `Code Alpha compliance result: ${report.overall_status.replaceAll('_', ' ')}`,
      `Product: ${editedFields.product_name?.value || report.filename}`,
      `Compliance score: ${Math.round(report.compliance_score * 100)}%`,
      `Passed: ${report.rule_results.filter(rule => rule.status === 'PASS').length}; failed: ${report.rule_results.filter(rule => rule.status === 'FAIL').length}; review: ${report.rule_results.filter(rule => rule.status === 'NEEDS_REVIEW').length}`,
      DISCLAIMER,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setRevalMsg({ type: 'error', text: 'Clipboard access was denied. Copy the summary from the report instead.' })
    }
  }

  const focusRuleEvidence = rule => {
    if (!rule.matched_text) return
    setSelectionText(rule.matched_text)
    setTab('rawtext')
  }

  if (loading) return <div role="status" className="text-muted">Loading report…</div>
  if (!report) return (
    <div className="fade-in-up">
      <div className="empty-state" role="status">This result is no longer available in local browser storage.</div>
      <Link to="/" className="btn btn-secondary btn-sm">← Back to Upload</Link>
    </div>
  )

  const status = report.overall_status
  const score = report.compliance_score || 0
  const applicableRules = (report.rule_results || []).filter(r => r.status !== 'SKIPPED')
  const passCount = applicableRules.filter(r => r.status === 'PASS').length
  const failCount = (report.rule_results || []).filter(r => r.status === 'FAIL').length
  const reviewCount = (report.rule_results || []).filter(r => r.status === 'NEEDS_REVIEW').length
  const visibleRules = (report.rule_results || []).filter(rule => filter === 'all'
    || (filter === 'passed' && rule.status === 'PASS')
    || (filter === 'failed' && rule.status === 'FAIL')
    || (filter === 'review' && rule.status === 'NEEDS_REVIEW'))

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>{t('result')}</h1>
      {/* Back link */}
      <Link to="/" style={{ fontSize: 13, color: 'var(--blue-light)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Back to Upload
      </Link>

      {/* Verdict Banner */}
      <div className={`verdict-banner ${status}`}>
        <ScoreRing score={score} status={status} size={90} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{STATUS_ICON[status]}</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              {t(status === 'COMPLIANT' ? 'compliant' : status === 'NON_COMPLIANT' ? 'nonCompliant' : 'needsReview')}
            </span>
            {report.is_demo && (
              <span className="badge-pill" style={{ fontSize: 10 }}>DEMO</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span style={{ color: 'var(--green-light)' }}>✓ {passCount} {t('passed')}</span>
            <span style={{ color: 'var(--red-light)' }}>✗ {failCount} {t('failed')}</span>
            <span style={{ color: 'var(--orange-light)' }}>⚠ {reviewCount} {t('review')}</span>
          </div>
          <div className="text-muted text-sm" style={{ marginTop: 6 }}>
            <strong style={{ color: 'var(--text)' }}>{passCount}/{applicableRules.length} checks passed · OCR {(report.ocr_confidence * 100).toFixed(0)}%</strong>
            &nbsp;·&nbsp;
            {isFood ? '🥗 Food Product' : '🧴 Non-Food'}
            &nbsp;·&nbsp;
            File: <strong style={{ color: 'var(--text)' }}>{report.filename}</strong>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}>{t('downloadPdf')}</button>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadJson}>{t('downloadJson')}</button>
          <button className="btn btn-secondary btn-sm" onClick={copySummary}>{copied ? 'Copied!' : t('copySummary')}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 22, maxWidth: 400 }}>
        {[['fields', `📝 ${t('extracted')}`], ['rules', `📋 ${t('checklist')}`], ['rawtext', `📃 ${t('rawText')}`]].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}>{l}</button>
        ))}
      </div>

      {/* Tab: Fields */}
      {tab === 'fields' && (
        <div className="result-evidence-grid">
          <aside className="card result-image-card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Scanned label</div>
            {report.image_url ? (
              <img
                className="result-image"
                src={report.image_url}
                alt={`Uploaded package label: ${report.filename}`}
                onError={event => { event.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="result-image-placeholder" role="img" aria-label="Label image unavailable">
                No label image is available for this report.
              </div>
            )}
            <div className="text-xs text-muted" style={{ marginTop: 9, overflowWrap: 'anywhere' }}>{report.filename}</div>
          </aside>
          <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Extracted Label Fields</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {revalMsg && (
                <span style={{ fontSize: 13, color: revalMsg.type === 'success' ? 'var(--green-light)' : 'var(--red-light)', alignSelf: 'center' }}>
                  {revalMsg.text}
                </span>
              )}
              <button className="btn btn-primary btn-sm" onClick={handleRevalidate}>
                {`🔁 ${t('rerun')}`}
              </button>
            </div>
          </div>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
            Edit any field below to correct OCR errors, then click <strong>Re-validate</strong> to re-run the compliance engine.
          </p>
          <label className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={isFood} onChange={event => setIsFood(event.target.checked)} aria-label="Treat as food product" />
            {t('food')}
          </label>
          <FieldEditor fields={editedFields} onChange={handleFieldChange} />
          </section>
        </div>
      )}

      {/* Tab: Rules */}
      {tab === 'rules' && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Rule-by-Rule Compliance Checklist</h2>
          <div className="tab-bar" role="group" aria-label="Filter compliance rules" style={{ marginBottom: 14 }}>
            {[['all', t('all')], ['passed', t('passed')], ['failed', t('failed')], ['review', t('review')]].map(([key, label]) => (
              <button key={key} className={`tab-btn ${filter === key ? 'active' : ''}`} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}>{label}</button>
            ))}
          </div>
          <details open>
            <summary className="text-sm" style={{ cursor: 'pointer', marginBottom: 10 }}>Rule results ({visibleRules.length})</summary>
            <RuleChecklist rules={visibleRules} onRuleHover={focusRuleEvidence} />
          </details>
        </div>
      )}

      {/* Tab: Raw Text */}
      {tab === 'rawtext' && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{t('rawText')}</h2>
          <p className="text-xs text-muted" style={{ marginBottom: 8 }}>Hover a rule result to select its evidence here. Edit text and re-run checks to validate corrections.</p>
          <textarea ref={textAreaRef} className="form-input" value={editedText} onChange={event => setEditedText(event.target.value)} rows={18} aria-label="Editable OCR label text and rule evidence" />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={handleRevalidate}>{t('rerun')}</button>
        </div>
      )}
      <p className="text-xs text-muted" style={{ marginTop: 20 }}>{DISCLAIMER}</p>
    </div>
  )
}
