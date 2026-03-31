from fastapi import APIRouter
from logger_store import logs

router = APIRouter()

@router.get("/logs")
def get_logs():
    return logs[::-1]  # newest first
