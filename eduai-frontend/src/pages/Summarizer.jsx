import { useState } from "react";
import { api } from "../Api";
import "./Summarizer.css";

const QUICK_TOPICS = [
  "OSI Model", "Data Structures", "Operating Systems",
  "Photosynthesis", "Newton's Laws", "SQL Joins",
];

export default function Summarizer() {
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSummary(t) {
    const topicToFetch = (t || topic).trim();
    if (!topicToFetch) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const data = await api.summary(topicToFetch);
      setSummary({ topic: topicToFetch, text: data.summary });
      setTopic(topicToFetch);
    } catch {
      setError("Failed to fetch summary. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") fetchSummary();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Topic Summarizer</h1>
        <p>Get concise, syllabus-grounded summaries for any topic</p>
      </div>

      <div className="card summary-input-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Enter a topic</label>
          <div className="summary-input-row">
            <input
              className="form-input"
              placeholder="e.g. TCP/IP Protocol, Binary Search Trees…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={() => fetchSummary()}
              disabled={loading || !topic.trim()}
            >
              {loading ? <><span className="spinner" /> Summarizing…</> : "Summarize"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <p className="form-label">Quick topics</p>
          <div className="quick-topics">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t}
                className="quick-topic-pill"
                onClick={() => { setTopic(t); fetchSummary(t); }}
                disabled={loading}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginTop: "1rem" }}>{error}</div>
      )}

      {loading && (
        <div className="summary-loading">
          <span className="spinner spinner-dark" />
          <span>Retrieving context and generating summary…</span>
        </div>
      )}

      {summary && !loading && (
        <div className="summary-result card">
          <div className="summary-header">
            <span className="badge badge-navy">{summary.topic}</span>
            <button
              className="btn btn-outline"
              style={{ padding: "0.3rem 0.75rem", fontSize: "13px" }}
              onClick={() => setSummary(null)}
            >
              Clear
            </button>
          </div>
          <hr className="divider" />
          <div className="summary-body">
            {formatSummary(summary.text)}
          </div>
          <div className="summary-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Generated from your uploaded syllabus content
          </div>
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="empty-state" style={{ marginTop: "3rem" }}>
          <div className="empty-state-icon">📄</div>
          <p>Enter a topic above to get a concise academic summary.</p>
        </div>
      )}
    </div>
  );
}

function formatSummary(text) {
  if (!text) return null;
  // Split on double newlines for paragraphs
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    // Detect bullet-like lines
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const items = trimmed.split("\n").filter(Boolean);
      return (
        <ul key={i} className="summary-list">
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^[-•]\s*/, "")}</li>
          ))}
        </ul>
      );
    }
    return <p key={i} className="summary-para">{trimmed}</p>;
  });
}