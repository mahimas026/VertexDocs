
const API_BASE_URL = "http://127.0.0.1:8001";

const conversionEndpoints: Record<string, Record<string, string>> = {
  pdf: {
    TXT: "/pdf-to-txt",
    DOCX: "/pdf-to-docx",
  },
  docx: {
    TXT: "/docx-to-txt",
    PDF: "/docx-to-pdf",
  },
  txt: {
    PDF: "/txt-to-pdf",
  },
  png: {
    PDF: "/image-to-pdf",
  },
  jpg: {
    PDF: "/image-to-pdf",
  },
  jpeg: {
    PDF: "/image-to-pdf",
  },
};

export const convertDocument = async (
  file: File,
  targetFormat: string
): Promise<{ blob: Blob; fileName: string }> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  const endpoint = conversionEndpoints[extension]?.[targetFormat];

  if (!endpoint) {
    throw new Error(
      `Conversion from ${extension.toUpperCase()} to ${targetFormat} is not supported.`
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "File conversion failed.";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  let blob: Blob;

  if (endpoint === "/pdf-to-txt") {
    const result = await response.json();
    blob = new Blob([result.text], { type: "text/plain" });
  } else {
    blob = await response.blob();
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const fileName = `${baseName}.${targetFormat.toLowerCase()}`;

  return { blob, fileName };
};
