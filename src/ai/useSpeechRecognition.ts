import { useState, useRef, useEffect, useCallback } from "react";
import type { ReplyLanguage } from "./types";
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  getVoiceLanguageTag,
  type ISpeechRecognition,
  type SpeechRecognitionEvent,
  type SpeechRecognitionErrorEvent,
} from "./voice";

export function joinNonEmpty(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (p ? p.trim() : ""))
    .filter(Boolean)
    .join(" ");
}

export interface UseSpeechRecognitionOptions {
  input: string;
  setInput: (value: string | ((prev: string) => string)) => void;
  replyLanguage: ReplyLanguage;
  autoSendAfterSpeaking: boolean;
  onSend: (text: string) => void | Promise<void>;
  onBeforeStart?: () => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  voiceStatus: string;
  isRecognitionSupported: boolean;
  startListening: () => void;
  stopListening: (options?: { triggeredByUser?: boolean }) => void;
  stopVoiceInput: (options?: { triggeredByUser?: boolean }) => void;
  toggleVoiceInput: () => void;
  notifyManualInput: (newText: string) => void;
  showVoiceStatus: (message: string, autoHide?: boolean) => void;
}

export function useSpeechRecognition({
  input,
  setInput,
  replyLanguage,
  autoSendAfterSpeaking,
  onSend,
  onBeforeStart,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");

  const isRecognitionSupported = isSpeechRecognitionSupported();

  // Primary intent flag: true from user start() until user stop() or fatal error
  const wantListeningRef = useRef<boolean>(false);

  // Text buffers across continuous recognition sessions
  const baseTextRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");

  // Recognition instance & timers
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userStopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edge-case & retry trackers
  const networkRetryCountRef = useRef<number>(0);
  const networkRetryDelayPendingRef = useRef<boolean>(false);
  const restartsTimestampsRef = useRef<number[]>([]);
  const pendingUserStopAutoSendRef = useRef<boolean>(false);
  const startRecognitionInstanceRef = useRef<() => void>(() => {});

  // Sync references to latest props and states
  const latestInputRef = useRef<string>(input);
  const replyLanguageRef = useRef<ReplyLanguage>(replyLanguage);
  const autoSendRef = useRef<boolean>(autoSendAfterSpeaking);
  const onSendRef = useRef(onSend);
  const onBeforeStartRef = useRef(onBeforeStart);
  const voiceStatusRef = useRef<string>("");

  useEffect(() => {
    latestInputRef.current = input;
  }, [input]);

  useEffect(() => {
    replyLanguageRef.current = replyLanguage;
  }, [replyLanguage]);

  useEffect(() => {
    autoSendRef.current = autoSendAfterSpeaking;
  }, [autoSendAfterSpeaking]);

  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  useEffect(() => {
    onBeforeStartRef.current = onBeforeStart;
  }, [onBeforeStart]);

  const showVoiceStatus = useCallback((message: string, autoHide = true) => {
    if (voiceStatusTimerRef.current) {
      clearTimeout(voiceStatusTimerRef.current);
      voiceStatusTimerRef.current = null;
    }
    voiceStatusRef.current = message;
    setVoiceStatus(message);

    if (autoHide && message) {
      voiceStatusTimerRef.current = setTimeout(() => {
        voiceStatusRef.current = "";
        setVoiceStatus("");
        voiceStatusTimerRef.current = null;
      }, 5000);
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (userStopFallbackTimerRef.current) {
      clearTimeout(userStopFallbackTimerRef.current);
      userStopFallbackTimerRef.current = null;
    }
  }, []);

  const cleanupCurrentRecognition = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {}
    }
  }, []);

  const stopListening = useCallback(
    (options?: { triggeredByUser?: boolean }) => {
      wantListeningRef.current = false;
      clearTimers();

      const triggeredByUser = Boolean(options?.triggeredByUser);
      const shouldAutoSend = triggeredByUser && autoSendRef.current;
      pendingUserStopAutoSendRef.current = shouldAutoSend;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          cleanupCurrentRecognition();
        }
      }

      setIsListening(false);
      if (voiceStatusRef.current === "Listening... click the mic to stop") {
        voiceStatusRef.current = "";
        setVoiceStatus("");
      }

      if (shouldAutoSend) {
        userStopFallbackTimerRef.current = setTimeout(() => {
          userStopFallbackTimerRef.current = null;
          if (pendingUserStopAutoSendRef.current) {
            pendingUserStopAutoSendRef.current = false;
            const textToSend = latestInputRef.current.trim();
            if (textToSend) {
              void onSendRef.current(textToSend);
            }
          }
        }, 250);
      }
    },
    [clearTimers, cleanupCurrentRecognition]
  );

  const startRecognitionInstance = useCallback(() => {
    if (!wantListeningRef.current) return;

    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      wantListeningRef.current = false;
      setIsListening(false);
      showVoiceStatus("Voice input works in Chrome or Edge");
      return;
    }

    cleanupCurrentRecognition();

    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getVoiceLanguageTag(replyLanguageRef.current);

      recognition.onstart = () => {
        setIsListening(true);
        showVoiceStatus("Listening... click the mic to stop", false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        networkRetryCountRef.current = 0;
        let newFinal = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            newFinal += transcript;
          } else {
            interim += transcript;
          }
        }

        if (newFinal) {
          const trimmed = newFinal.trim();
          if (trimmed) {
            if (finalTranscriptRef.current.trim()) {
              finalTranscriptRef.current = `${finalTranscriptRef.current.trim()} ${trimmed}`;
            } else {
              finalTranscriptRef.current = trimmed;
            }
          }
        }

        const combined = joinNonEmpty(
          baseTextRef.current,
          finalTranscriptRef.current,
          interim
        );
        latestInputRef.current = combined;
        setInput(combined);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const err = event.error;

        // "no-speech" and "aborted" are normal during pauses and restarts:
        // silently ignore them while wantListeningRef is true
        if (err === "no-speech" || err === "aborted") {
          return;
        }

        // Fatal permission / audio-capture errors:
        if (err === "not-allowed" || err === "service-not-allowed") {
          wantListeningRef.current = false;
          clearTimers();
          cleanupCurrentRecognition();
          setIsListening(false);
          showVoiceStatus(
            "Microphone access is blocked. Allow it in your browser's address bar and try again."
          );
          return;
        }

        if (err === "audio-capture") {
          wantListeningRef.current = false;
          clearTimers();
          cleanupCurrentRecognition();
          setIsListening(false);
          showVoiceStatus("No microphone found.");
          return;
        }

        // Network error: retry up to 3 times with 1-second delay
        if (err === "network") {
          networkRetryCountRef.current += 1;
          if (networkRetryCountRef.current > 3) {
            wantListeningRef.current = false;
            clearTimers();
            cleanupCurrentRecognition();
            setIsListening(false);
            showVoiceStatus("Voice input lost its internet connection.");
            return;
          }
          networkRetryDelayPendingRef.current = true;
          return;
        }

        // Any other fatal error:
        wantListeningRef.current = false;
        clearTimers();
        cleanupCurrentRecognition();
        setIsListening(false);
        showVoiceStatus("Voice input error. Try again.");
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        // If stopped intentionally or by fatal error:
        if (!wantListeningRef.current) {
          setIsListening(false);
          if (voiceStatusRef.current === "Listening... click the mic to stop") {
            voiceStatusRef.current = "";
            setVoiceStatus("");
          }

          if (pendingUserStopAutoSendRef.current) {
            pendingUserStopAutoSendRef.current = false;
            if (userStopFallbackTimerRef.current) {
              clearTimeout(userStopFallbackTimerRef.current);
              userStopFallbackTimerRef.current = null;
            }
            const textToSend = latestInputRef.current.trim();
            if (textToSend) {
              void onSendRef.current(textToSend);
            }
          }
          return;
        }

        // Intent is still true -> browser ended the session on silence/timeout
        // Restart loop guard: more than 5 restarts in 10 seconds
        const now = Date.now();
        restartsTimestampsRef.current = restartsTimestampsRef.current.filter(
          (t) => now - t <= 10000
        );
        restartsTimestampsRef.current.push(now);

        if (restartsTimestampsRef.current.length > 5) {
          wantListeningRef.current = false;
          setIsListening(false);
          clearTimers();
          showVoiceStatus(
            "Voice input stopped unexpectedly. Please click the mic to try again."
          );
          return;
        }

        const delay = networkRetryDelayPendingRef.current ? 1000 : 250;
        networkRetryDelayPendingRef.current = false;

        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }

        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          if (wantListeningRef.current) {
            startRecognitionInstanceRef.current();
          }
        }, delay);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        // ignore InvalidStateError
      } else {
        wantListeningRef.current = false;
        setIsListening(false);
        showVoiceStatus("Could not start microphone.");
      }
    }
  }, [cleanupCurrentRecognition, clearTimers, setInput, showVoiceStatus]);

  useEffect(() => {
    startRecognitionInstanceRef.current = startRecognitionInstance;
  }, [startRecognitionInstance]);

  const startListening = useCallback(() => {
    if (!isRecognitionSupported) {
      showVoiceStatus("Voice input works in Chrome or Edge");
      return;
    }

    // Brand-new listening session started from user click:
    baseTextRef.current = latestInputRef.current;
    finalTranscriptRef.current = "";
    restartsTimestampsRef.current = [];
    networkRetryCountRef.current = 0;
    networkRetryDelayPendingRef.current = false;
    pendingUserStopAutoSendRef.current = false;

    wantListeningRef.current = true;
    clearTimers();

    onBeforeStartRef.current?.();

    startRecognitionInstance();
  }, [
    isRecognitionSupported,
    showVoiceStatus,
    clearTimers,
    startRecognitionInstance,
  ]);

  const toggleVoiceInput = useCallback(() => {
    if (!isRecognitionSupported) {
      showVoiceStatus("Voice input works in Chrome or Edge");
      return;
    }

    if (wantListeningRef.current || isListening) {
      stopListening({ triggeredByUser: true });
    } else {
      startListening();
    }
  }, [
    isRecognitionSupported,
    isListening,
    showVoiceStatus,
    startListening,
    stopListening,
  ]);

  const notifyManualInput = useCallback((newText: string) => {
    latestInputRef.current = newText;
    if (wantListeningRef.current) {
      baseTextRef.current = newText;
      finalTranscriptRef.current = "";
    }
  }, []);

  // Language switch while listening: restart with new language, keeping baseText & finalTranscript
  const prevLangRef = useRef<ReplyLanguage>(replyLanguage);
  useEffect(() => {
    if (prevLangRef.current !== replyLanguage) {
      prevLangRef.current = replyLanguage;
      if (wantListeningRef.current) {
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }
        cleanupCurrentRecognition();
        startRecognitionInstance();
      }
    }
  }, [replyLanguage, cleanupCurrentRecognition, startRecognitionInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      clearTimers();
      cleanupCurrentRecognition();
      if (voiceStatusTimerRef.current) {
        clearTimeout(voiceStatusTimerRef.current);
        voiceStatusTimerRef.current = null;
      }
    };
  }, [clearTimers, cleanupCurrentRecognition]);

  return {
    isListening,
    voiceStatus,
    isRecognitionSupported,
    startListening,
    stopListening,
    stopVoiceInput: stopListening,
    toggleVoiceInput,
    notifyManualInput,
    showVoiceStatus,
  };
}
