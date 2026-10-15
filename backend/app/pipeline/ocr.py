from dataclasses import dataclass

import pytesseract
from pytesseract import TesseractNotFoundError
from pytesseract import Output

from .image_processing import prepare_image


class OCRUnavailableError(RuntimeError):
    pass


@dataclass
class OCRResult:
    text: str
    confidence: float
    ambiguous: bool = False


class TesseractOCR:
    def extract(self, image_bytes: bytes) -> OCRResult:
        image = prepare_image(image_bytes)
        try:
            data = pytesseract.image_to_data(
                image, output_type=Output.DICT, config="--psm 6"
            )
        except TesseractNotFoundError as exc:
            raise OCRUnavailableError(
                "Tesseract OCR is not installed or is not on PATH. Install Tesseract "
                "and retry; no scan results were generated."
            ) from exc
        except pytesseract.TesseractError as exc:
            raise OCRUnavailableError(f"Tesseract could not process this image: {exc}") from exc
        lines: dict[tuple[int, int, int, int], list[str]] = {}
        confidences = []
        for index, (word, raw_confidence) in enumerate(
            zip(data.get("text", []), data.get("conf", []))
        ):
            word = word.strip()
            try:
                confidence = float(raw_confidence)
            except (TypeError, ValueError):
                continue
            if word and confidence >= 0:
                line_key = tuple(
                    int(data.get(key, [0] * len(data.get("text", [])))[index])
                    for key in ("page_num", "block_num", "par_num", "line_num")
                )
                lines.setdefault(line_key, []).append(word)
                confidences.append(confidence)
        text = "\n".join(" ".join(words) for words in lines.values())
        confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.0
        return OCRResult(text=text, confidence=round(confidence, 4), ambiguous=confidence < 55)
