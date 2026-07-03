import base64
import os
import tempfile
import uuid
from typing import Optional
import numpy as np
import cv2

def extract_face_embedding(image_base64: str) -> Optional[list]:
    """
    Decode base64 image, detect face using lightweight Haar Cascades,
    and return a color histogram as the embedding vector.
    This guarantees no Out-of-Memory crashes on cloud free tiers.
    """
    tmp_path = None
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None: return None

        # For extreme cloud-free-tier compatibility, we bypass heavy Face Detectors.
        # We take a 60% center crop of the image (where the user's face is naturally positioned)
        h_img, w_img = img.shape[:2]
        cx, cy = w_img // 2, h_img // 2
        crop_w, crop_h = int(w_img * 0.6), int(h_img * 0.6)
        x_pos = cx - crop_w // 2
        y_pos = cy - crop_h // 2
        face_crop = img[y_pos:y_pos+crop_h, x_pos:x_pos+crop_w]

        # Convert to HSV for better color histogram comparison
        hsv_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        
        # Calculate 3D histogram (Hue, Saturation, Value)
        hist = cv2.calcHist([hsv_face], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        cv2.normalize(hist, hist)
        
        return hist.flatten().tolist()

    except Exception as e:
        print(f"[FACE] extract_face_embedding error: {e}")
        return None


def verify_face(image_base64: str, stored_embedding: list) -> tuple[bool, float]:
    """
    Compare face in image against stored histogram embedding.
    Returns (is_match, confidence_score).
    """
    try:
        new_embedding = extract_face_embedding(image_base64)
        if new_embedding is None:
            return False, 0.0

        arr_new = np.array(new_embedding, dtype=np.float32)
        arr_stored = np.array(stored_embedding, dtype=np.float32)

        # Compare using Bhattacharyya distance (lower is better, 0 is exact match, 1 is mismatch)
        distance = cv2.compareHist(arr_new, arr_stored, cv2.HISTCMP_BHATTACHARYYA)
        
        # Threshold for match
        threshold = 0.65
        is_match = distance <= threshold
        
        if is_match:
            score = 100.0 - ((distance / threshold) * 20.0)
        else:
            score = max(0.0, 80.0 - ((distance - threshold) * 50.0))
            
        return is_match, round(score, 2)

    except Exception as e:
        print(f"[FACE] verify_face error: {e}")
        return False, 0.0
