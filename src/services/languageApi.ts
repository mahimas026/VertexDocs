const API_BASE_URL = "http://127.0.0.1:8001";

export interface SupportedLanguage {
  code: string;
  name: string;
  script: string;
  configured?: boolean;
  installed?: boolean;
  available?: boolean;
  status?: string;
}

export interface TranslationResponse {
  success: boolean;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text: string;
}

export interface TanglishResponse {
  input: string;
  output: string;
}

// 12 core languages + Tanglish
export const ALL_SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", script: "Latin" },
  { code: "ta", name: "Tamil", script: "Tamil" },
  { code: "hi", name: "Hindi", script: "Devanagari" },
  { code: "ml", name: "Malayalam", script: "Malayalam" },
  { code: "te", name: "Telugu", script: "Telugu" },
  { code: "ja", name: "Japanese", script: "Japanese" },
  { code: "de", name: "German", script: "Latin" },
  { code: "sa", name: "Sanskrit", script: "Devanagari" },
  { code: "kn", name: "Kannada", script: "Kannada" },
  { code: "bn", name: "Bengali", script: "Bengali" },
  { code: "fr", name: "French", script: "Latin" },
  { code: "es", name: "Spanish", script: "Latin" },
  { code: "tanglish", name: "Tanglish (Tamil in English script)", script: "Latin" },
];

// Fetch language availability from backend
export const getSupportedLanguages = async () => {
  const response = await fetch(`${API_BASE_URL}/api/languages`);
  if (!response.ok) {
    throw new Error("Failed to retrieve supported languages");
  }
  return response.json();
};

// Translate text between languages
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Translation failed");
  }

  return response.json();
};

// Transliterate Tanglish text to Tamil
export const tanglishToTamil = async (text: string): Promise<TanglishResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/tanglish/to-tamil`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Tanglish to Tamil conversion failed");
  }

  return response.json();
};

// Transliterate Tamil text to Tanglish
export const tamilToTanglish = async (text: string): Promise<TanglishResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/tanglish/to-roman`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Tamil to Tanglish conversion failed");
  }

  return response.json();
};

