export const SAMPLE_LABELS = [
  {
    id: 'sample-food',
    title: 'Sample food label',
    isFood: true,
    text: `PRODUCT NAME: Sample Wheat Flour
NET WT: 1 kg
MRP ₹120 inclusive of all taxes
Manufactured by: Alpha Foods, 10 Example Road, Pune PIN 411001
Mfd: 03/2025
Best Before: 12 months from packing
FSSAI Licence No: 12345678901234
Vegetarian
Ingredients: Whole wheat flour
Nutrition Information: Energy 340 kcal
Contains wheat (gluten)
Customer care: 1800 123 4567 support@example.in`,
  },
  {
    id: 'sample-incomplete',
    title: 'Sample label needing review',
    isFood: true,
    text: `PRODUCT NAME: Sample Snack
Net Qty: 200 g
MRP Rs 80
Packed by: Alpha Foods, Pune
Mfd 03/2025
FSSAI 12345678901234`,
  },
  {
    id: 'sample-nonfood',
    title: 'Sample non-food label',
    isFood: false,
    text: `PRODUCT NAME: Sample Household Item
Net Content: 2 pieces
Max Retail Price: Rs 120
Marketed by: Alpha Trading, Pune PIN 411001
Packed on: 03/2025
Toll free: 1800 123 4567`,
  },
]
