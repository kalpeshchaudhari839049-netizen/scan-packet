export const CLIENT_RULES = [
  {
    id: 'label-product-name', name: 'Product name declared', field: 'product_name',
    severity: 'critical', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Add the common or generic name of the packaged commodity.',
  },
  {
    id: 'label-net-quantity', name: 'Net quantity declared', field: 'net_quantity',
    severity: 'major', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Declare the net quantity on the label.',
  },
  {
    id: 'label-net-quantity-unit', name: 'Net quantity uses a standard unit', field: 'net_quantity',
    checkType: 'standard_unit',
    severity: 'minor', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Use a recognized mass, volume or count unit such as g, kg, ml or L.',
  },
  {
    id: 'label-mrp', name: 'Maximum retail price declared', field: 'mrp',
    severity: 'major', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Print the maximum retail price (MRP) clearly.',
  },
  {
    id: 'label-mrp-format', name: 'MRP uses a numeric amount', field: 'mrp',
    checkType: 'numeric',
    severity: 'minor', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Show the MRP as a clear numeric amount in Indian currency.',
  },
  {
    id: 'label-mrp-tax', name: 'MRP inclusive of all taxes', field: 'mrp_inclusive_of_taxes',
    checkType: 'declared_true',
    severity: 'major', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'State that the MRP is inclusive of all taxes.',
  },
  {
    id: 'label-responsible-business', name: 'Manufacturer / packer / importer declared', field: 'manufacturer_name',
    severity: 'major', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Declare the responsible manufacturer, packer or importer and address.',
  },
  {
    id: 'label-pin', name: 'Six-digit PIN code present', field: 'pin_code',
    checkType: 'pin',
    severity: 'minor', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Include the relevant six-digit postal PIN code.',
  },
  {
    id: 'label-date', name: 'Manufacture / packing date declared', field: 'manufacturing_date',
    severity: 'minor', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Add the applicable month/year or date of manufacture or packing.',
  },
  {
    id: 'label-date-format', name: 'Manufacture date uses a recognizable format', field: 'manufacturing_date',
    checkType: 'date',
    severity: 'minor', applies: 'all', source: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    fix: 'Use a clear date or month/year declaration.',
  },
  {
    id: 'food-fssai', name: 'FSSAI licence number has 14 digits', field: 'fssai_license',
    checkType: 'license',
    severity: 'critical', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Display the valid 14-digit FSSAI licence number.',
  },
  {
    id: 'food-veg-mark', name: 'Vegetarian / non-vegetarian mark declared', field: 'veg_nonveg',
    checkType: 'veg_mark',
    severity: 'minor', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Add the applicable vegetarian or non-vegetarian mark.',
  },
  {
    id: 'food-date', name: 'Best-before / expiry information declared', field: 'expiry_date',
    severity: 'major', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Declare the applicable best-before, use-by or expiry information.',
  },
  {
    id: 'food-date-sequence', name: 'Expiry date follows manufacture date', field: 'expiry_date',
    checkType: 'date_sequence',
    severity: 'major', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Confirm that a legible expiry date falls after the manufacture or packing date.',
  },
  {
    id: 'food-ingredients', name: 'Ingredients declaration present', field: 'ingredients',
    severity: 'major', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Add an ingredients list in descending order of composition.',
  },
  {
    id: 'food-allergen', name: 'Allergen information present', field: 'allergens',
    severity: 'minor', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Declare applicable allergen information or cross-contact warning.',
  },
  {
    id: 'food-nutrition', name: 'Nutrition information present', field: 'nutrition_info',
    severity: 'minor', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Add the applicable nutrition information panel.',
  },
  {
    id: 'food-fssai-logo', name: 'FSSAI logo / mark detected', field: 'fssai_logo',
    severity: 'minor', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Ensure the FSSAI logo and licence details are displayed where applicable.',
  },
  {
    id: 'food-best-before-wording', name: 'Best-before / use-by wording detected', field: 'best_before_wording',
    severity: 'minor', applies: 'food', source: 'FSSAI Labelling and Display Regulations, 2020',
    fix: 'Use a clear best-before, use-by or expiry date-marking statement.',
  },
]

export const DISCLAIMER = 'Decision-support tool for preliminary checks. Final verification rests with authorised officials.'
