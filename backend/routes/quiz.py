from fastapi import APIRouter
from backend.schemas import QuizRequest
from quiz_generator import generate_quiz

router = APIRouter()

@router.post("/quiz")
def create_quiz(data: QuizRequest):

    result = generate_quiz(
        topic=data.topic,
        difficulty=data.difficulty,
        num_questions=data.num_questions
    )

    return {"quiz": result}
