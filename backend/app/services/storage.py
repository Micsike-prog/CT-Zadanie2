from datetime import date
from uuid import UUID

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, status

from ..config import get_settings


def file_extension(filename: str | None, content_type: str | None) -> str:
    if filename and "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    if content_type == "image/png":
        return "png"
    if content_type == "image/webp":
        return "webp"
    return "jpg"


def build_object_key(
    analysis_id: UUID,
    filename: str | None,
    content_type: str | None,
    captured_at: date | None,
) -> str:
    captured = captured_at or date.today()
    extension = file_extension(filename, content_type)
    return f"uploads/originals/{captured:%Y/%m}/{analysis_id}.{extension}"


class S3Storage:
    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.s3_bucket:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="S3_BUCKET is not configured.",
            )
        self.client = boto3.client("s3", region_name=self.settings.aws_region)

    def upload_image(self, key: str, content: bytes, content_type: str | None) -> None:
        try:
            self.client.put_object(
                Bucket=self.settings.s3_bucket,
                Key=key,
                Body=content,
                ContentType=content_type or "application/octet-stream",
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"S3 upload failed: {exc}",
            ) from exc

    def presigned_url(self, key: str) -> str:
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.settings.s3_bucket, "Key": key},
                ExpiresIn=self.settings.s3_presign_seconds,
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"S3 presigned URL creation failed: {exc}",
            ) from exc
