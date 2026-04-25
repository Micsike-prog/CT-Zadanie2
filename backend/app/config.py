import os
from functools import lru_cache

from pydantic import BaseModel, model_validator


class Settings(BaseModel):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://pothole:pothole@localhost:5432/pothole_db",
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_expires_seconds: int = int(os.getenv("JWT_EXPIRES_SECONDS", "3600"))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://ct-zadanie2.vercel.app",
        ).split(",")
        if origin.strip()
    ]
    aws_region: str = os.getenv("AWS_REGION", "eu-central-1")
    s3_bucket: str = os.getenv("S3_BUCKET", "")
    s3_presign_seconds: int = int(os.getenv("S3_PRESIGN_SECONDS", "3600"))
    lambda_function_name: str = os.getenv("LAMBDA_FUNCTION_NAME", "")
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))
    run_migrations_on_startup: bool = os.getenv("RUN_MIGRATIONS_ON_STARTUP", "true").lower() == "true"

    @model_validator(mode="after")
    def validate_required_secrets(self):
        if not self.jwt_secret.strip():
            raise ValueError("JWT_SECRET must be set.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
