# Code Alpha — AI-Based Compliance Checker

A local Smart India Hackathon 2026 demo for scanning a packaged-product label, extracting visible declarations, and checking them against configurable rule-engine guidance.

## Run locally (Windows / PowerShell)

Prerequisites: Node.js 20.19+ (or 22.12+) and npm. The primary React app runs without Python, a backend, or a separate Tesseract installation.

1. Install frontend dependencies:

   ```powershell
   npm install --prefix frontend
   ```

2. Start the frontend:

   ```powershell
   npm --prefix frontend run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173). Vite prepares the local OCR worker and bundled English, Hindi, and Marathi language files automatically.

To create a static hosted build, run `npm --prefix frontend run build`; the worker, WebAssembly core, and language data are copied into `frontend\dist\ocr`. Images are processed locally in the browser and are not sent to an API.

## What is included

- Drag-and-drop, file-picker, and mobile camera JPG/PNG uploads; local image preprocessing and English/Hindi/Marathi OCR.
- Editable extracted fields and repeatable rule-engine validation.
- Configurable client-side rules and evidence-linked findings.
- Browser-local scan history, status charts, clickable reports, and clear-history control.
- JSON/PDF reports, summary copy, batch checks with CSV export, and three sample labels.
- Dark/light mode and a responsive React + Tailwind frontend.

## Important limitations

This is a demo screening aid, not a legal determination, certification, or substitute for an authorized inspector. Rule entries are configurable examples; confirm every requirement, amendment, applicability condition, and prescribed method against current authoritative Legal Metrology and FSSAI publications before operational use. OCR can omit or misread small, obscured, or low-quality text; review extracted evidence and route ambiguous cases for human review.

Reports are saved in browser `localStorage`; clearing browser storage removes them. OCR models and the WebAssembly worker are distributed with the static app build. The project retains optional FastAPI backend modules, but the primary scan, result, rules, demo, and history flows do not depend on them.
