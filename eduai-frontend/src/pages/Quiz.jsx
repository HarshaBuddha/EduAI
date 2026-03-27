import { useState } from "react";
import { api } from "../Api";
import "./Quiz.css";

const DIFFICULTIES = ["Basic", "Intermediate", "Advanced"];
const QUESTION_COUNTS = [3, 5, 10];

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Basic");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [rawQuiz, setRawQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  async function generateQuiz() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setQuiz(null);
    setRawQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setScore(null);

    try {
      const data = await api.generateQuiz(topic.trim(), difficulty, numQuestions);
      const parsed = parseQuiz(data.quiz);
      if (parsed && parsed.length > 0) {
        setQuiz(parsed);
      } else {
        setRawQuiz(data.quiz);
      }
    } catch (e) {
      setError("Failed to generate quiz. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function parseQuiz(raw) {
    // Already an array
    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") {
      // Strip markdown fences
      let cleaned = raw.replace(/```json|```/g, "").trim();

      // The backend sometimes returns a truncated JSON string without closing `]`
      // Try to parse as-is first, then attempt repair
      try {
        const arr = JSON.parse(cleaned);
        if (Array.isArray(arr)) return arr;
      } catch {
        // Attempt to close a truncated array by trimming the last incomplete object
        // Find the last complete `}` before any trailing comma or truncation
        const lastBrace = cleaned.lastIndexOf("}");
        if (lastBrace !== -1) {
          const repaired = cleaned.slice(0, lastBrace + 1) + "]";
          try {
            const arr = JSON.parse(repaired);
            if (Array.isArray(arr)) return arr;
          } catch {}
        }
      }
    }
    return null;
  }

  function selectAnswer(qIdx, optionIdx) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
  }

  async function submitQuiz() {
    if (!quiz) return;
    setSubmitting(true);
    setSubmitError(null);

    let correct = 0;
    quiz.forEach((q, i) => {
      const correctIdx = findCorrectIndex(q);
      if (answers[i] === correctIdx) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    try {
      await api.submitQuiz(topic.trim(), correct, quiz.length);
    } catch {
      setSubmitError("Score could not be saved to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  // Backend returns answer as a letter: "A", "B", "C", "D"
  // Map to 0-based index for options array
  function findCorrectIndex(q) {
    const LETTER_MAP = { A: 0, B: 1, C: 2, D: 3 };

    const answerField = q.answer ?? q.correct_answer;

    if (answerField !== undefined) {
      if (typeof answerField === "number") return answerField;
      if (typeof answerField === "string") {
        const upper = answerField.trim().toUpperCase();
        // Single letter e.g. "A", "B"
        if (upper in LETTER_MAP) return LETTER_MAP[upper];
        // Full option text match
        return q.options?.indexOf(answerField) ?? -1;
      }
    }
    return -1;
  }

  function resetQuiz() {
    setQuiz(null);
    setRawQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setError(null);
  }

  const allAnswered = quiz && Object.keys(answers).length === quiz.length;
  const pct = quiz && score !== null ? Math.round((score / quiz.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Quiz Generator</h1>
        <p>Generate syllabus-grounded MCQs and track your performance</p>
      </div>

      {/* Config panel */}
      <div className="card quiz-config">
        <div className="quiz-config-fields">
          <div className="form-group">
            <label className="form-label">Topic</label>
            <input
              className="form-input"
              placeholder="e.g. OSI Model, Data Structures, Photosynthesis…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <div className="btn-toggle-group">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`btn-toggle ${difficulty === d ? "btn-toggle--active" : ""}`}
                  onClick={() => setDifficulty(d)}
                  disabled={loading}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Questions</label>
            <div className="btn-toggle-group">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  className={`btn-toggle ${numQuestions === n ? "btn-toggle--active" : ""}`}
                  onClick={() => setNumQuestions(n)}
                  disabled={loading}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={generateQuiz}
          disabled={loading || !topic.trim()}
          style={{ alignSelf: "flex-end" }}
        >
          {loading ? <><span className="spinner" /> Generating…</> : "Generate Quiz"}
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ margin: "1rem 0" }}>{error}</div>}

      {/* Quiz display */}
      {quiz && (
        <div className="quiz-section">
          <div className="quiz-meta">
            <span className="badge badge-navy">{topic}</span>
            <span className="badge badge-gold">{difficulty}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{quiz.length} questions</span>
            {!submitted && (
              <button className="btn btn-outline" style={{ marginLeft: "auto", padding: "0.3rem 0.75rem", fontSize: "13px" }} onClick={resetQuiz}>
                Reset
              </button>
            )}
          </div>

          {/* Score banner */}
          {submitted && (
            <div className={`score-banner ${pct >= 70 ? "score-banner--pass" : "score-banner--fail"}`}>
              <div className="score-number">{score}/{quiz.length}</div>
              <div className="score-label">{pct}% — {pct >= 70 ? "Well done!" : "Keep practising"}</div>
              {submitError && <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>{submitError}</div>}
              <button className="btn" style={{ marginTop: "0.75rem", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }} onClick={resetQuiz}>
                New Quiz
              </button>
            </div>
          )}

          {/* Questions */}
          <div className="questions-list">
            {quiz.map((q, qi) => {
              const correctIdx = findCorrectIndex(q);
              const userAns = answers[qi];
              return (
                <div key={qi} className={`question-card ${submitted ? (userAns === correctIdx ? "question-card--correct" : "question-card--wrong") : ""}`}>
                  <div className="question-number">Q{qi + 1}</div>
                  <div className="question-text">{q.question}</div>
                  <div className="options-list">
                    {(q.options || []).map((opt, oi) => {
                      let cls = "option";
                      if (submitted) {
                        if (oi === correctIdx) cls += " option--correct";
                        else if (oi === userAns && oi !== correctIdx) cls += " option--wrong";
                      } else if (userAns === oi) {
                        cls += " option--selected";
                      }
                      return (
                        <button key={oi} className={cls} onClick={() => selectAnswer(qi, oi)}>
                          <span className="option-label">{OPTION_LABELS[oi]}</span>
                          <span className="option-text">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!submitted && (
            <button
              className="btn btn-primary"
              style={{ marginTop: "1rem", width: "100%", padding: "0.75rem" }}
              onClick={submitQuiz}
              disabled={!allAnswered || submitting}
            >
              {submitting ? <><span className="spinner" /> Submitting…</> : allAnswered ? "Submit Quiz" : `Answer all ${quiz.length} questions to submit`}
            </button>
          )}
        </div>
      )}

      {/* Raw quiz fallback */}
      {rawQuiz && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card-title">Quiz</div>
          <pre style={{ fontFamily: "var(--font-body)", fontSize: "13px", whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--text-secondary)" }}>
            {typeof rawQuiz === "string" ? rawQuiz : JSON.stringify(rawQuiz, null, 2)}
          </pre>
          <button className="btn btn-outline" style={{ marginTop: "1rem" }} onClick={resetQuiz}>Reset</button>
        </div>
      )}
    </div>
  );
}