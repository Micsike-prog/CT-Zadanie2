# Toto je príklad konverzie v backend/app/routers/detection.py
# YOLOv8 vracia výsledky v pixeloch – treba ich normalizovať a konvertovať

def yolo_to_frontend(yolo_boxes, image_width: int, image_height: int) -> list:
    """
    Konvertuje YOLOv8 bounding boxy do formátu pre frontend.

    YOLOv8 formát (pixely, stred boxu):
        x_center, y_center, width, height

    Frontend formát (percentá, ľavý horný roh):
        x, y, w, h  (všetko 0.0 – 1.0)
    """
    results = []

    for i, box in enumerate(yolo_boxes):
        # 1. Načítaj hodnoty z YOLOv8 (v pixeloch)
        x_center_px = float(box.xywh[0][0])
        y_center_px = float(box.xywh[0][1])
        w_px        = float(box.xywh[0][2])
        h_px        = float(box.xywh[0][3])
        confidence  = float(box.conf[0])

        # 2. Normalizuj na percentá (0.0 – 1.0)
        x_center = x_center_px / image_width
        y_center = y_center_px / image_height
        w        = w_px        / image_width
        h        = h_px        / image_height

        # 3. Konvertuj stred → ľavý horný roh
        x = x_center - (w / 2)
        y = y_center - (h / 2)

        # 4. Vypočítaj severity podľa plochy boxu
        area = w * h  # percentuálna plocha voči celému obrázku
        if area > 0.05:
            severity = "high"
        elif area > 0.015:
            severity = "medium"
        else:
            severity = "low"

        results.append({
            "id":         i + 1,
            "x":          round(max(0.0, x), 6),  # zaokrúhli, zabezpeč >= 0
            "y":          round(max(0.0, y), 6),
            "w":          round(w, 6),
            "h":          round(h, 6),
            "confidence": round(confidence, 4),
            "severity":   severity,
        })

    return results


# --- Príklad použitia v FastAPI endpointe ---
#
# from ultralytics import YOLO
# from PIL import Image
# import io
#
# model = YOLO("weights/best.pt")
#
# @router.post("/detect")
# async def detect(image: UploadFile, db: Session = Depends(get_db)):
#     img_bytes = await image.read()
#     img = Image.open(io.BytesIO(img_bytes))
#     img_w, img_h = img.size
#
#     yolo_results = model(img)
#     boxes = yolo_to_frontend(yolo_results[0].boxes, img_w, img_h)
#
#     # Ulož do DB...
#     return boxes


# --- Overenie konverzie na príklade z datasetu ---
if __name__ == "__main__":
    # Vstup z label súboru datasetu:
    # 0 0.160123 0.344630 0.137778 0.054444
    yolo_labels = [
        (0.160123, 0.344630, 0.137778, 0.054444),
        (0.333117, 0.163704, 0.303704, 0.175000),
        (0.499414, 0.045926, 0.165185, 0.042778),
        (0.429012, 0.832222, 0.858025, 0.335556),
        (0.466975, 0.380231, 0.371852, 0.148333),
    ]

    print("YOLO (x_center, y_center, w, h) → Frontend (x_topleft, y_topleft, w, h)")
    print("-" * 70)
    for xc, yc, w, h in yolo_labels:
        x = round(xc - w / 2, 6)
        y = round(yc - h / 2, 6)
        area = w * h
        sev = "high" if area > 0.05 else ("medium" if area > 0.015 else "low")
        print(f"  ({xc:.3f}, {yc:.3f}, {w:.3f}, {h:.3f})  →  x={x:.3f} y={y:.3f} w={w:.3f} h={h:.3f}  [{sev}]")
