/**
 * ScoreRing – animated SVG donut that shows compliance score %.
 */
const STATUS_COLOR = {
  COMPLIANT:     '#18a870',
  NON_COMPLIANT: '#e04040',
  NEEDS_REVIEW:  '#f09828',
}

export default function ScoreRing({ score = 0, status, size = 80 }) {
  const color = STATUS_COLOR[status] || '#7a91ab'
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * score
  const gap  = circ - dash
  const cx   = size / 2
  const cy   = size / 2

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={8}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>
          {Math.round(score * 100)}%
        </div>
        <div style={{ fontSize: size * 0.11, color: 'var(--muted)', fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          Score
        </div>
      </div>
    </div>
  )
}
