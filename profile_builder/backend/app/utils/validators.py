import os
from pathlib import Path
from fastapi import HTTPException, UploadFile

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


def get_max_cv_size_mb() -> int:
    return int(os.getenv("MAX_CV_SIZE_MB", "5"))


async def validate_cv(file: UploadFile) -> bytes:
    filename = Path(file.filename or "resume.pdf").name
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX resumes are supported.",
        )

    content = await file.read()
    await file.seek(0)

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded resume is empty.")

    max_size_mb = get_max_cv_size_mb()
    max_size = max_size_mb * 1024 * 1024

    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Resume exceeds the {max_size_mb} MB limit.",
        )

    return content
