from quiz_generator import generate_quiz

quiz = generate_quiz(
    topic="DevOps",
    difficulty="Intermediate",
    num_questions=3
)

print(quiz)
