import sys
from pathlib import Path

# Allow importing Phase-2 modules (retriever, llm) when running from Summarizer/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from retriever import retrieve_context
from llm import get_llm

llm = get_llm()

def summarize_topic(topic):

    context = retrieve_context(topic, k=4)

    prompt = f"""
You are an academic summarization assistant.

Use ONLY the syllabus content below.

SYLLABUS TEXT:
{context}

TASK:
Write a concise, clear summary of the topic: {topic}

RULES:
- Must be syllabus-aligned
- Must not invent information
- Keep it student-friendly
- 150–200 words

Return only the summary.
"""

    response = llm.invoke(prompt)
    return response
