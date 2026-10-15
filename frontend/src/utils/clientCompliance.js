import { CLIENT_RULES } from '../rules/clientRules.js'

const patterns = {
  product_name: /(?:product\s*name|common\s*name|name\s*of\s*(?:the\s*)?product)\s*[:-]?\s*([^\n;]+)/i,
  net_quantity: /(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents)|quantity)(?:\s*\/\s*(?:net\s*)?(?:wt\.?|weight|qty\.?|quantity|content))?\s*[:-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:kg|g|mg|ml|mL|l|L|litres?|liters?|pieces?|pcs?))/i,
  mrp: /(?:mrp|m\.r\.p\.|max(?:imum)?\s*retail\s*price|market(?:ed)?\s*retail\s*price)\s*[:-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
  manufacturer_name: /(?:manufactured\s*by|mfd\.?\s*by|marketed\s*by|packed\s*by|pkd\.?\s*by|imported\s*by)\s*[:-]?\s*([^\n;]+)/i,
  packer_name: /(?:packed\s*by|pkd\.?\s*by)\s*[:-]?\s*([^\n;]+)/i,
  importer_name: /imported\s*by\s*[:-]?\s*([^\n;]+)/i,
  marketed_by: /marketed\s*by\s*[:-]?\s*([^\n;]+)/i,
  manufacturing_date: /(?:mfd\.?|mfg\.?|packed\s*on|pkd\.?|manufactured\s*on|date\s*of\s*(?:manufacture|packing))\s*[:-]?\s*((?:0?[1-9]|1[0-2])[/-]\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
  expiry_date: /(?:best\s*before(?:\s*date)?|use\s*by|expiry|expires?\s*on|exp\.?)\s*[:-]?\s*([^\n;]+)/i,
  country_of_origin: /(?:country\s*of\s*origin|product\s*of|made\s*in)\s*[:-]?\s*([^\n;]+)/i,
  ingredients: /ingredients?\s*[:-]?\s*([^\n]+)/i,
  nutrition_info: /(?:nutrition(?:al)?\s*(?:information|facts|value)|nutritional\s*info)\s*[:-]?\s*([^\n]+)/i,
  allergens: /(?:contains|allergen(?:s)?|may\s*contain)\s*[:-]?\s*([^\n]+)/i,
  consumer_care: /(?:consumer\s*care|customer\s*care|contact|toll[\s-]*free)\s*[:-]?\s*([^\n]+)/i,
}

function getMatch(text, pattern) {
  const match = pattern.exec(text)
  return match ? { value: match[1].trim(), matched_text: match[0] } : null
}

function normalizedConfidence(rawConfidence, present) {
  return present ? Math.max(0.35, Math.min(0.99, rawConfidence ?? 0.7)) : 0
}

export function extractClientFields(text, rawConfidence = 0.7) {
  const source = String(text || '')
  const fields = {}
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = getMatch(source, pattern)
    fields[key] = {
      value: match?.value || '',
      confidence: normalizedConfidence(rawConfidence, Boolean(match)),
      matched_text: match?.matched_text || '',
    }
  }
  const pin = source.match(/(?:PIN(?:\s*code)?|postal\s*code)?\s*[:#-]?\s*\b([1-9]\d{5})\b/i)
  fields.pin_code = { value: pin?.[1] || '', confidence: normalizedConfidence(rawConfidence, Boolean(pin)), matched_text: pin?.[0] || '' }
  const fssai = source.match(/(?:FSSAI(?:\s*(?:licen[cs]e|no\.?|number))?|licen[cs]e\s*(?:no\.?|number))[^\d]{0,16}(\d{14})/i)
  fields.fssai_license = { value: fssai?.[1] || '', confidence: normalizedConfidence(rawConfidence, Boolean(fssai)), matched_text: fssai?.[0] || '' }
  const tollFree = source.match(/\b(?:1800|1860)[\s-]?\d{3}[\s-]?\d{4}\b/)
  fields.toll_free = { value: tollFree?.[0] || '', confidence: normalizedConfidence(rawConfidence, Boolean(tollFree)), matched_text: tollFree?.[0] || '' }
  const phoneText = tollFree ? source.replace(tollFree[0], ' ') : source
  const phone = phoneText.match(/(?:phone|tel(?:ephone)?|consumer\s*care|customer\s*care|call|contact)[^\d]{0,16}(\+?91[\s-]?)?(0?[6-9]\d{9})/i)
    || phoneText.match(/\b[6-9]\d{9}\b/)
  fields.phone = { value: phone?.[2] || phone?.[0] || '', confidence: normalizedConfidence(rawConfidence, Boolean(phone)), matched_text: phone?.[0] || '' }
  const email = source.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
  fields.email = { value: email?.[0] || '', confidence: normalizedConfidence(rawConfidence, Boolean(email)), matched_text: email?.[0] || '' }
  const veg = source.match(/\b(non[\s-]?veg(?:etarian)?|vegetarian|veg(?:etarian)?)\b/i)
  fields.veg_nonveg = { value: veg?.[1] || '', confidence: normalizedConfidence(rawConfidence, Boolean(veg)), matched_text: veg?.[0] || '' }
  const inclusive = source.match(/(?:inclusive\s*of\s*(?:all\s*)?taxes|incl\.?\s*of\s*all\s*taxes)/i)
  fields.mrp_inclusive_of_taxes = { value: Boolean(inclusive), confidence: normalizedConfidence(rawConfidence, Boolean(inclusive)), matched_text: inclusive?.[0] || '' }
  const logo = source.match(/\bFSSAI\b/i)
  fields.fssai_logo = { value: logo?.[0] || '', confidence: normalizedConfidence(rawConfidence, Boolean(logo)), matched_text: logo?.[0] || '' }
  const bestBefore = source.match(/\b(?:best\s*before|use\s*by|expiry|expires?)\b/i)
  fields.best_before_wording = { value: bestBefore?.[0] || '', confidence: normalizedConfidence(rawConfidence, Boolean(bestBefore)), matched_text: bestBefore?.[0] || '' }
  fields.mrp_text = { value: getMatch(source, patterns.mrp)?.matched_text || '', confidence: normalizedConfidence(rawConfidence, Boolean(getMatch(source, patterns.mrp))), matched_text: getMatch(source, patterns.mrp)?.matched_text || '' }
  if (!fields.manufacturer_address) fields.manufacturer_address = { value: '', confidence: 0, matched_text: '' }
  fields.manufacture_date = fields.manufacturing_date
  fields.fssai_number = fields.fssai_license
  fields.best_before = fields.expiry_date
  fields.nutritional_info = fields.nutrition_info
  fields.manufacturer_pin = fields.pin_code
  fields.manufacturer_pin_code = fields.pin_code
  if (fields.manufacturer_name.value) {
    const [name, ...address] = fields.manufacturer_name.value.split(',')
    fields.manufacturer_name = { ...fields.manufacturer_name, value: name.trim() }
    fields.manufacturer_address = {
      ...fields.manufacturer_name,
      value: address.join(',').trim(),
    }
  }
  for (const role of ['packer', 'importer']) {
    const roleName = fields[`${role}_name`]
    if (roleName?.value) {
      const [name, ...address] = roleName.value.split(',')
      fields[`${role}_name`] = { ...roleName, value: name.trim() }
      fields[`${role}_address`] = {
        ...roleName,
        value: address.join(',').trim(),
      }
    } else {
      fields[`${role}_address`] = { value: '', confidence: 0, matched_text: '' }
    }
    fields[`${role}_pin`] = fields.pin_code
  }

  const isFood = /\b(?:fssai|ingredients?|nutrition(?:al)?|veg(?:etarian)?|non[\s-]?veg|allergen|best\s*before)\b/i.test(source)
  return { fields, isFood }
}

function fieldValue(fields, key) {
  const value = fields[key]?.value ?? fields[key] ?? ''
  return String(value).trim()
}

function evaluateRule(rule, fields, text, isFood) {
  if (rule.applies === 'food' && !isFood) return { status: 'SKIPPED', extracted_value: '', matched_text: '' }
  const value = fieldValue(fields, rule.field)
  const fieldConfidence = fields[rule.field]?.confidence ?? 0
  const checkTypes = {
    presence: () => value ? 'PASS' : 'NEEDS_REVIEW',
    standard_unit: () => !value ? 'NEEDS_REVIEW' : /\b(?:kg|g|mg|ml|l|litres?|liters?)\b/i.test(value) ? 'PASS' : 'FAIL',
    numeric: () => !value ? 'NEEDS_REVIEW' : /^\d+(?:[.,]\d{1,2})?$/.test(value) ? 'PASS' : 'FAIL',
    pin: () => !value ? 'NEEDS_REVIEW' : /^[1-9]\d{5}$/.test(value) ? 'PASS' : 'FAIL',
    license: () => !value ? 'NEEDS_REVIEW' : /^\d{14}$/.test(value) ? 'PASS' : 'FAIL',
    declared_true: () => value.toLowerCase() === 'true' ? 'PASS' : 'NEEDS_REVIEW',
    veg_mark: () => value ? 'PASS' : 'NEEDS_REVIEW',
    date: () => !value ? 'NEEDS_REVIEW' : /^(?:(?:0?[1-9]|1[0-2])[/-]\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})$/.test(value) ? 'PASS' : 'FAIL',
    date_sequence: () => {
      const startValue = fields.manufacturing_date?.value || ''
      const endValue = fields.expiry_date?.value || ''
      if (!startValue || !endValue) return 'NEEDS_REVIEW'
      const toDate = input => {
        const parts = input.split(/[/-]/).map(Number)
        if (parts.length === 3) {
          const [first, second, third] = parts
          return first > 31
            ? new Date(first, second - 1, third)
            : new Date(third < 100 ? third + 2000 : third, second - 1, first)
        }
        if (parts.length === 2 && parts[1] > 31) return new Date(parts[1], parts[0] - 1, 1)
        return null
      }
      const start = toDate(startValue)
      const end = toDate(endValue)
      return !start || !end ? 'NEEDS_REVIEW' : end > start ? 'PASS' : 'FAIL'
    },
  }
  let status = (checkTypes[rule.checkType || 'presence'] || checkTypes.presence)()
  const supportingConfidence = rule.checkType === 'date_sequence'
    ? Math.min(fieldConfidence, fields.manufacturing_date?.confidence ?? 1)
    : fieldConfidence
  if (status === 'PASS' && rule.checkType !== 'veg_mark' && supportingConfidence < 0.45) status = 'NEEDS_REVIEW'
  const valueEvidence = fields[rule.field]?.matched_text
    || (value && text.toLowerCase().includes(value.toLowerCase()) ? value : '')
  return { status, extracted_value: value, matched_text: valueEvidence }
}

export function createClientReport({ text, isFood, confidence = 0.7, fields: editedFields, id = crypto.randomUUID(), filename = 'label-text' }) {
  const extraction = extractClientFields(text, confidence)
  const fields = { ...extraction.fields, ...(editedFields || {}) }
  if (editedFields?.fssai_number) fields.fssai_license = editedFields.fssai_number
  if (editedFields?.manufacture_date) fields.manufacturing_date = editedFields.manufacture_date
  if (editedFields?.manufacturer_pin || editedFields?.manufacturer_pin_code) {
    fields.pin_code = editedFields.manufacturer_pin || editedFields.manufacturer_pin_code
  }
  if (editedFields?.nutritional_info) fields.nutrition_info = editedFields.nutritional_info
  if (editedFields?.best_before) fields.expiry_date = editedFields.best_before
  const classifiedAsFood = typeof isFood === 'boolean' ? isFood : extraction.isFood
  const ruleResults = CLIENT_RULES.map(rule => ({
    rule_id: rule.id,
    name: rule.name,
    severity: rule.severity,
    legal_source: rule.source,
    message: rule.fix,
    how_to_fix: rule.fix,
    ...evaluateRule(rule, fields, text, classifiedAsFood),
  }))
  const evaluated = ruleResults.filter(rule => rule.status !== 'SKIPPED')
  const passCount = evaluated.filter(rule => rule.status === 'PASS').length
  const failedCount = evaluated.filter(rule => rule.status === 'FAIL').length
  const reviewCount = evaluated.filter(rule => rule.status === 'NEEDS_REVIEW').length
  const overall_status = reviewCount ? 'NEEDS_REVIEW' : failedCount ? 'NON_COMPLIANT' : 'COMPLIANT'
  return {
    id,
    filename,
    original_filename: filename,
    overall_status,
    compliance_score: evaluated.length ? passCount / evaluated.length : 0,
    ocr_confidence: confidence,
    is_food: classifiedAsFood,
    extracted_fields: fields,
    rule_results: ruleResults,
    raw_text: text,
    is_demo: false,
    confidence_source: 'browser_tesseract',
    created_at: new Date().toISOString(),
    image_url: '',
  }
}
