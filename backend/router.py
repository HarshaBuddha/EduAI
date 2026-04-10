from fastapi import APIRouter
from backend.routes import analytics, chat, knowledge, quiz, summary

api_router = APIRouter()

api_router.include_router(quiz.router, prefix="/ai", tags=["Quiz"])
api_router.include_router(summary.router, prefix="/ai", tags=["Summary"])
api_router.include_router(chat.router, prefix="/ai", tags=["Chat"])
api_router.include_router(analytics.router, prefix="/ai", tags=["Analytics"])
api_router.include_router(knowledge.router, prefix="/ai", tags=["Knowledge"])
