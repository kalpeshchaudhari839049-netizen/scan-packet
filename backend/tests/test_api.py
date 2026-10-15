from fastapi.testclient import TestClient

from backend.app import main


def test_report_storage_and_dashboard_summary(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DATABASE_PATH", tmp_path / "reports.db")
    report = {
        "id": "test-report",
        "overall_status": "NEEDS_REVIEW",
        "created_at": "2026-10-15T00:00:00+00:00",
        "filename": "label.png",
        "raw_text": "private OCR text",
        "rule_results": [
            {"rule_id": "label-mrp", "name": "MRP present", "status": "FAIL"}
        ],
    }

    with TestClient(main.app) as client:
        saved = client.post("/api/reports", json=report)
        assert saved.status_code == 201

        history = client.get("/api/reports").json()
        assert history["total"] == 1
        assert history["stats"]["NEEDS_REVIEW"] == 1
        assert history["top_failed_rules"][0]["rule_id"] == "label-mrp"
        assert "raw_text" not in history["items"][0]

        fetched = client.get("/api/reports/test-report")
        assert fetched.status_code == 200
        assert fetched.json()["raw_text"] == "private OCR text"

        deleted = client.delete("/api/reports")
        assert deleted.status_code == 200
        assert client.get("/api/reports").json()["total"] == 0


def test_report_validation(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DATABASE_PATH", tmp_path / "reports.db")

    with TestClient(main.app) as client:
        response = client.post("/api/reports", json={"id": "invalid"})

    assert response.status_code == 422
