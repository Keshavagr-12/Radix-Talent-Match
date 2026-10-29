import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path to ensure absolute and relative imports resolve cleanly
_backend_dir = str(Path(__file__).resolve().parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.talent_check_router import router

app = FastAPI(
    title="RADIX Talent Check API",
    description="Candidate skill-gap analysis, company benchmark comparison, and readiness scoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def home():
    return {
        "service": "RADIX Talent Check API",
        "status": "online",
        "endpoints": [
            "/talent-check/companies",
            "/talent-check/check",
            "/talent-check/evaluate",
            "/talent-check/evaluations",
            "/health",
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "talent_check",
        "port": 8004,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8004, reload=True)
