import base64
import io
import json
import os
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image


MODEL_PATH = Path(os.environ.get("MODEL_PATH", "/var/task/model/best.onnx"))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.25"))
IOU_THRESHOLD = float(os.environ.get("IOU_THRESHOLD", "0.45"))
INPUT_SIZE = int(os.environ.get("INPUT_SIZE", "640"))

_INIT_STARTED_AT = time.perf_counter()
_SESSION = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
_INPUT_NAME = _SESSION.get_inputs()[0].name
_INIT_DURATION_MS = round((time.perf_counter() - _INIT_STARTED_AT) * 1000, 2)


def _json_response(status_code: int, payload: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(payload),
    }


def _decode_image(event: dict) -> Image.Image:
    if "image_base64" in event:
        payload = event
    else:
        body = event.get("body")
        if body is None:
            raise ValueError("Missing request body.")

        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")

        payload = json.loads(body)

    image_base64 = payload.get("image_base64")
    if not image_base64:
        raise ValueError("Request JSON must include 'image_base64'.")

    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))
    return image.convert("RGB")


def _letterbox_image(image: Image.Image, target_size: int) -> tuple[np.ndarray, float, float, float]:
    image_width, image_height = image.size
    scale = min(target_size / image_width, target_size / image_height)

    resized_width = int(round(image_width * scale))
    resized_height = int(round(image_height * scale))
    resized = image.resize((resized_width, resized_height))

    canvas = Image.new("RGB", (target_size, target_size), (114, 114, 114))
    pad_x = (target_size - resized_width) / 2
    pad_y = (target_size - resized_height) / 2
    canvas.paste(resized, (int(round(pad_x)), int(round(pad_y))))

    image_array = np.asarray(canvas, dtype=np.float32) / 255.0
    image_array = np.transpose(image_array, (2, 0, 1))[None, :, :, :]
    return image_array, scale, pad_x, pad_y


def _prepare_predictions(raw_output: np.ndarray) -> np.ndarray:
    predictions = np.squeeze(raw_output)

    if predictions.ndim != 2:
        raise ValueError(f"Unexpected ONNX output shape: {raw_output.shape}")

    if predictions.shape[0] < predictions.shape[1]:
        predictions = predictions.T

    return predictions


def _compute_iou(box: np.ndarray, boxes: np.ndarray) -> np.ndarray:
    x1 = np.maximum(box[0], boxes[:, 0])
    y1 = np.maximum(box[1], boxes[:, 1])
    x2 = np.minimum(box[2], boxes[:, 2])
    y2 = np.minimum(box[3], boxes[:, 3])

    intersection = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    box_area = max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])
    boxes_area = np.maximum(0.0, boxes[:, 2] - boxes[:, 0]) * np.maximum(0.0, boxes[:, 3] - boxes[:, 1])
    union = box_area + boxes_area - intersection

    return np.divide(intersection, union, out=np.zeros_like(intersection), where=union > 0)


def _non_max_suppression(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float) -> list[int]:
    order = scores.argsort()[::-1]
    keep = []

    while order.size > 0:
        current = order[0]
        keep.append(int(current))
        if order.size == 1:
            break

        remaining = order[1:]
        ious = _compute_iou(boxes[current], boxes[remaining])
        order = remaining[ious < iou_threshold]

    return keep


def _clip_box(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def _run_inference(image: Image.Image) -> list[dict]:
    image_width, image_height = image.size
    input_tensor, scale, pad_x, pad_y = _letterbox_image(image, INPUT_SIZE)

    raw_output = _SESSION.run(None, {_INPUT_NAME: input_tensor})[0]
    predictions = _prepare_predictions(raw_output)
    if predictions.shape[1] < 5:
        raise ValueError(f"Unexpected prediction width: {predictions.shape}")

    boxes_xyxy = []
    scores = []

    for row in predictions:
        x_center, y_center, width, height = row[:4]
        class_scores = row[4:]
        confidence = float(np.max(class_scores))
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        x1 = (x_center - width / 2 - pad_x) / scale
        y1 = (y_center - height / 2 - pad_y) / scale
        x2 = (x_center + width / 2 - pad_x) / scale
        y2 = (y_center + height / 2 - pad_y) / scale

        x1 = _clip_box(float(x1), 0.0, float(image_width))
        y1 = _clip_box(float(y1), 0.0, float(image_height))
        x2 = _clip_box(float(x2), 0.0, float(image_width))
        y2 = _clip_box(float(y2), 0.0, float(image_height))

        if x2 <= x1 or y2 <= y1:
            continue

        boxes_xyxy.append([x1, y1, x2, y2])
        scores.append(confidence)

    if not boxes_xyxy:
        return []

    boxes_array = np.asarray(boxes_xyxy, dtype=np.float32)
    scores_array = np.asarray(scores, dtype=np.float32)
    kept_indices = _non_max_suppression(boxes_array, scores_array, IOU_THRESHOLD)

    detections = []
    for index, kept_index in enumerate(kept_indices, start=1):
        x1, y1, x2, y2 = boxes_array[kept_index]
        width = (x2 - x1) / image_width
        height = (y2 - y1) / image_height

        area = width * height
        if area > 0.05:
            severity = "high"
        elif area > 0.015:
            severity = "medium"
        else:
            severity = "low"

        detections.append(
            {
                "id": index,
                "x": round(x1 / image_width, 6),
                "y": round(y1 / image_height, 6),
                "w": round(width, 6),
                "h": round(height, 6),
                "confidence": round(float(scores_array[kept_index]), 4),
                "severity": severity,
            }
        )

    return detections


def handler(event, context):
    request_started_at = time.perf_counter()

    try:
        image = _decode_image(event)

        inference_started_at = time.perf_counter()
        detections = _run_inference(image)
        inference_duration_ms = round((time.perf_counter() - inference_started_at) * 1000, 2)
        total_duration_ms = round((time.perf_counter() - request_started_at) * 1000, 2)

        return _json_response(
            200,
            {
                "detections": detections,
                "meta": {
                    "model_path": str(MODEL_PATH),
                    "confidence_threshold": CONFIDENCE_THRESHOLD,
                    "iou_threshold": IOU_THRESHOLD,
                    "input_size": INPUT_SIZE,
                    "cold_start_init_ms": _INIT_DURATION_MS,
                    "inference_ms": inference_duration_ms,
                    "request_ms": total_duration_ms,
                    "aws_request_id": getattr(context, "aws_request_id", None),
                },
            },
        )
    except Exception as exc:
        return _json_response(
            400,
            {
                "error": str(exc),
                "meta": {
                    "model_path": str(MODEL_PATH),
                    "cold_start_init_ms": _INIT_DURATION_MS,
                },
            },
        )
