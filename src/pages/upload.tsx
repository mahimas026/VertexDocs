import { useRef, useState, useEffect } from "react";
import type { JSX as ReactJSX } from "react";
import type { DragEvent } from "react";
import {
  UploadCloud,
  FileText,
  FileImage,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Trash2,
  Download,
  Pencil,
  Loader2,
} from "lucide-react";
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  downloadDocument,
  renameDocument,
  extractDocumentText,
} from "../services/documentApi";
declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

interface UploadedFile {
  id: number;
  file: File;
  status: "Ready" | "Uploading" | "Completed";
  progress: number;
}
interface BackendDocument {
  document_id: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  file_type: string;
}

function Upload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [backendDocuments, setBackendDocuments] = useState<BackendDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [extractedText, setExtractedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const result = await getDocuments();
        setBackendDocuments(result.documents);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Failed to load documents from server.");
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, []);

  const allowedExtensions = [
    "pdf", "doc", "docx", "xls", "xlsx",
    "png", "jpg", "jpeg", "txt",
  ];

  const addFiles = (selectedFiles: FileList | File[]) => {
    setError("");

    const validFiles: UploadedFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";

      if (!allowedExtensions.includes(extension)) {
        invalidFiles.push(file.name);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (over 20 MB)`);
        return;
      }

      validFiles.push({
        id: Date.now() + Math.random(),
        file: file,
        status: "Ready",
        progress: 0,
      });
    });

    setFiles((previous) => [...previous, ...validFiles]);

    if (invalidFiles.length > 0) {
      setError(
        `Unsupported file or size limit exceeded: ${invalidFiles.join(", ")}`
      );
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (id: number) => {
    setFiles((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };
const handleDeleteDocument = async (documentId: string) => {
  try {
    await deleteDocument(documentId);

    setBackendDocuments((previous) =>
      previous.filter(
        (document) => document.document_id !== documentId
      )
    );
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to delete document"
    );
  }
};
  const handleStartRename = (documentId: string, currentName: string) => {
    setError("");
    setSuccessMessage("");
    setEditingDocId(documentId);
    setRenameInput(currentName);
  };

  const handleCancelRename = () => {
    setEditingDocId(null);
    setRenameInput("");
  };

  const handleSaveRename = async (documentId: string, originalName: string) => {
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setError("File name cannot be empty.");
      return;
    }

    // Preserve the original extension if the user omitted it
    const originalExt = originalName.includes(".")
      ? "." + originalName.split(".").pop()?.toLowerCase()
      : "";
    let finalName = trimmed;
    if (originalExt && !trimmed.toLowerCase().endsWith(originalExt)) {
      finalName = trimmed + originalExt;
    }

    if (finalName === originalName) {
      handleCancelRename();
      return;
    }

    try {
      setRenaming(true);
      setError("");
      const result = await renameDocument(documentId, finalName);
      setBackendDocuments((previous) =>
        previous.map((doc) =>
          doc.document_id === documentId
            ? { ...doc, original_filename: result.document.original_filename }
            : doc
        )
      );
      setSuccessMessage(`Document renamed to "${result.document.original_filename}" successfully.`);
      handleCancelRename();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to rename document"
      );
    } finally {
      setRenaming(false);
    }
  };
const handleExtractText = async (documentId: string) => {
  try {
    setExtracting(true);
    setExtractedText("");

    const result = await extractDocumentText(documentId);

    setExtractedText(
      result.extracted_text || "No text found in this document."
    );
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Text extraction failed"
    );
  } finally {
    setExtracting(false);
  }
};
const uploadFiles = async () => {
  const readyFiles = files.filter(
    (item) => item.status === "Ready"
  );

  for (const item of readyFiles) {
    setFiles((previous) =>
      previous.map((file) =>
        file.id === item.id
          ? { ...file, status: "Uploading", progress: 0 }
          : file
      )
    );

    try {
      await uploadDocument(item.file);
      const updatedDocuments = await getDocuments();
      setBackendDocuments(updatedDocuments.documents);

      setFiles((previous) =>
        previous.map((file) =>
          file.id === item.id
            ? {
                ...file,
                status: "Completed",
                progress: 100,
              }
            : file
        )
      );

    } catch (error) {
      setFiles((previous) =>
        previous.map((file) =>
          file.id === item.id
            ? { ...file, status: "Ready", progress: 0 }
            : file
        )
      );

      setError(
        error instanceof Error
          ? error.message
          : "Document upload failed"
      );
    }
  }
};


  const formatSize = (size: number) => {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage />;
    }

    if (file.name.endsWith(".pdf")) {
      return <FileText />;
    }

    return <File />;
  };

  return (
    <div className="upload-page">

<div className="page-heading">
        <div>
          <h1>Upload Documents</h1>
          <p>Upload and organize all your documents in one place.</p>
        </div>
      </div>

      <div
        className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-cloud-icon">
          <UploadCloud size={42} />
        </div>

        <h2>Drag and drop your files here</h2>

        <p>or browse files from your computer</p>

        <button
          className="browse-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen size={18} />
          Browse Files
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }

            event.target.value = "";
          }}
        />

        <div className="upload-info">
          Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, TXT
          <br />
          Maximum file size: 20 MB per file
        </div>
      </div>

      {error && (
        <div className="upload-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="remove-file-btn"
            style={{ marginLeft: "auto", padding: "0 4px" }}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="upload-success">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="remove-file-btn"
            style={{ marginLeft: "auto", padding: "0 4px" }}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="file-section">

        <div className="file-section-heading">
          <h2>Selected Documents ({files.length})</h2>

          {files.some((file) => file.status === "Ready") && (
            <button
              className="upload-action-btn"
              onClick={uploadFiles}
            >
              <UploadCloud size={18} />
              Upload All
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="empty-upload">
            <FileText size={35} />
            <h3>No documents selected</h3>
            <p>Your selected files will appear here.</p>
          </div>
        ) : (
          <div className="file-list">

            {files.map((item) => (
              <div className="file-item" key={item.id}>

                <div className="file-icon">
                  {getIcon(item.file)}
                </div>

                <div className="file-details">
                  <h3>{item.file.name}</h3>
                  <p>{formatSize(item.file.size)}</p>

                  {item.status === "Uploading" && (
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className={`file-status ${item.status.toLowerCase()}`}>
                  {item.status === "Completed" && (
                    <CheckCircle size={16} />
                  )}
                  {item.status}
                </div>

                {item.status === "Ready" && (
                  <button
                     className="remove-file-btn" 
                    onClick={() => removeFile(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X size={18} />
                  </button>
                )}

              </div>
            ))}

          </div>
        )}

      </div>
      <div className="file-section">
        <div className="file-section-heading">
          <h2>Uploaded Documents ({backendDocuments.length})</h2>
        </div>

        {loadingDocuments ? (
          <div className="empty-upload">
            <Loader2 size={30} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: "10px" }}>Loading documents...</p>
          </div>
        ) : backendDocuments.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <div className="file-list">
            {backendDocuments.map((document) => (
              <div className="file-item" key={document.document_id}>
                <div className="file-icon">
                  <FileText />
                </div>

                <div className="file-details">
                  {editingDocId === document.document_id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSaveRename(document.document_id, document.original_filename);
                      }}
                      style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}
                    >
                      <input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        disabled={renaming}
                        autoFocus
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #7065e9",
                          borderRadius: "6px",
                          fontSize: "14px",
                          minWidth: "200px",
                          flex: 1,
                        }}
                      />
                      <button
                        type="submit"
                        disabled={renaming}
                        className="browse-btn"
                        style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
                      >
                        {renaming ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        disabled={renaming}
                        className="remove-file-btn"
                        style={{ padding: "6px" }}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <h3>{document.original_filename}</h3>
                      <p>{formatSize(document.file_size)}</p>
                    </>
                  )}
                </div>

                <div className="file-status completed">
                  <CheckCircle size={16} />
                  Completed
                </div>

                {editingDocId !== document.document_id && (
                  <button
                    className="remove-file-btn"
                    onClick={() => handleStartRename(document.document_id, document.original_filename)}
                    aria-label={`Rename ${document.original_filename}`}
                    title="Rename Document"
                  >
                    <Pencil size={18} />
                  </button>
                )}

                <button
                  className="remove-file-btn"
                  onClick={() => handleExtractText(document.document_id)}
                  disabled={extracting}
                  title="Extract Text"
                >
                  {extracting ? "Extracting..." : "Extract Text"}
                </button>

                <button
                  className="remove-file-btn"
                  onClick={() =>
                    window.open(
                      downloadDocument(document.document_id),
                      "_blank"
                    )
                  }
                  aria-label={`Download ${document.original_filename}`}
                  title="Download Document"
                >
                  <Download size={18} />
                </button>

                <button
                  className="remove-file-btn"
                  onClick={() => handleDeleteDocument(document.document_id)}
                  aria-label={`Delete ${document.original_filename}`}
                  title="Delete Document"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
  {extractedText && (
  <div className="extracted-text">
    <h3>Extracted Text</h3>
    <pre>{extractedText}</pre>
  </div>
)}
</div>
    </div>
  );
}

export default Upload;