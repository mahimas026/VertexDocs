export type DocumentStatus = "processing" | "ready" | "error";

export type ReplyLanguage =
  | "auto"
  | "english"
  | "tamil"
  | "tanglish"
  | "hindi"
  | "japanese"
  | "german";

export interface AttachedDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  extractedText?: string;
  status: DocumentStatus;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
  canRetry?: boolean;
  retryPrompt?: string;
  timestamp: number;
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
