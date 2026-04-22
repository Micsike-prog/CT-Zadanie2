from pathlib import Path

from ultralytics import YOLO


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_CONFIG = ROOT_DIR / "ml" / "config" / "dataset.yaml"
RUNS_DIR = ROOT_DIR / "ml" / "runs" / "detect"


def main() -> None:
    model = YOLO("yolov8s.pt")

    model.train(
        data=str(DATA_CONFIG),
        epochs=75,
        imgsz=640,
        batch=8,
        device=0,
        workers=4,
        patience=15,
        project=str(RUNS_DIR),
        name="baseline",
    )


if __name__ == "__main__":
    main()
