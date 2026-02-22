from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from backend.db import Base

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(255), index=True)
    score = Column(Integer)
    total_questions = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
