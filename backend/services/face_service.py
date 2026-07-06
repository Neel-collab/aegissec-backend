import base64
import os
import numpy as np
import cv2
from typing import Optional

def extract_face_embedding(image_base64: str) -> Optional[list]:
    """
    Decode base64 image, take a center crop of the face, and extract
    HOG (Histogram of Oriented Gradients) features. HOG captures the actual
    structural shape of the face (eyes, nose, jawline) rather than just color,
    preventing imposters from logging in just by being in the same lighting.
    """
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE) # Grayscale for structure
        
        if img is None: return None

        # Take a 60% center crop (the bounding box where the face sits in the UI)
        h_img, w_img = img.shape[:2]
        cx, cy = w_img // 2, h_img // 2
        crop_w, crop_h = int(w_img * 0.6), int(h_img * 0.6)
        x_pos = cx - crop_w // 2
        y_pos = cy - crop_h // 2
        face_crop = img[y_pos:y_pos+crop_h, x_pos:x_pos+crop_w]

        # Standardize size for HOG (must be a fixed size)
        face_resized = cv2.resize(face_crop, (128, 128))
        
        # Initialize HOG descriptor
        hog = cv2.HOGDescriptor(
            _winSize=(128, 128),
            _blockSize=(16, 16),
            _blockStride=(8, 8),
            _cellSize=(8, 8),
            _nbins=9
        )
        
        # Compute HOG features
        hog_features = hog.compute(face_resized)
        
        # Flatten and normalize the feature vector
        hog_features = hog_features.flatten()
        norm = np.linalg.norm(hog_features)
        if norm > 0:
            hog_features = hog_features / norm
            
        return hog_features.tolist()

    except Exception as e:
        print(f"[FACE] extract_face_embedding error: {e}")
        return None


def verify_face(image_base64: str, stored_embedding: list) -> tuple[bool, float]:
    """
    Compare new HOG embedding against stored embedding using Cosine Similarity.
    """
    try:
        new_embedding = extract_face_embedding(image_base64)
        if new_embedding is None:
            return False, 0.0

        vec_new = np.array(new_embedding, dtype=np.float32)
        vec_stored = np.array(stored_embedding, dtype=np.float32)

        # Cosine Similarity (1.0 is exact match, 0.0 is completely different)
        similarity = np.dot(vec_new, vec_stored)
        
        # HOG Cosine Similarity threshold for faces
        # 0.70 to 0.85 is a typical sweet spot depending on strictness
        threshold = 0.75 
        is_match = similarity >= threshold
        
        if is_match:
            score = 80.0 + ((similarity - threshold) / (1.0 - threshold) * 20.0)
        else:
            score = max(0.0, (similarity / threshold) * 79.0)
            
        return bool(is_match), round(score, 2)

    except Exception as e:
        print(f"[FACE] verify_face error: {e}")
        return False, 0.0
