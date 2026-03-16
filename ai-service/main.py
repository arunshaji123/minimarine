from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import numpy as np
import base64
import io
import os
import cv2
from PIL import Image, ImageDraw
from ultralytics import YOLO

MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = None

# Inference tuning for small/fine defects
CONF_THRESHOLD = float(os.getenv("YOLO_CONF", "0.10"))
IMG_SIZE = int(os.getenv("YOLO_IMGSZ", "1280"))
TILE_SIZE = int(os.getenv("YOLO_TILE_SIZE", "1024"))
TILE_OVERLAP = float(os.getenv("YOLO_TILE_OVERLAP", "0.25"))
IOU_MERGE_THRESHOLD = float(os.getenv("YOLO_IOU_MERGE", "0.50"))
CRACK_MIN_CONF_PCT = float(os.getenv("YOLO_MIN_CRACK_CONF", "10"))
CORROSION_MIN_CONF_PCT = float(os.getenv("YOLO_MIN_CORROSION_CONF", "30"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print(f"Loading YOLOv8 model from: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print("✅ YOLOv8 model loaded successfully")
    yield

app = FastAPI(title="YOLOv8 Hull Inspection API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def compute_iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a["bbox"]["x1"], box_a["bbox"]["y1"], box_a["bbox"]["x2"], box_a["bbox"]["y2"]
    bx1, by1, bx2, by2 = box_b["bbox"]["x1"], box_b["bbox"]["y1"], box_b["bbox"]["x2"], box_b["bbox"]["y2"]

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0, inter_x2 - inter_x1)
    inter_h = max(0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    union_area = area_a + area_b - inter_area

    return (inter_area / union_area) if union_area > 0 else 0.0


def deduplicate_detections(detections, iou_threshold=0.5):
    if not detections:
        return []

    sorted_detections = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    kept = []

    for detection in sorted_detections:
        should_keep = True
        for kept_detection in kept:
            if detection["class"].lower() == kept_detection["class"].lower():
                if compute_iou(detection, kept_detection) >= iou_threshold:
                    should_keep = False
                    break
        if should_keep:
            kept.append(detection)

    return kept


def extract_detections(result, names, x_offset=0, y_offset=0):
    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = names[class_id]
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        detections.append({
            "class": class_name,
            "confidence": round(confidence * 100, 2),
            "bbox": {
                "x1": round(x1 + x_offset, 2),
                "y1": round(y1 + y_offset, 2),
                "x2": round(x2 + x_offset, 2),
                "y2": round(y2 + y_offset, 2)
            }
        })
    return detections


def filter_by_class_confidence(detections):
    filtered = []
    for detection in detections:
        class_name = detection.get("class", "").lower()
        confidence = float(detection.get("confidence", 0))

        if "crack" in class_name and confidence >= CRACK_MIN_CONF_PCT:
            filtered.append(detection)
            continue

        if ("corrosion" in class_name or "rust" in class_name) and confidence >= CORROSION_MIN_CONF_PCT:
            filtered.append(detection)
            continue

    return filtered


def run_tiled_inference(image, names):
    image_np = np.array(image)
    height, width = image_np.shape[:2]

    step = int(TILE_SIZE * (1 - TILE_OVERLAP))
    step = max(1, step)
    detections = []

    for y in range(0, height, step):
        for x in range(0, width, step):
            x_end = min(x + TILE_SIZE, width)
            y_end = min(y + TILE_SIZE, height)

            tile = image_np[y:y_end, x:x_end]
            if tile.size == 0:
                continue

            tile_results = model(tile, conf=CONF_THRESHOLD, imgsz=IMG_SIZE, verbose=False)
            tile_result = tile_results[0]
            detections.extend(extract_detections(tile_result, names, x_offset=x, y_offset=y))

    return deduplicate_detections(detections, iou_threshold=IOU_MERGE_THRESHOLD)


def draw_detections_on_image(image, detections):
    output = image.copy()
    draw = ImageDraw.Draw(output)

    for detection in detections:
        x1 = detection["bbox"]["x1"]
        y1 = detection["bbox"]["y1"]
        x2 = detection["bbox"]["x2"]
        y2 = detection["bbox"]["y2"]
        label = f"{detection['class']} {detection['confidence']}%"

        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        draw.rectangle([x1, max(0, y1 - 20), x1 + 220, y1], fill="red")
        draw.text((x1 + 4, max(0, y1 - 18)), label, fill="white")

    return output


def run_cv_fallback(image: Image.Image):
    """
    OpenCV-based fallback detector used when YOLO model is untrained / returns 0 boxes.
    Detects:
      - corrosion/rust  : HSV color masking (orange-brown-red hues)
      - crack           : edge + morphology analysis (thin elongated dark features)
    Returns detections in the same format as extract_detections().
    """
    img_np = np.array(image.convert("RGB"))
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]

    detections = []

    # ── 1. CORROSION / RUST detection via HSV masking ──────────────────────────
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    # Rust: hue 0-22 + 155-180 (wraps), high saturation, medium-high value
    mask_rust1 = cv2.inRange(img_hsv, np.array([0,   60,  60]), np.array([22,  255, 255]))
    mask_rust2 = cv2.inRange(img_hsv, np.array([155, 60,  60]), np.array([180, 255, 255]))
    # Brown rust (slightly higher hue)
    mask_rust3 = cv2.inRange(img_hsv, np.array([8,   40,  40]), np.array([30,  255, 200]))
    mask_rust = cv2.bitwise_or(mask_rust1, cv2.bitwise_or(mask_rust2, mask_rust3))

    # Morphological clean-up
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask_rust = cv2.morphologyEx(mask_rust, cv2.MORPH_CLOSE, kernel)
    mask_rust = cv2.morphologyEx(mask_rust, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))

    contours_rust, _ = cv2.findContours(mask_rust, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_rust_area = (h * w) * 0.002   # at least 0.2% of image
    for cnt in contours_rust:
        area = cv2.contourArea(cnt)
        if area < min_rust_area:
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        # Confidence proportional to area up to ~85%
        conf = min(85, int(50 + area / (h * w) * 3000))
        detections.append({
            "class": "corrosion",
            "confidence": conf,
            "bbox": {"x1": float(x), "y1": float(y), "x2": float(x + bw), "y2": float(y + bh)}
        })

    # ── 2. CRACK detection via edge + morphology ───────────────────────────────
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray_eq = clahe.apply(gray)

    # Canny edges
    edges = cv2.Canny(gray_eq, 40, 120)

    # Morphological close to join short crack segments
    crack_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 15))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, crack_kernel)
    # Second pass: horizontal segments
    crack_kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
    closed_h = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, crack_kernel_h)
    combined_cracks = cv2.bitwise_or(closed, closed_h)

    # Dilate slightly to form blobs for contour detection
    combined_cracks = cv2.dilate(combined_cracks, np.ones((3,3), np.uint8), iterations=2)

    contours_crack, _ = cv2.findContours(combined_cracks, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_crack_area = (h * w) * 0.0015
    for cnt in contours_crack:
        area = cv2.contourArea(cnt)
        if area < min_crack_area:
            continue

        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect = max(bw, bh) / (min(bw, bh) + 1)
        if aspect < 2.0:   # Reject square blobs — cracks are elongated
            continue

        # Solidity check: real cracks are sparse inside their bbox
        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        solidity = area / (hull_area + 1)

        conf = min(82, int(45 + aspect * 4 + (1 - solidity) * 20))
        detections.append({
            "class": "crack",
            "confidence": conf,
            "bbox": {"x1": float(x), "y1": float(y), "x2": float(x + bw), "y2": float(y + bh)}
        })

    # De-duplicate and return top-N per class
    detections = deduplicate_detections(detections, iou_threshold=0.3)
    # Limit to avoid noise: top 5 corrosion + top 5 cracks by confidence
    cracks = sorted([d for d in detections if d["class"] == "crack"], key=lambda d: -d["confidence"])[:5]
    corrosion = sorted([d for d in detections if d["class"] == "corrosion"], key=lambda d: -d["confidence"])[:5]
    return cracks + corrosion

@app.get("/")
def health_check():
    return {
        "status": "running",
        "model": "YOLOv8 Hull Inspection",
        "model_loaded": model is not None,
        "inference": {
            "conf": CONF_THRESHOLD,
            "imgsz": IMG_SIZE,
            "tile_size": TILE_SIZE,
            "tile_overlap": TILE_OVERLAP,
            "iou_merge": IOU_MERGE_THRESHOLD,
            "class_thresholds": {
                "crack_min_conf_pct": CRACK_MIN_CONF_PCT,
                "corrosion_min_conf_pct": CORROSION_MIN_CONF_PCT
            },
            "fallback": "cv_analysis (edge+color)"
        }
    }

@app.post("/detect")
async def detect_defects(file: UploadFile = File(...)):
    """
    Accepts a ship hull image and returns:
    - detected defect classes (crack, corrosion)
    - confidence scores
    - bounding box coordinates
    - annotated image (base64)
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Read image bytes
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run primary full-image YOLOv8 inference with tuned settings
        results = model(image, conf=CONF_THRESHOLD, imgsz=IMG_SIZE, verbose=False)
        result = results[0]

        detections = extract_detections(result, model.names)
        detections = filter_by_class_confidence(detections)
        detections = deduplicate_detections(detections, iou_threshold=IOU_MERGE_THRESHOLD)
        strategy = "full_image"

        # Fallback: CV-based analysis when YOLO model has no learned weights
        if len(detections) == 0:
            detections = run_cv_fallback(image)
            detections = filter_by_class_confidence(detections)
            detections = deduplicate_detections(detections, iou_threshold=0.3)
            strategy = "cv_fallback"

        # Generate annotated image using filtered detections only
        annotated_image = draw_detections_on_image(image, detections)

        # Convert annotated image to base64
        buffer = io.BytesIO()
        annotated_image.save(buffer, format="JPEG", quality=90)
        buffer.seek(0)
        annotated_base64 = base64.b64encode(buffer.read()).decode("utf-8")

        # Build summary
        total_detections = len(detections)
        crack_count = sum(1 for d in detections if "crack" in d["class"].lower())
        corrosion_count = sum(1 for d in detections if "corrosion" in d["class"].lower() or "rust" in d["class"].lower())

        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "total_detections": total_detections,
            "summary": {
                "crack": crack_count,
                "corrosion": corrosion_count,
                "other": total_detections - crack_count - corrosion_count
            },
            "detections": detections,
            "annotated_image": f"data:image/jpeg;base64,{annotated_base64}",
            "inference": {
                "strategy": strategy,
                "conf": CONF_THRESHOLD,
                "imgsz": IMG_SIZE,
                "tile_size": TILE_SIZE,
                "tile_overlap": TILE_OVERLAP,
                "iou_merge": IOU_MERGE_THRESHOLD,
                "class_thresholds": {
                    "crack_min_conf_pct": CRACK_MIN_CONF_PCT,
                    "corrosion_min_conf_pct": CORROSION_MIN_CONF_PCT
                }
            },
            "model_info": {
                "model": "YOLOv8",
                "classes": list(model.names.values())
            }
        })

    except Exception as e:
        print(f"❌ Detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
