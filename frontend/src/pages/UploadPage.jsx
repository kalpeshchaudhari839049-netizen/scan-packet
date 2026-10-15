import { useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../language/useLanguage.js'
import { createClientReport } from '../utils/clientCompliance.js'
import { recognizeLabel } from '../utils/browserOcr.js'
import { saveReport } from '../utils/reportApi.js'
import { SAMPLE_LABELS } from '../utils/sampleLabels.js'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function UploadPage() {
  const { t } = useLanguage()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(0.7)
  const [isFood, setIsFood] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState(null)
  const [batchFiles, setBatchFiles] = useState([])
  const [batchText, setBatchText] = useState('')
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchResults, setBatchResults] = useState([])
  const [batchError, setBatchError] = useState(null)
  const cameraInput = useRef(null)
  const previewUrl = useRef(null)
  const ocrSequence = useRef(0)
  const navigate = useNavigate()

  const updatePreview = nextFile => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = nextFile ? URL.createObjectURL(nextFile) : null
    setPreview(previewUrl.current)
  }

  const handleFile = async nextFile => {
    if (!nextFile) return
    const sequence = ++ocrSequence.current
    if (!['image/jpeg', 'image/png'].includes(nextFile.type)) {
      setError('Choose a valid JPG or PNG image.')
      setLoading(false)
      return
    }
    if (nextFile.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5 MB or smaller.')
      setLoading(false)
      return
    }
    setError(null)
    setText('')
    setConfidence(0)
    setFile(nextFile)
    updatePreview(nextFile)
    setLoading(true)
    setProgress(2)
    setProgressLabel('Preparing image…')
    try {
      const result = await recognizeLabel(nextFile, ({ progress: value, status }) => {
        if (sequence !== ocrSequence.current) return
        setProgress(Math.max(3, Math.round(value * 94)))
        setProgressLabel(status)
      })
      if (sequence !== ocrSequence.current) return
      setText(result.text)
      setConfidence(result.confidence)
      const detected = result.text
      setIsFood(/\b(?:fssai|ingredients?|nutrition(?:al)?|veg(?:etarian)?|non[\s-]?veg|food|edible)\b/i.test(detected))
      setProgress(100)
      setProgressLabel(result.text ? 'OCR complete. Review the recognized text before checking.' : t('noText'))
      if (!result.text) setError(t('noText'))
    } catch (ocrError) {
      if (sequence !== ocrSequence.current) return
      setError(`Could not read this image: ${ocrError.message || 'Please try a clearer photo.'}`)
      setProgress(0)
    } finally {
      if (sequence === ocrSequence.current) setLoading(false)
    }
  }

  const onDrop = (accepted, rejected) => {
    setError(null)
    if (rejected.length) {
      const reason = rejected[0].errors[0]
      setError(reason?.code === 'file-too-large'
        ? 'Image must be 5 MB or smaller.'
        : 'Choose a valid JPG or PNG image.')
      return
    }
    if (accepted.length) void handleFile(accepted[0])
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_IMAGE_SIZE,
    multiple: false,
    noClick: true,
  })

  const applySample = sample => {
    ocrSequence.current += 1
    setLoading(false)
    updatePreview(null)
    setFile(null)
    setText(sample.text)
    setConfidence(0.99)
    setIsFood(sample.isFood)
    setError(null)
    setProgress(0)
  }

  const reset = () => {
    ocrSequence.current += 1
    setLoading(false)
    updatePreview(null)
    setFile(null)
    setText('')
    setConfidence(0.7)
    setError(null)
    setProgress(0)
    setProgressLabel('')
  }

  const analyzeText = async () => {
    if (!text.trim()) {
      setError(t('noText'))
      return
    }
    try {
      const report = createClientReport({
        text,
        isFood,
        confidence: confidence || 0.7,
        filename: file?.name || 'label-text',
      })
      setSaving(true)
      await saveReport({ ...report, image_url: preview || '' })
      navigate(`/result/${report.id}`)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const onBatchFiles = event => {
    setBatchFiles(Array.from(event.target.files || []))
    setBatchResults([])
    setBatchError(null)
  }

  const runBatch = async () => {
    const textBlocks = batchText.split(/\n-{3,}\n/g).map(value => value.trim()).filter(Boolean)
    if (!batchFiles.length && !textBlocks.length) {
      setBatchError('Add one or more images or text blocks to run batch checks.')
      return
    }
    setBatchRunning(true)
    setBatchError(null)
    const entries = [
      ...batchFiles.map(item => ({ filename: item.name, file: item })),
      ...textBlocks.map((value, index) => ({ filename: `Text block ${index + 1}`, text: value })),
    ]
    const results = []
    try {
      for (const item of entries) {
        try {
          if (item.file && !['image/jpeg', 'image/png'].includes(item.file.type)) throw new Error('Only JPG and PNG photos are supported.')
          if (item.file && item.file.size > MAX_IMAGE_SIZE) throw new Error('Image must be 5 MB or smaller.')
          const recognized = item.file ? await recognizeLabel(item.file) : { text: item.text, confidence: 0.99 }
          const extracted = createClientReport({
            text: recognized.text,
            confidence: recognized.confidence,
            filename: item.filename,
          })
          results.push({
            ...extracted,
            product: extracted.extracted_fields.product_name.value || item.filename,
            failedCount: extracted.rule_results.filter(rule => rule.status === 'FAIL').length,
          })
          await saveReport(extracted)
        } catch (itemError) {
          results.push({ id: crypto.randomUUID(), filename: item.filename, product: item.filename, overall_status: 'NEEDS_REVIEW', failedCount: 0, error: itemError.message })
        }
      }
      setBatchResults(results)
    } catch (batchException) {
      setBatchError(batchException.message)
    } finally {
      setBatchRunning(false)
    }
  }

  const downloadCsv = () => {
    const csvCell = value => {
      const safeValue = /^[=+\-@]/.test(String(value)) ? `'${value}` : String(value)
      return `"${safeValue.replaceAll('"', '""')}"`
    }
    const csv = [
      ['Product', 'Verdict', 'Failed rules'].join(','),
      ...batchResults.map(item => [item.product, item.overall_status, item.failedCount].map(csvCell).join(',')),
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'code-alpha-batch-results.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>{t('labelTitle')}</h1>
        <p className="text-muted">Scan package declarations with on-device OCR, then review and check the detected text.</p>
      </div>

      <div className={`upload-layout ${preview ? 'has-preview' : ''}`}>
        <section className="card" aria-labelledby="label-panel-title">
          <h2 id="label-panel-title" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>1. Label</h2>
          <div
            {...getRootProps()}
            className={`upload-zone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            aria-label={t('selectImage')}
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } }}
          >
            <input {...getInputProps({ 'aria-label': 'Choose a JPG or PNG label image' })} />
            {preview ? (
              <img src={preview} alt={`Preview of ${file?.name || 'selected label'}`} style={{ maxHeight: 210, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
            ) : (
              <div>
                <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
                <p style={{ fontWeight: 700 }}>{isDragActive ? 'Drop the image here' : t('selectImage')}</p>
                <p className="text-muted text-xs">JPG / PNG · Max 5 MB · OCR runs in this browser</p>
              </div>
            )}
            {file && <p className="text-muted text-sm" style={{ marginTop: 8 }}>{file.name}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button className="btn btn-secondary btn-sm" type="button" onClick={open}>Browse files</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => cameraInput.current?.click()}>📷 Use camera</button>
            <input ref={cameraInput} type="file" accept="image/jpeg,image/png" capture="environment" hidden aria-label="Capture a label photo" onChange={event => { void handleFile(event.target.files?.[0]); event.target.value = '' }} />
            <button className="btn btn-ghost btn-sm" type="button" onClick={reset}>{t('reset')}</button>
          </div>

          {loading && (
            <div style={{ marginTop: 12 }} role="status" aria-live="polite">
              <div className="flex items-center gap-2" style={{ marginBottom: 7, fontSize: 13 }}>
                <div className="spinner" />
                <span>{progressLabel || 'Running in-browser OCR…'}</span>
              </div>
              <div className="progress-bar" aria-label="OCR progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <label className="field-label" htmlFor="label-text" style={{ marginTop: 18 }}>{t('textLabel')} — review and edit OCR results</label>
          <textarea
            id="label-text"
            className="form-input"
            rows={9}
            value={text}
            onChange={event => setText(event.target.value)}
            placeholder="Recognized label text appears here. You can also paste label text."
            aria-label="Editable recognized product label text"
          />
          {text && !loading && <p className="text-xs text-muted" style={{ marginTop: 5 }}>OCR confidence: {(confidence * 100).toFixed(0)}%</p>}
          {error && <div className="error-banner" role="alert">{error}</div>}

          <div className="card card-sm" style={{ marginTop: 14 }}>
            <label className="flex items-center justify-between" htmlFor="food-toggle">
              <span><strong>{t('food')}</strong><span className="text-xs text-muted" style={{ display: 'block' }}>Detected automatically; change if needed</span></span>
              <input id="food-toggle" type="checkbox" checked={isFood} onChange={event => setIsFood(event.target.checked)} aria-label="Treat this as a food product" />
            </label>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="text-xs text-muted" style={{ marginBottom: 7 }}>Try a sample label</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SAMPLE_LABELS.map(sample => <button key={sample.id} className="btn btn-secondary btn-sm" type="button" onClick={() => applySample(sample)}>{sample.title}</button>)}
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="button" style={{ marginTop: 16, width: '100%' }} onClick={analyzeText} disabled={loading || saving || !text.trim()}>
                {loading ? 'Reading label…' : saving ? 'Saving report…' : `⚖ ${t('analyze')}`}
          </button>
        </section>

        {preview && (
          <aside className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Image Preview</h2>
            <img src={preview} alt={`Current label photo: ${file?.name || ''}`} style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, background: 'var(--surface-2)' }} />
            <p className="text-xs text-muted" style={{ marginTop: 8 }}>{file?.name} · {((file?.size || 0) / 1024).toFixed(0)} KB</p>
          </aside>
        )}
      </div>

      <section className="card" style={{ marginTop: 24 }} aria-labelledby="batch-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 id="batch-heading" style={{ fontSize: 17, fontWeight: 700 }}>{t('batch')}</h2>
            <p className="text-xs text-muted">Check multiple photos or text blocks at once. Separate text blocks with a line containing ---.</p>
          </div>
          <label className="btn btn-secondary btn-sm" htmlFor="batch-images">Add photos</label>
          <input id="batch-images" className="visually-hidden" type="file" accept="image/jpeg,image/png" multiple onChange={onBatchFiles} aria-label="Select multiple label images for batch checking" />
        </div>
        <textarea className="form-input" rows={4} style={{ marginTop: 12 }} value={batchText} onChange={event => setBatchText(event.target.value)} placeholder="Paste label text blocks separated by ---" aria-label="Batch label text blocks" />
        {!!batchFiles.length && <p className="text-xs text-muted" style={{ marginTop: 5 }}>{batchFiles.length} photo(s) selected</p>}
        <button className="btn btn-primary btn-sm" type="button" style={{ marginTop: 10 }} onClick={runBatch} disabled={batchRunning}>
          {batchRunning ? 'Checking batch…' : 'Run batch checks'}
        </button>
        {batchError && <div className="error-banner" role="alert">{batchError}</div>}
        {batchResults.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead><tr><th align="left">Product</th><th align="left">Verdict</th><th align="left">Failed</th><th align="left">Report</th></tr></thead>
              <tbody>{batchResults.map(item => (
                <tr key={item.id}>
                  <td>{item.product}</td><td>{item.overall_status.replaceAll('_', ' ')}</td><td>{item.failedCount}</td>
                  <td><button className="btn btn-ghost btn-sm" type="button" disabled={Boolean(item.error)} onClick={() => navigate(`/result/${item.id}`)}>Open</button>{item.error && <span className="text-xs text-muted">{item.error}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
            <button className="btn btn-secondary btn-sm" type="button" style={{ marginTop: 8 }} onClick={downloadCsv}>{t('exportCsv')}</button>
          </div>
        )}
      </section>
      <p className="text-xs text-muted" style={{ marginTop: 16 }}>{t('disclaimer')}</p>
    </div>
  )
}
