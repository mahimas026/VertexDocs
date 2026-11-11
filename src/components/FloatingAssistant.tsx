import { useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, Send, X } from "lucide-react";
import type { ChatMessage } from "../ai/types";
import { sendToLLM } from "../ai/llmClient";
import { MarkdownRenderer } from "../ai/markdown";
import "./FloatingAssistant.css";

let messageId = 0;

function makeMessage(role: ChatMessage["role"], text: string): ChatMessage {
  messageId += 1;
  return {
    id: `floating-${Date.now()}-${messageId}`,
    role,
    text,
    timestamp: Date.now(),
  };
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages, isLoading]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMessage = makeMessage("user", prompt);
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendToLLM(prompt, [], messages);
      setMessages((previous) => [...previous, makeMessage("assistant", reply)]);
    } catch (error) {
      const text = error instanceof Error ? error.message : "The assistant could not respond. Please try again.";
      setMessages((previous) => [...previous, { ...makeMessage("assistant", text), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="floating-assistant-root">
      {isOpen && (
        <section className="floating-assistant-panel" aria-label="AI assistant">
          <header className="floating-assistant-header">
            <span className="floating-assistant-avatar"><Bot size={19} /></span>
            <span className="floating-assistant-title">
              <strong>AI Assistant</strong>
              <small>Ask anything about your work</small>
            </span>
            <button className="floating-assistant-close" onClick={() => setIsOpen(false)} aria-label="Close assistant">
              <X size={18} />
            </button>
          </header>

          <div className="floating-assistant-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="floating-assistant-welcome">
                <span className="floating-assistant-welcome-icon"><Bot size={22} /></span>
                <strong>How can I help?</strong>
                <p>Ask a question, get a summary, or brainstorm an idea.</p>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`floating-assistant-row ${message.role}`}>
                <div className={`floating-assistant-bubble${message.isError ? " error" : ""}`}>
                  {message.role === "assistant" ? <MarkdownRenderer content={message.text} /> : message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="floating-assistant-row assistant">
                <div className="floating-assistant-bubble loading"><LoaderCircle size={16} /> Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="floating-assistant-form" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Message the assistant…"
              rows={1}
              aria-label="Message the AI assistant"
            />
            <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
              <Send size={17} />
            </button>
          </form>
          <p className="floating-assistant-note">AI can make mistakes. Check important information.</p>
        </section>
      )}

      <button
        className={`floating-assistant-trigger${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} /> : <Bot size={24} />}
        {!isOpen && <span className="floating-assistant-trigger-label">AI</span>}
      </button>
    </div>
  );
}
