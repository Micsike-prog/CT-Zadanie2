import base64
import json

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, status

from ..config import get_settings


def run_lambda_inference(image_bytes: bytes) -> list[dict]:
    settings = get_settings()
    if not settings.lambda_function_name:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LAMBDA_FUNCTION_NAME is not configured.",
        )

    payload = {"image_base64": base64.b64encode(image_bytes).decode("utf-8")}
    client = boto3.client("lambda", region_name=settings.aws_region)

    try:
        response = client.invoke(
            FunctionName=settings.lambda_function_name,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload).encode("utf-8"),
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lambda inference failed: {exc}",
        ) from exc

    if "FunctionError" in response:
        error_payload = response["Payload"].read().decode("utf-8")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lambda function returned an error: {error_payload}",
        )

    try:
        data = json.loads(response["Payload"].read())
    except (KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Lambda response payload is not valid JSON.",
        ) from exc

    if isinstance(data, dict) and "body" in data:
        try:
            data = json.loads(data["body"])
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Lambda response body is not valid JSON.",
            ) from exc

    detections = data.get("detections") if isinstance(data, dict) else data
    if not isinstance(detections, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Lambda response does not contain a detections list.",
        )

    return detections
