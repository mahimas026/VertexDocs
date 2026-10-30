import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  FileImage,
  File,
  ArrowRight,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

function Convert() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("PDF");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [converting, setConverting] = useState(false);

  const formats = ["PDF", "DOCX", "TXT", "PNG", "JPG"];

  const handleFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      setStatus("File size must be below 20 MB.");
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setStatus("");
  };

  const startConversion = () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    setConverting(true);
    setProgress(0);
    setStatus("");

    let value = 0;

    const interval = setInterval(() => {
      value += 10;
      setProgress(value);

      if (value >= 100) {
        clearInterval(interval);
        setConverting(false);
        setStatus(
          "Demo conversion completed. Actual format conversion requires backend integration."
        );
      }
    }, 300);
  };

  const downloadDemo = () => {
    if (!file) return;

    const blob = new Blob(
      [`Demo conversion output for ${file.name} to ${format}.\nActual conversion is not connected yet.`],
      { type: "text/plain" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `converted-demo-${file.name}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const getIcon = () => {
    if (file?.type.startsWith("image/")) return <FileImage size={35} />;
    if (file?.type === "application/pdf") return <FileText size={35} />;
    return <File size={35} />;
  };

  return (
    <div className="convert-page">

      <div className="convert-heading">
        <div>
          <h1>Convert Files</h1>
          <p>Convert your documents into different file formats.</p>
        </div>
      </div>

      <div
        className="convert-upload"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <UploadCloud size={45} />

        <h2>Upload your document</h2>
        <p>Drag and drop your file here or browse your computer.</p>

        <button onClick={() => inputRef.current?.click()}>
          Browse Files
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <small>PDF, DOCX, TXT, PNG, JPG · Maximum 20 MB</small>
      </div>

      {file && (
        <div className="convert-file-card">
          <div className="convert-file-icon">{getIcon()}</div>

          <div className="convert-file-details">
            <h3>{file.name}</h3>
            <p>{(file.size / 1024).toFixed(1)} KB</p>
          </div>

          <button
            className="convert-remove"
            onClick={() => {
              setFile(null);
              setProgress(0);
              setStatus("");
            }}
            aria-label="Remove selected file"
          >
            <X />
          </button>
        </div>
      )}

      <div className="format-card">
        <h2>Select Output Format</h2>

        <div className="format-selection">
          <div>
            <label>Convert From</label>
            <div className="format-box">
              {file ? file.name.split(".").pop()?.toUpperCase() : "Unknown"}
            </div>
          </div>

          <ArrowRight size={25} />

          <div>
            <label>Convert To</label>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {formats.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="convert-start-btn"
          onClick={startConversion}
          disabled={!file || converting}
        >
          <RefreshCw size={18} />
          {converting ? "Converting..." : "Start Conversion"}
        </button>
      </div>

      {converting && (
        <div className="conversion-progress">
          <div className="progress-label">
            <span>Processing document</span>
            <strong>{progress}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status && (
        <div className="conversion-result">
          {progress === 100 ? (
            <CheckCircle />
          ) : (
            <AlertCircle />
          )}

          <span>{status}</span>

          {progress === 100 && (
            <button onClick={downloadDemo}>
              <Download size={17} /> Download Demo
            </button>
          )}
        </div>
      )}

    </div>
  );
}

export default Convert;