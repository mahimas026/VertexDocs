import { useRef, useState } from "react";
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
} from "lucide-react";

interface UploadedFile {
  id: number;
  file: File;
  status: "Ready" | "Uploading" | "Completed";
  progress: number;
}

function Upload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

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

  const uploadFiles = () => {
    const readyFiles = files.filter(
      (item) => item.status === "Ready"
    );

    readyFiles.forEach((item) => {
      setFiles((previous) =>
        previous.map((file) =>
          file.id === item.id
            ? { ...file, status: "Uploading", progress: 0 }
            : file
        )
      );

      let progress = 0;

      const interval = setInterval(() => {
        progress += 10;

        if (progress >= 100) {
          clearInterval(interval);

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
        } else {
          setFiles((previous) =>
            previous.map((file) =>
              file.id === item.id
                ? { ...file, progress }
                : file
            )
          );
        }
      }, 200);
    });
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

    if (file.name.toLowerCase().endsWith(".pdf")) {
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
          {error}
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
    </div>
  );
}

export default Upload;