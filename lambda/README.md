# Lambda Image Inference

This folder packages the trained pothole detector as an AWS Lambda container image for single-image inference.

It uses an exported ONNX model with `onnxruntime`, which is a much better fit for Lambda than shipping the full PyTorch and Ultralytics runtime stack.

## What It Does

- Loads the exported ONNX model once during Lambda initialization.
- Accepts a JSON request containing one base64-encoded image.
- Returns detections in the frontend format:

```json
{
  "detections": [
    {
      "id": 1,
      "x": 0.091,
      "y": 0.317,
      "w": 0.138,
      "h": 0.054,
      "confidence": 0.91,
      "severity": "low"
    }
  ],
  "meta": {
    "cold_start_init_ms": 1234.56,
    "inference_ms": 456.78,
    "request_ms": 567.89
  }
}
```

## Build The Image

Run from the repository root:

```powershell
python lambda\export_onnx.py
docker build -f lambda/Dockerfile -t pothole-lambda .
```

## Optional: Export ONNX First

Run from the repository root:

```powershell
.venv311\Scripts\activate
pip install onnx onnxruntime onnxslim
python lambda\export_onnx.py
```

This will create `ml/runs/detect/baseline/weights/best.onnx`, which the Docker image copies into Lambda.

## Test Locally With The Lambda Runtime Interface Emulator

Start the container:

```powershell
docker run --rm -p 9000:8080 pothole-lambda
```

In another terminal, send one image:

```powershell
$img = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\test.jpg"))
$body = @{ image_base64 = $img } | ConvertTo-Json -Depth 3
Invoke-RestMethod -Method Post -Uri "http://localhost:9000/2015-03-31/functions/function/invocations" -ContentType "application/json" -Body $body
```

Call it twice to compare the first cold start against the warm request.

## Push To AWS Lambda

Typical flow:

1. Create an ECR repository.
2. Authenticate Docker to ECR.
3. Tag and push the image.
4. Create a Lambda function from that container image.
5. Set memory to around `2048` or `3008 MB` and timeout to `30-60s`.
6. Add a Lambda Function URL to test with one image.

## Notes

- The current image bakes in `ml/runs/detect/baseline/weights/best.onnx`.
- The function runs on CPU through `onnxruntime`.
- The request and response shape stays compatible with the frontend detection format.
