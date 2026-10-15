from typing import Any

from .extraction import extract_fields
from .ocr import OCRResult, TesseractOCR
from .rule_engine import evaluate_rules, summarize_results


class Analyzer:
    def __init__(self, ocr: Any | None = None):
        self.ocr = ocr or TesseractOCR()

    def analyze(
        self,
        image_bytes: bytes,
        is_food: bool,
        synthetic_text: str | None = None,
    ) -> dict[str, Any]:
        if synthetic_text is None:
            ocr_result = self.ocr.extract(image_bytes)
            confidence_source = "live_ocr"
        else:
            ocr_result = OCRResult(text=synthetic_text, confidence=0.98, ambiguous=False)
            confidence_source = "synthetic_fixture_transcription"
        fields = extract_fields(ocr_result)
        rule_fields = {
            key: {
                "value": field.value,
                "confidence": field.confidence,
                "ambiguous": field.ambiguous,
            }
            for key, field in fields.items()
        }
        results = evaluate_rules(rule_fields, is_food, ocr_result.confidence)
        overall_status, compliance_score = summarize_results(results)
        return {
            "overall_status": overall_status,
            "compliance_score": compliance_score,
            "ocr_confidence": ocr_result.confidence,
            "confidence_source": confidence_source,
            "is_food": is_food,
            "extracted_fields": {
                key: {
                    "value": field.value,
                    "confidence": field.confidence,
                    "ambiguous": field.ambiguous,
                }
                for key, field in fields.items()
            },
            "rule_results": results,
            "raw_text": ocr_result.text,
        }
