import { useState } from "react";
import {
  Languages,
  Upload,
  Download,
  ArrowRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

function LanguageBridge() {
  const [fileName, setFileName] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("Tamil");
  const [originalText, setOriginalText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [revisedTamil, setRevisedTamil] = useState("");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleUpload = async (file?: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setStatus("File size must be below 20 MB.");
      return;
    }

    setFileName(file.name);
    setStatus(
      "File uploaded. Enter or extract the Tamil text to continue."
    );
  };

  const translateToEnglish = () => {
    if (!originalText.trim()) {
      setStatus("Please enter the original Tamil text.");
      return;
    }

    setStep(1);
    setStatus(
      "Translation service is not connected yet. Enter your English translation below."
    );
  };

  const translateBackToTamil = () => {
    if (!englishText.trim()) {
      setStatus("Please enter the English translation first.");
      return;
    }

    setStep(2);
    setAccepted(false);
    setStatus(
      "Enter the revised Tamil translation below. It should be based on your edited English text."
    );
  };

  const downloadText = (text: string, filename: string) => {
    if (!text.trim()) {
      setStatus("There is no content to download.");
      return;
    }

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="language-bridge">

      <div className="language-heading">
        <div>
          <h1>Language Bridge</h1>
          <p>Translate, edit and compare Tamil and English documents.</p>
        </div>

        <div className="language-icon">
          <Languages size={28} />
        </div>
      </div>

      {/* Progress */}

      <div className="translation-progress">
        {["Original Tamil", "English Translation", "Revised Tamil"].map(
          (label, index) => (
            <div
              key={label}
              className={`progress-step ${
                step >= index ? "active" : ""
              }`}
            >
              <span>{index + 1}</span>
              <p>{label}</p>
            </div>
          )
        )}
      </div>

      {/* Upload */}

      <div className="language-card upload-language-card">
        <h2>Upload Document</h2>
        <p>Upload your document to begin the translation process.</p>

        <label className="language-upload">
          <Upload size={25} />
          <span>Choose a document</span>
          <small>PDF, DOCX or TXT · Maximum 20 MB</small>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            hidden
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </label>

        {fileName && (
          <div className="uploaded-file">
            <FileText size={20} />
            <span>{fileName}</span>
            <CheckCircle size={18} />
          </div>
        )}
      </div>

      {/* Language Selection */}

      <div className="language-card">
        <h2>Language Settings</h2>

        <div className="language-selection">
          <div>
            <label>Source Language</label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
            >
              <option value="Tamil">Tamil</option>
              <option value="English">English</option>
            </select>
          </div>

          <ArrowRight size={24} />

          <div>
            <label>Target Language</label>
            <select defaultValue="English" disabled>
              <option value="English">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Translation Journey */}

      <div className="translation-columns">

        <div className="language-card">
          <div className="translation-card-heading">
            <h2>1. Original Tamil</h2>
            <button
              onClick={() =>
                downloadText(originalText, "original-tamil.txt")
              }
            >
              <Download size={16} /> Download
            </button>
          </div>

          <textarea
            placeholder="Enter your original Tamil content here..."
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
          />

          <button
            className="primary-language-btn"
            onClick={translateToEnglish}
          >
            Translate to English <ArrowRight size={17} />
          </button>
        </div>

        <div className="language-card">
          <div className="translation-card-heading">
            <h2>2. English Translation</h2>
            <button
              onClick={() =>
                downloadText(englishText, "english-translation.txt")
              }
            >
              <Download size={16} /> Download
            </button>
          </div>

          <textarea
            placeholder="English translation will appear here. You can edit it..."
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
          />

          <button
            className="primary-language-btn"
            onClick={translateBackToTamil}
          >
            Translate edited version back to Tamil
            <ArrowRight size={17} />
          </button>
        </div>

      </div>

      {/* Revised Tamil */}

      <div className="language-card revised-card">
        <div className="translation-card-heading">
          <h2>3. Revised Tamil Translation</h2>

          <button
            onClick={() =>
              downloadText(revisedTamil, "revised-tamil.txt")
            }
          >
            <Download size={16} /> Download
          </button>
        </div>

        <textarea
          placeholder="Revised Tamil translation based on your edited English content..."
          value={revisedTamil}
          onChange={(e) => {
            setRevisedTamil(e.target.value);
            setAccepted(false);
          }}
        />

        <div className="comparison-actions">
          <button
            className="accept-btn"
            onClick={() => {
              setAccepted(true);
              setStatus("Revised Tamil version accepted.");
            }}
          >
            <CheckCircle size={17} /> Accept Changes
          </button>

          <button
            className="reject-btn"
            onClick={() => {
              setRevisedTamil("");
              setAccepted(false);
              setStatus("Revised Tamil changes rejected.");
            }}
          >
            <XCircle size={17} /> Reject Changes
          </button>
        </div>

        {accepted && (
          <p className="accepted-message">
            <CheckCircle size={16} /> Changes accepted successfully.
          </p>
        )}
      </div>

      {/* Warning */}

      <div className="translation-warning">
        <AlertTriangle size={22} />

        <div>
          <strong>Important Document Notice</strong>
          <p>
            For legal, financial and official documents, always
            verify the translated content before using it.
          </p>
        </div>
      </div>

      {status && (
        <div className="language-status">
          {status}
          <button onClick={() => setStatus("")}>Dismiss</button>
        </div>
      )}

    </div>
  );
}

export default LanguageBridge;