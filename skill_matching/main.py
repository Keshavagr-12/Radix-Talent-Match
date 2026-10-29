import os
import sys
import importlib.util
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure skill_matching directory and project root are in sys.path
_current_dir = Path(__file__).resolve().parent
_root_dir = _current_dir.parent

if str(_current_dir) not in sys.path:
    sys.path.insert(0, str(_current_dir))
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

load_dotenv(_current_dir / ".env")
load_dotenv()

# Safely import router without collision with other modules' "api" folders
try:
    from skill_matching.api.routes import router
except (ModuleNotFoundError, ImportError):
    try:
        routes_path = _current_dir / "api" / "routes.py"
        spec = importlib.util.spec_from_file_location("skill_matching_routes_mod", str(routes_path))
        mod = importlib.util.module_from_spec(spec)
        sys.modules["skill_matching_routes_mod"] = mod
        spec.loader.exec_module(mod)
        router = mod.router
    except Exception as exc:
        raise ImportError(f"Failed to load skill matching router: {exc}")

app = FastAPI(
    title="RADIX Skill Matching API",
    description="Fuzzy & semantic skill comparison between Candidate Profiles and Job Descriptions (Role 5)",
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
        "service": "RADIX Skill Matching API",
        "version": "1.0.0",
        "status": "online",
        "port": 8005,
        "endpoints": [
            "/skill-matching/compare",
            "/skill-matching/match",
            "/skill-matching/candidates",
            "/skill-matching/jds",
            "/skill-matching/history",
            "/health"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8005))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
