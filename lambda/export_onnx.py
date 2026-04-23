from pathlib import Path

from ultralytics import YOLO


ROOT_DIR = Path(__file__).resolve().parent.parent
PT_MODEL = ROOT_DIR / "ml" / "runs" / "detect" / "baseline" / "weights" / "best.pt"


def main() -> None:
    model = YOLO(str(PT_MODEL))
    model.export(format="onnx", imgsz=640, opset=12, simplify=True)


if __name__ == "__main__":
    main()
