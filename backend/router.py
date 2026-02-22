from fastapi import APIRouter
from backend.routes import quiz, summary, chat

api_router = APIRouter()

api_router.include_router(quiz.router, prefix="/ai", tags=["Quiz"])
api_router.include_router(summary.router, prefix="/ai", tags=["Summary"])
api_router.include_router(chat.router, prefix="/ai", tags=["Chat"])
