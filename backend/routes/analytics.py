from fastapi import APIRouter
from backend.db import SessionLocal
from backend.analytics import compute_performance

router = APIRouter()

@router.get("/analytics")
def get_analytics():

    db = SessionLocal()
    result = compute_performance(db)
    db.close()

    return result
