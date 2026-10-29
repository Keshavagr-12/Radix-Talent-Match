"""
Local Authentication Router for RADIX Talent Match.
Provides user registration, login, session inspection, and logout
using secure JSON-based persistence (data/users.json) with PBKDF2-HMAC-SHA256
password hashing and HS256 signed JWT tokens.
Completely replaces Supabase Auth with zero external network dependencies.
"""

import os
import json
import time
import hashlib
import secrets
from pathlib import Path
from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(tags=["Authentication"])

# Secure 64-character signing secret
JWT_SECRET = (
    os.getenv("JWT_SECRET")
    or os.getenv("AUTH_SECRET")
    or "radix-talent-match-production-auth-signing-secret-key-32-bytes-minimum!!"
)
if len(JWT_SECRET) < 32:
    JWT_SECRET = JWT_SECRET.ljust(32, "x")

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
CENTRAL_USERS_FILE = ROOT_DIR / "data" / "users.json"
LOCAL_USERS_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "registered_users.json"


def _hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return key.hex(), salt.hex()


def _verify_password(password: str, stored_hash: str, stored_salt_hex: str) -> bool:
    try:
        salt = bytes.fromhex(stored_salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return secrets.compare_digest(key.hex(), stored_hash)
    except Exception:
        return False


def _create_jwt(user_id: str, email: str, name: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + 86400 * 7,  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _decode_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None


def _load_users() -> dict:
    """
    Loads users from central data/users.json or local fallback.
    Returns dict mapping user_id -> user_dict and indexed by email.
    """
    users_by_email = {}
    for path in (CENTRAL_USERS_FILE, LOCAL_USERS_FILE):
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    for k, u in data.items():
                        email = (u.get("email") or k).strip().lower()
                        if email:
                            users_by_email[email] = u
                    if users_by_email:
                        break
            except Exception:
                pass

    # Ensure baseline real candidate demo accounts exist
    defaults = [
        ("rohan.verma@radix.ai", "Rohan Verma", "Password123!", "6d0d6386-b722-4bd5-bfd5-49d24cf3923c"),
        ("ananya.rao@radix.ai", "Ananya Rao", "Password123!", "723bf135-9f63-4ddd-b172-3288463a88c0"),
    ]
    updated = False
    for email, name, pwd, uid in defaults:
        if email not in users_by_email:
            h, s = _hash_password(pwd)
            users_by_email[email] = {
                "id": uid,
                "email": email,
                "name": name,
                "password_hash": h,
                "salt": s,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            updated = True

    if updated:
        _save_users(users_by_email)

    return users_by_email


def _save_users(users_by_email: dict):
    """Saves users atomically to data/users.json and local registered_users.json."""
    for path in (CENTRAL_USERS_FILE, LOCAL_USERS_FILE):
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.parent / f".tmp_{uuid4().hex}_{path.name}"
            tmp.write_text(json.dumps(users_by_email, indent=2), encoding="utf-8")
            os.replace(tmp, path)
        except Exception:
            pass


class SignupRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Full name of user")
    email: EmailStr = Field(..., description="Valid user email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email address")
    password: str = Field(..., min_length=1, description="Account password")


class AuthUser(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    message: str
    user: Optional[AuthUser] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    email_confirmed: bool = True


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def register_user(payload: SignupRequest):
    """
    Registers a new user in local JSON storage with PBKDF2-hashed credentials.
    Rejects duplicate emails with 409 Conflict.
    Issues a valid JWT immediately.
    """
    clean_email = payload.email.strip().lower()
    user_name = payload.name.strip() if payload.name and payload.name.strip() else clean_email.split("@")[0].replace(".", " ").title()

    users = _load_users()
    if clean_email in users:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address is already registered. Please sign in."
        )

    user_id = str(uuid4())
    p_hash, p_salt = _hash_password(payload.password)
    now_iso = datetime.now(timezone.utc).isoformat()

    new_user = {
        "id": user_id,
        "email": clean_email,
        "name": user_name,
        "password_hash": p_hash,
        "salt": p_salt,
        "created_at": now_iso,
    }
    users[clean_email] = new_user
    _save_users(users)

    access_token = _create_jwt(user_id, clean_email, user_name)

    return AuthResponse(
        message="Account created successfully.",
        user=AuthUser(
            id=user_id,
            email=clean_email,
            name=user_name,
            created_at=now_iso
        ),
        access_token=access_token,
        refresh_token=None,
        expires_in=604800,
        email_confirmed=True
    )


@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest):
    """
    Verifies user credentials against local JSON user store.
    Issues signed JWT access token on successful authentication.
    """
    clean_email = payload.email.strip().lower()
    users = _load_users()

    if clean_email in users:
        record = users[clean_email]
        if _verify_password(payload.password, record.get("password_hash", ""), record.get("salt", "")):
            user_id = record["id"]
            user_name = record.get("name") or clean_email.split("@")[0].replace(".", " ").title()
            token = _create_jwt(user_id, clean_email, user_name)

            return AuthResponse(
                message="Login successful.",
                user=AuthUser(
                    id=user_id,
                    email=clean_email,
                    name=user_name,
                    created_at=record.get("created_at")
                ),
                access_token=token,
                refresh_token=None,
                expires_in=604800,
                email_confirmed=True
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password. Please verify your credentials or register a new account."
    )


@router.get("/session")
@router.get("/me")
def get_current_session(authorization: Optional[str] = Header(None)):
    """
    Validates current JWT session against backend signing secret.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header."
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    payload = _decode_jwt(token)
    if payload and payload.get("sub"):
        return {
            "authenticated": True,
            "user": {
                "id": str(payload.get("sub")),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "confirmed_at": datetime.now(timezone.utc).isoformat(),
            }
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session has expired or is invalid. Please log in again."
    )


@router.post("/logout")
def logout_user(authorization: Optional[str] = Header(None)):
    """
    Terminates session cleanly.
    """
    return {"message": "Logged out successfully.", "authenticated": False}
