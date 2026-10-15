import re
from dataclasses import dataclass

from .ocr import OCRResult

FIELD_PATTERNS = {
    "mrp": re.compile(
        r"\bMRP\b\s*(?:\(?(?:Rs\.?|INR|₹)\)?\s*)?(?:[:\-]\s*)?(?:Rs\.?|INR|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)",
        re.IGNORECASE,
    ),
    "fssai_license": re.compile(
        r"\bFSSAI\b.{0,35}?(?:licen[cs]e|no\.?|number)?\s*[:#\-]?\s*(\d{14})",
        re.IGNORECASE,
    ),
    "pin_code": re.compile(
        r"\b(?:PIN|PIN\s*CODE|POSTAL\s*CODE)\b\s*[:#\-]?\s*(\d{6})",
        re.IGNORECASE,
    ),
    "net_quantity": re.compile(
        r"\b(?:NET\s*(?:QTY|QUANTITY|CONTENTS?)|QUANTITY)\b\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:kg|g|mg|l|ml|litre|liter|pcs?|pieces?))",
        re.IGNORECASE,
    ),
    "manufacturing_date": re.compile(
        r"\b(?:MFG|MFD|MANUFACTURED\s*ON|DATE\s*OF\s*MANUFACTURE)\b\s*[:\-]?\s*"
        r"(\d{1,2}[/-]\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})",
        re.IGNORECASE,
    ),
    "expiry_date": re.compile(
        r"\b(?:EXP|USE\s*BY|BEST\s*BEFORE|BEST\s*BEFORE\s*END)\b\s*[:\-]?\s*"
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})",
        re.IGNORECASE,
    ),
    "manufacturer_address": re.compile(
        r"\b(?:MANUFACTURED|MFD\.?)\s+BY\b\s*[:\-]?\s*([^,\n]+,\s*[^,\n]+(?:,\s*[^,\n]+)?)",
        re.IGNORECASE,
    ),
    "manufacturer_pin": re.compile(
        r"\b(?:MANUFACTURED|MFD\.?)\s+BY\b[^,\n]*(?:,[^,\n]*){0,3}?\b(\d{6})\b",
        re.IGNORECASE,
    ),
    "packer_name": re.compile(r"\bPACKED\s+BY\b\s*[:\-]?\s*([^,\n]+)", re.IGNORECASE),
    "packer_address": re.compile(
        r"\bPACKED\s+BY\b\s*[:\-]?\s*([^,\n]+,\s*[^,\n]+(?:,\s*[^,\n]+)?)",
        re.IGNORECASE,
    ),
    "packer_pin": re.compile(r"\bPACKED\s+BY\b[^,\n]*(?:,[^,\n]*){0,3}?\b(\d{6})\b", re.IGNORECASE),
    "importer_name": re.compile(r"\bIMPORTED\s+BY\b\s*[:\-]?\s*([^,\n]+)", re.IGNORECASE),
    "importer_address": re.compile(
        r"\bIMPORTED\s+BY\b\s*[:\-]?\s*([^,\n]+,\s*[^,\n]+(?:,\s*[^,\n]+)?)",
        re.IGNORECASE,
    ),
    "importer_pin": re.compile(r"\bIMPORTED\s+BY\b[^,\n]*(?:,[^,\n]*){0,3}?\b(\d{6})\b", re.IGNORECASE),
    "month_year": re.compile(
        r"\b(?:MFG|MFD|MANUFACTURED\s+IN)\b\s*[:\-]?\s*((?:0?[1-9]|1[0-2])[/-]\d{4})",
        re.IGNORECASE,
    ),
    "best_before": re.compile(
        r"\bBEST\s+BEFORE\b\s*[:\-]?\s*([^\n,;]+)", re.IGNORECASE
    ),
    "consumer_care": re.compile(
        r"\b(?:CONSUMER\s+CARE|CUSTOMER\s+CARE)\b\s*[:\-]?\s*([^\n]+)",
        re.IGNORECASE,
    ),
    "country_of_origin": re.compile(
        r"\b(?:COUNTRY\s+OF\s+ORIGIN|PRODUCT\s+OF|MADE\s+IN)\b\s*[:\-]?\s*([A-Za-z][A-Za-z ]+)",
        re.IGNORECASE,
    ),
    "fssai_number": re.compile(
        r"\bFSSAI\b.{0,35}?(?:licen[cs]e|no\.?|number)?\s*[:#\-]?\s*(\d{14})",
        re.IGNORECASE,
    ),
    "veg_nonveg": re.compile(
        r"\b(VEG(?:ETARIAN)?|NON[\s-]?VEG(?:ETARIAN)?)\b", re.IGNORECASE
    ),
    "ingredients": re.compile(r"\bINGREDIENTS?\b\s*[:\-]?\s*([^\n]+)", re.IGNORECASE),
    "nutritional_info": re.compile(
        r"\b(?:NUTRITION(?:AL)?\s+(?:INFORMATION|FACTS)|NUTRIENTS?)\b\s*[:\-]?\s*([^\n]+)",
        re.IGNORECASE,
    ),
}
INCLUSIVE_TAX_PATTERN = re.compile(
    r"(?:inclusive\s+of\s+(?:all\s+)?taxes|incl\.?\s+of\s+all\s+taxes)", re.IGNORECASE
)


@dataclass
class ExtractedField:
    value: str | bool | None
    confidence: float
    ambiguous: bool = False


def extract_fields(ocr: OCRResult) -> dict[str, ExtractedField]:
    text = ocr.text
    frontend_fields = (
        "product_name", "manufacturer_name", "manufacturer_address",
        "manufacturer_pin", "manufacturer_pin_code", "packer_name",
        "packer_address", "packer_pin", "importer_name", "importer_address",
        "importer_pin", "net_quantity", "mrp", "mrp_text", "manufacture_date",
        "month_year", "expiry_date", "best_before", "consumer_care",
        "country_of_origin", "fssai_number", "veg_nonveg", "ingredients",
        "nutritional_info", "mrp_inclusive_of_taxes", "pin_code",
    )
    fields: dict[str, ExtractedField] = {
        key: ExtractedField(value="", confidence=0.0) for key in frontend_fields
    }
    field_confidence = max(0.0, min(1.0, ocr.confidence * 0.92))
    for key, pattern in FIELD_PATTERNS.items():
        match = pattern.search(text)
        value = normalize_value(key, match.group(1)) if match else ""
        fields[key] = ExtractedField(
            value=value,
            confidence=field_confidence if match else 0.0,
            ambiguous=ocr.ambiguous,
        )
    # Keep the established rule field names and the frontend editing aliases in sync.
    aliases = {
        "fssai_number": "fssai_license",
        "manufacture_date": "manufacturing_date",
        "manufacturer_pin_code": "manufacturer_pin",
    }
    for alias, canonical in aliases.items():
        if fields[canonical].value:
            fields[alias] = fields[canonical]
    if fields["mrp"].value:
        fields["mrp_text"] = ExtractedField(
            value=f"₹{fields['mrp'].value}",
            confidence=fields["mrp"].confidence,
            ambiguous=fields["mrp"].ambiguous,
        )
    fields["mrp_inclusive_of_taxes"] = ExtractedField(
        value=bool(INCLUSIVE_TAX_PATTERN.search(text)),
        confidence=field_confidence if text else 0.0,
        ambiguous=ocr.ambiguous,
    )
    # These fields are intentionally unknown unless visible text supports extraction.
    for key, pattern in (
        ("manufacturer_name", re.compile(r"\b(?:MFD\.?\s*BY|MANUFACTURED\s*BY)\s*[:\-]?\s*([^,\n]+)", re.I)),
        ("product_name", re.compile(r"\bPRODUCT\s*NAME\s*[:\-]?\s*([^\n]+)", re.I)),
    ):
        match = pattern.search(text)
        fields[key] = ExtractedField(
            value=normalize_value(key, match.group(1)) if match else "",
            confidence=field_confidence if match else 0.0,
            ambiguous=ocr.ambiguous,
        )
    return fields


def normalize_value(key: str, value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip(" \t:;,.")
    if key == "mrp":
        value = value.replace(",", ".")
        try:
            return f"{float(value):.2f}"
        except ValueError:
            return value
    if key == "net_quantity":
        match = re.fullmatch(
            r"([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|mg|ml|l|litre|liter|pcs?|pieces?)",
            value,
            re.IGNORECASE,
        )
        if match:
            amount = match.group(1).replace(",", ".")
            unit = match.group(2).lower()
            if unit in {"l", "litre", "liter"}:
                unit = "L"
            elif unit in {"pc", "pcs", "piece", "pieces"}:
                try:
                    unit = "piece" if float(amount) == 1 else "pieces"
                except ValueError:
                    unit = "pieces"
            return f"{amount} {unit}"
    if key in {"fssai_license", "pin_code"}:
        return re.sub(r"\D", "", value)
    return value
