# mock_phishing_model.py
import os

class PhishingDetectionModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "bert_model")
        # In reality: self.pipeline = pipeline("text-classification", model=self.model_path)

    def predict_url(self, url: str):
        # Mock logic
        malicious_keywords = ["login", "verify", "secure", "update", "bank"]
        if any(kw in url.lower() for kw in malicious_keywords):
            return "Phishing", 0.92, 90
        return "Safe", 0.98, 10

    def predict_email(self, content: str):
        if "urgent" in content.lower() or "password" in content.lower():
             return "Phishing/Spam", 0.85, 75
        return "Safe", 0.95, 5

phishing_model = PhishingDetectionModel()
