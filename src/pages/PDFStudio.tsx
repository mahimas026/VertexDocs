
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
import {
  mergePDFs,
  splitPDF,
  rotatePDF,
  deletePDFPages,
  reorderPDF,
  extractPDFPages,
  insertPDFPages,
  watermarkPDF,
  protectPDF,
  unlockPDF,
  addPageNumbers,
  compressPDF,
  cropPDF,
  addHeaderFooter,
  addPDFBookmark,
} from "../services/pdfOperationsApi";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
type ToolButtonProps = {
  icon: typeof Type;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function PDFToolButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: ToolButtonProps) {
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
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);
  const rotateInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const reorderInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);
  const insertOpOriginalRef = useRef<HTMLInputElement>(null);
  const insertOpInsertRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const protectInputRef = useRef<HTMLInputElement>(null);
  const unlockInputRef = useRef<HTMLInputElement>(null);
  const pageNumberInputRef = useRef<HTMLInputElement>(null);
  const compressInputRef = useRef<HTMLInputElement>(null);
  const cropInputRef = useRef<HTMLInputElement>(null);
  const headerFooterInputRef = useRef<HTMLInputElement>(null);
  const bookmarkInputRef = useRef<HTMLInputElement>(null);
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

  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);

  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitRanges, setSplitRanges] = useState("");
  const [splitting, setSplitting] = useState(false);

  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const [rotating, setRotating] = useState(false);

  const [deleteFile, setDeleteFile] = useState<File | null>(null);
  const [deletePages, setDeletePages] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reorderFile, setReorderFile] = useState<File | null>(null);
const [reorderPages, setReorderPages] = useState("");
const [reordering, setReordering] = useState(false);
const [extractFile, setExtractFile] = useState<File | null>(null);
const [extractPages, setExtractPages] = useState("");
const [extracting, setExtracting] = useState(false);

  // 1. Insert Pages operation
  const [insertOpFile, setInsertOpFile] = useState<File | null>(null);
  const [insertOpInsertFile, setInsertOpInsertFile] = useState<File | null>(null);
  const [insertOpPosition, setInsertOpPosition] = useState<number>(0);
  const [insertingPages, setInsertingPages] = useState(false);

  // 2. Watermark operation
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarking, setWatermarking] = useState(false);

  // 3. Password Protect operation
  const [protectFile, setProtectFile] = useState<File | null>(null);
  const [protectPassword, setProtectPassword] = useState("");
  const [protecting, setProtecting] = useState(false);

  // 4. Unlock operation
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  // 5. Page Numbers operation
  const [pageNumberFile, setPageNumberFile] = useState<File | null>(null);
  const [startPageNumber, setStartPageNumber] = useState<number>(1);
  const [numberingPages, setNumberingPages] = useState(false);

  // 6. Compress operation
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressingPDF, setCompressingPDF] = useState(false);

  // 7. Crop operation
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropLeft, setCropLeft] = useState<number>(20);
  const [cropRight, setCropRight] = useState<number>(20);
  const [cropTop, setCropTop] = useState<number>(20);
  const [cropBottom, setCropBottom] = useState<number>(20);
  const [cropping, setCropping] = useState(false);

  // 8. Header and Footer operation
  const [headerFooterFile, setHeaderFooterFile] = useState<File | null>(null);
  const [headerFooterText, setHeaderFooterText] = useState("");
  const [headerFooterPos, setHeaderFooterPos] = useState<"header" | "footer">("footer");
  const [headerFooterSize, setHeaderFooterSize] = useState<number>(10);
  const [addingHeaderFooter, setAddingHeaderFooter] = useState(false);

  // 9. Bookmarks operation
  const [bookmarkFile, setBookmarkFile] = useState<File | null>(null);
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkPage, setBookmarkPage] = useState<number>(1);
  const [bookmarking, setBookmarking] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Uint8Array[]>([]);
  const [future, setFuture] = useState<Uint8Array[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [thumbnails, setThumbnails] = useState<string[]>([]);
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
        setPreviewUrl(
          URL.createObjectURL(
            new Blob([bytes as BlobPart], { type: "application/pdf" })
          )
        );
      }
    };

    void createBlank();

    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  useEffect(() => {
    if (
      isBlankDocument &&
      blankEditorRef.current &&
      blankEditorRef.current.innerText !== blankText
    ) {
      blankEditorRef.current.innerText = blankText;
    }
  }, [blankText, isBlankDocument]);

  const publishDocument = (
    bytes: Uint8Array,
    count: number,
    dirty: boolean
  ) => {
    setPdfBytes(bytes);
    setPageCount(count);
    setSelectedPage((page) => Math.min(page, count - 1));
    setSaved(!dirty);
    setPreviewUrl(
      URL.createObjectURL(
        new Blob([bytes as BlobPart], { type: "application/pdf" })
      )
    );
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

  const handleMergePDFs = async () => {
    if (mergeFiles.length < 2) {
      setError("Please select at least two PDF files.");
      return;
    }

    try {
      setMerging(true);
      setError("");
      setMessage("Merging PDF files...");

      const blob = await mergePDFs(mergeFiles);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "merged.pdf";
      link.click();

      URL.revokeObjectURL(url);
      setMessage("PDFs merged and downloaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "PDF merging failed."
      );
    } finally {
      setMerging(false);
    }
  };

  const handleSplitPDF = async () => {
    if (!splitFile) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setSplitting(true);
      setError("");
      setMessage("Splitting PDF...");

      const blob = await splitPDF(splitFile, splitRanges.trim());

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "split-pages.zip";
      link.click();

      URL.revokeObjectURL(url);
      setMessage("PDF split successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "PDF splitting failed."
      );
    } finally {
      setSplitting(false);
    }
  };

  const handleRotatePDF = async () => {
    if (!rotateFile) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setRotating(true);
      setError("");
      setMessage("Rotating PDF...");

      const blob = await rotatePDF(rotateFile, rotation);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "rotated.pdf";
      link.click();

      URL.revokeObjectURL(url);
      setMessage("PDF rotated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "PDF rotation failed."
      );
    } finally {
      setRotating(false);
    }
  };

  const handleDeletePages = async () => {
    if (!deleteFile) {
      setError("Please select a PDF file.");
      return;
    }

    if (!deletePages.trim()) {
      setError("Please enter the page numbers to delete.");
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("Deleting PDF pages...");

      const blob = await deletePDFPages(deleteFile, deletePages);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "pages-deleted.pdf";
      link.click();

      URL.revokeObjectURL(url);
      setMessage("Selected pages deleted successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Deleting pages failed."
      );
    } finally {
      setDeleting(false);
    }
  };
  const handleReorderPDF = async () => {
  if (!reorderFile) {
    setError("Please select a PDF file.");
    return;
  }

  if (!reorderPages.trim()) {
    setError("Please enter the complete new page order.");
    return;
  }

  try {
    setReordering(true);
    setError("");
    setMessage("Reordering PDF pages...");

    const blob = await reorderPDF(reorderFile, reorderPages);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "reordered.pdf";
    link.click();

    URL.revokeObjectURL(url);

    setMessage("PDF pages reordered successfully!");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "PDF reordering failed."
    );
  } finally {
    setReordering(false);
  }
};
const handleExtractPDF = async () => {
  if (!extractFile) {
    setError("Please select a PDF file.");
    return;
  }

  if (!extractPages.trim()) {
    setError("Please enter the page numbers to extract.");
    return;
  }

  try {
    setExtracting(true);
    setError("");
    setMessage("Extracting PDF pages...");

    const blob = await extractPDFPages(extractFile, extractPages);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "extracted-pages.pdf";
    link.click();

    URL.revokeObjectURL(url);

    setMessage("PDF pages extracted successfully!");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "PDF extraction failed."
    );
  } finally {
    setExtracting(false);
  }
};

  const handleInsertPagesOp = async () => {
    if (!insertOpFile || !insertOpInsertFile) {
      setError("Please select both the original PDF and the PDF to insert.");
      return;
    }
    if (insertOpPosition < 0) {
      setError("Insertion position cannot be negative.");
      return;
    }
    try {
      setInsertingPages(true);
      setError("");
      setMessage("Inserting PDF pages...");
      const blob = await insertPDFPages(insertOpFile, insertOpInsertFile, insertOpPosition);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${insertOpFile.name.replace(/\.pdf$/i, "")}_inserted.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDF pages inserted and downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to insert PDF pages.");
    } finally {
      setInsertingPages(false);
    }
  };

  const handleWatermarkOp = async () => {
    if (!watermarkFile) {
      setError("Please select a PDF file to watermark.");
      return;
    }
    const text = watermarkText.trim();
    if (!text) {
      setError("Please enter watermark text.");
      return;
    }
    if (text.length > 100) {
      setError("Watermark text cannot exceed 100 characters.");
      return;
    }
    try {
      setWatermarking(true);
      setError("");
      setMessage("Adding watermark...");
      const blob = await watermarkPDF(watermarkFile, text);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${watermarkFile.name.replace(/\.pdf$/i, "")}_watermarked.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Watermark added and PDF downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add watermark.");
    } finally {
      setWatermarking(false);
    }
  };

  const handleProtectOp = async () => {
    if (!protectFile) {
      setError("Please select a PDF file to protect.");
      return;
    }
    if (!protectPassword || protectPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    try {
      setProtecting(true);
      setError("");
      setMessage("Protecting PDF...");
      const blob = await protectPDF(protectFile, protectPassword);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${protectFile.name.replace(/\.pdf$/i, "")}_protected.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDF protected and downloaded successfully!");
      setProtectPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to protect PDF.");
    } finally {
      setProtecting(false);
    }
  };

  const handleUnlockOp = async () => {
    if (!unlockFile) {
      setError("Please select a password-protected PDF file.");
      return;
    }
    if (!unlockPassword) {
      setError("Please enter the PDF password.");
      return;
    }
    try {
      setUnlocking(true);
      setError("");
      setMessage("Unlocking PDF...");
      const blob = await unlockPDF(unlockFile, unlockPassword);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${unlockFile.name.replace(/\.pdf$/i, "")}_unlocked.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDF unlocked and downloaded successfully!");
      setUnlockPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock PDF.");
    } finally {
      setUnlocking(false);
    }
  };

  const handlePageNumbersOp = async () => {
    if (!pageNumberFile) {
      setError("Please select a PDF file to number.");
      return;
    }
    if (startPageNumber < 1) {
      setError("Start page number must be 1 or greater.");
      return;
    }
    try {
      setNumberingPages(true);
      setError("");
      setMessage("Adding page numbers...");
      const blob = await addPageNumbers(pageNumberFile, startPageNumber);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${pageNumberFile.name.replace(/\.pdf$/i, "")}_numbered.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Page numbers added and PDF downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add page numbers.");
    } finally {
      setNumberingPages(false);
    }
  };

  const handleCompressOp = async () => {
    if (!compressFile) {
      setError("Please select a PDF file to compress.");
      return;
    }
    try {
      setCompressingPDF(true);
      setError("");
      setMessage("Compressing PDF...");
      const blob = await compressPDF(compressFile);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${compressFile.name.replace(/\.pdf$/i, "")}_compressed.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDF compressed and downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compress PDF.");
    } finally {
      setCompressingPDF(false);
    }
  };

  const handleCropOp = async () => {
    if (!cropFile) {
      setError("Please select a PDF file to crop.");
      return;
    }
    if (cropLeft < 0 || cropRight < 0 || cropTop < 0 || cropBottom < 0) {
      setError("Crop margins cannot be negative.");
      return;
    }
    try {
      setCropping(true);
      setError("");
      setMessage("Cropping PDF margins...");
      const blob = await cropPDF(cropFile, cropLeft, cropRight, cropTop, cropBottom);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cropFile.name.replace(/\.pdf$/i, "")}_cropped.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDF cropped and downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to crop PDF.");
    } finally {
      setCropping(false);
    }
  };

  const handleHeaderFooterOp = async () => {
    if (!headerFooterFile) {
      setError("Please select a PDF file.");
      return;
    }
    const text = headerFooterText.trim();
    if (!text) {
      setError("Please enter header or footer text.");
      return;
    }
    try {
      setAddingHeaderFooter(true);
      setError("");
      setMessage(`Adding ${headerFooterPos}...`);
      const blob = await addHeaderFooter(headerFooterFile, text, headerFooterPos, headerFooterSize);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${headerFooterFile.name.replace(/\.pdf$/i, "")}_${headerFooterPos}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`${headerFooterPos === "header" ? "Header" : "Footer"} added and PDF downloaded successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add header/footer.");
    } finally {
      setAddingHeaderFooter(false);
    }
  };

  const handleBookmarkOp = async () => {
    if (!bookmarkFile) {
      setError("Please select a PDF file.");
      return;
    }
    const title = bookmarkTitle.trim();
    if (!title) {
      setError("Please enter a bookmark title.");
      return;
    }
    if (bookmarkPage < 1) {
      setError("Page number must be 1 or greater.");
      return;
    }
    try {
      setBookmarking(true);
      setError("");
      setMessage("Adding bookmark...");
      const blob = await addPDFBookmark(bookmarkFile, title, bookmarkPage);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bookmarkFile.name.replace(/\.pdf$/i, "")}_bookmarked.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Bookmark added and PDF downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bookmark.");
    } finally {
      setBookmarking(false);
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
      try {
  const pdf = await pdfjsLib.getDocument({
    data: savedBytes.slice(),
  }).promise;

  const pageThumbnails: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.25 });

    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) continue;

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
await page.render({
  canvas,
  canvasContext: context,
  viewport,
}).promise;
    pageThumbnails.push(canvas.toDataURL("image/png"));
  }

  setThumbnails(pageThumbnails);
  
} catch (thumbnailError) {
  console.error("Thumbnail generation failed:", thumbnailError);
  setThumbnails([]);
}

      setHistory([]);
      setFuture([]);
      publishDocument(savedBytes, document.getPageCount(), false);
      setIsBlankDocument(false);
      setBlankText("");

      blankHistoryRef.current = [];
      blankFutureRef.current = [];

      setBlankUndoCount(0);
      setBlankRedoCount(0);

      setDocumentName(
        file.name.replace(/\.pdf$/i, "") || "Imported document"
      );

      setMessage(
        "PDF opened. Existing content is shown in the page preview."
      );
    } catch {
      setError(
        "Unable to open this PDF. It may be invalid, encrypted, or use unsupported features."
      );
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const applyEdit = async (
    edit: (document: PDFDocument) => Promise<void> | void,
    success: string
  ) => {
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

    const text = window.prompt(
      annotation ? "Enter your annotation:" : "Enter text to add:"
    );

    if (!text?.trim() || !pdfBytes) return;

    await applyEdit(async (document) => {
      const page = document.getPage(selectedPage);
      const font = await document.embedFont(StandardFonts.Helvetica);

      page.drawText(text.trim(), {
        x: 54,
        y: page.getHeight() - (annotation ? 115 : 80),
        size: annotation ? 12 : 18,
        font,
        color: annotation
          ? rgb(0.13, 0.32, 0.65)
          : rgb(0.12, 0.16, 0.22),
        maxWidth: page.getWidth() - 108,
      });
    }, annotation ? "Annotation added." : "Text added.");
  };

  const addImage = async (file: File) => {
    if (!pdfBytes) return;

    try {
      const data = new Uint8Array(await file.arrayBuffer());

      await applyEdit(async (document) => {
        const image =
          file.type === "image/png"
            ? await document.embedPng(data)
            : await document.embedJpg(data);

        const page = document.getPage(selectedPage);
        const maxWidth = page.getWidth() * 0.55;
        const maxHeight = page.getHeight() * 0.35;

        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1
        );

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

  const highlight = () =>
    applyEdit((document) => {
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

  const draw = () =>
    applyEdit((document) => {
      const page = document.getPage(selectedPage);
      const y = page.getHeight() - 205;

      page.drawLine({
        start: { x: 54, y },
        end: { x: 220, y: y - 45 },
        thickness: 3,
        color: rgb(0.18, 0.42, 0.82),
      });
    }, "Drawing added.");

  const rotatePage = () =>
    applyEdit((document) => {
      const page = document.getPage(selectedPage);

      page.setRotation(
        degrees((page.getRotation().angle + 90) % 360)
      );
    }, "Page rotated.");

  const addPage = () =>
    applyEdit((document) => {
      document.insertPage(selectedPage + 1, [
        A4_WIDTH,
        A4_HEIGHT,
      ]);
    }, "Blank page added.");

  const deletePage = async () => {
    if (!pdfBytes || pageCount <= 1) {
      setError("A PDF must contain at least one page.");
      return;
    }

    if (!window.confirm("Delete the selected page?")) return;

    await applyEdit(
      (document) => document.removePage(selectedPage),
      "Page deleted."
    );
  };

  const insertPDF = async (file: File) => {
    if (!pdfBytes) return;

    try {
      const sourceBytes = isBlankDocument
        ? await createBlankPdfBytes(blankText)
        : pdfBytes;

      const document = await PDFDocument.load(sourceBytes);

      const additional = await PDFDocument.load(
        new Uint8Array(await file.arrayBuffer())
      );

      const copied = await document.copyPages(
        additional,
        additional.getPageIndices()
      );

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

      const [page] = await extracted.copyPages(source, [
        selectedPage,
      ]);

      extracted.addPage(page);

      downloadPDF(
        await extracted.save(),
        `page-${selectedPage + 1}.pdf`,
        false
      );

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

        const order = Array.from(
          { length: document.getPageCount() },
          (_, index) => index
        );

        [order[selectedPage], order[target]] = [
          order[target],
          order[selectedPage],
        ];

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

  const downloadPDF = (
    bytes = pdfBytes,
    filename?: string,
    markSaved = true
  ) => {
    if (!bytes) return;

    const url = URL.createObjectURL(
      new Blob([bytes as BlobPart], {
        type: "application/pdf",
      })
    );

    const link = window.document.createElement("a");

    link.href = url;
    link.download =
      filename ?? `${documentName || "VertexDocs-Edited"}.pdf`;

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
        "Unable to export this text with the built-in PDF font. Try removing unsupported characters."
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
    setFuture((items) => (pdfBytes ? [...items, pdfBytes] : items));

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
    setHistory((items) => (pdfBytes ? [...items, pdfBytes] : items));

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

            <span
              className={
                saved ? "pdf-status saved" : "pdf-status unsaved"
              }
            >
              {saved ? "Saved" : "Unsaved changes"}
            </span>
          </div>

          <p>Edit, organize and manage your PDF documents.</p>
        </div>

        <span className="pdf-document-name">{documentName}</span>
      </header>

      <section className="pdf-operations-panel">
        <h2>PDF Operations</h2>

        <input
          ref={mergeInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            setMergeFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        <button onClick={() => mergeInputRef.current?.click()}>
          Choose PDFs to Merge
        </button>

        <span>{mergeFiles.length} PDF(s) selected</span>

        <button
          onClick={() => void handleMergePDFs()}
          disabled={mergeFiles.length < 2 || merging}
        >
          {merging ? "Merging..." : "Merge PDFs"}
        </button>

        <div className="pdf-operation-item">
          <h3>Split PDF</h3>

          <input
            ref={splitInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setSplitFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />

          <button onClick={() => splitInputRef.current?.click()}>
            Choose PDF to Split
          </button>

          <p>{splitFile?.name ?? "No PDF selected"}</p>

          <input
            type="text"
            placeholder="Page ranges (e.g. 1-3, 5-7)"
            value={splitRanges}
            onChange={(e) => setSplitRanges(e.target.value)}
          />

          <button
            onClick={() => void handleSplitPDF()}
            disabled={!splitFile || splitting}
          >
            {splitting ? "Splitting..." : "Split PDF"}
          </button>
        </div>

        <div className="pdf-operation-item">
          <h3>Rotate PDF</h3>

          <input
            ref={rotateInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setRotateFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />

          <button onClick={() => rotateInputRef.current?.click()}>
            Choose PDF to Rotate
          </button>

          <p>{rotateFile?.name ?? "No PDF selected"}</p>

          <select
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
          >
            <option value={90}>90° Clockwise</option>
            <option value={180}>180°</option>
            <option value={270}>270° Clockwise</option>
          </select>

          <button
            onClick={() => void handleRotatePDF()}
            disabled={!rotateFile || rotating}
          >
            {rotating ? "Rotating..." : "Rotate PDF"}
          </button>
        </div>

        <div className="pdf-operation-item">
          <h3>Delete PDF Pages</h3>

          <input
            ref={deleteInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setDeleteFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />

          <button onClick={() => deleteInputRef.current?.click()}>
            Choose PDF
          </button>

          <p>{deleteFile?.name ?? "No PDF selected"}</p>

          <input
            type="text"
            placeholder="Pages to delete (e.g. 2, 4, 5)"
            value={deletePages}
            onChange={(e) => setDeletePages(e.target.value)}
          />

          <button
            onClick={() => void handleDeletePages()}
            disabled={!deleteFile || !deletePages.trim() || deleting}
          >
            {deleting ? "Deleting..." : "Delete Pages"}
          </button>
        </div>
        <div className="pdf-operation-item">
  <h3>Reorder PDF Pages</h3>

  <input
    ref={reorderInputRef}
    type="file"
    accept=".pdf,application/pdf"
    hidden
    onChange={(e) => {
      setReorderFile(e.target.files?.[0] ?? null);
      e.target.value = "";
    }}
  />

  <button onClick={() => reorderInputRef.current?.click()}>
    Choose PDF
  </button>

  <p>{reorderFile?.name ?? "No PDF selected"}</p>

  <input
    type="text"
    placeholder="Complete order (e.g. 3,1,2,4)"
    value={reorderPages}
    onChange={(e) => setReorderPages(e.target.value)}
  />

  <button
    onClick={() => void handleReorderPDF()}
    disabled={!reorderFile || !reorderPages.trim() || reordering}
  >
    {reordering ? "Reordering..." : "Reorder Pages"}
  </button>
</div>
<div className="pdf-operation-item">
  <h3>Extract PDF Pages</h3>

  <input
    ref={extractInputRef}
    type="file"
    accept=".pdf,application/pdf"
    hidden
    onChange={(e) => {
      setExtractFile(e.target.files?.[0] ?? null);
      e.target.value = "";
    }}
  />

  <button onClick={() => extractInputRef.current?.click()}>
    Choose PDF
  </button>

  <p>{extractFile?.name ?? "No PDF selected"}</p>

  <input
    type="text"
    placeholder="Pages to extract (e.g. 1,3,5)"
    value={extractPages}
    onChange={(e) => setExtractPages(e.target.value)}
  />

  <button
    onClick={() => void handleExtractPDF()}
    disabled={!extractFile || !extractPages.trim() || extracting}
  >
    {extracting ? "Extracting..." : "Extract Pages"}
  </button>
</div>

        {/* 1. Insert Pages */}
        <div className="pdf-operation-item">
          <h3>Insert PDF Pages</h3>
          <input
            ref={insertOpOriginalRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setInsertOpFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => insertOpOriginalRef.current?.click()}>
            Choose Base PDF
          </button>
          <p>{insertOpFile?.name ?? "No base PDF selected"}</p>

          <input
            ref={insertOpInsertRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setInsertOpInsertFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => insertOpInsertRef.current?.click()}>
            Choose PDF to Insert
          </button>
          <p>{insertOpInsertFile?.name ?? "No PDF to insert selected"}</p>

          <input
            type="number"
            min={0}
            placeholder="Insert after page (0 = beginning)"
            value={insertOpPosition}
            onChange={(e) => setInsertOpPosition(Math.max(0, parseInt(e.target.value) || 0))}
          />

          <button
            onClick={() => void handleInsertPagesOp()}
            disabled={!insertOpFile || !insertOpInsertFile || insertingPages}
          >
            {insertingPages ? "Inserting..." : "Insert Pages"}
          </button>
        </div>

        {/* 2. Watermark */}
        <div className="pdf-operation-item">
          <h3>Watermark PDF</h3>
          <input
            ref={watermarkInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setWatermarkFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => watermarkInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{watermarkFile?.name ?? "No PDF selected"}</p>

          <input
            type="text"
            maxLength={100}
            placeholder="Watermark text (max 100)"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
          />

          <button
            onClick={() => void handleWatermarkOp()}
            disabled={!watermarkFile || !watermarkText.trim() || watermarking}
          >
            {watermarking ? "Adding..." : "Add Watermark"}
          </button>
        </div>

        {/* 3. Password Protect */}
        <div className="pdf-operation-item">
          <h3>Password Protect</h3>
          <input
            ref={protectInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setProtectFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => protectInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{protectFile?.name ?? "No PDF selected"}</p>

          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={protectPassword}
            onChange={(e) => setProtectPassword(e.target.value)}
          />

          <button
            onClick={() => void handleProtectOp()}
            disabled={!protectFile || protectPassword.length < 8 || protecting}
          >
            {protecting ? "Protecting..." : "Protect PDF"}
          </button>
        </div>

        {/* 4. Unlock PDF */}
        <div className="pdf-operation-item">
          <h3>Unlock PDF</h3>
          <input
            ref={unlockInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setUnlockFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => unlockInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{unlockFile?.name ?? "No PDF selected"}</p>

          <input
            type="password"
            placeholder="Enter password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
          />

          <button
            onClick={() => void handleUnlockOp()}
            disabled={!unlockFile || !unlockPassword || unlocking}
          >
            {unlocking ? "Unlocking..." : "Unlock PDF"}
          </button>
        </div>

        {/* 5. Page Numbers */}
        <div className="pdf-operation-item">
          <h3>Add Page Numbers</h3>
          <input
            ref={pageNumberInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setPageNumberFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => pageNumberInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{pageNumberFile?.name ?? "No PDF selected"}</p>

          <input
            type="number"
            min={1}
            placeholder="Start number (default 1)"
            value={startPageNumber}
            onChange={(e) => setStartPageNumber(Math.max(1, parseInt(e.target.value) || 1))}
          />

          <button
            onClick={() => void handlePageNumbersOp()}
            disabled={!pageNumberFile || numberingPages}
          >
            {numberingPages ? "Numbering..." : "Add Page Numbers"}
          </button>
        </div>

        {/* 6. Compress PDF */}
        <div className="pdf-operation-item">
          <h3>Compress PDF</h3>
          <input
            ref={compressInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setCompressFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => compressInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{compressFile?.name ?? "No PDF selected"}</p>

          <button
            onClick={() => void handleCompressOp()}
            disabled={!compressFile || compressingPDF}
          >
            {compressingPDF ? "Compressing..." : "Compress PDF"}
          </button>
        </div>

        {/* 7. Crop PDF */}
        <div className="pdf-operation-item">
          <h3>Crop PDF Margins</h3>
          <input
            ref={cropInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setCropFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => cropInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{cropFile?.name ?? "No PDF selected"}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <input
              type="number"
              min={0}
              placeholder="Left (pt)"
              value={cropLeft}
              onChange={(e) => setCropLeft(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <input
              type="number"
              min={0}
              placeholder="Right (pt)"
              value={cropRight}
              onChange={(e) => setCropRight(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <input
              type="number"
              min={0}
              placeholder="Top (pt)"
              value={cropTop}
              onChange={(e) => setCropTop(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <input
              type="number"
              min={0}
              placeholder="Bottom (pt)"
              value={cropBottom}
              onChange={(e) => setCropBottom(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>

          <button
            onClick={() => void handleCropOp()}
            disabled={!cropFile || cropping}
          >
            {cropping ? "Cropping..." : "Crop Margins"}
          </button>
        </div>

        {/* 8. Header / Footer */}
        <div className="pdf-operation-item">
          <h3>Header & Footer</h3>
          <input
            ref={headerFooterInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setHeaderFooterFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => headerFooterInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{headerFooterFile?.name ?? "No PDF selected"}</p>

          <input
            type="text"
            placeholder="Header / footer text"
            value={headerFooterText}
            onChange={(e) => setHeaderFooterText(e.target.value)}
          />

          <div style={{ display: "flex", gap: "6px" }}>
            <select
              value={headerFooterPos}
              onChange={(e) => setHeaderFooterPos(e.target.value as "header" | "footer")}
              style={{ flex: 1 }}
            >
              <option value="header">Header (Top)</option>
              <option value="footer">Footer (Bottom)</option>
            </select>
            <select
              value={headerFooterSize}
              onChange={(e) => setHeaderFooterSize(Number(e.target.value))}
              style={{ width: "70px" }}
            >
              {[8, 9, 10, 11, 12, 14, 16, 18].map((s) => (
                <option key={s} value={s}>{s}pt</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => void handleHeaderFooterOp()}
            disabled={!headerFooterFile || !headerFooterText.trim() || addingHeaderFooter}
          >
            {addingHeaderFooter ? "Adding..." : "Add Header / Footer"}
          </button>
        </div>

        {/* 9. Bookmarks */}
        <div className="pdf-operation-item">
          <h3>Add Bookmark</h3>
          <input
            ref={bookmarkInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              setBookmarkFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button onClick={() => bookmarkInputRef.current?.click()}>
            Choose PDF
          </button>
          <p>{bookmarkFile?.name ?? "No PDF selected"}</p>

          <input
            type="text"
            placeholder="Bookmark title"
            value={bookmarkTitle}
            onChange={(e) => setBookmarkTitle(e.target.value)}
          />

          <input
            type="number"
            min={1}
            placeholder="Target page number"
            value={bookmarkPage}
            onChange={(e) => setBookmarkPage(Math.max(1, parseInt(e.target.value) || 1))}
          />

          <button
            onClick={() => void handleBookmarkOp()}
            disabled={!bookmarkFile || !bookmarkTitle.trim() || bookmarking}
          >
            {bookmarking ? "Bookmarking..." : "Add Bookmark"}
          </button>
        </div>
      </section>

      <nav className="pdf-top-toolbar" aria-label="Document actions">
        <button
          className="pdf-primary-action"
          onClick={createBlank}
        >
          <FilePlus2 size={17} /> New Blank PDF
        </button>

        <button onClick={() => inputRef.current?.click()}>
          <Upload size={17} /> Open PDF
        </button>

        <button disabled={!pdfBytes} onClick={() => void savePDF()}>
          <Save size={17} /> Save
        </button>

        <span className="pdf-toolbar-divider" />

        <button
          disabled={!history.length && !blankUndoCount}
          onClick={undo}
        >
          <Undo2 size={17} /> Undo
        </button>

        <button
          disabled={!future.length && !blankRedoCount}
          onClick={redo}
        >
          <Redo2 size={17} /> Redo
        </button>

        <span className="pdf-toolbar-spacer" />

        <button
          className="pdf-download-action"
          disabled={!pdfBytes}
          onClick={() => void savePDF()}
        >
          <Download size={17} /> Download
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) void loadPDF(file);

            event.target.value = "";
          }}
        />
      </nav>

      <div className="pdf-workspace">
        <aside className="pdf-page-panel">
          <div className="pdf-panel-heading">
            <h2>Pages</h2>
            <span>{pageCount}</span>
          </div>

          <div className="pdf-page-list">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                className={`pdf-page-item ${
                  selectedPage === index ? "selected" : ""
                }`}
                onClick={() => setSelectedPage(index)}
                aria-label={`Select page ${index + 1}`}
              >
                <span className="pdf-thumbnail">
  {thumbnails[index] ? (
    <img
      src={thumbnails[index]}
      alt={`Page ${index + 1} preview`}
      className="pdf-thumbnail-image"
    />
  ) : (
    <span className="pdf-thumb-line" />
  )}
</span>

                <span className="pdf-page-label">
                  Page {index + 1}
                </span>
              </button>
            ))}
          </div>

          <button
            className="pdf-add-page"
            disabled={!pdfBytes || loading}
            onClick={addPage}
          >
            <FilePlus2 size={16} /> Add Page
          </button>

          <button
            className="pdf-add-page"
            disabled={!pdfBytes || loading}
            onClick={() => insertRef.current?.click()}
          >
            <Upload size={15} /> Insert PDF
          </button>

          <button
            className="pdf-add-page"
            disabled={!pdfBytes || loading}
            onClick={() => void extractPage()}
          >
            <Scissors size={15} /> Extract page
          </button>

          <input
            ref={insertRef}
            type="file"
            hidden
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) void insertPDF(file);

              event.target.value = "";
            }}
          />

          <div className="pdf-page-reorder">
            <button
              disabled={selectedPage <= 0}
              onClick={() => movePage(-1)}
              aria-label="Move page up"
            >
              <ArrowUp size={16} /> Move up
            </button>

            <button
              disabled={selectedPage >= pageCount - 1}
              onClick={() => movePage(1)}
              aria-label="Move page down"
            >
              <ArrowDown size={16} /> Move down
            </button>
          </div>
        </aside>

        <section className="pdf-editor" aria-label="PDF page preview">
          <div className="pdf-editor-meta">
            <span>
              Page {selectedPage + 1} of {pageCount}
            </span>
            <span>A4 · 100%</span>
          </div>

          {loading ? (
            <div className="pdf-loading">
              <Loader2 size={32} className="pdf-loading-icon" />
              <span>Processing document...</span>
            </div>
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
              <iframe
  key={selectedPage}
  className="pdf-preview"
  src={`${previewUrl}#page=${selectedPage + 1}&toolbar=0&navpanes=0`}
  title="PDF page preview"
/>
            )
          ) : (
            <div className="pdf-loading">
              <Loader2 size={32} className="pdf-loading-icon" />
              <span>Creating blank document...</span>
            </div>
          )}
        </section>

        <aside className="pdf-tools">
          <h2>Editing tools</h2>

          <div className="pdf-tool-group">
            <span className="pdf-tool-section-label">CONTENT</span>

            <PDFToolButton
              icon={Type}
              label="Add Text"
              disabled={loading || !pdfBytes}
              onClick={() => void addText()}
            />

            <PDFToolButton
              icon={ImagePlus}
              label="Insert Image"
              disabled={loading || !pdfBytes}
              onClick={() => imageRef.current?.click()}
            />

            <PDFToolButton
              icon={Highlighter}
              label="Highlight"
              disabled={loading || !pdfBytes}
              onClick={highlight}
            />

            <PDFToolButton
              icon={Pencil}
              label="Draw"
              disabled={loading || !pdfBytes}
              onClick={draw}
            />

            <PDFToolButton
              icon={StickyNote}
              label="Annotate"
              disabled={loading || !pdfBytes}
              onClick={() => void addText(true)}
            />

            <input
              ref={imageRef}
              type="file"
              hidden
              accept="image/png,image/jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) void addImage(file);

                event.target.value = "";
              }}
            />
          </div>

          <div className="pdf-tool-group">
            <span className="pdf-tool-section-label">PAGE</span>

            <PDFToolButton
              icon={RotateCw}
              label="Rotate Page"
              disabled={loading || !pdfBytes}
              onClick={rotatePage}
            />

            <PDFToolButton
              icon={FilePlus2}
              label="Add Page"
              disabled={loading || !pdfBytes}
              onClick={addPage}
            />

            <PDFToolButton
              icon={Trash2}
              label="Delete Page"
              disabled={loading || !pdfBytes}
              onClick={() => void deletePage()}
            />
          </div>

          <p className="pdf-tools-note">
            Edits are added at preset positions on the selected page.
            Page thumbnails are placeholders; the PDF itself is shown
            in the preview.
          </p>
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
    </main>
  );
}

export default PDFStudio;
