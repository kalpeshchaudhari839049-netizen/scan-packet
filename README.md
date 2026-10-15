# Code Alpha — AI-Based Compliance Checker

A Smart India Hackathon 2026 demo for scanning a packaged-product label, extracting visible declarations, and checking them against configurable rule-engine guidance. OCR and rule evaluation run in the browser; an optional FastAPI service stores reports for deployment.

## Run locally (Windows / PowerShell)

Prerequisites: Node.js 20.19+ (or 22.12+) and npm. The frontend works locally without a backend or separate Tesseract installation. Python 3.10+ is required only to run the optional report API.

1. Install frontend dependencies:

   ```powershell
   npm install --prefix frontend
   ```

2. Start the frontend:

   ```powershell
   npm run dev
   ```

   To persist reports through the API, open a second terminal and start the backend:

   ```powershell
   python -m pip install -r backend/requirements.txt
   npm run dev:api
   ```

   In the frontend terminal, configure the API before starting Vite:

   ```powershell
   $env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173). Vite prepares the local OCR worker and bundled English, Hindi, and Marathi language files automatically. Without `VITE_API_BASE_URL`, reports remain in browser storage.

## Deploy to Render

The root `render.yaml` defines a static frontend and a FastAPI web service. Connect the repository to Render and deploy the Blueprint. The API uses a persistent disk at `/var/data` for SQLite reports. The static frontend is built with `VITE_API_BASE_URL` pointing to the API service.

For manual deployments, set `DATABASE_PATH` to a persistent disk path and `CORS_ORIGINS` to the exact frontend origin. Set `VITE_API_BASE_URL` at frontend build time to the API origin. The API exposes `/api/health`, `POST /api/reports`, `GET /api/reports`, `GET /api/reports/{id}`, and `DELETE /api/reports`.

## What is included

- Drag-and-drop, file-picker, and mobile camera JPG/PNG uploads; local image preprocessing and English/Hindi/Marathi OCR.
- Editable extracted fields and repeatable rule-engine validation.
- Configurable client-side rules and evidence-linked findings.
- Browser-local scan history with optional API persistence, status charts, clickable reports, and clear-history control.
- JSON/PDF reports, summary copy, batch checks with CSV export, and three sample labels.
- Dark/light mode and a responsive React + Tailwind frontend.

## Important limitations

This is a demo screening aid, not a legal determination, certification, or substitute for an authorized inspector. Rule entries are configurable examples; confirm every requirement, amendment, applicability condition, and prescribed method against current authoritative Legal Metrology and FSSAI publications before operational use. OCR can omit or misread small, obscured, or low-quality text; review extracted evidence and route ambiguous cases for human review.

OCR models and the WebAssembly worker are distributed with the static app build. Label images are OCR-processed locally and are not uploaded; report JSON is sent to the API only when `VITE_API_BASE_URL` is configured. The API is a shared demo service without user authentication, so do not store sensitive reports or use it as a production system without adding access control.
