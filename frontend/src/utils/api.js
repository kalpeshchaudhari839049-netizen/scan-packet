const BASE = ''

async function request(path, options, fallbackMessage) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, options)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the local compliance API. Start the FastAPI server, then try again.')
    }
    throw error
  }

  if (!response.ok) {
    let message = `${fallbackMessage} (${response.status})`
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body.detail)) message = body.detail.map(item => item.msg).filter(Boolean).join('; ') || message
      else if (typeof body.message === 'string') message = body.message
    } catch {
      if (response.statusText) message = `${fallbackMessage}: ${response.statusText}`
    }
    throw new Error(message)
  }

  return response
}

export async function analyzeImage(file, isFood = true) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('is_food', String(isFood))
  return (await request('/api/analyze', { method: 'POST', body: fd }, 'Label analysis failed')).json()
}

export async function analyzeDemo(demoId) {
  const fd = new FormData()
  fd.append('demo_id', demoId)
  return (await request('/api/analyze', { method: 'POST', body: fd }, 'Demo analysis failed')).json()
}

export async function revalidate(payload) {
  return (await request('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 'Revalidation failed')).json()
}

export async function getReports(params = {}) {
  const q = new URLSearchParams(params).toString()
  return (await request(`/api/reports${q ? `?${q}` : ''}`, undefined, 'Failed to load scan history')).json()
}

export async function getReport(id) {
  const response = await request(`/api/reports/${encodeURIComponent(id)}`, undefined, `Report ${id} not found`)
  return response.json()
}

export function getPdfUrl(id) {
  return `${BASE}/api/reports/${encodeURIComponent(id)}/pdf`
}

export async function getRules() {
  return (await request('/api/rules', undefined, 'Failed to load compliance rules')).json()
}

export async function getDemoLabels() {
  return (await request('/api/demo-labels', undefined, 'Failed to load demo labels')).json()
}

export async function getHealth() {
  return (await request('/api/health', undefined, 'Compliance API is unavailable')).json()
}
