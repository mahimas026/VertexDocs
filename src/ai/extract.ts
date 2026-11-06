import mammoth from "mammoth";
import type { AttachedDocument } from "./types";

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "txt",
  "png",
  "jpg",
  "jpeg",
] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (
    !ALLOWED_EXTENSIONS.includes(
      extension as (typeof ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return {
      valid: false,
      error: `"${file.name}" is not supported. Please attach a .pdf, .docx, .txt, .png, or .jpg file.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" is over 20 MB. Maximum allowed size is 20 MB per file.`,
    };
  }
  return { valid: true };
}

function resolveMimeType(extension: string, fallback: string): string {
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "txt":
      return "text/plain";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return fallback || "application/octet-stream";
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version || "6.5.438"}/cmaps/`,
    cMapPacked: true,
  });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageString = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ")
      .trim();

    if (pageString) {
      pageTexts.push(pageString);
    }
  }

  return pageTexts.join("\n\n").trim();
}

export async function processAttachedFile(
  file: File
): Promise<AttachedDocument> {
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = resolveMimeType(extension, file.type);

  const baseDoc: AttachedDocument = {
    id,
    file,
    name: file.name,
    size: file.size,
    extension,
    mimeType,
    status: "processing",
  };

  try {
    if (extension === "txt") {
      const text = await file.text();
      const trimmed = text.trim();
      if (!trimmed) {
        return {
          ...baseDoc,
          status: "error",
          error: "I couldn't read any text from this file.",
        };
      }

      return {
        ...baseDoc,
        status: "ready",
        extractedText: trimmed,
      };
    }

    if (extension === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result?.value?.trim() || "";

      if (!text) {
        return {
          ...baseDoc,
          status: "error",
          error: "I couldn't read any text from this file.",
        };
      }

      return {
        ...baseDoc,
        status: "ready",
        extractedText: text,
      };
    }

    if (extension === "pdf") {
      const text = await extractTextFromPDF(file);
      if (!text) {
        return {
          ...baseDoc,
          status: "error",
          error:
            "I couldn't read any text from this PDF. It may be a scanned image.",
        };
      }

      return {
        ...baseDoc,
        status: "ready",
        extractedText: text,
      };
    }

    if (["png", "jpg", "jpeg"].includes(extension)) {
      return {
        ...baseDoc,
        status: "ready",
      };
    }

    return {
      ...baseDoc,
      status: "error",
      error: "Unsupported file type.",
    };
  } catch {
    if (extension === "pdf") {
      return {
        ...baseDoc,
        status: "error",
        error:
          "I couldn't read any text from this PDF. It may be a scanned image.",
      };
    }
    return {
      ...baseDoc,
      status: "error",
      error: "I couldn't read any text from this file.",
    };
  }
}
