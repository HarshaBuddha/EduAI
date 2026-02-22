from fastapi import APIRouter
from backend.schemas import ChatRequest
from retriever import retrieve_context
from llm import get_llm

router = APIRouter()
llm = get_llm()

@router.post("/chat")
def chat(data: ChatRequest):

    context = retrieve_context(data.question)

    prompt = f"""
You are a helpful academic assistant.

Use ONLY the syllabus context below.

CONTEXT:
{context}

QUESTION:
{data.question}

Answer clearly and concisely.
"""

    response = llm.invoke(prompt)

    return {"answer": response}
