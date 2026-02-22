from sqlalchemy.orm import Session
from backend.models import QuizAttempt
from collections import defaultdict

def compute_performance(db: Session):

    attempts = db.query(QuizAttempt).all()

    topic_scores = defaultdict(list)

    for a in attempts:
        if a.total_questions == 0:
            continue

        accuracy = a.score / a.total_questions
        topic_scores[a.topic].append(accuracy)

    performance = {}

    for topic, scores in topic_scores.items():
        performance[topic] = sum(scores) / len(scores)

    if not performance:
        return {"weak_topic": None, "performance": {}}

    weak_topic = min(performance, key=performance.get)

    return {
        "weak_topic": weak_topic,
        "performance": performance
    }
