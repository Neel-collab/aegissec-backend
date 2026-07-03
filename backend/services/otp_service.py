import random
import string
import bcrypt
from datetime import datetime, timedelta


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP of given length."""
    return "".join(random.choices(string.digits, k=length))


def hash_otp(otp: str) -> str:
    """Hash the OTP using bcrypt."""
    return bcrypt.hashpw(otp.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_otp(otp: str, hashed: str) -> bool:
    """Verify an OTP against its hash."""
    try:
        return bcrypt.checkpw(otp.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def is_otp_expired(created_at: datetime, expire_minutes: int = 10) -> bool:
    """Check if the OTP has expired."""
    return datetime.utcnow() > created_at + timedelta(minutes=expire_minutes)
