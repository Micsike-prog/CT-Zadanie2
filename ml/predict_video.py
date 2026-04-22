from pathlib import Path

from ultralytics import YOLO


ROOT_DIR = Path(__file__).resolve().parent.parent
WEIGHTS = ROOT_DIR / "ml" / "runs" / "detect" / "baseline" / "weights" / "best.pt"
VIDEO = ROOT_DIR / "ml" / "data" / "potholes_yolov8" / "sample_video.mp4"
OUTPUT_DIR = ROOT_DIR / "ml" / "runs" / "predict"


def main() -> None:
    model = YOLO(str(WEIGHTS))

    model.predict(
        source=str(VIDEO),
        conf=0.25,
        device=0,
        show=True,
        save=True,
        project=str(OUTPUT_DIR),
        name="sample_video",
    )


if __name__ == "__main__":
    main()
