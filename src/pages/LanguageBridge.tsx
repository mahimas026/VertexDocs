import { useState } from "react";
import {
  Languages,
  Upload,
  Download,
  ArrowRight,
  ArrowLeftRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  ALL_SUPPORTED_LANGUAGES,
  translateText,
  tanglishToTamil,
  tamilToTanglish,
} from "../services/languageApi";
import {
  uploadDocument,
  extractDocumentText,
} from "../services/documentApi";

function LanguageBridge() {
  const [fileName, setFileName] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("ta");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [originalText, setOriginalText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [revisedTamil, setRevisedTamil] = useState("");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [backTranslating, setBackTranslating] = useState(false);

  const handleUpload = async (file?: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be below 20 MB.");
      return;
    }

    try {
      setUploadingDoc(true);
      setError("");
      setStatus(`Uploading and extracting text from ${file.name}...`);
      setFileName(file.name);

      const uploaded = await uploadDocument(file);
      const extracted = await extractDocumentText(uploaded.document_id);

      if (extracted.extracted_text) {
        setOriginalText(extracted.extracted_text);
        setStatus(
          `Document text extracted successfully (${extracted.character_count} characters).`
        );
      } else {
        setStatus("Document uploaded, but no text could be extracted.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Document upload or text extraction failed."
      );
      setStatus("");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setOriginalText(englishText);
    setEnglishText(originalText);
  };

  const translateForward = async () => {
    if (!originalText.trim()) {
      setError("Please enter or extract original text before translating.");
      return;
    }

    try {
      setTranslating(true);
      setError("");
      setStatus("Translating text...");

      let resultText = "";

      if (sourceLanguage === "tanglish" && targetLanguage === "ta") {
        const res = await tanglishToTamil(originalText);
        resultText = res.output;
      } else if (sourceLanguage === "ta" && targetLanguage === "tanglish") {
        const res = await tamilToTanglish(originalText);
        resultText = res.output;
      } else if (sourceLanguage === "tanglish") {
        const tamilRes = await tanglishToTamil(originalText);
        const transRes = await translateText(tamilRes.output, "ta", targetLanguage);
        resultText = transRes.translated_text;
      } else if (targetLanguage === "tanglish") {
        const transRes = await translateText(originalText, sourceLanguage, "ta");
        const tanglishRes = await tamilToTanglish(transRes.translated_text);
        resultText = tanglishRes.output;
      } else {
        const res = await translateText(originalText, sourceLanguage, targetLanguage);
        resultText = res.translated_text;
      }

      setEnglishText(resultText);
      setStep(1);
      setStatus("Translation completed. You can edit the translated text in Box 2.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Translation failed. Verify that language packages are configured."
      );
    } finally {
      setTranslating(false);
    }
  };

  const translateBack = async () => {
    if (!englishText.trim()) {
      setError("Please enter or generate translated text in Box 2 first.");
      return;
    }

    try {
      setBackTranslating(true);
      setError("");
      setStatus("Translating edited content back to source language...");

      let resultText = "";

      if (targetLanguage === "en" && sourceLanguage === "ta") {
        const res = await translateText(englishText, "en", "ta");
        resultText = res.translated_text;
      } else if (targetLanguage === "tanglish" && sourceLanguage === "ta") {
        const res = await tanglishToTamil(englishText);
        resultText = res.output;
      } else if (sourceLanguage === "tanglish") {
        const transRes = await translateText(englishText, targetLanguage, "ta");
        const tanglishRes = await tamilToTanglish(transRes.translated_text);
        resultText = tanglishRes.output;
      } else {
        const res = await translateText(englishText, targetLanguage, sourceLanguage);
        resultText = res.translated_text;
      }

      setRevisedTamil(resultText);
      setStep(2);
      setAccepted(false);
      setStatus("Back-translation completed. Review the side-by-side comparison below.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Back-translation failed. Verify that language packages are configured."
      );
    } finally {
      setBackTranslating(false);
    }
  };

  const downloadText = (text: string, filename: string) => {
    if (!text.trim()) {
      setError("There is no content to download.");
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
    setStatus(`Downloaded ${filename}.`);
  };

  const getLanguageName = (code: string) => {
    return ALL_SUPPORTED_LANGUAGES.find((lang) => lang.code === code)?.name || code;
  };

  return (
    <div className="language-bridge">

      <div className="language-heading">
        <div>
          <h1>Language Bridge</h1>
          <p>Translate, edit and compare documents across 12 languages and Tanglish.</p>
        </div>

        <div className="language-icon">
          <Languages size={28} />
        </div>
      </div>

      {/* Progress */}
      <div className="translation-progress">
        {["Original", "Translation", "Revised"].map(
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
        <p>Upload a document to extract text automatically, or paste text below.</p>

        <label className="language-upload">
          {uploadingDoc ? (
            <Loader2 size={25} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Upload size={25} />
          )}
          <span>{uploadingDoc ? "Extracting document text..." : "Choose a document"}</span>
          <small>PDF, DOCX or TXT · Maximum 20 MB</small>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            hidden
            disabled={uploadingDoc}
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

        <div className="language-selection" style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
              Source Language
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d9dce5" }}
            >
              {ALL_SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapLanguages}
            title="Swap source and target languages"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #d9dce5",
              background: "#fff",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            <ArrowLeftRight size={18} />
          </button>

          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
              Target Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d9dce5" }}
            >
              {ALL_SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translation Journey */}
      <div className="translation-columns">

        <div className="language-card">
          <div className="translation-card-heading">
            <h2>1. Original ({getLanguageName(sourceLanguage)})</h2>
            <button
              onClick={() =>
                downloadText(originalText, `original-${sourceLanguage}.txt`)
              }
            >
              <Download size={16} /> Download
            </button>
          </div>

          <textarea
            placeholder={`Enter or paste your ${getLanguageName(sourceLanguage)} content here...`}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
          />

          <button
            className="primary-language-btn"
            onClick={translateForward}
            disabled={translating || !originalText.trim()}
          >
            {translating ? "Translating..." : `Translate to ${getLanguageName(targetLanguage)}`}
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="language-card">
          <div className="translation-card-heading">
            <h2>2. Translated ({getLanguageName(targetLanguage)})</h2>
            <button
              onClick={() =>
                downloadText(englishText, `translated-${targetLanguage}.txt`)
              }
            >
              <Download size={16} /> Download
            </button>
          </div>

          <textarea
            placeholder={`${getLanguageName(targetLanguage)} translation will appear here. You can edit it before back-translation...`}
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
          />

          <button
            className="primary-language-btn"
            onClick={translateBack}
            disabled={backTranslating || !englishText.trim()}
          >
            {backTranslating
              ? "Translating back..."
              : `Translate edited version back to ${getLanguageName(sourceLanguage)}`}
            <ArrowRight size={17} />
          </button>
        </div>

      </div>

      {/* Revised Version */}
      <div className="language-card revised-card">
        <div className="translation-card-heading">
          <h2>3. Revised ({getLanguageName(sourceLanguage)})</h2>

          <button
            onClick={() =>
              downloadText(revisedTamil, `revised-${sourceLanguage}.txt`)
            }
          >
            <Download size={16} /> Download
          </button>
        </div>

        <textarea
          placeholder={`Revised ${getLanguageName(sourceLanguage)} content generated from your edited translation...`}
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
              setStatus("Revised version accepted.");
              setError("");
            }}
          >
            <CheckCircle size={17} /> Accept Changes
          </button>

          <button
            className="reject-btn"
            onClick={() => {
              setRevisedTamil("");
              setAccepted(false);
              setStatus("Revised changes rejected.");
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
            verify translated content before using it.
          </p>
        </div>
      </div>

      {error && (
        <div className="language-status" style={{ background: "#fff0f0", color: "#d14343", border: "1px solid #ffd4d4" }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ marginLeft: "auto" }}>Dismiss</button>
        </div>
      )}

      {status && !error && (
        <div className="language-status">
          <CheckCircle size={18} />
          <span>{status}</span>
          <button onClick={() => setStatus("")} style={{ marginLeft: "auto" }}>Dismiss</button>
        </div>
      )}

    </div>
  );
}

export default LanguageBridge;