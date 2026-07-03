from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "analyst"
    department: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    is_active: bool = True
    mfa_enabled: bool = False
    face_embedding: Optional[List[float]] = None
    otp_hash: Optional[str] = None
    otp_created_at: Optional[datetime] = None
    otp_purpose: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    mfa_enabled: bool
    has_face_id: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str
    requires_mfa: bool = False
    user_id: Optional[str] = None


class MFAVerify(BaseModel):
    user_id: str
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    user_id: str
    otp: str
    new_password: str


class FaceLoginRequest(BaseModel):
    image_base64: str
    email: EmailStr


class FaceEnrollRequest(BaseModel):
    image_base64: str
    user_id: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
