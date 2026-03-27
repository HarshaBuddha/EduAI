# EduAI Backend Workflow

This document explains the current backend setup, route behavior, and how requests flow through the system.

## Current Directory Structure

```text
EduAI/
├─ backend/
│  ├─ main.py
│  ├─ router.py
│  ├─ db.py
│  ├─ models.py
│  ├─ schemas.py
│  ├─ init_db.py
│  ├─ analytics.py
│  └─ routes/
│     ├─ quiz.py
│     ├─ summary.py
│     ├─ chat.py
│     └─ analytics.py
├─ llm.py
├─ retriever.py
├─ summarizer.py
└─ quiz_generator.py
```

## High-Level Backend Setup

1. `backend/main.py` creates the FastAPI app and enables permissive CORS (`*` origins, methods, headers).
2. `backend/router.py` mounts all route modules under one API prefix: `/ai`.
3. Route handlers call service/helper modules in project root (`summarizer.py`, `quiz_generator.py`, `retriever.py`, `llm.py`).
4. Quiz attempts are stored in MySQL using SQLAlchemy (`backend/db.py`, `backend/models.py`).
5. Analytics are computed from quiz attempt history (`backend/analytics.py`).

## API Route Map (Current)

All API routes below are mounted under `/ai` (except root health route).

### `GET /`
- **File:** `backend/main.py`
- **Purpose:** Basic backend health check.
- **Returns:** `{"message": "EduAI Backend Running"}`

### `POST /ai/chat`
- **File:** `backend/routes/chat.py`
- **Request body:** `ChatRequest` from `backend/schemas.py`
  - `question: str`
- **Current flow:**
  1. Retrieve relevant context via `retrieve_context(question)` from `retriever.py`.
  2. Build constrained academic-assistant prompt.
  3. Invoke LLM from `llm.py` (currently `llama3.2:3b`).
  4. Return `{"answer": <model_output>}`.
- **Current functionality:** Context-grounded Q&A over syllabus content.

### `POST /ai/summary`
- **File:** `backend/routes/summary.py`
- **Request body:** `SummaryRequest`
  - `topic: str`
- **Current flow:**
  1. Call `summarize_topic(topic)` in `summarizer.py`.
  2. Summarizer retrieves context (`k=4`) and prompts LLM.
  3. Return `{"summary": <model_output>}`.
- **Current functionality:** Student-friendly topic summaries based on retrieved syllabus context.

### `POST /ai/quiz`
- **File:** `backend/routes/quiz.py`
- **Request body:** `QuizRequest`
  - `topic: str`
  - `difficulty: str = "Basic"`
  - `num_questions: int = 5`
- **Current flow:**
  1. Call `generate_quiz(...)` from `quiz_generator.py`.
  2. Retrieve topic context from vector store.
  3. Prompt LLM to output strict JSON MCQs.
  4. Parse and format response (with answer markers) before return.
  5. Return `{"quiz": <formatted_or_raw_quiz_output>}`.
- **Current functionality:** Generates MCQ quizzes from retrieved syllabus context.

### `POST /ai/submit-quiz`
- **File:** `backend/routes/quiz.py`
- **Input params (query params):**
  - `topic: str`
  - `score: int`
  - `total_questions: int`
- **Current flow:**
  1. Open DB session (`SessionLocal`).
  2. Create `QuizAttempt` row.
  3. Commit and close session.
  4. Return success message.
- **Current functionality:** Persists quiz attempt history in MySQL table `quiz_attempts`.

### `GET /ai/adaptive-quiz`
- **File:** `backend/routes/quiz.py`
- **Current flow:**
  1. `generate_adaptive_quiz()` reads analytics from DB.
  2. Finds weakest topic by average accuracy.
  3. If attempts exist, generates 3 basic questions on weak topic.
  4. If no attempts, returns `"No attempts available yet."`.
- **Current functionality:** Adaptive practice quiz based on weakest topic.

### `GET /ai/analytics`
- **File:** `backend/routes/analytics.py`
- **Current flow:**
  1. Fetch all `QuizAttempt` records.
  2. Compute per-topic average accuracy.
  3. Identify weakest topic.
  4. Return analytics JSON.
- **Returns shape:**
  - With data: `{"weak_topic": "...", "performance": {"topicA": 0.6, ...}}`
  - Without data: `{"weak_topic": None, "performance": {}}`
- **Current functionality:** Performance summary for adaptive learning decisions.

## Core Data and Dependency Notes

### Request Schemas (`backend/schemas.py`)
- `QuizRequest(topic, difficulty="Basic", num_questions=5)`
- `SummaryRequest(topic)`
- `ChatRequest(question)`

### Database Layer
- `backend/db.py`: SQLAlchemy engine and session factory (`SessionLocal`) targeting MySQL `eduai` DB.
- `backend/models.py`: `QuizAttempt` table (`topic`, `score`, `total_questions`, `created_at`).
- `backend/init_db.py`: table creation script using `Base.metadata.create_all(...)`.

### LLM + Retrieval
- `llm.py`: returns `OllamaLLM(model="llama3.2:3b")`.
- `retriever.py`: loads Chroma vector DB from `../vector_db` with `all-MiniLM-L6-v2` embeddings.
- Used by:
  - `chat` route (`retrieve_context` + LLM)
  - `summary` route (`summarizer.py`)
  - `quiz` route (`quiz_generator.py`)

## End-to-End Request Workflows

### Chat Workflow
`Client -> /ai/chat -> retrieve_context -> LLM -> response`

### Summary Workflow
`Client -> /ai/summary -> summarize_topic -> retrieve_context -> LLM -> response`

### Quiz Workflow
`Client -> /ai/quiz -> generate_quiz -> retrieve_context -> LLM -> parse/format -> response`

### Quiz Attempt + Analytics Workflow
`Client -> /ai/submit-quiz -> DB insert -> /ai/analytics -> compute_performance -> weak_topic/performance`

### Adaptive Quiz Workflow
`Client -> /ai/adaptive-quiz -> compute_performance -> weak_topic -> generate_quiz -> response`

## Current Functional Scope (As Implemented)

- Syllabus-context-based chat answers.
- Topic summaries with retrieval-augmented generation.
- Quiz generation with configurable question count and difficulty input.
- Attempt persistence in MySQL.
- Topic-wise performance analytics.
- Adaptive quiz generation from weakest topic.

