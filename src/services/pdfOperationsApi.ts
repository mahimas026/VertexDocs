
const API_BASE_URL = "http://127.0.0.1:8000";

// Merge multiple PDF files
export const mergePDFs = async (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/merge`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF merging failed");
  }

  return response.blob();
};
// Split a PDF into separate pages or page ranges
export const splitPDF = async (
  file: File,
  pageRanges?: string
) => {
  const formData = new FormData();

  formData.append("file", file);

  if (pageRanges) {
    formData.append("page_ranges", pageRanges);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/split`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF splitting failed");
  }

  return response.blob();
};
// Rotate PDF pages
export const rotatePDF = async (
  file: File,
  rotation: number
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("rotation", String(rotation));

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/rotate`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF rotation failed");
  }

  return response.blob();
};
// Delete selected pages from a PDF
export const deletePDFPages = async (
  file: File,
  pages: string
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("pages", pages);

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/delete-pages`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Deleting pages failed");
  }

  return response.blob();
};
export const reorderPDF = async (
  file: File,
  pages: string
): Promise<Blob> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("pages", pages);

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/reorder`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF reordering failed.");
  }

  return await response.blob();
};
export const extractPDFPages = async (
  file: File,
  pages: string
): Promise<Blob> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("pages", pages);

  const response = await fetch(
    `${API_BASE_URL}/api/pdf/extract`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF extraction failed.");
  }

  return await response.blob();
};

// Insert pages from another PDF
export const insertPDFPages = async (
  file: File,
  insertFile: File,
  position: number
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("insert_file", insertFile);
  formData.append("position", String(position));

  const response = await fetch(`${API_BASE_URL}/api/pdf/insert-pages`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF page insertion failed");
  }

  return await response.blob();
};

// Add a text watermark to all pages of a PDF
export const watermarkPDF = async (
  file: File,
  watermarkText: string
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("watermark_text", watermarkText);

  const response = await fetch(`${API_BASE_URL}/api/pdf/watermark`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF watermark failed");
  }

  return await response.blob();
};

// Protect a PDF with password encryption
export const protectPDF = async (
  file: File,
  password: string
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/pdf/protect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF password protection failed");
  }

  return await response.blob();
};

// Add page numbers to a PDF
export const addPageNumbers = async (
  file: File,
  startNumber: number = 1
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("start_number", String(startNumber));

  const response = await fetch(`${API_BASE_URL}/api/pdf/page-numbers`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF page numbering failed");
  }

  return await response.blob();
};

// Unlock a password-protected PDF
export const unlockPDF = async (
  file: File,
  password: string
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/pdf/unlock`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF unlocking failed");
  }

  return await response.blob();
};

// Compress and optimize a PDF
export const compressPDF = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/pdf/compress`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF compression failed");
  }

  return await response.blob();
};

// Crop PDF margins
export const cropPDF = async (
  file: File,
  left: number = 20,
  right: number = 20,
  top: number = 20,
  bottom: number = 20
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("left", String(left));
  formData.append("right", String(right));
  formData.append("top", String(top));
  formData.append("bottom", String(bottom));

  const response = await fetch(`${API_BASE_URL}/api/pdf/crop`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF crop failed");
  }

  return await response.blob();
};

// Add header or footer to PDF
export const addHeaderFooter = async (
  file: File,
  text: string,
  position: "header" | "footer" = "footer",
  fontSize: number = 10
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("text", text);
  formData.append("position", position);
  formData.append("font_size", String(fontSize));

  const response = await fetch(`${API_BASE_URL}/api/pdf/header-footer`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Header/footer operation failed");
  }

  return await response.blob();
};

// Add outline bookmark to PDF
export const addPDFBookmark = async (
  file: File,
  title: string,
  pageNumber: number
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("page_number", String(pageNumber));

  const response = await fetch(`${API_BASE_URL}/api/pdf/bookmark`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "PDF bookmark creation failed");
  }

  return await response.blob();
};
