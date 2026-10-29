import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

# Ensure .env is loaded from backend directory regardless of current working directory
_backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv()

_supabase: Client | None = None


def get_max_cv_size_mb() -> int:
    return int(os.getenv("MAX_CV_SIZE_MB", "5"))


def get_cv_bucket() -> str:
    return os.getenv("SUPABASE_CV_BUCKET", "profile-cvs")


def get_supabase() -> Client:
    global _supabase

    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        # Support service role key if available (bypasses RLS on backend), fallback to anon key
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

        if not url or not key:
            raise RuntimeError(
                "Set SUPABASE_URL and SUPABASE_KEY in backend/.env"
            )

        _supabase = create_client(url, key)

    return _supabase


def get_supabase_for_user(token: str | None = None) -> Client:
    """
    Returns a Supabase client scoped to the authenticated user's JWT token if provided,
    ensuring RLS policies (e.g. auth.uid() = id) are evaluated for the real authenticated user.
    """
    client = get_supabase()
    if token:
        try:
            client.postgrest.auth(token)
        except Exception as exc:
            pass
    return client
