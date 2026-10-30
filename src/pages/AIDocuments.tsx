import { useState } from "react";
import {
  Bot,
  Send,
  User,
  FileText,
  Sparkles,
  Trash2,
  Paperclip,
} from "lucide-react";
import "./AIDocuments.css";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const suggestions = [
  "Summarize my document",
  "Explain this document in simple words",
  "Find important points",
  "Generate questions from my document",
];

export default function AIDocuments() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
      {
        role: "assistant",
        text: "This is a demo response. AI document analysis will be available after connecting the backend and AI service.",
      },
    ]);

    setInput("");
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div>
          <h1>AI Documents</h1>
          <p>Your intelligent assistant for understanding documents.</p>
        </div>

        <button className="clear-chat" onClick={clearChat}>
          <Trash2 size={16} />
          Clear Chat
        </button>
      </div>

      <div className="ai-workspace">
        <div className="ai-chat-header">
          <div className="ai-bot-icon">
            <Bot size={24} />
          </div>

          <div>
            <h3>Vertex AI Assistant</h3>
            <span className="ai-status">Frontend demo</span>
          </div>
        </div>

        <div className="ai-chat-area">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <Sparkles size={30} />
              </div>

              <h2>How can I help you today?</h2>

              <p>
                Ask questions, understand documents, and get help with your
                document-related tasks.
              </p>

              <div className="ai-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                  >
                    <FileText size={17} />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`ai-message ${
                    message.role === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  <div className="message-avatar">
                    {message.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>

                  <div className="message-content">
                    <strong>
                      {message.role === "user" ? "You" : "Vertex AI"}
                    </strong>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ai-input-area">
          <button
            className="attach-button"
            title="Attach document (not available in demo)"
            aria-label="Attach document"
            disabled
          >
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            placeholder="Ask anything about your document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send size={19} />
          </button>
        </div>

        <p className="ai-disclaimer">
          AI responses are for assistance only. Verify important information
          before using it.
        </p>
      </div>
    </div>
  );
}