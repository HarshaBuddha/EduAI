from fastapi import APIRouter
from backend.schemas import QuizRequest
from quiz_generator import generate_quiz

from backend.db import SessionLocal
from backend.models import QuizAttempt
from quiz_generator import generate_adaptive_quiz


router = APIRouter()

@router.post("/quiz")
def create_quiz(data: QuizRequest):

    result = generate_quiz(
        topic=data.topic,
        difficulty=data.difficulty,
        num_questions=data.num_questions
    )

    return {"quiz": result}

@router.post("/submit-quiz")
def submit_quiz(topic: str, score: int, total_questions: int):

    db = SessionLocal()

    attempt = QuizAttempt(
        topic=topic,
        score=score,
        total_questions=total_questions
    )

    db.add(attempt)
    db.commit()
    db.close()

    return {"message": "Quiz attempt stored in MySQL"}

@router.get("/adaptive-quiz")
def adaptive_quiz():

    result = generate_adaptive_quiz()
    return {"adaptive_quiz": result}


