from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def create_pdf(report: dict) -> bytes:
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    width, height = letter
    y = height - 48

    def line(text: str, size: int = 10):
        nonlocal y
        if y < 52:
            pdf.showPage()
            y = height - 48
        pdf.setFont("Helvetica", size)
        safe_text = text.encode("latin-1", "replace").decode("latin-1")
        pdf.drawString(42, y, safe_text[:110])
        y -= size + 7

    line("Code Alpha — Packaged Commodities Screening Report", 15)
    line(f"Report: {report['id']}    Created: {report['created_at']}")
    line(f"File: {report['original_filename']}")
    line(f"Status: {report['overall_status']}    Score: {report['compliance_score']:.0%}")
    line(f"OCR confidence: {report['ocr_confidence']:.0%}    Food: {report['is_food']}")
    line("Extracted fields", 12)
    for key, field in report["extracted_fields"].items():
        line(f"{key}: {field.get('value')} (confidence {field.get('confidence', 0):.0%})")
    line("Rule results", 12)
    for item in report["rule_results"]:
        line(f"{item['status']} — {item['name']}: {item['message']}")
        line(f"  Legal source: {item['legal_source']}")
    line("Demo screening only; not legal advice or a certification of compliance.", 9)
    pdf.save()
    return output.getvalue()
