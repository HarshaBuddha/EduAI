import { useState, useRef, useEffect } from "react";
import { api } from "../Api";
import "./Chatbot.css";

const WELCOME = {
  role: "assistant",
  text: "Hello! I'm your academic assistant, grounded in your syllabus. Ask me anything about your course topics.",
};

export default function Chatbot() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.chat(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered an error reaching the backend. Please check that the server is running.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([WELCOME]);
  }

  return (
    <div className="chat-page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>AI Assistant</h1>
          <p>Syllabus-grounded academic question answering</p>
        </div>
        <button className="btn btn-outline" onClick={clearChat} style={{ marginBottom: "1px" }}>
          Clear chat
        </button>
      </div>

      <div className="chat-container card">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
          {loading && (
            <div className="bubble bubble--assistant">
              <div className="bubble-avatar bubble-avatar--ai">AI</div>
              <div className="bubble-body bubble-body--typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            className="form-textarea chat-textarea"
            placeholder="Ask about any syllabus topic…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ alignSelf: "flex-end" }}
          >
            {loading ? <span className="spinner" /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
              </svg>
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"}`}>
      {!isUser && (
        <div className={`bubble-avatar bubble-avatar--ai ${message.isError ? "bubble-avatar--error" : ""}`}>
          AI
        </div>
      )}
      <div className={`bubble-body ${isUser ? "bubble-body--user" : "bubble-body--assistant"} ${message.isError ? "bubble-body--error" : ""}`}>
        {message.text}
      </div>
      {isUser && <div className="bubble-avatar bubble-avatar--user">You</div>}
    </div>
  );
}