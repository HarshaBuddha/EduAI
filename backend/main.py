from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.router import api_router

app = FastAPI(title="EduAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "EduAI Backend Running"}
