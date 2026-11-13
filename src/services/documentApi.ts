
const API_BASE_URL = "http://127.0.0.1:8000";

// Upload a document
export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/documents/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Document upload failed");
  }

  return response.json();
};

// Get all uploaded documents
export const getDocuments = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
};
// Delete a document
export const deleteDocument = async (documentId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete document");
  }

  return response.json();
};
// Download a document
export const downloadDocument = (documentId: string) => {
  return `${API_BASE_URL}/api/documents/${documentId}/download`;
};

// Rename a document
export const renameDocument = async (documentId: string, newName: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}/rename`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_name: newName }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Document rename failed");
  }

  return response.json();
};

// Get details for a single document
export const getDocument = async (documentId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch document details");
  }

  return response.json();
};
// Extract text from a document
export const extractDocumentText = async (documentId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}/extract`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Text extraction failed");
  }

  return response.json();
};
