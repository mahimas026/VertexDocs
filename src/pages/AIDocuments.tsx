import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  FileText,
  FileImage,
  Trash2,
  Paperclip,
  X,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  Loader2,
  UploadCloud,
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AttachedDocument, ChatMessage, ReplyLanguage } from "../ai/types";
import {
  validateFile,
  processAttachedFile,
  formatFileSize,
} from "../ai/extract";
import { sendToLLM } from "../ai/llmClient";
import { MarkdownRenderer } from "../ai/markdown";
import {
  getVoiceLanguageTag,
  speakText,
  stopSpeaking,
} from "../ai/voice";
import { useSpeechRecognition } from "../ai/useSpeechRecognition";
import "./AIDocuments.css";

const suggestions = [
  "Summarize my document",
  "Explain this document in simple words",
  "Find important points",
  "Generate questions from my document",
];

let globalMsgCounter = 0;
function createMessage(
  role: "user" | "assistant",
  text: string,
  extra: Partial<ChatMessage> = {}
): ChatMessage {
  globalMsgCounter += 1;
  return {
    id: `${role}-${Date.now()}-${globalMsgCounter}`,
    role,
    text,
    timestamp: Date.now(),
    ...extra,
  };
}

export default function AIDocuments() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyLanguage, setReplyLanguage] = useState<ReplyLanguage>("auto");

  // Voice Assistant states
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSendAfterSpeaking, setAutoSendAfterSpeaking] = useState(false);
  const [autoReadReplies, setAutoReadReplies] = useState(false);

  const [isGroqConfigured, setIsGroqConfigured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const autoReadRef = useRef<boolean>(false);

  useEffect(() => {
    autoReadRef.current = autoReadReplies;
  }, [autoReadReplies]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/chat/status")
      .then((response) => response.json())
      .then((status) => setIsGroqConfigured(Boolean(status.configured)))
      .catch(() => setIsGroqConfigured(false));
  }, []);

  // Auto-scroll to the bottom of the chat area on message update or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Adjust textarea height when input changes (e.g. from speech or reset)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  const stopVoiceOutput = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
  };

  const {
    isListening,
    voiceStatus,
    isRecognitionSupported,
    toggleVoiceInput,
    stopVoiceInput,
    notifyManualInput,
  } = useSpeechRecognition({
    input,
    setInput,
    replyLanguage,
    autoSendAfterSpeaking,
    onSend: (text) => void handleSend(text),
    onBeforeStart: stopVoiceOutput,
  });

  // Clean up voice synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const toggleReadMessage = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      stopVoiceOutput();
      return;
    }

    // Stop microphone if currently listening
    stopVoiceInput();

    setSpeakingMessageId(messageId);
    const langTag = getVoiceLanguageTag(replyLanguage);

    speakText(
      text,
      langTag,
      () => {
        setSpeakingMessageId((current) =>
          current === messageId ? null : current
        );
      },
      () => {
        setSpeakingMessageId((current) =>
          current === messageId ? null : current
        );
      }
    );
  };

  const handleFiles = async (filesToAdd: File[]) => {
    setFileError("");
    const validFiles: File[] = [];

    for (const file of filesToAdd) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setFileError(validation.error || "Unsupported file or size exceeded.");
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Process files
    const processed = await Promise.all(
      validFiles.map((file) => processAttachedFile(file))
    );

    const validNewDocs: AttachedDocument[] = [];
    for (const doc of processed) {
      if (doc.status === "error") {
        setFileError(doc.error || "I couldn't read any text from this file.");
      } else {
        validNewDocs.push(doc);
      }
    }

    if (validNewDocs.length > 0) {
      setAttachments((prev) => {
        const existingNames = new Set(prev.map((d) => d.name));
        const filteredNew = validNewDocs.filter((d) => !existingNames.has(d.name));
        return [...prev, ...filteredNew];
      });
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
    // Reset so the same file can be re-selected if removed
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const clearChat = () => {
    stopVoiceInput();
    stopVoiceOutput();
    setMessages([]);
    setAttachments([]);
    setFileError("");
    setInput("");
    notifyManualInput("");
    setReplyLanguage("auto");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSend = async (forcedPrompt?: string) => {
    // Automatically stop listening when message is sent
    stopVoiceInput();

    const promptToSend = (forcedPrompt ?? input).trim();
    if (!promptToSend && attachments.length === 0) return;
    if (isLoading) return;

    const userMessageText = promptToSend || "Analyze the attached document(s)";

    const userMessage = createMessage("user", userMessageText);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    notifyManualInput("");
    setFileError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const response = await sendToLLM(
        userMessageText,
        attachments,
        messages,
        replyLanguage
      );

      const assistantMessage = createMessage("assistant", response);
      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-read reply aloud if toggle is ON
      if (autoReadRef.current) {
        toggleReadMessage(assistantMessage.id, response);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      const errorReply = createMessage("assistant", errorMessage, {
        isError: true,
        canRetry: true,
        retryPrompt: userMessageText,
      });

      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (promptToRetry: string) => {
    // Remove the last error message and retry
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].isError) {
        return prev.slice(0, lastIndex);
      }
      return prev;
    });
    void handleSend(promptToRetry);
  };

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      // Fallback or ignore
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    notifyManualInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const renderFileIcon = (extension: string) => {
    if (["png", "jpg", "jpeg"].includes(extension)) {
      return <FileImage size={14} />;
    }
    return <FileText size={14} />;
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div>
          <h1>AI Documents</h1>
          <p>Your intelligent assistant for understanding documents.</p>
        </div>

        <button className="clear-chat" onClick={clearChat} type="button">
          <Trash2 size={16} />
          Clear Chat
        </button>
      </div>

      <div
        className={`ai-workspace ${isDragging ? "ai-dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            void handleFiles(Array.from(e.dataTransfer.files));
          }
        }}
      >
        {isDragging && (
          <div className="ai-drag-overlay">
            <UploadCloud size={48} />
            <p>Drop documents to attach (.pdf, .docx, .txt, .png, .jpg)</p>
          </div>
        )}

        <div className="ai-chat-header">
          <div className="ai-bot-icon">
            <Bot size={24} />
          </div>

          <div>
            <h3>Vertex AI Assistant</h3>
            <span className="ai-status">
              {isGroqConfigured ? "Powered by Groq" : "Frontend demo"}
            </span>
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
                    type="button"
                    onClick={() => void handleSend(suggestion)}
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
              {messages.map((message) => (
                <div
                  key={message.id}
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

                  <div
                    className={`message-content ${
                      message.isError ? "ai-message-content-error" : ""
                    }`}
                  >
                    {message.isError ? (
                      <div className="ai-error-box">
                        <div className="ai-error-text">
                          <AlertCircle size={16} />
                          <span>{message.text}</span>
                        </div>
                        {message.canRetry && message.retryPrompt && (
                          <button
                            type="button"
                            className="ai-retry-button"
                            onClick={() => handleRetry(message.retryPrompt!)}
                          >
                            <RotateCcw size={13} />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="ai-message-header">
                          <strong>
                            {message.role === "user" ? "You" : "Vertex AI"}
                          </strong>
                          {message.role === "assistant" && (
                            <div className="ai-message-actions">
                              <button
                                type="button"
                                className={`ai-speak-button ${
                                  speakingMessageId === message.id ? "is-speaking" : ""
                                }`}
                                onClick={() =>
                                  toggleReadMessage(message.id, message.text)
                                }
                                aria-label={
                                  speakingMessageId === message.id
                                    ? "Stop reading aloud"
                                    : "Read message aloud"
                                }
                                title={
                                  speakingMessageId === message.id
                                    ? "Stop reading"
                                    : "Read aloud"
                                }
                              >
                                {speakingMessageId === message.id ? (
                                  <>
                                    <VolumeX size={13} />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 size={13} />
                                    <span>Read</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                className="ai-copy-button"
                                onClick={() =>
                                  void copyToClipboard(message.id, message.text)
                                }
                                aria-label="Copy response"
                                title="Copy response"
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check size={13} />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {message.role === "assistant" ? (
                          <MarkdownRenderer content={message.text} />
                        ) : (
                          <p>{message.text}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="ai-message bot-message ai-typing-row">
                  <div className="message-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="message-content ai-typing-content">
                    <div className="ai-message-header">
                      <strong>Vertex AI</strong>
                    </div>
                    <div className="ai-typing-indicator">
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-label">
                        Vertex AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Inline file error */}
        {fileError && (
          <div className="ai-file-error" role="alert">
            <AlertCircle size={16} />
            <span>{fileError}</span>
            <button
              type="button"
              onClick={() => setFileError("")}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attached files chips */}
        {attachments.length > 0 && (
          <div className="ai-attachment-chips" aria-label="Attached files">
            {attachments.map((doc) => (
              <div
                key={doc.id}
                className={`ai-attachment-chip ${
                  doc.status === "error" ? "chip-error" : ""
                }`}
              >
                <span className="chip-icon">{renderFileIcon(doc.extension)}</span>
                <span className="chip-name" title={doc.name}>
                  {doc.name}
                </span>
                <span className="chip-size">{formatFileSize(doc.size)}</span>
                {doc.status === "processing" ? (
                  <Loader2 size={13} className="chip-spinner" />
                ) : (
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => removeAttachment(doc.id)}
                    aria-label={`Remove ${doc.name}`}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="ai-input-area">
          <div className="ai-input-toolbar">
            <div className="ai-toolbar-left">
              <div className="ai-lang-selector-pill">
                <label htmlFor="ai-reply-lang-select" className="ai-lang-label">
                  <Languages size={14} />
                  <span>Reply in</span>
                </label>
                <select
                  id="ai-reply-lang-select"
                  className="ai-lang-select"
                  value={replyLanguage}
                  onChange={(e) =>
                    setReplyLanguage(e.target.value as ReplyLanguage)
                  }
                  aria-label="Reply in"
                  disabled={isLoading}
                >
                  <option value="auto">Auto (same as my question)</option>
                  <option value="english">English</option>
                  <option value="tamil">Tamil (தமிழ்)</option>
                  <option value="tanglish">Tanglish (Tamil in English letters)</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="japanese">Japanese (日本語)</option>
                  <option value="german">German (Deutsch)</option>
                </select>
              </div>

              <div className="ai-voice-toggles">
                <label
                  className="ai-toggle-label"
                  title="Auto-send message after you finish speaking"
                >
                  <input
                    type="checkbox"
                    checked={autoSendAfterSpeaking}
                    onChange={(e) => setAutoSendAfterSpeaking(e.target.checked)}
                    aria-label="Auto-send after speaking"
                  />
                  <span>Auto-send</span>
                </label>

                <label
                  className="ai-toggle-label"
                  title="Automatically read assistant responses aloud"
                >
                  <input
                    type="checkbox"
                    checked={autoReadReplies}
                    onChange={(e) => setAutoReadReplies(e.target.checked)}
                    aria-label="Auto-read replies"
                  />
                  <span>Auto-read</span>
                </label>
              </div>
            </div>

            {voiceStatus && (
              <div
                className={`ai-voice-status ${
                  isListening ? "is-listening" : "is-error"
                }`}
                role="status"
                aria-live="polite"
              >
                {isListening && <span className="ai-voice-pulse" />}
                <span>{voiceStatus}</span>
              </div>
            )}
          </div>

          <div className="ai-input-row">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              onChange={(e) => void handleFileInputChange(e)}
            />

            <button
              type="button"
              className="attach-button"
              title="Attach documents (.pdf, .docx, .txt, .png, .jpg)"
              aria-label="Attach document"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={20} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything about your document..."
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Ask about document"
            />

            <button
              type="button"
              className={`mic-button ${isListening ? "is-listening" : ""}`}
              title={
                !isRecognitionSupported
                  ? "Voice input works in Chrome or Edge"
                  : isListening
                  ? "Stop listening"
                  : "Voice input (speak)"
              }
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              disabled={isLoading || !isRecognitionSupported}
              onClick={toggleVoiceInput}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              type="button"
              className="send-button"
              onClick={() => void handleSend()}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </div>
        </div>

        <p className="ai-disclaimer">
          AI responses are for assistance only. Verify important information
          before using it.
        </p>
      </div>
    </div>
  );
}
