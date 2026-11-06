import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Download,
  FilePlus2,
  Highlighter,
  ImagePlus,
  Loader2,
  Pencil,
  RotateCw,
  Save,
  Scissors,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  Redo2,
  Upload,
} from "lucide-react";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import "./PDFStudio.css";

type ToolButtonProps = {
  icon: typeof Type;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function PDFToolButton({ icon: Icon, label, onClick, disabled = false }: ToolButtonProps) {
  return (
    <button className="pdf-tool-button" disabled={disabled} onClick={onClick}>
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const createBlankPdfBytes = async (text = "") => {
  const document = await PDFDocument.create();
  const page = document.addPage([A4_WIDTH, A4_HEIGHT]);

  if (text.trim()) {
    const font = await document.embedFont(StandardFonts.Helvetica);
    page.drawText(text, {
      x: 54,
      y: page.getHeight() - 60,
      size: 12,
      lineHeight: 18,
      maxWidth: page.getWidth() - 108,
      font,
      color: rgb(0.12, 0.16, 0.22),
    });
  }

  return document.save();
};

function PDFStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const insertRef = useRef<HTMLInputElement>(null);
  const blankEditorRef = useRef<HTMLDivElement>(null);
  const blankHistoryRef = useRef<string[]>([]);
  const blankFutureRef = useRef<string[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [selectedPage, setSelectedPage] = useState(0);
  const [isBlankDocument, setIsBlankDocument] = useState(true);
  const [blankText, setBlankText] = useState("");
  const [blankUndoCount, setBlankUndoCount] = useState(0);
  const [blankRedoCount, setBlankRedoCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Uint8Array[]>([]);
  const [future, setFuture] = useState<Uint8Array[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [documentName, setDocumentName] = useState("Untitled document");

  useEffect(() => {
    let active = true;
    const createBlank = async () => {
      const bytes = await createBlankPdfBytes();
      if (active) {
        setPdfBytes(bytes);
        setPageCount(1);
        setSelectedPage(0);
        setDocumentName("Untitled document");
        setPreviewUrl(URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" })));
      }
    };
    void createBlank();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (
      isBlankDocument &&
      blankEditorRef.current &&
      blankEditorRef.current.innerText !== blankText
    ) {
      blankEditorRef.current.innerText = blankText;
    }
  }, [blankText, isBlankDocument]);

  const publishDocument = (bytes: Uint8Array, count: number, dirty: boolean) => {
    setPdfBytes(bytes);
    setPageCount(count);
    setSelectedPage((page) => Math.min(page, count - 1));
    setSaved(!dirty);
    setPreviewUrl(URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" })));
  };

  const createBlank = async () => {
    try {
      const bytes = await createBlankPdfBytes();
      setHistory([]);
      setFuture([]);
      publishDocument(bytes, 1, true);
      setIsBlankDocument(true);
      setBlankText("");
      blankHistoryRef.current = [];
      blankFutureRef.current = [];
      setBlankUndoCount(0);
      setBlankRedoCount(0);
      setDocumentName("Untitled document");
      setError("");
      setMessage("A new blank A4 document is ready.");
    } catch {
      setError("Unable to create a blank PDF.");
    }
  };

  const loadPDF = async (file: File) => {
    try {
      setLoading(true);
      setError("");
      setMessage("Loading PDF...");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const document = await PDFDocument.load(bytes);
      const savedBytes = await document.save();
      setHistory([]);
      setFuture([]);
      publishDocument(savedBytes, document.getPageCount(), false);
      setIsBlankDocument(false);
      setBlankText("");
      blankHistoryRef.current = [];
      blankFutureRef.current = [];
      setBlankUndoCount(0);
      setBlankRedoCount(0);
      setDocumentName(file.name.replace(/\.pdf$/i, "") || "Imported document");
      setMessage("PDF opened. Existing content is shown in the page preview.");
    } catch {
      setError("Unable to open this PDF. It may be invalid, encrypted, or use unsupported features.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const applyEdit = async (edit: (document: PDFDocument) => Promise<void> | void, success: string) => {
    if (!pdfBytes) return;
    try {
      const sourceBytes = isBlankDocument
        ? await createBlankPdfBytes(blankText)
        : pdfBytes;
      const document = await PDFDocument.load(sourceBytes);
      await edit(document);
      const bytes = await document.save();
      setHistory((items) => [...items, sourceBytes]);
      setFuture([]);
      publishDocument(bytes, document.getPageCount(), true);
      setIsBlankDocument(false);
      setMessage(success);
      setError("");
    } catch {
      setError("Unable to apply this edit to the current PDF.");
    }
  };

  const addText = async (annotation = false) => {
    if (!annotation && isBlankDocument) {
      blankEditorRef.current?.focus();
      setMessage("Type directly on the blank page to add editable text.");
      return;
    }
    const text = window.prompt(annotation ? "Enter your annotation:" : "Enter text to add:");
    if (!text?.trim() || !pdfBytes) return;
    await applyEdit(async (document) => {
      const page = document.getPage(selectedPage);
      const font = await document.embedFont(StandardFonts.Helvetica);
      page.drawText(text.trim(), {
        x: 54,
        y: page.getHeight() - (annotation ? 115 : 80),
        size: annotation ? 12 : 18,
        font,
        color: annotation ? rgb(0.13, 0.32, 0.65) : rgb(0.12, 0.16, 0.22),
        maxWidth: page.getWidth() - 108,
      });
    }, annotation ? "Annotation added." : "Text added.");
  };

  const addImage = async (file: File) => {
    if (!pdfBytes) return;
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      await applyEdit(async (document) => {
        const image = file.type === "image/png"
          ? await document.embedPng(data)
          : await document.embedJpg(data);
        const page = document.getPage(selectedPage);
        const maxWidth = page.getWidth() * 0.55;
        const maxHeight = page.getHeight() * 0.35;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        page.drawImage(image, {
          x: 54,
          y: page.getHeight() - image.height * scale - 150,
          width: image.width * scale,
          height: image.height * scale,
        });
      }, "Image inserted.");
    } catch {
      setError("Choose a supported PNG or JPEG image.");
    }
  };

  const highlight = () => applyEdit((document) => {
    const page = document.getPage(selectedPage);
    page.drawRectangle({
      x: 54,
      y: page.getHeight() - 160,
      width: Math.min(page.getWidth() - 108, 260),
      height: 24,
      color: rgb(1, 0.88, 0.25),
      opacity: 0.38,
    });
  }, "Highlight added.");

  const draw = () => applyEdit((document) => {
    const page = document.getPage(selectedPage);
    const y = page.getHeight() - 205;
    page.drawLine({
      start: { x: 54, y },
      end: { x: 220, y: y - 45 },
      thickness: 3,
      color: rgb(0.18, 0.42, 0.82),
    });
  }, "Drawing added.");

  const rotatePage = () => applyEdit((document) => {
    const page = document.getPage(selectedPage);
    page.setRotation(degrees((page.getRotation().angle + 90) % 360));
  }, "Page rotated.");

  const addPage = () => applyEdit((document) => {
    document.insertPage(selectedPage + 1, [A4_WIDTH, A4_HEIGHT]);
  }, "Blank page added.");

  const deletePage = async () => {
    if (!pdfBytes || pageCount <= 1) {
      setError("A PDF must contain at least one page.");
      return;
    }
    if (!window.confirm("Delete the selected page?")) return;
    await applyEdit((document) => document.removePage(selectedPage), "Page deleted.");
  };

  const insertPDF = async (file: File) => {
    if (!pdfBytes) return;
    try {
      const sourceBytes = isBlankDocument
        ? await createBlankPdfBytes(blankText)
        : pdfBytes;
      const document = await PDFDocument.load(sourceBytes);
      const additional = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const copied = await document.copyPages(additional, additional.getPageIndices());
      copied.forEach((page) => document.addPage(page));
      const bytes = await document.save();
      setHistory((items) => [...items, sourceBytes]);
      setFuture([]);
      publishDocument(bytes, document.getPageCount(), true);
      setIsBlankDocument(false);
      setMessage("PDF pages inserted.");
      setError("");
    } catch {
      setError("Unable to insert pages from this PDF.");
    }
  };

  const extractPage = async () => {
    if (!pdfBytes) return;
    try {
      const sourceBytes = isBlankDocument
        ? await createBlankPdfBytes(blankText)
        : pdfBytes;
      const source = await PDFDocument.load(sourceBytes);
      const extracted = await PDFDocument.create();
      const [page] = await extracted.copyPages(source, [selectedPage]);
      extracted.addPage(page);
      downloadPDF(await extracted.save(), `page-${selectedPage + 1}.pdf`, false);
      setMessage(`Page ${selectedPage + 1} downloaded.`);
    } catch {
      setError("Unable to extract the selected page.");
    }
  };

  const movePage = (direction: number) => {
    const target = selectedPage + direction;
    if (!pdfBytes || target < 0 || target >= pageCount) return;
    void (async () => {
      try {
        const document = await PDFDocument.load(pdfBytes);
        const reordered = await PDFDocument.create();
        const order = Array.from({ length: document.getPageCount() }, (_, index) => index);
        [order[selectedPage], order[target]] = [order[target], order[selectedPage]];
        const copied = await reordered.copyPages(document, order);
        copied.forEach((page) => reordered.addPage(page));
        const bytes = await reordered.save();
        setHistory((items) => [...items, pdfBytes]);
        setFuture([]);
        publishDocument(bytes, reordered.getPageCount(), true);
        setSelectedPage(target);
        setMessage("Page order updated.");
        setError("");
      } catch {
        setError("Unable to reorder the selected page.");
      }
    })();
  };

  const downloadPDF = (bytes = pdfBytes, filename?: string, markSaved = true) => {
    if (!bytes) return;
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename ?? `${documentName || "VertexDocs-Edited"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    if (markSaved) setSaved(true);
    setMessage("PDF downloaded.");
  };

  const savePDF = async () => {
    if (!pdfBytes) return;
    try {
      const bytes = isBlankDocument
        ? await createBlankPdfBytes(blankText)
        : pdfBytes;
      downloadPDF(bytes, undefined, true);
    } catch {
      setError(
        "Unable to export this text with the built-in PDF font. Try removing unsupported characters.",
      );
    }
  };

  const handleBlankTextInput = (text: string) => {
    if (text === blankText) return;
    blankHistoryRef.current.push(blankText);
    blankFutureRef.current = [];
    setBlankUndoCount((count) => count + 1);
    setBlankRedoCount(0);
    setBlankText(text);
    setSaved(false);
    setMessage("");
  };

  const undo = async () => {
    if (isBlankDocument && blankHistoryRef.current.length) {
      const previous = blankHistoryRef.current.pop() ?? "";
      blankFutureRef.current.push(blankText);
      setBlankUndoCount((count) => Math.max(0, count - 1));
      setBlankRedoCount((count) => count + 1);
      setBlankText(previous);
      setSaved(false);
      setMessage("Last text edit undone.");
      return;
    }
    if (!history.length) return;
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => pdfBytes ? [...items, pdfBytes] : items);
    const document = await PDFDocument.load(previous);
    publishDocument(previous, document.getPageCount(), true);
    setMessage("Last change undone.");
  };

  const redo = async () => {
    if (isBlankDocument && blankFutureRef.current.length) {
      const next = blankFutureRef.current.pop() ?? "";
      blankHistoryRef.current.push(blankText);
      setBlankUndoCount((count) => count + 1);
      setBlankRedoCount((count) => Math.max(0, count - 1));
      setBlankText(next);
      setSaved(false);
      setMessage("Text edit restored.");
      return;
    }
    if (!future.length) return;
    const next = future[future.length - 1];
    setFuture((items) => items.slice(0, -1));
    setHistory((items) => pdfBytes ? [...items, pdfBytes] : items);
    const document = await PDFDocument.load(next);
    publishDocument(next, document.getPageCount(), true);
    setMessage("Change restored.");
  };

  return (
    <main className="pdf-studio">
      <header className="pdf-studio-header">
        <div>
          <div className="pdf-studio-title-row">
            <h1>PDF Studio</h1>
            <span className={saved ? "pdf-status saved" : "pdf-status unsaved"}>
              {saved ? "Saved" : "Unsaved changes"}
            </span>
          </div>
          <p>Edit, organize and manage your PDF documents.</p>
        </div>
        <span className="pdf-document-name">{documentName}</span>
      </header>

      <nav className="pdf-top-toolbar" aria-label="Document actions">
        <button className="pdf-primary-action" onClick={createBlank}><FilePlus2 size={17} /> New Blank PDF</button>
        <button onClick={() => inputRef.current?.click()}><Upload size={17} /> Open PDF</button>
        <button disabled={!pdfBytes} onClick={() => void savePDF()}><Save size={17} /> Save</button>
        <span className="pdf-toolbar-divider" />
        <button disabled={!history.length && !blankUndoCount} onClick={undo}><Undo2 size={17} /> Undo</button>
        <button disabled={!future.length && !blankRedoCount} onClick={redo}><Redo2 size={17} /> Redo</button>
        <span className="pdf-toolbar-spacer" />
        <button className="pdf-download-action" disabled={!pdfBytes} onClick={() => void savePDF()}><Download size={17} /> Download</button>
        <input ref={inputRef} type="file" hidden accept=".pdf,application/pdf" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadPDF(file);
          event.target.value = "";
        }} />
      </nav>

      <div className="pdf-workspace">
        <aside className="pdf-page-panel">
          <div className="pdf-panel-heading"><h2>Pages</h2><span>{pageCount}</span></div>
          <div className="pdf-page-list">
            {Array.from({ length: pageCount }, (_, index) => (
              <button key={index} className={`pdf-page-item ${selectedPage === index ? "selected" : ""}`}
                onClick={() => setSelectedPage(index)} aria-label={`Select page ${index + 1}`}>
                <span className="pdf-thumbnail"><span className="pdf-thumb-line" /><span className="pdf-thumb-line short" /><span className="pdf-thumb-line" /></span>
                <span className="pdf-page-label">Page {index + 1}</span>
              </button>
            ))}
          </div>
          <button className="pdf-add-page" disabled={!pdfBytes || loading} onClick={addPage}><FilePlus2 size={16} /> Add Page</button>
          <button className="pdf-add-page" disabled={!pdfBytes || loading} onClick={() => insertRef.current?.click()}><Upload size={15} /> Insert PDF</button>
          <button className="pdf-add-page" disabled={!pdfBytes || loading} onClick={() => void extractPage()}><Scissors size={15} /> Extract page</button>
          <input ref={insertRef} type="file" hidden accept=".pdf,application/pdf" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void insertPDF(file);
            event.target.value = "";
          }} />
          <div className="pdf-page-reorder">
            <button disabled={selectedPage <= 0} onClick={() => movePage(-1)} aria-label="Move page up"><ArrowUp size={16} /> Move up</button>
            <button disabled={selectedPage >= pageCount - 1} onClick={() => movePage(1)} aria-label="Move page down"><ArrowDown size={16} /> Move down</button>
          </div>
        </aside>

        <section className="pdf-editor" aria-label="PDF page preview">
          <div className="pdf-editor-meta"><span>Page {selectedPage + 1} of {pageCount}</span><span>A4 · 100%</span></div>
          {loading ? (
            <div className="pdf-loading"><Loader2 size={32} className="pdf-loading-icon" /><span>Processing document...</span></div>
          ) : previewUrl ? (
            isBlankDocument ? (
              <div
                ref={blankEditorRef}
                className="pdf-blank-page"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="Editable blank A4 PDF page"
                aria-multiline="true"
                onInput={(event) =>
                  handleBlankTextInput(event.currentTarget.innerText)
                }
              />
            ) : (
              <iframe className="pdf-preview" src={`${previewUrl}#page=${selectedPage + 1}&toolbar=0&navpanes=0`} title="PDF page preview" />
            )
          ) : (
            <div className="pdf-loading"><Loader2 size={32} className="pdf-loading-icon" /><span>Creating blank document...</span></div>
          )}
        </section>

        <aside className="pdf-tools">
          <h2>Editing tools</h2>
          <div className="pdf-tool-group">
            <span className="pdf-tool-section-label">CONTENT</span>
            <PDFToolButton icon={Type} label="Add Text" disabled={loading || !pdfBytes} onClick={() => void addText()} />
            <PDFToolButton icon={ImagePlus} label="Insert Image" disabled={loading || !pdfBytes} onClick={() => imageRef.current?.click()} />
            <PDFToolButton icon={Highlighter} label="Highlight" disabled={loading || !pdfBytes} onClick={highlight} />
            <PDFToolButton icon={Pencil} label="Draw" disabled={loading || !pdfBytes} onClick={draw} />
            <PDFToolButton icon={StickyNote} label="Annotate" disabled={loading || !pdfBytes} onClick={() => void addText(true)} />
            <input ref={imageRef} type="file" hidden accept="image/png,image/jpeg" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void addImage(file);
              event.target.value = "";
            }} />
          </div>
          <div className="pdf-tool-group">
            <span className="pdf-tool-section-label">PAGE</span>
            <PDFToolButton icon={RotateCw} label="Rotate Page" disabled={loading || !pdfBytes} onClick={rotatePage} />
            <PDFToolButton icon={FilePlus2} label="Add Page" disabled={loading || !pdfBytes} onClick={addPage} />
            <PDFToolButton icon={Trash2} label="Delete Page" disabled={loading || !pdfBytes} onClick={() => void deletePage()} />
          </div>
          <p className="pdf-tools-note">Edits are added at preset positions on the selected page. Page thumbnails are placeholders; the PDF itself is shown in the preview.</p>
        </aside>
      </div>

      {error && <div className="pdf-message error-message"><AlertCircle size={18} /> {error}<button onClick={() => setError("")}>Dismiss</button></div>}
      {message && !error && <div className="pdf-message success-message"><CheckCircle size={18} /> {message}<button onClick={() => setMessage("")}>Dismiss</button></div>}
    </main>
  );
}

export default PDFStudio;
