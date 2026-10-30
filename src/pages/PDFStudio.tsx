import { useRef, useState } from "react";
import {
  Upload,
  Save,
  Undo2,
  Redo2,
  RotateCw,
  Trash2,
  FilePlus,
  Download,
  Scissors,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

function PDFStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const insertRef = useRef<HTMLInputElement>(null);

  const [pdf, setPdf] = useState<PDFDocument | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [selectedPage, setSelectedPage] = useState(0);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Uint8Array[]>([]);
  const [future, setFuture] = useState<Uint8Array[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");

  const updatePreview = (bytes: Uint8Array) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const blob = new Blob([bytes as BlobPart], {
      type: "application/pdf",
    });

    setPreviewUrl(URL.createObjectURL(blob));
  };

  const loadPDF = async (file: File) => {
    try {
      setLoading(true);
      setError("");
      setMessage("Loading PDF...");

      const bytes = new Uint8Array(await file.arrayBuffer());
      const document = await PDFDocument.load(bytes);

      setPdf(document);
      setPdfBytes(bytes);
      setPages(Array.from({ length: document.getPageCount() }, (_, i) => i));
      setSelectedPage(0);
      setHistory([]);
      setFuture([]);
      setSaved(true);

      updatePreview(bytes);
      setMessage("PDF loaded successfully.");
    } catch {
      setError("Unable to open this PDF. Please select a valid PDF file.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const recordChange = async (document: PDFDocument) => {
    if (pdfBytes) {
      setHistory((previous) => [...previous, pdfBytes]);
    }

    setFuture([]);
    const bytes = await document.save();

    setPdf(document);
    setPdfBytes(bytes);
    setPages(Array.from({ length: document.getPageCount() }, (_, i) => i));
    setSelectedPage(0);
    setSaved(false);
    updatePreview(bytes);
    setMessage("Changes applied. Remember to save.");
  };

  const rotatePage = async () => {
    if (!pdf) return;

    const document = await PDFDocument.load(await pdf.save());
    const page = document.getPages()[selectedPage];

    if (!page) return;

    page.setRotation(degrees((page.getRotation().angle + 90) % 360));

    await recordChange(document);
  };

  const deletePage = async () => {
    if (!pdf || pages.length <= 1) {
      setError("A PDF must contain at least one page.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this page?")) {
      return;
    }

    const document = await PDFDocument.load(await pdf.save());
    document.removePage(selectedPage);

    await recordChange(document);
  };

  const movePage = async (direction: number) => {
    if (!pdf) return;

    const target = selectedPage + direction;

    if (target < 0 || target >= pages.length) return;

    const document = await PDFDocument.load(await pdf.save());

    const copiedDocument = await PDFDocument.create();
    const copiedPages = await copiedDocument.copyPages(
      document,
      pages.map((_, index) => index)
    );

    const order = [...pages];
    [order[selectedPage], order[target]] = [
      order[target],
      order[selectedPage],
    ];

    order.forEach((index) => copiedDocument.addPage(copiedPages[index]));

    await recordChange(copiedDocument);
    setSelectedPage(target);
  };

  const insertPDF = async (file: File) => {
    if (!pdf) return;

    try {
      setLoading(true);

      const document = await PDFDocument.load(await pdf.save());
      const additional = await PDFDocument.load(
        new Uint8Array(await file.arrayBuffer())
      );

      const copiedPages = await document.copyPages(
        additional,
        additional.getPageIndices()
      );

      copiedPages.forEach((page) => document.addPage(page));

      await recordChange(document);
      setMessage("Pages inserted successfully.");
    } catch {
      setError("Unable to insert this PDF.");
    } finally {
      setLoading(false);
    }
  };

  const extractPage = async () => {
    if (!pdf) return;

    try {
      const document = await PDFDocument.load(await pdf.save());
      const extracted = await PDFDocument.create();

      const [page] = await extracted.copyPages(document, [selectedPage]);
      extracted.addPage(page);

      const bytes = await extracted.save();
      downloadPDF(bytes, `page-${selectedPage + 1}.pdf`);
      setMessage("Page extracted successfully.");
    } catch {
      setError("Unable to extract this page.");
    }
  };

  const downloadPDF = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as BlobPart], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const savePDF = () => {
    if (!pdfBytes) return;

    downloadPDF(pdfBytes, "VertexDocs-Edited.pdf");
    setSaved(true);
    setMessage("PDF exported successfully.");
  };

  const undo = async () => {
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [...items, pdfBytes!]);

    const document = await PDFDocument.load(previous);
    setPdf(document);
    setPdfBytes(previous);
    setPages(Array.from({ length: document.getPageCount() }, (_, i) => i));
    updatePreview(previous);
    setSaved(false);
    setMessage("Last change undone.");
  };

  const redo = async () => {
    if (future.length === 0) return;

    const next = future[future.length - 1];
    setFuture((items) => items.slice(0, -1));
    setHistory((items) => [...items, pdfBytes!]);

    const document = await PDFDocument.load(next);
    setPdf(document);
    setPdfBytes(next);
    setPages(Array.from({ length: document.getPageCount() }, (_, i) => i));
    updatePreview(next);
    setSaved(false);
    setMessage("Change restored.");
  };

  return (
    <div className="pdf-studio">

      <div className="pdf-heading">
        <div>
          <h1>PDF Studio</h1>
          <p>Edit, organize and manage your PDF documents.</p>
        </div>

        <span className={saved ? "saved-status" : "unsaved-status"}>
          {saved ? "● Saved" : "● Unsaved changes"}
        </span>
      </div>

      <div className="pdf-toolbar">
        <button onClick={() => inputRef.current?.click()}>
          <Upload size={17} /> Open PDF
        </button>

        <button disabled={!pdf} onClick={undo}>
          <Undo2 size={17} /> Undo
        </button>

        <button disabled={!pdf} onClick={redo}>
          <Redo2 size={17} /> Redo
        </button>

        <button disabled={!pdf} onClick={savePDF}>
          <Save size={17} /> Save
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) loadPDF(file);
            event.target.value = "";
          }}
        />
      </div>

      <div className="pdf-workspace">

        <aside className="pdf-page-panel">
          <h3>Pages ({pages.length})</h3>

          {pages.map((page, index) => (
            <div
              key={index}
              className={`pdf-page-item ${
                selectedPage === index ? "selected" : ""
              }`}
              onClick={() => setSelectedPage(index)}
            >
              <FileText size={30} />
              <span>Page {index + 1}</span>
            </div>
          ))}

          <button
            className="pdf-insert-btn"
            disabled={!pdf}
            onClick={() => insertRef.current?.click()}
          >
            <FilePlus size={17} /> Insert PDF
          </button>

          <input
            ref={insertRef}
            type="file"
            hidden
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) insertPDF(file);
              event.target.value = "";
            }}
          />
        </aside>

        <section className="pdf-editor">

          {!pdf && !loading && (
            <div className="pdf-empty">
              <FileText size={55} />
              <h2>Open a PDF to get started</h2>
              <p>Upload a PDF document to start editing.</p>

              <button onClick={() => inputRef.current?.click()}>
                <Upload size={17} /> Choose PDF
              </button>
            </div>
          )}

          {loading && (
            <div className="pdf-empty">
              <Loader2 size={40} className="loading-icon" />
              <h3>Processing document...</h3>
            </div>
          )}

          {pdf && previewUrl && (
            <iframe
              className="pdf-preview"
              src={previewUrl}
              title="PDF Preview"
            />
          )}

        </section>

        <aside className="pdf-tools">
          <h3>Page Tools</h3>

          <button disabled={!pdf} onClick={rotatePage}>
            <RotateCw /> Rotate Page
          </button>

          <button disabled={!pdf} onClick={() => movePage(-1)}>
            Move Left
          </button>

          <button disabled={!pdf} onClick={() => movePage(1)}>
            Move Right
          </button>

          <button disabled={!pdf} onClick={extractPage}>
            <Scissors /> Extract Page
          </button>

          <button disabled={!pdf} onClick={deletePage}>
            <Trash2 /> Delete Page
          </button>
        </aside>

      </div>

      {error && (
        <div className="pdf-message error-message">
          <AlertCircle size={18} /> {error}
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {message && !error && (
        <div className="pdf-message success-message">
          <CheckCircle size={18} /> {message}
          <button onClick={() => setMessage("")}>Dismiss</button>
        </div>
      )}

    </div>
  );
}

export default PDFStudio;