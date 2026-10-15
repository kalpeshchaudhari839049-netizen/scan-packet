from io import BytesIO
from pathlib import Path

from PIL import Image, UnidentifiedImageError

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG"}
MAX_IMAGE_PIXELS = 25_000_000


class InvalidImageError(ValueError):
    pass


def validate_image(data: bytes, filename: str) -> str:
    """Validate size and decoded image format; never trust a browser MIME type."""
    if not data:
        raise InvalidImageError("The uploaded image is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise InvalidImageError("Image must be 5 MB or smaller.")
    if Path(filename).suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        raise InvalidImageError("Only JPG and PNG images are accepted.")
    try:
        with Image.open(BytesIO(data)) as image:
            image.verify()
            image_format = image.format
            if image.width * image.height > MAX_IMAGE_PIXELS:
                raise InvalidImageError("Image dimensions exceed the safe processing limit.")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        if isinstance(exc, InvalidImageError):
            raise
        raise InvalidImageError("The upload is not a valid JPG or PNG image.") from exc
    if image_format not in ALLOWED_FORMATS:
        raise InvalidImageError("Only JPG and PNG images are accepted.")
    return image_format
