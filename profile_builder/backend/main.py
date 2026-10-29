import sys
from pathlib import Path
from datetime import datetime, timezone

# Ensure backend directory is first in sys.path
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) in sys.path:
    sys.path.remove(str(_backend_dir))
sys.path.insert(0, str(_backend_dir))

# Evict conflicting top-level 'app' if imported from another module in test suite
if "app" in sys.modules:
    _app_mod = sys.modules["app"]
    _app_file = getattr(_app_mod, "__file__", "") or ""
    _app_paths = getattr(_app_mod, "__path__", [])
    if str(_backend_dir / "app") not in _app_file and not any(str(_backend_dir) in p for p in _app_paths):
        del sys.modules["app"]
        for _mod_name in list(sys.modules.keys()):
            if _mod_name.startswith("app."):
                del sys.modules[_mod_name]

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.profile_routes import router as profile_router
from app.routes.auth_routes import router as auth_router

app = FastAPI(
    title="RADIX Talent Match - Profile Builder",
    description="Candidate profile creation, management, and Supabase authentication API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],
)

app.include_router(
    auth_router,
    prefix="/auth",
    include_in_schema=False,
)

app.include_router(
    profile_router,
    prefix="/api/profiles",
    tags=["Profiles"],
)

@app.get("/")
def home():
    return {
        "message": "Profile Builder API is running",
        "service": "RADIX Profile Builder API",
        "status": "online",
        "endpoints": ["/api/profiles", "/api/profiles/resume", "/health"]
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "profile_builder",
        "port": 8003,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8003, reload=True)
