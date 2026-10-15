import json
import os
import sqlite3
from contextlib import asynccontextmanager
from contextlib import closing
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


DEFAULT_DATABASE = Path(__file__).resolve().parents[1] / "data" / "reports.db"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DATABASE)))
ALLOWED_STATUSES = {"COMPLIANT", "NON_COMPLIANT", "NEEDS_REVIEW"}
def connect_database() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=15)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with closing(connect_database()) as connection, connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                overall_status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                report_json TEXT NOT NULL
            )
            """
        )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="Code Alpha Compliance API",
    description="Persistent report storage for the browser-based compliance checker.",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/reports", status_code=201)
def save_report(report: dict[str, Any]) -> dict[str, str]:
    report_id = report.get("id")
    status = report.get("overall_status")
    if not isinstance(report_id, str) or not report_id.strip():
        raise HTTPException(status_code=422, detail="Report id is required.")
    if not isinstance(status, str) or status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail="Report status is invalid.")
    rules = report.get("rule_results", [])
    if not isinstance(rules, list) or any(not isinstance(rule, dict) for rule in rules):
        raise HTTPException(status_code=422, detail="Report rule results are invalid.")
    if len(json.dumps(report, ensure_ascii=False)) > 2_000_000:
        raise HTTPException(status_code=413, detail="Report exceeds the 2 MB storage limit.")

    created_at = report.get("created_at")
    if not isinstance(created_at, str):
        raise HTTPException(status_code=422, detail="Report creation time is required.")

    stored_report = {**report, "image_url": ""}
    with closing(connect_database()) as connection, connection:
        connection.execute(
            """
            INSERT INTO reports (id, overall_status, created_at, report_json)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                overall_status = excluded.overall_status,
                created_at = excluded.created_at,
                report_json = excluded.report_json
            """,
            (report_id, status, created_at, json.dumps(stored_report, ensure_ascii=False)),
        )
    return {"id": report_id, "status": "saved"}


@app.get("/api/reports")
def list_reports(
    status: str | None = None,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    if status and status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail="Report status filter is invalid.")

    with closing(connect_database()) as connection, connection:
        rows = connection.execute(
            "SELECT id, overall_status, created_at, report_json FROM reports ORDER BY created_at DESC"
        ).fetchall()

    reports = [json.loads(row["report_json"]) for row in rows]
    counts = {status_name: 0 for status_name in ALLOWED_STATUSES}
    failed_rules: dict[str, dict[str, Any]] = {}
    for report in reports:
        counts[report["overall_status"]] += 1
        for rule in report.get("rule_results", []):
            if rule.get("status") != "FAIL":
                continue
            rule_id = rule.get("rule_id", "unknown")
            current = failed_rules.setdefault(
                rule_id,
                {"rule_id": rule_id, "name": rule.get("name", rule_id), "count": 0},
            )
            current["count"] += 1

    filtered = [
        report for report in reports
        if not status or report["overall_status"] == status
    ]
    items = [
        {key: value for key, value in report.items() if key != "raw_text"}
        for report in filtered[offset : offset + limit]
    ]
    return {
        "items": items,
        "total": len(filtered),
        "stats": counts,
        "top_failed_rules": sorted(
            failed_rules.values(), key=lambda rule: rule["count"], reverse=True
        )[:5],
    }


@app.get("/api/reports/{report_id}")
def get_report(report_id: str) -> dict[str, Any]:
    with closing(connect_database()) as connection, connection:
        row = connection.execute(
            "SELECT report_json FROM reports WHERE id = ?", (report_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found.")
    return json.loads(row["report_json"])


@app.delete("/api/reports")
def delete_reports() -> dict[str, int]:
    with closing(connect_database()) as connection, connection:
        cursor = connection.execute("DELETE FROM reports")
        deleted = cursor.rowcount
    return {"deleted": deleted}
