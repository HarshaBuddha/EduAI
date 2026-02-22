from pydantic import BaseModel

class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "Basic"
    num_questions: int = 5


class SummaryRequest(BaseModel):
    topic: str


class ChatRequest(BaseModel):
    question: str
