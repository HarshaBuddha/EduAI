import json
import re
from retriever import retrieve_context
from llm import get_llm

llm = get_llm()

def generate_quiz(topic, difficulty="Basic", num_questions=5):

    context = retrieve_context(topic)

    prompt = f"""You are an expert teacher.

Use ONLY the syllabus context below to generate quiz questions. Do NOT use outside knowledge.

SYLLABUS CONTEXT:
{context}

TASK:
Generate {num_questions} multiple choice questions on the topic: {topic}
Difficulty level: {difficulty}

STRICT RULES:
- Each question must have exactly 4 options.
- "options" must be an array of 4 strings: the full text of each choice (e.g. "Containerization tool", "A type of VM", ...).
- "answer" must be exactly one letter: "A", "B", "C", or "D" (the letter of the correct option).
- Output MUST be valid JSON only. No code, no expressions like + or [...], no markdown, no explanation.

OUTPUT FORMAT (copy this structure exactly):
[
  {{"question": "Your question here?", "options": ["First choice text", "Second choice text", "Third choice text", "Fourth choice text"], "answer": "A"}},
  {{"question": "Another question?", "options": ["Choice A text", "Choice B text", "Choice C text", "Choice D text"], "answer": "C"}}
]

Return ONLY the JSON array. Nothing else."""

    response = llm.invoke(prompt)
    return _parse_quiz_response(response)


def _parse_quiz_response(response):
    """Extract and parse JSON from LLM response. Returns parsed list or formatted string."""
    if not isinstance(response, str):
        response = str(response)
    # Strip markdown code blocks if present
    text = response.strip()
    match = re.search(r"\[[\s\S]*\]", text)
    if match:
        text = match.group(0)
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return _format_quiz(data)
        return response
    except json.JSONDecodeError:
        return response


def _format_quiz(questions):
    """Format parsed quiz as readable string."""
    lines = []
    for i, q in enumerate(questions, 1):
        if not isinstance(q, dict):
            continue
        question = q.get("question", "?")
        options = q.get("options", [])
        answer = q.get("answer", "")
        lines.append(f"{i}. {question}")
        for letter, opt in zip("ABCD", options[:4]):
            marker = " ✓" if letter == answer else ""
            lines.append(f"   {letter}. {opt}{marker}")
        lines.append("")
    return "\n".join(lines) if lines else str(questions)
