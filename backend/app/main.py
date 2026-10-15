import json
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .database import ScanReport, create_tables, get_db
from .pipeline.analyzer import Analyzer
from .pipeline.ocr import OCRUnavailableError
from .pipeline.pdf_report import create_pdf
from .pipeline.rule_engine import evaluate_rules, load_rules, summarize_results
from .pipeline.upload_validation import MAX_UPLOAD_BYTES, InvalidImageError, validate_image

BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploads"
DEMO_DIR = BACKEND_DIR / "demo_labels"
DEMO_CATALOG_PATH = DEMO_DIR / "catalog.json"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DEMO_DIR.mkdir(parents=True, exist_ok=True)
DEMO_CATALOG = json.loads(DEMO_CATALOG_PATH.read_text(encoding="utf-8"))

@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="Code Alpha Packaged Commodities Screening API",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.analyzer = Analyzer()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _created(report: ScanReport) -> str:
    value = report.created_at
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _serialize(report: ScanReport) -> dict[str, Any]:
    return {
        "id": report.id,
        "filename": report.filename,
        "original_filename": report.original_filename,
        "overall_status": report.overall_status,
        "compliance_score": report.compliance_score,
        "ocr_confidence": report.ocr_confidence,
        "is_food": report.is_food,
        "extracted_fields": report.extracted_fields,
        "rule_results": report.rule_results,
        "raw_text": report.raw_text,
        "is_demo": report.is_demo,
        "confidence_source": report.confidence_source,
        "created_at": _created(report),
        "image_url": f"/uploads/{report.filename}",
    }


def _store_report(
    db: Session,
    image_bytes: bytes,
    original_filename: str,
    is_food: bool,
    is_demo: bool,
    synthetic_text: str | None = None,
) -> dict[str, Any]:
    try:
        if synthetic_text is None:
            analysis = app.state.analyzer.analyze(image_bytes, is_food)
        else:
            analysis = app.state.analyzer.analyze(
                image_bytes, is_food, synthetic_text=synthetic_text
            )
    except OCRUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    extension = ".png" if image_bytes.startswith(b"\x89PNG\r\n\x1a\n") else ".jpg"
    stored_name = f"{uuid.uuid4().hex}{extension}"
    (UPLOAD_DIR / stored_name).write_bytes(image_bytes)
    report = ScanReport(
        id=str(uuid.uuid4()),
        filename=stored_name,
        original_filename=Path(original_filename).name[:255] or "upload",
        upload_path=str(UPLOAD_DIR / stored_name),
        overall_status=analysis["overall_status"],
        compliance_score=analysis["compliance_score"],
        ocr_confidence=analysis["ocr_confidence"],
        is_food=is_food,
        extracted_fields=analysis["extracted_fields"],
        rule_results=analysis["rule_results"],
        raw_text=analysis["raw_text"],
        is_demo=is_demo,
        confidence_source=analysis["confidence_source"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _serialize(report)


async def _read_limited_upload(upload: UploadFile) -> bytes:
    chunks = []
    size = 0
    while chunk := await upload.read(64 * 1024):
        size += len(chunk)
        if size > MAX_UPLOAD_BYTES:
            raise InvalidImageError("Image must be 5 MB or smaller.")
        chunks.append(chunk)
    return b"".join(chunks)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/uploads/{filename}")
def uploaded_image(filename: str) -> Response:
    if not re.fullmatch(r"[a-f0-9]{32}\.(?:jpg|png)", filename):
        raise HTTPException(status_code=404, detail="Image not found.")
    image_path = UPLOAD_DIR / filename
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")
    mime = "image/png" if image_path.suffix == ".png" else "image/jpeg"
    return Response(image_path.read_bytes(), media_type=mime)


@app.get("/api/rules")
def rules() -> dict[str, Any]:
    return {"rules": load_rules()}


@app.get("/api/demo-labels")
def demo_labels() -> dict[str, list[dict[str, Any]]]:
    return {
        "demos": [
            {
                **{
                    key: value
                    for key, value in demo.items()
                    if key not in {"filename", "synthetic_transcription"}
                },
                "image_url": f"/api/demo-labels/{demo['id']}/image",
            }
            for demo in DEMO_CATALOG
        ]
    }


@app.get("/api/demo-labels/{demo_id}/image")
def demo_image(demo_id: str) -> Response:
    demo = next((item for item in DEMO_CATALOG if item["id"] == demo_id), None)
    if not demo:
        raise HTTPException(status_code=404, detail="Demo label not found.")
    image_path = DEMO_DIR / demo["filename"]
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Demo image is missing.")
    mime = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
    return Response(image_path.read_bytes(), media_type=mime)


@app.post("/api/analyze")
async def analyze(
    file: UploadFile | None = File(default=None),
    is_food: bool = Form(default=False),
    demo_id: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if demo_id:
        demo = next((item for item in DEMO_CATALOG if item["id"] == demo_id), None)
        if not demo:
            raise HTTPException(status_code=404, detail="Demo label not found.")
        image_path = DEMO_DIR / demo["filename"]
        image_bytes = image_path.read_bytes()
        validation_name = demo["filename"]
        is_food = demo["is_food"]
        original_filename = demo["label"]
        is_demo = True
        synthetic_text = demo["synthetic_transcription"]
    elif file is not None:
        try:
            image_bytes = await _read_limited_upload(file)
        except InvalidImageError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        validation_name = file.filename or "upload.jpg"
        original_filename = validation_name
        is_demo = False
        synthetic_text = None
    else:
        raise HTTPException(status_code=422, detail="Provide an image file or a demo_id.")
    try:
        validate_image(image_bytes, validation_name)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _store_report(
        db, image_bytes, original_filename, is_food, is_demo, synthetic_text=synthetic_text
    )


@app.post("/api/revalidate")
def revalidate(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    report_id = payload.get("id") or payload.get("report_id")
    if not report_id:
        raise HTTPException(status_code=422, detail="A report id is required.")
    report = db.get(ScanReport, str(report_id))
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    submitted_fields = payload.get("extracted_fields", payload.get("fields"))
    if not isinstance(submitted_fields, dict):
        raise HTTPException(status_code=422, detail="Provide extracted_fields as an object.")
    # Keep the established {field: {value, confidence}} frontend shape.
    updated_fields = {}
    for key, entry in submitted_fields.items():
        if isinstance(entry, dict):
            updated_fields[key] = {
                "value": entry.get("value"),
                "confidence": entry.get("confidence", 1.0),
                "ambiguous": entry.get("ambiguous", False),
            }
        else:
            updated_fields[key] = {"value": entry, "confidence": 1.0, "ambiguous": False}
    aliases = {
        "fssai_number": "fssai_license",
        "manufacture_date": "manufacturing_date",
        "manufacturer_pin": "pin_code",
        "manufacturer_pin_code": "pin_code",
    }
    for alias, canonical in aliases.items():
        if alias in submitted_fields:
            updated_fields[canonical] = updated_fields[alias]
    results = evaluate_rules(updated_fields, report.is_food, report.ocr_confidence)
    status, score = summarize_results(results)
    report.extracted_fields = updated_fields
    report.rule_results = results
    report.overall_status = status
    report.compliance_score = score
    db.commit()
    db.refresh(report)
    return _serialize(report)


@app.get("/api/reports")
def reports(
    limit: int = 50, offset: int = 0, db: Session = Depends(get_db)
) -> dict[str, Any]:
    limit = max(1, min(limit, 100))
    all_reports = db.query(ScanReport).order_by(desc(ScanReport.created_at)).all()
    counts = {status: 0 for status in ("COMPLIANT", "NON_COMPLIANT", "NEEDS_REVIEW")}
    failed_rules: dict[str, dict[str, Any]] = {}
    for report in all_reports:
        counts[report.overall_status] = counts.get(report.overall_status, 0) + 1
        for result in report.rule_results:
            if result["status"] == "FAIL":
                record = failed_rules.setdefault(
                    result["rule_id"], {"rule_id": result["rule_id"], "name": result["name"], "count": 0}
                )
                record["count"] += 1
    top_failed_rules = sorted(failed_rules.values(), key=lambda item: (-item["count"], item["rule_id"]))[:5]
    return {
        "items": [_serialize(report) for report in all_reports[offset : offset + limit]],
        "total": len(all_reports),
        "stats": counts,
        "top_failed_rules": top_failed_rules,
    }


@app.get("/api/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    report = db.get(ScanReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    return _serialize(report)


@app.get("/api/reports/{report_id}/pdf")
def report_pdf(report_id: str, db: Session = Depends(get_db)) -> Response:
    report = db.get(ScanReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    pdf = create_pdf(_serialize(report))
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.pdf"'},
    )
