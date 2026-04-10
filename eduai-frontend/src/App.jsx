import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import Quiz from "./pages/Quiz";
import Summarizer from "./pages/Summarizer";
import KnowledgeUpload from "./pages/KnowledgeUpload";
import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "chat": return <Chatbot />;
      case "quiz": return <Quiz />;
      case "summarizer": return <Summarizer />;
      case "knowledge": return <KnowledgeUpload />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}