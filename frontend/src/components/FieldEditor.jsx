/**
 * FieldEditor – editable grid of extracted label fields.
 * User can correct OCR errors; onChange propagates up for re-validation.
 */
const FIELD_META = {
  product_name:     { label: 'Product Name',            icon: '📦', required: true },
  manufacturer_name:{ label: 'Manufacturer / Packer',   icon: '🏭', required: true },
  manufacturer_address: { label: 'Manufacturer Address', icon: '📍', required: true },
  marketed_by: { label: 'Marketed By', icon: '🏪', required: false },
  manufacturer_pin: { label: 'Manufacturer PIN',         icon: '⌖', required: true },
  packer_name:      { label: 'Packer Name',              icon: '📦', required: false },
  packer_address:   { label: 'Packer Address',           icon: '📍', required: false },
  packer_pin:       { label: 'Packer PIN',               icon: '⌖', required: false },
  importer_name:    { label: 'Importer Name',             icon: '🌐', required: false },
  importer_address: { label: 'Importer Address',          icon: '📍', required: false },
  importer_pin:     { label: 'Importer PIN',              icon: '⌖', required: false },
  net_quantity:     { label: 'Net Quantity',             icon: '⚖',  required: true },
  mrp:              { label: 'MRP (₹)',                  icon: '💰', required: true },
  mrp_text:         { label: 'MRP Full Text',            icon: '📝', required: false },
  manufacture_date: { label: 'Manufacture Date',         icon: '📅', required: true },
  month_year:      { label: 'Month / Year of Packing',   icon: '🗓', required: false },
  expiry_date:      { label: 'Expiry / Best Before',     icon: '🗓', required: true },
  best_before:     { label: 'Best Before',               icon: '⏳', required: false },
  consumer_care:    { label: 'Consumer Care',            icon: '📞', required: false },
  country_of_origin:{ label: 'Country of Origin',        icon: '🌍', required: true },
  fssai_number:     { label: 'FSSAI Licence No.',        icon: '🍽', required: false },
  veg_nonveg:       { label: 'Veg / Non-Veg',           icon: '🥗', required: false },
  ingredients:      { label: 'Ingredients',             icon: '🧪', required: false },
  nutritional_info: { label: 'Nutritional Info',        icon: '📊', required: false },
  allergens: { label: 'Allergen statement', icon: '⚠️', required: false },
  fssai_logo: { label: 'FSSAI logo text', icon: '🛡', required: false },
  best_before_wording: { label: 'Best-before wording', icon: '📅', required: false },
  phone: { label: 'Phone', icon: '☎', required: false },
  toll_free: { label: 'Toll-free number', icon: '☎', required: false },
  email: { label: 'Email', icon: '✉', required: false },
  mrp_inclusive_of_taxes: { label: 'MRP includes taxes', icon: '₹', required: false },
}

function ConfBar({ conf }) {
  const pct = Math.round((conf || 0) * 100)
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
      <div style={{ flex: 1, height: 3, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--muted)', minWidth: 28 }}>{pct}%</span>
    </div>
  )
}

export default function FieldEditor({ fields, onChange }) {
  if (!fields) return null

  return (
    <div className="fields-grid">
      {Object.entries(FIELD_META).map(([key, meta]) => {
        const fd = fields[key] || {}
        const val = fd.value ?? ''
        const conf = fd.confidence ?? 0
        const isEmpty = !val

        return (
          <div
            key={key}
            className="field-card"
            style={{ borderColor: isEmpty && meta.required ? 'rgba(224,64,64,0.35)' : undefined }}
          >
            <div className="field-label">
              <span style={{ marginRight: 5 }}>{meta.icon}</span>
              {meta.label}
              {meta.required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
            </div>
            {typeof fd.value === 'boolean' ? (
              <label className="flex items-center gap-2 text-sm" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={fd.value} aria-label={meta.label} onChange={event => onChange(key, event.target.checked)} />
                {fd.value ? 'Yes' : 'No / not detected'}
              </label>
            ) : (
              <input
                className="form-input"
                style={{ fontSize: 13, padding: '7px 10px', marginTop: 4, background: isEmpty && meta.required ? 'rgba(224,64,64,0.06)' : undefined }}
                value={val}
                placeholder={isEmpty ? '⚠ Not detected' : ''}
                aria-label={meta.label}
                onChange={e => onChange(key, e.target.value)}
              />
            )}
            <ConfBar conf={conf} />
            {isEmpty && meta.required && (
              <div style={{ fontSize: 10, color: 'var(--red-light)', marginTop: 3 }}>
                Required field missing
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
