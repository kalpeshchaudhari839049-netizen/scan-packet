# Code Alpha backend

FastAPI service for local, OCR-assisted packaged-commodity label screening. It stores reports in SQLite, serves validated uploads and bundled synthetic examples, exposes declarative screening rules, and can generate a downloadable PDF report.

## Run locally

From the workspace root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`. The default Vite origins `http://localhost:5173` and `http://127.0.0.1:5173` are allowed. Configure `DATABASE_URL` to override the default SQLite database (`backend/scans.db`).

### OCR system dependency

Install the Tesseract OCR executable separately and ensure `tesseract` is on `PATH` (for example, install the Tesseract package for your OS). `pytesseract` is only its Python wrapper. When Tesseract is absent or fails, `/api/analyze` for uploaded images returns HTTP 503 with an explicit diagnostic and does not save or fabricate an analysis. Demo reports instead use the bundled synthetic transcriptions explicitly labeled as such; they do not imply a live OCR scan. The rule evaluator itself treats low-confidence and missing/uncertain field evidence as `NEEDS_REVIEW`.

## API

- `POST /api/analyze`: multipart `file` (JPG/PNG, at most 5 MiB) and optional `is_food`, or `demo_id` with no uploaded file. Returns the frontend-compatible report object. Uploaded images are stored under `backend/uploads/` with generated names and served at `/uploads/{filename}`.
- `POST /api/revalidate`: JSON `{"id":"<report id>","extracted_fields":{"mrp":{"value":"12.00","confidence":1.0}}}`. Re-evaluates and persists editable fields using the same rules; plain field values are also accepted.
- `GET /api/reports`: `{items,total,stats,top_failed_rules}` history and aggregate status counts; supports `limit` and `offset`.
- `GET /api/reports/{id}` and `GET /api/reports/{id}/pdf`.
- `GET /api/rules`, `GET /api/health`.
- `GET /api/demo-labels` lists fixture metadata and `image_url`; `GET /api/demo-labels/{id}/image` serves each generated fixture. Submit a returned demo `id` to `/api/analyze` to analyze its bundled generated image and bundled, clearly identified synthetic transcription. This mode runs the same field extraction and JSON-driven rule evaluator without requiring Tesseract; `confidence_source` is `synthetic_fixture_transcription` and `raw_text` is the fixture transcription, not OCR. `expected_status` documents the intended scenario only; the report status is calculated by loading and evaluating `rules.json`.

## Rules and interpretation

`backend/rules.json` is the sole source of rule definitions. The generic evaluator supports declarative `present`, `regex`, `equals`, `equals_field`, `number_between`, and `date_after_field` checks and food/non-food classification. Rule statuses are `PASS`, `FAIL`, `NEEDS_REVIEW`, or `SKIPPED`; report statuses remain `COMPLIANT`, `NON_COMPLIANT`, or `NEEDS_REVIEW`. Compliance score is a fraction from 0 to 1. The sample rules reference the Legal Metrology Act, 2009; Legal Metrology (Packaged Commodities) Rules, 2011, as amended; and, for food labels only, the Food Safety and Standards (Labelling and Display) Regulations, 2020. They demonstrate declaration presence/format/consistency screening, recognized quantity units, 14-digit FSSAI numbers, six-digit Indian PIN codes, and MRP inclusive of all taxes.

**Legal and operational caveats:** these are illustrative demo screening checks, not a legal opinion, authoritative rules database, compliance certification, or substitute for verifying current consolidated legislation, applicability, product-specific exemptions, declarations, source image, and OCR output. A missing OCR match is not proof that the label omits the declaration. Review flagged and uncertain fields manually. Results depend on image quality and Tesseract's installed language data. This local demo has no authentication, rate limiting, retention controls, or production deployment hardening; do not expose it publicly or upload sensitive material.

## Tests

From the workspace root run `pytest backend\tests -q`. Tests inject/mimic OCR and do not require an installed Tesseract executable.
