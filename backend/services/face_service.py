import base64
import os
import tempfile
import uuid
from typing import Optional

import numpy as np


def _cosine_similarity(a: list, b: list) -> float:
    arr_a = np.array(a)
    arr_b = np.array(b)
    norm_a = np.linalg.norm(arr_a)
    norm_b = np.linalg.norm(arr_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(arr_a, arr_b) / (norm_a * norm_b))


def extract_face_embedding(image_base64: str) -> Optional[list]:
    """
    Decode base64 image, detect face, and return its embedding vector.
    Returns None if no face detected or any error occurs.
    """
    tmp_path = None
    try:
        from deepface import DeepFace

        # Strip data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        img_bytes = base64.b64decode(image_base64)
        tmp_path = os.path.join(tempfile.gettempdir(), f"aegissec_{uuid.uuid4().hex}.jpg")

        with open(tmp_path, "wb") as f:
            f.write(img_bytes)

        result = DeepFace.represent(
            img_path=tmp_path,
            model_name="ArcFace",
            detector_backend="mtcnn",
            enforce_detection=True,
        )

        if result and len(result) > 0:
            return result[0]["embedding"]
        return None

    except Exception as e:
        print(f"[FACE] extract_face_embedding error: {e}")
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


def verify_face(image_base64: str, stored_embedding: list) -> tuple[bool, float]:
    """
    Compare face in image against stored embedding.
    Returns (is_match, confidence_score).
    """
    try:
        new_embedding = extract_face_embedding(image_base64)
        if new_embedding is None:
            return False, 0.0

        similarity = _cosine_similarity(new_embedding, stored_embedding)
        distance = 1.0 - similarity
        
        # ArcFace exact cosine distance threshold is 0.687
        # For '110% accuracy' (strict mode), we can tighten it to 0.60
        threshold = 0.60
        is_match = distance <= threshold
        
        # Convert similarity to a 0-100% score based on the threshold
        # If distance == threshold, score = 80%. If distance == 0, score = 100%.
        if is_match:
            score = 100.0 - ((distance / threshold) * 20.0)
        else:
            score = max(0.0, 80.0 - ((distance - threshold) * 50.0))
            
        return is_match, round(score, 2)

    except Exception as e:
        print(f"[FACE] verify_face error: {e}")
        return False, 0.0
