import type { ReplyLanguage } from "./types";

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

type SpeechRecognitionCtor = new () => ISpeechRecognition;

export function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionConstructor());
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Maps the Reply in selection to the standard BCP 47 language tag
 * for both Speech Recognition and Speech Synthesis.
 */
export function getVoiceLanguageTag(language: ReplyLanguage): string {
  switch (language) {
    case "tamil":
      return "ta-IN";
    case "hindi":
      return "hi-IN";
    case "japanese":
      return "ja-JP";
    case "german":
      return "de-DE";
    case "tanglish":
    case "english":
    case "auto":
    default:
      return "en-IN";
  }
}

/**
 * Strips markdown symbols (**, *, #, backticks, bullet dashes) and converts
 * text to a clean string suitable for SpeechSynthesis, preserving sentence punctuation.
 */
export function stripMarkdownForTTS(markdown: string): string {
  if (!markdown) return "";

  let text = markdown;

  // 1. Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, " ");

  // 2. Remove inline code
  text = text.replace(/`([^`]+)`/g, "$1");

  // 3. Remove headers (#, ##, ###, etc.)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 4. Remove bold & italics
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // 5. Remove bullet list markers (-, *, •) at line starts
  text = text.replace(/^[\s]*[-*•]\s+/gm, "");

  // 6. Remove numbered lists (1. , 2. )
  text = text.replace(/^[\s]*\d+[.)]\s+/gm, "");

  // 7. Remove blockquotes
  text = text.replace(/^>\s+/gm, "");

  // 8. Remove markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 9. Remove horizontal rules
  text = text.replace(/^---+$/gm, "");

  // 10. Collapse multiple blank lines / spaces into single space, maintaining sentence pauses
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/(\r?\n[ \t]*)+/g, ". ");
  text = text.replace(/\s*\.\s*\./g, ".");

  return text.trim();
}

/**
 * Speaks the text aloud using the browser's speechSynthesis API.
 */
export function speakText(
  text: string,
  langTag: string,
  onEnd: () => void,
  onError: () => void
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    onError();
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const clean = stripMarkdownForTTS(text);
  if (!clean) {
    onEnd();
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = langTag;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Pick matching voice if available
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const primary = langTag.toLowerCase();
    const prefix = primary.split("-")[0];
    const matchingVoice =
      voices.find((v) => v.lang.toLowerCase().replace("_", "-") === primary) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
  }

  utterance.onend = () => {
    onEnd();
  };

  utterance.onerror = (e) => {
    // If canceled manually, don't necessarily treat as an error
    if (e.error === "canceled" || e.error === "interrupted") {
      onEnd();
    } else {
      onError();
    }
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

