from fastapi import APIRouter
from backend.schemas import SummaryRequest
from summarizer import summarize_topic

router = APIRouter()

@router.post("/summary")
def create_summary(data: SummaryRequest):

    result = summarize_topic(data.topic)
    return {"summary": result}
