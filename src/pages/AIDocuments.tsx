import { useState } from "react";
import {
  Bot,
  Send,
  User,
  FileText,
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
              <div className="ai-welcome-stage">
                <div className="ai-speech-bubble">
                  <span>Hey there! 👋</span>
                  <span>How can I help you today?</span>
                </div>

                <svg
                  className="ai-robot"
                  viewBox="0 0 320 300"
                  role="img"
                  aria-label="Friendly purple and white AI assistant robot"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="robot-shell" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff" />
                      <stop offset="1" stopColor="#e9e1f4" />
                    </linearGradient>
                    <linearGradient id="robot-purple" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#b69ae8" />
                      <stop offset="1" stopColor="#7854b7" />
                    </linearGradient>
                    <linearGradient id="robot-screen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#49345f" />
                      <stop offset="1" stopColor="#30213f" />
                    </linearGradient>
                    <filter id="robot-shadow" x="-30%" y="-30%" width="160%" height="170%">
                      <feDropShadow
                        dx="0"
                        dy="8"
                        stdDeviation="8"
                        floodColor="#49345f"
                        floodOpacity=".16"
                      />
                    </filter>
                  </defs>

                  <ellipse cx="160" cy="278" rx="76" ry="12" fill="#bba9d5" opacity=".22" />
                  <g filter="url(#robot-shadow)">
                    <path
                      d="M112 202c0-15 12-27 27-27h42c15 0 27 12 27 27v45c0 11-9 20-20 20h-56c-11 0-20-9-20-20z"
                      fill="url(#robot-shell)"
                      stroke="#ded2ee"
                      strokeWidth="3"
                    />
                    <path d="M135 203h50v43c0 7-6 13-13 13h-24c-7 0-13-6-13-13z" fill="url(#robot-purple)" />
                    <circle cx="160" cy="227" r="10" fill="#f3edfb" />
                    <path d="M113 211c-19-4-27-17-24-31 2-9 9-15 19-16" fill="none" stroke="#9e7bd5" strokeWidth="12" strokeLinecap="round" />
                    <path d="M207 211c19-4 27-17 24-31-2-9-9-15-19-16" fill="none" stroke="#9e7bd5" strokeWidth="12" strokeLinecap="round" />
                    <path d="M146 177v-13h28v13" fill="#bca7d8" />
                    <rect x="83" y="74" width="154" height="123" rx="48" fill="url(#robot-shell)" stroke="#d8cbe9" strokeWidth="3" />
                    <path d="M113 79c15-12 75-14 94 0" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".9" />
                    <rect x="101" y="101" width="118" height="73" rx="31" fill="url(#robot-screen)" />
                    <path d="M147 66V51" stroke="#9673d3" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="147" cy="44" r="11" fill="url(#robot-purple)" />
                    <circle cx="144" cy="41" r="3" fill="#fff" opacity=".8" />
                    <rect x="72" y="116" width="18" height="39" rx="9" fill="url(#robot-purple)" />
                    <rect x="230" y="116" width="18" height="39" rx="9" fill="url(#robot-purple)" />
                    <ellipse cx="137" cy="134" rx="7" ry="10" fill="#fff" />
                    <ellipse cx="183" cy="134" rx="7" ry="10" fill="#fff" />
                    <circle cx="139" cy="132" r="2.5" fill="#d9c9f0" />
                    <circle cx="185" cy="132" r="2.5" fill="#d9c9f0" />
                    <path d="M150 151c6 7 14 7 20 0" fill="none" stroke="#d8b8ff" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="115" cy="151" r="6" fill="#eaaecf" opacity=".8" />
                    <circle cx="205" cy="151" r="6" fill="#eaaecf" opacity=".8" />
                    <path d="M133 190h54" stroke="#c7b5df" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="126" cy="187" r="3" fill="#bca7d8" />
                    <circle cx="194" cy="187" r="3" fill="#bca7d8" />
                  </g>
                  <path d="M77 91l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" fill="#c6a9f5" />
                  <path d="M245 190l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#c6a9f5" />
                </svg>
              </div>

              <h2>Your Intelligent Document Assistant</h2>

              <p>
                Upload your documents and let AI help you summarize, understand,
                analyze and discover important information.
              </p>

              <div className="ai-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                  >
                    <span className="ai-suggestion-icon">
                      <FileText size={17} />
                    </span>
                    <span>{suggestion}</span>
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