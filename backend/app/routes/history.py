from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from ..dependencies import get_current_user
from ..schemas import HistoryItem
from ..services.analyses import list_history
from ..services.storage import S3Storage


router = APIRouter(tags=["history"])


@router.get("/history", response_model=list[HistoryItem])
def history(
    current_user: Annotated[dict, Depends(get_current_user)],
    severity: Literal["low", "medium", "high"] | None = None,
    days: int | None = Query(None, ge=1),
) -> list[HistoryItem]:
    storage = S3Storage()
    rows = list_history(current_user["id"], severity, days)

    return [
        HistoryItem(
            id=str(row["id"])[:8],
            analysisId=str(row["id"]),
            date=row["captured_at"] or row["created_at"].date(),
            location=row["location_text"] or "Neznáma lokalita",
            lat=row["latitude"],
            lng=row["longitude"],
            roadType=row["road_type"],
            count=row["detection_count"],
            severity=row["max_severity"],
            avgConfidence=row["avg_confidence"],
            imageUrl=storage.presigned_url(row["original_s3_key"]),
        )
        for row in rows
    ]
