from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..dependencies import get_current_user
from ..schemas import HistoryDetail, HistoryItem
from ..services.analyses import get_history_detail, list_history
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


@router.get("/history/{analysis_id}", response_model=HistoryDetail)
def history_detail(
    analysis_id: UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> HistoryDetail:
    storage = S3Storage()
    row = get_history_detail(current_user["id"], analysis_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analýza sa nenašla.")

    return HistoryDetail(
        analysisId=str(row["id"]),
        imageUrl=storage.presigned_url(row["original_s3_key"]),
        date=row["captured_at"] or row["created_at"].date(),
        location=row["location_text"] or "Neznáma lokalita",
        roadType=row["road_type"],
        summary={
            "count": row["detection_count"],
            "maxSeverity": row["max_severity"],
            "avgConfidence": row["avg_confidence"],
        },
        detections=row["detections"],
    )
