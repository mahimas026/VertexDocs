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
import "./Convert.css";
import { convertDocument } from "../services/convertApi";

type CompressionLevel = "none" | "low" | "medium" | "high";

type CompressionResult =
  | { kind: "actual"; blob: Blob; fileName: string }
  | { kind: "estimate"; estimatedSize: number };

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const getImageType = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.type === "image/png" || extension === "png") return "image/png";
  if (
    file.type === "image/jpeg" ||
    ["jpg", "jpeg"].includes(extension ?? "")
  ) {
    return "image/jpeg";
  }
  return null;
};

const compressImage = (
  file: File,
  mimeType: string,
  quality: number,
  onProgress: (progress: number) => void
) =>
  new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
      onProgress(35);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Your browser could not prepare this image."));
        return;
      }

      context.drawImage(image, 0, 0);
      onProgress(70);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(imageUrl);
          if (blob) resolve(blob);
          else reject(new Error("Your browser could not encode this image."));
        },
        mimeType,
        mimeType === "image/jpeg" ? quality : undefined
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("This image could not be opened for compression."));
    };
    image.src = imageUrl;
  });

function Convert() {
  const inputRef = useRef<HTMLInputElement>(null);
  const compressionRunRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<{
  blob: Blob;
  fileName: string;
} | null>(null);
  const [format, setFormat] = useState("PDF");
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("none");
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStatus, setCompressionStatus] = useState("");
  const [compressionResult, setCompressionResult] =
    useState<CompressionResult | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [converting, setConverting] = useState(false);

  const extension = file?.name.split(".").pop()?.toLowerCase() || "";

const formats =
  extension === "pdf"
    ? ["TXT", "DOCX"]
    : extension === "docx"
      ? ["TXT", "PDF"]
      : extension === "txt"
        ? ["PDF"]
        : ["PDF"];
  const imageType = file ? getImageType(file) : null;
  const matchingImageOutput =
    (imageType === "image/png" && format === "PNG") ||
    (imageType === "image/jpeg" && format === "JPG");
  const canCompressImage = Boolean(imageType && matchingImageOutput);
  const compressionQualities: Record<Exclude<CompressionLevel, "none">, number> =
    {
      low: 0.85,
      medium: 0.7,
      high: 0.5,
    };

  
const handleFile = (selectedFile?: File) => {
  if (!selectedFile) return;

  if (selectedFile.size > 20 * 1024 * 1024) {
    setStatus("File size must be below 20 MB.");
    return;
  }

  const extension =
    selectedFile.name.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf") {
    setFormat("TXT");
  } else if (extension === "docx") {
    setFormat("TXT");
  } else if (extension === "txt") {
    setFormat("PDF");
  } else if (["png", "jpg", "jpeg"].includes(extension)) {
    setFormat("PDF");
  } else {
    setStatus("Unsupported file format.");
    return;
  }

  compressionRunRef.current += 1;
  setCompressing(false);
  setFile(selectedFile);
  setConvertedFile(null);
  setProgress(0);
  setStatus("");
  setCompressionProgress(0);
  setCompressionStatus("");
  setCompressionResult(null);
};

  
const startConversion = async () => {
  if (!file) {
    setStatus("Please select a file first.");
    return;
  }

  setConverting(true);
  setProgress(10);
  setStatus("");
  setConvertedFile(null);

  try {
    const result = await convertDocument(file, format);

    setConvertedFile(result);
    setProgress(100);
    setStatus("Conversion completed successfully!");
  } catch (error) {
    setProgress(0);
    setStatus(
      error instanceof Error
        ? error.message
        : "File conversion failed. Please try again."
    );
  } finally {
    setConverting(false);
  }
};

  const startCompression = async () => {
    if (!file) {
      setCompressionStatus("Select a file first to review compression.");
      return;
    }

    const runId = ++compressionRunRef.current;
    setCompressing(true);
    setCompressionProgress(0);
    setCompressionStatus("");
    setCompressionResult(null);

    if (compressionLevel === "none") {
      setCompressionProgress(100);
      setCompressionResult({ kind: "actual", blob: file, fileName: file.name });
      setCompressionStatus("No compression selected. The original file is ready.");
      setCompressing(false);
      return;
    }

    if (canCompressImage && imageType) {
      try {
        setCompressionStatus("Compressing this image in your browser…");
        setCompressionProgress(10);
        const blob = await compressImage(
          file,
          imageType,
          compressionQualities[compressionLevel],
          (value) => {
            if (runId === compressionRunRef.current) {
              setCompressionProgress(value);
            }
          }
        );
        if (runId !== compressionRunRef.current) return;
        const extension = imageType === "image/png" ? "png" : "jpg";
        const baseName = file.name.replace(/\.[^.]+$/, "");
        setCompressionResult({
          kind: "actual",
          blob,
          fileName: `${baseName}-compressed.${extension}`,
        });
        setCompressionProgress(100);
        setCompressionStatus(
          blob.size < file.size
            ? "Image compressed locally. No file was uploaded."
            : "Image re-encoded locally, but the result is not smaller. No file was uploaded."
        );
      } catch (error) {
        if (runId !== compressionRunRef.current) return;
        setCompressionStatus(
          error instanceof Error
            ? error.message
            : "Image compression could not be completed."
        );
      } finally {
        if (runId === compressionRunRef.current) setCompressing(false);
      }
      return;
    }

    setCompressionStatus("Preparing an illustrative size estimate…");
    const estimatedFactors: Record<Exclude<CompressionLevel, "none">, number> =
      {
        low: 0.95,
        medium: 0.85,
        high: 0.75,
      };
    setCompressionProgress(40);
    window.setTimeout(() => {
      if (runId !== compressionRunRef.current) return;
      setCompressionProgress(100);
      setCompressionResult({
        kind: "estimate",
        estimatedSize: Math.round(
          file.size * estimatedFactors[compressionLevel]
        ),
      });
      setCompressionStatus(
        "Estimate only — this file type or output format cannot be compressed here. No converted file was created."
      );
      setCompressing(false);
    }, 350);
  };

  const downloadCompressionResult = () => {
    if (!file || !compressionResult) return;

    const blob =
      compressionResult.kind === "actual"
        ? compressionResult.blob
        : new Blob(
            [
              `Vertex Docs compression estimate\n\nFile: ${file.name}\nSelected output format: ${format}\nCompression level: ${compressionLevel}\nOriginal size: ${formatFileSize(file.size)}\nIllustrative estimated size: ${formatFileSize(compressionResult.estimatedSize)}\n\nThis is an estimate only. No compressed or converted document was created.`,
            ],
            { type: "text/plain" }
          );
    const fileName =
      compressionResult.kind === "actual"
        ? compressionResult.fileName
        : `${file.name}.compression-estimate.txt`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  
const downloadDemo = () => {
  if (!convertedFile) {
    setStatus("Please convert the file before downloading.");
    return;
  }

  const url = URL.createObjectURL(convertedFile.blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = convertedFile.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

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
              compressionRunRef.current += 1;
              setCompressing(false);
              setFile(null);
              setProgress(0);
              setStatus("");
              setCompressionProgress(0);
              setCompressionStatus("");
              setCompressionResult(null);
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
              onChange={(e) => {
                compressionRunRef.current += 1;
                setCompressing(false);
                setFormat(e.target.value);
                setCompressionProgress(0);
                setCompressionStatus("");
                setCompressionResult(null);
              }}
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

      <section className="compression-card" aria-labelledby="compression-title">
        <div className="compression-heading">
          <div>
            <p className="compression-eyebrow">FILE COMPRESSION</p>
            <h2 id="compression-title">Choose a compression level</h2>
            <p>
              {canCompressImage
                ? "This matching image format can be re-encoded in your browser. The file stays on your device."
                : file
                  ? `Compression settings target the uploaded ${imageType ? "image" : "file"} only. ${format} conversion is a demo, so no converted output is available to compress.`
                  : "Upload a file to see format-specific compression options."}
            </p>
          </div>
        </div>

        <div className="compression-options" role="radiogroup" aria-label="File compression level">
          {(
            [
              ["none", "No", "Keep the original file"],
              ["low", "Low", "Light compression"],
              ["medium", "Medium", "Balanced compression"],
              ["high", "High", "Strongest compression"],
            ] as const
          ).map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              className={`compression-option${compressionLevel === value ? " is-selected" : ""}`}
              role="radio"
              aria-checked={compressionLevel === value}
              onClick={() => {
                compressionRunRef.current += 1;
                setCompressing(false);
                setCompressionLevel(value);
                setCompressionProgress(0);
                setCompressionStatus("");
                setCompressionResult(null);
              }}
            >
              <span className="compression-option-title">{label}</span>
              <span className="compression-option-description">{description}</span>
            </button>
          ))}
        </div>

        {file && (
          <div className="compression-size-details">
            <div>
              <span>Original file size</span>
              <strong>{formatFileSize(file.size)}</strong>
            </div>
            <div>
              <span>
                {compressionResult?.kind === "actual"
                  ? "Final file size"
                  : compressionResult?.kind === "estimate"
                    ? "Estimated final size"
                    : "Final size"}
              </span>
              <strong>
                {compressionResult?.kind === "actual"
                  ? formatFileSize(compressionResult.blob.size)
                  : compressionResult?.kind === "estimate"
                    ? `≈ ${formatFileSize(compressionResult.estimatedSize)}`
                    : "—"}
              </strong>
            </div>
          </div>
        )}

        {file && !canCompressImage && compressionLevel !== "none" && (
          <p className="compression-note">
            Estimates are illustrative and can differ from actual results.
            PDF, DOCX and text compression needs a compatible processor; this
            demo does not create a compressed document.
          </p>
        )}
        {file && imageType === "image/png" && matchingImageOutput && (
          <p className="compression-note">
            PNG uses lossless browser re-encoding; Low, Medium and High cannot
            change PNG quality and may not reduce the file size.
          </p>
        )}
        {file && imageType === "image/jpeg" && matchingImageOutput && (
          <p className="compression-note">
            JPEG quality settings trade image detail for smaller size.
          </p>
        )}

        <button
          className="compression-start-btn"
          onClick={startCompression}
          disabled={!file || compressing}
        >
          <RefreshCw size={17} />
          {compressing ? "Processing…" : compressionLevel === "none" ? "Use Original File" : "Apply Compression"}
        </button>

        {compressing && (
          <div className="compression-progress" aria-live="polite">
            <div className="compression-progress-label">
              <span>{canCompressImage ? "Compressing image" : "Preparing estimate"}</span>
              <strong>{compressionProgress}%</strong>
            </div>
            <div
              className="compression-progress-track"
              role="progressbar"
              aria-valuenow={compressionProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="compression-progress-fill"
                style={{ width: `${compressionProgress}%` }}
              />
            </div>
          </div>
        )}

        {compressionStatus && (
          <div className="compression-result" aria-live="polite">
            <span>{compressionStatus}</span>
            {compressionResult && (
              <button onClick={downloadCompressionResult}>
                <Download size={17} />
                {compressionResult.kind === "actual"
                  ? compressionLevel === "none"
                    ? "Download Original"
                    : "Download Image"
                  : "Download Estimate"}
              </button>
            )}
          </div>
        )}
      </section>

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