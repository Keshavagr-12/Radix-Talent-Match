"""
Configuration module for RADIX Resume Parsing Microservice.
Loads settings from .env file and environment variables.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
_base_dir = Path(__file__).resolve().parent.parent
load_dotenv(_base_dir / ".env")
load_dotenv(_base_dir.parent / ".env")
load_dotenv()

PORT = int(os.getenv("PORT", "8002"))
HOST = os.getenv("HOST", "127.0.0.1")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip()
DATA_DIR = Path(os.getenv("DATA_DIR", str(_base_dir / "data")))
STORAGE_FILE = DATA_DIR / "resumes.json"
