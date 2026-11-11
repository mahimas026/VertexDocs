import type {
  AttachedDocument,
  ChatMessage,
  OpenAIMessage,
  ReplyLanguage,
} from "./types";

// Maximum combined document characters for Groq free-tier budget (~4,500 tokens)
export const MAX_DOC_CHARS = 18000;

export function getMaxDocChars(language: ReplyLanguage = "auto"): number {
  switch (language) {
    case "tamil":
    case "hindi":
    case "japanese":
      return 9000;
    case "auto":
    case "english":
    case "german":
    case "tanglish":
    default:
      return 18000;
  }
}

export function isDocumentQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  const documentKeywords = [
    "my document",
    "the document",
    "this document",
    "document",
    "pdf",
    "file",
    "summarize",
    "summary",
    "explain this",
    "important points",
    "generate questions",
  ];
  return documentKeywords.some((keyword) => normalized.includes(keyword));
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/(\r?\n[ \t]*){3,}/g, "\n\n")
    .trim();
}

function getLanguageInstruction(language: ReplyLanguage = "auto"): string {
  switch (language) {
    case "english":
      return "Reply entirely in English, regardless of the document's language. Keep names, dates, numbers and technical terms accurate. Translate the document's content as needed.";
    case "tamil":
      return "Reply entirely in Tamil, regardless of the document's language. Keep names, dates, numbers and technical terms accurate. Translate the document's content as needed.";
    case "hindi":
      return "Reply entirely in Hindi, regardless of the document's language. Keep names, dates, numbers and technical terms accurate. Translate the document's content as needed.";
    case "japanese":
      return "Reply entirely in Japanese, regardless of the document's language. Keep names, dates, numbers and technical terms accurate. Translate the document's content as needed.";
    case "german":
      return "Reply entirely in German, regardless of the document's language. Keep names, dates, numbers and technical terms accurate. Translate the document's content as needed.";
    case "tanglish":
      return "Reply in Tanglish: Tamil written in English (Roman) letters, the way people casually text, for example 'Indha document la mukkiyamana points ivai.' Do not use Tamil script. Keep dates, names and numbers exact. Use simple everyday words and keep English technical terms as they are.";
    case "auto":
    default:
      return "Reply in the same language the user writes their question in. If the user explicitly asks for a language in their message, that request overrides everything.";
  }
}

/**
 * Groq requests go through the backend so the API key stays out of the browser bundle.
 */
export async function sendToLLM(
  prompt: string,
  attachments: AttachedDocument[],
  history: ChatMessage[] = [],
  replyLanguage: ReplyLanguage = "auto"
): Promise<string> {
  const readyAttachments = attachments.filter((doc) => doc.status === "ready");

  // 1. Check if user attached only image files
  const imageDocs = readyAttachments.filter((doc) =>
    ["png", "jpg", "jpeg"].includes(doc.extension)
  );
  const textDocs = readyAttachments.filter(
    (doc) =>
      !["png", "jpg", "jpeg"].includes(doc.extension) &&
      Boolean(doc.extractedText?.trim())
  );

  if (readyAttachments.length > 0 && textDocs.length === 0 && imageDocs.length > 0) {
    return "Image reading isn't supported by the current model. Please attach a PDF, DOCX or TXT file.";
  }

  // 2. Check if user asks about "my document" with nothing attached
  if (readyAttachments.length === 0 && isDocumentQuery(prompt)) {
    return "Please attach a document first using the paperclip icon.";
  }

  // Read model from env, trimmed with surrounding quotes removed, defaulting to llama-3.3-70b-versatile
  const rawModel = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
  const model =
    rawModel
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim() || "llama-3.3-70b-versatile";

  // 3. Prepare document text with language-dependent budget limits
  let wasTruncated = false;
  const preparedDocs: { name: string; text: string }[] = [];

  if (textDocs.length > 0) {
    const maxDocChars = getMaxDocChars(replyLanguage);
    const perDocBudget = Math.floor(maxDocChars / textDocs.length);

    for (const doc of textDocs) {
      const cleaned = cleanExtractedText(doc.extractedText || "");
      let docText = cleaned;

      if (cleaned.length > perDocBudget) {
        docText = cleaned.slice(0, perDocBudget);
        wasTruncated = true;
      }

      preparedDocs.push({
        name: doc.name,
        text: docText,
      });
    }
  }

  // 4. Build system message
  const languageInstruction = getLanguageInstruction(replyLanguage);

  let systemContent =
    "You are Vertex AI Assistant inside VertexDocs. Answer using ONLY the attached document text when it is present. If the answer is not in the document, say so. Be clear and concise. Use short bullet points for summaries and key points. " +
    languageInstruction +
    " If the document text looks garbled or unreadable, say so instead of guessing. For legal or financial documents, remind the user to verify with a professional.\n\n" +
    "Response Guidelines:\n" +
    "- When asked to \"Summarize my document\": Provide a 1-line overview followed by 5 to 8 short bullet points.\n" +
    "- When asked to \"Explain this document in simple words\": Provide a plain-language explanation using short paragraphs.\n" +
    "- When asked to \"Find important points\": List key points, dates, names, and amounts as bullet points.\n" +
    "- When asked to \"Generate questions from my document\": Provide 8 to 10 questions with short answers based on the document text.";

  for (const item of preparedDocs) {
    systemContent += `\n\nDOCUMENT: ${item.name}\n${item.text}`;
  }

  const systemMessage: OpenAIMessage = {
    role: "system",
    content: systemContent,
  };

  // 5. Last 4 chat turns only
  const recentHistory: OpenAIMessage[] = history
    .filter((msg) => !msg.isError && msg.text.trim())
    .slice(-4)
    .map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.text,
    }));

  const userMessage: OpenAIMessage = {
    role: "user",
    content: prompt,
  };

  const messages: OpenAIMessage[] = [
    systemMessage,
    ...recentHistory,
    userMessage,
  ];

  // 6. Call the backend proxy; the Groq API key remains server-side.
  const endpoint = "http://127.0.0.1:8001/api/chat/completions";

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 800,
      }),
    });
  } catch {
    throw new Error(
      "Unable to connect to the AI service. Please check your internet connection."
    );
  }

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse failure
    }

    const errorCode = errorData?.error?.code || "";
    const groqErrorMessage =
      errorData?.error?.message ||
      (typeof errorData?.error === "string" ? errorData.error : "");

    // 1. Read JSON body and console.error the HTTP status and Groq's error.message
    console.error(
      `[Groq Client] HTTP ${response.status} Error:`,
      groqErrorMessage || "No error message provided in response body"
    );

    // 2. Helper to append Groq's own error.message to the friendly error shown in chat
    const appendGroqError = (friendlyMsg: string) =>
      groqErrorMessage ? `${friendlyMsg} (${groqErrorMessage})` : friendlyMsg;

    if (response.status === 401) {
      throw new Error(
        appendGroqError(
          "Groq rejected the backend API key. Check GROQ_API_KEY in .env."
        )
      );
    }

    if (
      response.status === 404 ||
      errorCode === "model_not_found" ||
      groqErrorMessage.toLowerCase().includes("model")
    ) {
      throw new Error(
        appendGroqError(
          "The specified Groq model was not found. Please check VITE_GROQ_MODEL."
        )
      );
    }

    if (response.status === 413 || response.status === 429) {
      throw new Error(
        appendGroqError(
          "Rate or size limit reached. Wait a minute or attach a shorter document."
        )
      );
    }

    if (response.status >= 500) {
      throw new Error(appendGroqError("Groq server problem, try again."));
    }

    throw new Error(
      appendGroqError(
        `AI service error (${response.status}). Please try again.`
      )
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error("Received an invalid response from the AI service.");
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("The AI returned an empty response.");
  }

  const truncationNotice = wasTruncated
    ? "Your document is long, so I used only the first part.\n\n"
    : "";

  return `${truncationNotice}${reply}`;
}
