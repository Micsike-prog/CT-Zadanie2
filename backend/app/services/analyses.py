from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from statistics import mean
from typing import Any
from uuid import UUID

from ..db import get_conn


SEVERITY_RANK = {"low": 1, "medium": 2, "high": 3}


def parse_location(location: str | None) -> tuple[str, float | None, float | None]:
    if not location:
        return "", None, None

    parts = [part.strip() for part in location.split(",")]
    if len(parts) >= 2:
        try:
            return location, float(parts[0]), float(parts[1])
        except ValueError:
            pass

    return location, None, None


def normalize_detections(detections: list[dict]) -> list[dict]:
    normalized = []
    for index, detection in enumerate(detections, start=1):
        severity = detection["severity"]
        if severity not in SEVERITY_RANK:
            raise ValueError(f"Invalid severity '{severity}'.")

        x = float(detection["x"])
        y = float(detection["y"])
        width = float(detection["w"])
        height = float(detection["h"])
        confidence = float(detection["confidence"])
        if not all(0 <= value <= 1 for value in [x, y, width, height, confidence]):
            raise ValueError("Detection coordinates and confidence must be between 0 and 1.")

        normalized.append(
            {
                "id": int(detection.get("id", index)),
                "x": x,
                "y": y,
                "w": width,
                "h": height,
                "confidence": confidence,
                "severity": severity,
            }
        )
    return normalized


def max_severity(detections: list[dict]) -> str | None:
    if not detections:
        return None
    return max((detection["severity"] for detection in detections), key=lambda item: SEVERITY_RANK[item])


def summarize_detections(detections: list[dict]) -> dict[str, Any]:
    return {
        "count": len(detections),
        "maxSeverity": max_severity(detections),
        "avgConfidence": round(mean(d["confidence"] for d in detections), 4) if detections else None,
    }


def save_analysis(
    *,
    analysis_id: UUID,
    user_id: UUID,
    image_key: str,
    original_filename: str | None,
    content_type: str | None,
    file_size_bytes: int,
    location: str | None,
    road_type: str | None,
    captured_at: date | None,
    detections: list[dict],
) -> dict[str, Any]:
    location_text, latitude, longitude = parse_location(location)
    summary = summarize_detections(detections)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO analyses
                  (id, user_id, original_s3_key, original_filename, content_type,
                   file_size_bytes, location_text, latitude, longitude, road_type,
                   captured_at, detection_count, max_severity, avg_confidence)
                VALUES
                  (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    analysis_id,
                    user_id,
                    image_key,
                    original_filename,
                    content_type,
                    file_size_bytes,
                    location_text,
                    latitude,
                    longitude,
                    road_type,
                    captured_at,
                    summary["count"],
                    summary["maxSeverity"],
                    summary["avgConfidence"],
                ),
            )

            for index, detection in enumerate(detections, start=1):
                cur.execute(
                    """
                    INSERT INTO detections
                      (analysis_id, detection_index, x, y, w, h, confidence, severity)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        analysis_id,
                        index,
                        detection["x"],
                        detection["y"],
                        detection["w"],
                        detection["h"],
                        detection["confidence"],
                        detection["severity"],
                    ),
                )

        conn.commit()

    return summary


def decimal_to_float(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    return value


def list_history(user_id: UUID, severity: str | None, days: int | None) -> list[dict]:
    conditions = ["user_id = %s"]
    params: list[Any] = [user_id]

    if severity:
        conditions.append("max_severity = %s")
        params.append(severity)
    if days:
        conditions.append("created_at >= %s")
        params.append(datetime.now(timezone.utc) - timedelta(days=days))

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT
                  id, created_at, captured_at, location_text, latitude, longitude,
                  road_type, detection_count, max_severity, avg_confidence,
                  original_s3_key
                FROM analyses
                WHERE {' AND '.join(conditions)}
                ORDER BY created_at DESC
                LIMIT 100
                """,
                params,
            )
            rows = cur.fetchall()

    return [
        {
            **row,
            "avg_confidence": decimal_to_float(row["avg_confidence"]),
        }
        for row in rows
    ]
