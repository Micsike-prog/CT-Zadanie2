from io import BytesIO
from datetime import date
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from ..config import get_settings
from ..dependencies import get_current_user
from ..schemas import DetectResponse
from ..services.analyses import normalize_detections, save_analysis
from ..services.inference import run_lambda_inference
from ..services.storage import S3Storage, build_object_key


router = APIRouter(tags=["detections"])
SUPPORTED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


async def read_limited_image(image: UploadFile) -> bytes:
    settings = get_settings()
    image_bytes = await image.read(settings.max_upload_bytes + 1)
    if len(image_bytes) > settings.max_upload_bytes:
        max_mb = settings.max_upload_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image upload is too large. Maximum size is {max_mb} MB.",
        )
    return image_bytes


def validate_yolo_image(image_bytes: bytes) -> None:
    try:
        with Image.open(BytesIO(image_bytes)) as parsed_image:
            if parsed_image.format not in SUPPORTED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unsupported image format. Use JPEG, PNG, or WebP.",
                )
            parsed_image.verify()
    except (OSError, UnidentifiedImageError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        ) from exc


@router.post("/detect", response_model=DetectResponse)
async def detect(
    current_user: Annotated[dict, Depends(get_current_user)],
    image: UploadFile = File(...),
    location: str | None = Form(None),
    date_value: date | None = Form(None, alias="date"),
    road_type: str | None = Form(None),
) -> DetectResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload must be an image.")

    image_bytes = await read_limited_image(image)
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image is empty.")
    validate_yolo_image(image_bytes)

    analysis_id = uuid4()
    storage = S3Storage()
    image_key = build_object_key(analysis_id, image.filename, image.content_type, date_value)
    storage.upload_image(image_key, image_bytes, image.content_type)

    raw_detections = run_lambda_inference(image_bytes)
    try:
        detections = normalize_detections(raw_detections)
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Invalid Lambda detection payload: {exc}",
        ) from exc

    summary = save_analysis(
        analysis_id=analysis_id,
        user_id=current_user["id"],
        image_key=image_key,
        original_filename=image.filename,
        content_type=image.content_type,
        file_size_bytes=len(image_bytes),
        location=location,
        road_type=road_type,
        captured_at=date_value,
        detections=detections,
    )

    return DetectResponse(
        analysisId=str(analysis_id),
        imageUrl=storage.presigned_url(image_key),
        detections=detections,
        summary=summary,
    )
