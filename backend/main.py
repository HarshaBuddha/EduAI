from fastapi import FastAPI
from backend.router import api_router

app = FastAPI(title="EduAI Backend")

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "EduAI Backend Running"}
