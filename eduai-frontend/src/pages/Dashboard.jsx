import { useState, useEffect } from "react";
import { api } from "../Api";
import "./Dashboard.css";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [adaptiveQuiz, setAdaptiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [analyticsData, adaptiveData] = await Promise.all([
        api.getAnalytics(),
        api.getAdaptiveQuiz().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setAdaptiveQuiz(adaptiveData);
    } catch (e) {
      setError("Unable to load analytics. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const performance = analytics?.performance || {};
  const topics = Object.entries(performance);
  const totalAttempts = topics.length;
  const overallAvg =
    totalAttempts > 0
      ? topics.reduce((sum, [, v]) => sum + v, 0) / totalAttempts
      : 0;

  const strongTopics = topics.filter(([, v]) => v >= 0.7);
  const weakTopics = topics.filter(([, v]) => v < 0.7);

  return (
    <div>
      <div className="page-header">
        <h1>Learning Dashboard</h1>
        <p>Track your progress and identify areas for improvement</p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {loading ? (
        <div className="dash-loading">
          <span className="spinner spinner-dark"></span>
          <span>Loading analytics…</span>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Overall Accuracy</div>
              <div className="stat-value">{(overallAvg * 100).toFixed(0)}%</div>
              <div className="stat-sub">Across all topics</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Topics Attempted</div>
              <div className="stat-value">{totalAttempts}</div>
              <div className="stat-sub">Unique topics</div>
            </div>
            <div className="stat-card stat-card--gold">
              <div className="stat-label">Weak Topic</div>
              <div className="stat-value stat-value--sm">
                {analytics?.weak_topic || "—"}
              </div>
              <div className="stat-sub">Needs attention</div>
            </div>
            <div className="stat-card stat-card--green">
              <div className="stat-label">Strong Topics</div>
              <div className="stat-value">{strongTopics.length}</div>
              <div className="stat-sub">Above 70% accuracy</div>
            </div>
          </div>

          <div className="dash-two-col">
            {/* Performance Breakdown */}
            <div className="card">
              <div className="card-title">Topic Performance</div>
              {topics.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <p>No quiz attempts yet. Take a quiz to see your performance.</p>
                </div>
              ) : (
                <div className="topic-list">
                  {topics
                    .sort(([, a], [, b]) => b - a)
                    .map(([topic, accuracy]) => (
                      <div key={topic} className="topic-row">
                        <div className="topic-row-header">
                          <span className="topic-name">{topic}</span>
                          <span
                            className={`topic-pct ${
                              accuracy >= 0.7 ? "topic-pct--good" : "topic-pct--weak"
                            }`}
                          >
                            {(accuracy * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${
                              accuracy >= 0.7 ? "" : "progress-fill--weak"
                            }`}
                            style={{ width: `${accuracy * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Adaptive Quiz Panel */}
            <div className="card">
              <div className="card-title">Adaptive Practice</div>
              {!adaptiveQuiz || !Array.isArray(adaptiveQuiz.adaptive_quiz) || adaptiveQuiz.adaptive_quiz.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🎯</div>
                  <p>
                    Complete at least one quiz to unlock adaptive practice
                    questions tailored to your weak areas.
                  </p>
                </div>
              ) : (
                <div>
                  {analytics?.weak_topic && (
                    <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
                      Focusing on: <strong>{analytics.weak_topic}</strong>
                    </div>
                  )}
                  <AdaptiveQuizPreview questions={adaptiveQuiz.adaptive_quiz} />
                </div>
              )}

              <button
                className="btn btn-outline"
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={loadData}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Weak vs Strong breakdown */}
          {topics.length > 0 && (
            <div className="card" style={{ marginTop: "1.5rem" }}>
              <div className="card-title">Topic Overview</div>
              <div className="topics-overview">
                <div>
                  <p className="overview-label overview-label--weak">
                    Needs Improvement ({weakTopics.length})
                  </p>
                  <div className="overview-tags">
                    {weakTopics.length === 0 ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        None — great job!
                      </span>
                    ) : (
                      weakTopics.map(([t]) => (
                        <span key={t} className="badge badge-danger">
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="overview-label overview-label--good">
                    Strong ({strongTopics.length})
                  </p>
                  <div className="overview-tags">
                    {strongTopics.length === 0 ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        Keep practicing!
                      </span>
                    ) : (
                      strongTopics.map(([t]) => (
                        <span key={t} className="badge badge-success">
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Renders the adaptive_quiz array: [{ question, options, answer: "A"|"B"|... }]
function AdaptiveQuizPreview({ questions }) {
  const LETTER_MAP = { A: 0, B: 1, C: 2, D: 3 };

  return (
    <div className="adaptive-questions">
      {questions.map((q, i) => {
        const correctIdx = LETTER_MAP[q.answer?.trim().toUpperCase()] ?? -1;
        return (
          <div key={i} className="adaptive-question">
            <div className="adaptive-q-num">Q{i + 1}</div>
            <div className="adaptive-q-text">{q.question}</div>
            <div className="adaptive-options">
              {(q.options || []).map((opt, oi) => (
                <div
                  key={oi}
                  className={`adaptive-option ${oi === correctIdx ? "adaptive-option--correct" : ""}`}
                >
                  <span className="adaptive-opt-label">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="adaptive-opt-text">{opt}</span>
                  {oi === correctIdx && (
                    <span className="adaptive-correct-mark">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}