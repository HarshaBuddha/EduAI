const BASE_URL = "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Chat
  chat: (question) =>
    request("/ai/chat", { method: "POST", body: JSON.stringify({ question }) }),

  // Summary
  summary: (topic) =>
    request("/ai/summary", { method: "POST", body: JSON.stringify({ topic }) }),

  // Quiz generation
  generateQuiz: (topic, difficulty = "Basic", num_questions = 5) =>
    request("/ai/quiz", {
      method: "POST",
      body: JSON.stringify({ topic, difficulty, num_questions }),
    }),

  // Submit quiz attempt
  submitQuiz: (topic, score, total_questions) =>
    request(
      `/ai/submit-quiz?topic=${encodeURIComponent(topic)}&score=${score}&total_questions=${total_questions}`,
      { method: "POST" }
    ),

  // Analytics
  getAnalytics: () => request("/ai/analytics"),

  // Adaptive quiz
  getAdaptiveQuiz: () => request("/ai/adaptive-quiz"),

  // Knowledge base — upload a PDF (multipart/form-data, no JSON Content-Type header)
  uploadPdf: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/ai/knowledge/upload`, {
      method: "POST",
      body: form,
      // Do NOT set Content-Type — browser sets it with the correct boundary
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `Upload failed (${res.status})` }));
      throw Object.assign(new Error(err.detail || "Upload failed"), { status: res.status, detail: err.detail });
    }
    return res.json();
  },
};