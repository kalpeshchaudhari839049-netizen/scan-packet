from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from backend.app.main import app
from backend.app.pipeline.extraction import extract_fields
from backend.app.pipeline.ocr import OCRResult
from backend.app.pipeline.rule_engine import evaluate_rules


class MockOCR:
    def extract(self, _image_bytes: bytes) -> OCRResult:
        return OCRResult(
            text=(
                "PRODUCT NAME: Sample Rice NET QUANTITY: 1 kg MRP Rs 55.00 "
                "inclusive of all taxes MFD BY Example Foods MFG 01/01/2025 "
                "FSSAI License No 12345678901234 PIN 560001 EXP 01/01/2027"
            ),
            confidence=0.96,
        )


def png_bytes() -> bytes:
    image = Image.new("RGB", (640, 480), "white")
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def client(monkeypatch, tmp_path):
    monkeypatch.setattr("backend.app.main.UPLOAD_DIR", tmp_path / "uploads")
    (tmp_path / "uploads").mkdir()
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from backend.app.database import Base, get_db

    test_engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(test_engine)
    test_session = sessionmaker(bind=test_engine, expire_on_commit=False)

    def override_db():
        db = test_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.state.analyzer = type(
        "MockAnalyzer",
        (),
        {
            "analyze": lambda self, image_bytes, is_food, synthetic_text=None: __import__(
                "backend.app.pipeline.analyzer", fromlist=["Analyzer"]
            ).Analyzer(MockOCR()).analyze(image_bytes, is_food, synthetic_text=synthetic_text)
        },
    )()
    return TestClient(app)


def test_rule_engine_supports_declared_checks_and_uncertainty():
    rules = [
        {
            "id": "check",
            "name": "Declarative format",
            "severity": "high",
            "checks": [{"field": "code", "operator": "regex", "pattern": "[0-9]{6}"}],
            "guidance": "Check format.",
            "legal_source": "Demo",
        }
    ]
    compliant = evaluate_rules({"code": {"value": "560001", "confidence": 0.9}}, False, 0.9, rules)
    invalid = evaluate_rules({"code": {"value": "56001", "confidence": 0.9}}, False, 0.9, rules)
    uncertain = evaluate_rules({"code": {"value": "560001", "confidence": 0.2}}, False, 0.9, rules)
    assert [r["status"] for r in (compliant[0], invalid[0], uncertain[0])] == [
        "PASS",
        "FAIL",
        "NEEDS_REVIEW",
    ]
    status, score = __import__(
        "backend.app.pipeline.rule_engine", fromlist=["summarize_results"]
    ).summarize_results(compliant)
    assert status == "COMPLIANT" and score == 1.0


def test_frontend_field_contract_has_empty_values_when_not_detected():
    fields = extract_fields(OCRResult(text="unrelated text", confidence=0.9))
    expected_keys = {
        "product_name", "manufacturer_name", "manufacturer_address", "manufacturer_pin",
        "manufacturer_pin_code", "packer_name", "packer_address", "packer_pin",
        "importer_name", "importer_address", "importer_pin", "net_quantity", "mrp",
        "mrp_text", "manufacture_date", "month_year", "expiry_date", "best_before",
        "consumer_care", "country_of_origin", "fssai_number", "veg_nonveg",
        "ingredients", "nutritional_info",
    }
    assert expected_keys <= fields.keys()
    assert all(fields[key].value == "" and fields[key].confidence == 0 for key in expected_keys)


def test_quantity_normalization_and_date_consistency_checks():
    from backend.app.pipeline.rule_engine import _evaluate_check

    fields = extract_fields(
        OCRResult(text="NET QUANTITY: 500ML MFG 03/2025", confidence=0.9)
    )
    assert fields["net_quantity"].value == "500 ml"
    assert fields["manufacturing_date"].value == "03/2025"

    check = {
        "field": "expiry_date",
        "operator": "date_after_field",
        "other_field": "manufacturing_date",
    }
    assert _evaluate_check(
        check, {"expiry_date": "01/04/2025", "manufacturing_date": "03/2025"}
    ) is True
    assert _evaluate_check(
        check, {"expiry_date": "01/02/2025", "manufacturing_date": "03/2025"}
    ) is False
    assert _evaluate_check(check, {"expiry_date": "", "manufacturing_date": "03/2025"}) is None


def test_image_preprocessing_resizes_and_returns_binary_image():
    import numpy as np

    from backend.app.pipeline.image_processing import prepare_image

    processed = prepare_image(png_bytes())
    assert processed.ndim == 2
    assert max(processed.shape) == 1600
    assert set(np.unique(processed)) <= {0, 255}


def test_api_analyze_persistence_revalidation_history_and_pdf(monkeypatch, tmp_path):
    with client(monkeypatch, tmp_path) as api:
        response = api.post(
            "/api/analyze",
            files={"file": ("synthetic.png", png_bytes(), "image/png")},
            data={"is_food": "true"},
        )
        assert response.status_code == 200, response.text
        report = response.json()
        assert report["overall_status"] == "COMPLIANT"
        assert 0 <= report["compliance_score"] <= 1
        assert report["is_food"] is True
        assert report["extracted_fields"]["fssai_license"]["value"] == "12345678901234"
        assert report["extracted_fields"]["fssai_number"]["value"] == "12345678901234"
        assert {item["status"] for item in report["rule_results"]} <= {
            "PASS", "FAIL", "NEEDS_REVIEW", "SKIPPED"
        }
        assert api.get(report["image_url"]).status_code == 200

        history = api.get("/api/reports").json()
        assert history["total"] == 1
        assert history["stats"]["COMPLIANT"] == 1
        edited = dict(report["extracted_fields"])
        edited["mrp"] = {"value": "bad", "confidence": 1.0}
        updated = api.post("/api/revalidate", json={"id": report["id"], "extracted_fields": edited})
        assert updated.status_code == 200
        assert updated.json()["overall_status"] == "NON_COMPLIANT"
        assert any(item["status"] == "FAIL" for item in updated.json()["rule_results"])
        assert api.get(f"/api/reports/{report['id']}").json()["extracted_fields"]["mrp"]["value"] == "bad"
        assert api.get(f"/api/reports/{report['id']}/pdf").content.startswith(b"%PDF")


def test_upload_validation_and_demo_catalog(monkeypatch, tmp_path):
    with client(monkeypatch, tmp_path) as api:
        invalid = api.post("/api/analyze", files={"file": ("bad.png", b"not an image", "image/png")})
        assert invalid.status_code == 400
        oversized = api.post(
            "/api/analyze",
            files={"file": ("large.png", b"x" * (5 * 1024 * 1024 + 1), "image/png")},
        )
        assert oversized.status_code == 400
        assert "5 MB" in oversized.json()["detail"]
        demos = api.get("/api/demo-labels").json()["demos"]
        assert len(demos) == 3
        assert all(item["image_url"].startswith("/api/demo-labels/") for item in demos)
        assert api.get(demos[0]["image_url"]).status_code == 200
        assert api.get("/api/health").json() == {"status": "ok"}


def test_missing_tesseract_returns_explicit_error_without_persisting(monkeypatch, tmp_path):
    from backend.app.pipeline.ocr import OCRUnavailableError

    with client(monkeypatch, tmp_path) as api:
        class UnavailableAnalyzer:
            def analyze(self, _image_bytes, _is_food):
                raise OCRUnavailableError("Tesseract OCR is not installed.")

        app.state.analyzer = UnavailableAnalyzer()
        response = api.post(
            "/api/analyze",
            files={"file": ("synthetic.png", png_bytes(), "image/png")},
        )
        assert response.status_code == 503
        assert "Tesseract OCR is not installed" in response.json()["detail"]
        assert api.get("/api/reports").json()["total"] == 0


def test_demo_analysis_uses_bundled_transcription_and_aliases_revalidate(monkeypatch, tmp_path):
    from backend.app.pipeline.ocr import OCRUnavailableError

    with client(monkeypatch, tmp_path) as api:
        class NoOCRAnalyzer:
            def analyze(self, _image_bytes, _is_food, synthetic_text=None):
                if synthetic_text is None:
                    raise OCRUnavailableError("Tesseract OCR is not installed.")
                from backend.app.pipeline.analyzer import Analyzer

                return Analyzer(MockOCR()).analyze(
                    _image_bytes, _is_food, synthetic_text=synthetic_text
                )

        app.state.analyzer = NoOCRAnalyzer()
        demos = api.get("/api/demo-labels").json()["demos"]
        assert "synthetic_transcription" not in demos[0]
        report = api.post("/api/analyze", data={"demo_id": demos[0]["id"]}).json()
        assert report["is_demo"] is True
        assert report["confidence_source"] == "synthetic_fixture_transcription"
        assert "PRODUCT NAME: Sample Rice" in report["raw_text"]
        assert report["overall_status"] == demos[0]["expected_status"]
        for demo in demos[1:]:
            result = api.post("/api/analyze", data={"demo_id": demo["id"]}).json()
            assert result["overall_status"] == demo["expected_status"]
        edited = dict(report["extracted_fields"])
        edited["fssai_number"] = {"value": "123", "confidence": 1.0}
        edited["manufacture_date"] = {"value": "not-a-date", "confidence": 1.0}
        updated = api.post(
            "/api/revalidate", json={"id": report["id"], "extracted_fields": edited}
        ).json()
        assert updated["extracted_fields"]["fssai_license"]["value"] == "123"
        assert updated["extracted_fields"]["manufacturing_date"]["value"] == "not-a-date"
        failed_ids = {rule["rule_id"] for rule in updated["rule_results"] if rule["status"] == "FAIL"}
        assert "food-fssai-license" in failed_ids
        assert "label-date" in failed_ids
