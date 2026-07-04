from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from models.user import (
    UserCreate, UserResponse, Token, UserInDB, MFAVerify,
    ForgotPasswordRequest, ResetPasswordRequest, FaceLoginRequest,
    FaceEnrollRequest, UserUpdate, ChangePasswordRequest
)
from core.security import get_password_hash, verify_password, create_access_token
from services.otp_service import generate_otp, hash_otp, verify_otp, is_otp_expired
from services.email_service import send_otp_email
from services.face_service import extract_face_embedding, verify_face
from db.mongodb import get_db
from core.config import settings
from datetime import datetime
import uuid
import jwt

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_db()
    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    db = get_db()
    existing = await db["users"].find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "department": user.department,
        "phone": user.phone,
        "hashed_password": get_password_hash(user.password),
        "created_at": datetime.utcnow(),
        "is_active": True,
        "mfa_enabled": False,
        "face_embedding": None,
        "otp_hash": None,
        "otp_created_at": None,
        "otp_purpose": None,
    }
    await db["users"].insert_one(new_user)
    return UserResponse(
        id=new_user["id"], email=new_user["email"], full_name=new_user["full_name"],
        role=new_user["role"], department=new_user["department"], phone=new_user["phone"],
        is_active=True, created_at=new_user["created_at"], mfa_enabled=False, has_face_id=False
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if user.get("mfa_enabled"):
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        await db["users"].update_one(
            {"id": user["id"]},
            {"$set": {"otp_hash": otp_hash, "otp_created_at": datetime.utcnow(), "otp_purpose": "mfa"}}
        )
        success = await send_otp_email(user["email"], otp, "mfa", user["full_name"])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send verification email. Please ensure the email address is valid or try again later.")
        return Token(access_token="", token_type="bearer", requires_mfa=True, user_id=user["id"])

    token = create_access_token(subject=user["id"])
    return Token(access_token=token, token_type="bearer", requires_mfa=False)


@router.post("/verify-mfa", response_model=Token)
async def verify_mfa(data: MFAVerify):
    db = get_db()
    user = await db["users"].find_one({"id": data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("otp_hash") or user.get("otp_purpose") != "mfa":
        raise HTTPException(status_code=400, detail="No pending MFA verification")
    if is_otp_expired(user["otp_created_at"]):
        raise HTTPException(status_code=400, detail="OTP has expired")
    if not verify_otp(data.otp, user["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db["users"].update_one(
        {"id": data.user_id},
        {"$set": {"otp_hash": None, "otp_created_at": None, "otp_purpose": None}}
    )
    token = create_access_token(subject=data.user_id)
    return Token(access_token=token, token_type="bearer", requires_mfa=False)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    db = get_db()
    user = await db["users"].find_one({"email": data.email})
    if not user:
        # Return success even if not found (security best practice)
        return {"message": "If this email exists, an OTP has been sent"}

    otp = generate_otp()
    otp_hash = hash_otp(otp)
    await db["users"].update_one(
        {"id": user["id"]},
        {"$set": {"otp_hash": otp_hash, "otp_created_at": datetime.utcnow(), "otp_purpose": "password_reset"}}
    )
    success = await send_otp_email(user["email"], otp, "password_reset", user["full_name"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send password reset email. Please try again later.")
    return {"message": "OTP sent to your email", "user_id": user["id"]}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    db = get_db()
    user = await db["users"].find_one({"id": data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("otp_hash") or user.get("otp_purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="No pending password reset")
    if is_otp_expired(user["otp_created_at"]):
        raise HTTPException(status_code=400, detail="OTP has expired")
    if not verify_otp(data.otp, user["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db["users"].update_one(
        {"id": data.user_id},
        {"$set": {
            "hashed_password": get_password_hash(data.new_password),
            "otp_hash": None, "otp_created_at": None, "otp_purpose": None
        }}
    )
    return {"message": "Password reset successfully"}


@router.post("/enroll-face")
async def enroll_face(data: FaceEnrollRequest):
    db = get_db()
    user = await db["users"].find_one({"id": data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    embedding = extract_face_embedding(data.image_base64)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in the image. Please try again with better lighting.")

    await db["users"].update_one(
        {"id": data.user_id},
        {"$set": {"face_embedding": embedding}}
    )
    return {"message": "Face ID enrolled successfully"}


@router.post("/face-login", response_model=Token)
async def face_login(data: FaceLoginRequest):
    db = get_db()
    user = await db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("face_embedding"):
        raise HTTPException(status_code=400, detail="Face ID not enrolled for this account")

    is_match, confidence = verify_face(data.image_base64, user["face_embedding"])
    if not is_match:
        raise HTTPException(status_code=401, detail=f"Face not recognized (confidence: {confidence:.1f}%)")

    token = create_access_token(subject=user["id"])
    return Token(access_token=token, token_type="bearer", requires_mfa=False)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], email=current_user["email"],
        full_name=current_user["full_name"], role=current_user.get("role", "analyst"),
        department=current_user.get("department"), phone=current_user.get("phone"),
        is_active=current_user.get("is_active", True),
        created_at=current_user["created_at"],
        mfa_enabled=current_user.get("mfa_enabled", False),
        has_face_id=bool(current_user.get("face_embedding"))
    )


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db["users"].update_one({"id": current_user["id"]}, {"$set": update_data})
    updated = await db["users"].find_one({"id": current_user["id"]})
    return UserResponse(
        id=updated["id"], email=updated["email"], full_name=updated["full_name"],
        role=updated.get("role", "analyst"), department=updated.get("department"),
        phone=updated.get("phone"), is_active=updated.get("is_active", True),
        created_at=updated["created_at"], mfa_enabled=updated.get("mfa_enabled", False),
        has_face_id=bool(updated.get("face_embedding"))
    )


@router.put("/me/change-password")
async def change_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    db = get_db()
    await db["users"].update_one(
        {"id": current_user["id"]},
        {"$set": {"hashed_password": get_password_hash(data.new_password)}}
    )
    return {"message": "Password changed successfully"}


@router.put("/me/toggle-mfa")
async def toggle_mfa(current_user: dict = Depends(get_current_user)):
    db = get_db()
    new_val = not current_user.get("mfa_enabled", False)
    await db["users"].update_one({"id": current_user["id"]}, {"$set": {"mfa_enabled": new_val}})
    return {"mfa_enabled": new_val}
