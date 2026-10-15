import assert from 'node:assert/strict'
import test from 'node:test'
import { createClientReport, extractClientFields } from '../src/utils/clientCompliance.js'

const completeLabel = [
  'PRODUCT NAME: Sample Rice',
  'NET WT / NET QTY: 1 kg',
  'MRP Rs 55.00 inclusive of all taxes',
  'Manufactured by: Alpha Foods, Road 1, Pune PIN 411001',
  'Mfd 03/2025',
  'Best Before: 01/04/2025',
  'FSSAI Licence No: 12345678901234',
  'Vegetarian',
  'Ingredients: Rice',
  'Nutrition Information: Energy 340 kcal',
  'Contains wheat (gluten)',
  'Consumer care: 1800 123 4567 support@example.in',
].join('\n')

test('extracts label variants, normalized evidence, and contact information', () => {
  const { fields, isFood } = extractClientFields(completeLabel, 0.94)
  assert.equal(isFood, true)
  assert.equal(fields.product_name.value, 'Sample Rice')
  assert.equal(fields.net_quantity.value, '1 kg')
  assert.equal(fields.mrp.value, '55.00')
  assert.equal(fields.manufacturer_name.value, 'Alpha Foods')
  assert.equal(fields.manufacturer_address.value, 'Road 1, Pune PIN 411001')
  assert.equal(fields.manufacturing_date.value, '03/2025')
  assert.equal(fields.pin_code.value, '411001')
  assert.equal(fields.fssai_license.value, '12345678901234')
  assert.equal(fields.veg_nonveg.value, 'Vegetarian')
  assert.equal(fields.allergens.value, 'wheat (gluten)')
  assert.match(fields.nutrition_info.value, /Energy/)
  assert.match(fields.toll_free.value, /1800/)
  assert.equal(fields.email.value, 'support@example.in')
  assert.ok(fields.product_name.confidence > 0.9)
})

test('non-standard count units fail and vegetarian evidence passes even at low OCR confidence', () => {
  const report = createClientReport({
    text: 'PRODUCT NAME: Sample Food\nNET CONTENT: 2 pieces\nVegetarian',
    isFood: true,
    confidence: 0.3,
  })
  const results = Object.fromEntries(report.rule_results.map(rule => [rule.rule_id, rule.status]))
  assert.equal(results['label-net-quantity-unit'], 'FAIL')
  assert.equal(results['food-veg-mark'], 'PASS')
  assert.equal(results['food-fssai'], 'NEEDS_REVIEW')
})

test('missing vegetarian mark is review and a food override can be changed on revalidation', () => {
  const first = createClientReport({ text: 'PRODUCT NAME: Soap', confidence: 0.95 })
  assert.equal(first.is_food, false)
  const changed = createClientReport({
    id: first.id,
    text: 'PRODUCT NAME: Sample Rice',
    isFood: true,
    confidence: 0.95,
    fields: { ...first.extracted_fields, veg_nonveg: { value: '', confidence: 0 } },
  })
  assert.equal(changed.is_food, true)
  assert.equal(changed.rule_results.find(rule => rule.rule_id === 'food-veg-mark').status, 'NEEDS_REVIEW')
})

test('manually corrected values use their field confidence on revalidation', () => {
  const first = createClientReport({
    text: 'PRODUCT NAME: Sample Rice\nMRP Rs 55',
    isFood: false,
    confidence: 0.2,
  })
  const corrected = createClientReport({
    id: first.id,
    text: first.raw_text,
    isFood: false,
    confidence: first.ocr_confidence,
    fields: { ...first.extracted_fields, mrp: { value: '55', confidence: 1 } },
  })
  assert.equal(corrected.rule_results.find(rule => rule.rule_id === 'label-mrp-format').status, 'PASS')
})

test('date sequence and score reflect rule outcomes', () => {
  const report = createClientReport({ text: completeLabel, isFood: true, confidence: 0.98 })
  assert.equal(report.rule_results.find(rule => rule.rule_id === 'food-date-sequence').status, 'PASS')
  assert.ok(report.compliance_score > 0.5 && report.compliance_score <= 1)
})
