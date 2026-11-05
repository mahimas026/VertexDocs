import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  Download,
  FileText,
  Italic,
  Plus,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import "./Templates.css";

type TemplateCategory =
  | "Resume"
  | "Invoice"
  | "Report"
  | "Letter"
  | "Certificate"
  | "Minutes";

interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  content: string;
}

interface DocumentTextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  size: number;
}

const categories = [
  "All",
  "Resume",
  "Invoice",
  "Report",
  "Letter",
  "Certificate",
  "Minutes",
] as const;

const templates: DocumentTemplate[] = [
  {
    id: "professional-resume",
    name: "Professional Resume",
    category: "Resume",
    description: "A polished, modern resume for experienced professionals.",
    content:
      "<h1>Alex Morgan</h1><p>Marketing Manager | New York, NY | alex.morgan@email.com</p><h2>Professional Summary</h2><p>Results-driven marketing professional with a track record of building memorable brands and growing customer engagement.</p><h2>Experience</h2><h3>Marketing Manager — Northstar Creative</h3><p>2021 – Present</p><ul><li>Led integrated campaigns across digital and print channels.</li><li>Managed a cross-functional team and annual marketing plans.</li></ul><h2>Education</h2><p>B.A. Communications — State University, 2018</p><h2>Skills</h2><p>Brand strategy · Content marketing · Analytics · Team leadership</p>",
  },
  {
    id: "fresher-resume",
    name: "Fresher Resume",
    category: "Resume",
    description: "A clear starter resume for graduates and early careers.",
    content:
      "<h1>Jordan Lee</h1><p>Recent Graduate | City, State | jordan.lee@email.com</p><h2>Career Objective</h2><p>Motivated graduate eager to contribute strong communication, research, and problem-solving skills to a collaborative team.</p><h2>Education</h2><h3>Bachelor of Arts — University Name</h3><p>Graduated: 2025 | GPA: 3.8</p><h2>Projects</h2><p><b>Community Research Project</b><br>Presented findings from a semester-long research project to a panel of faculty and local partners.</p><h2>Skills</h2><p>Research · Microsoft Office · Communication · Collaboration</p>",
  },
  {
    id: "business-invoice",
    name: "Business Invoice",
    category: "Invoice",
    description: "A simple, professional invoice for client billing.",
    content:
      "<h1>INVOICE</h1><p><b>Your Business Name</b><br>Street Address · City, State ZIP<br>billing@yourbusiness.com</p><p><b>Invoice No.</b> INV-1001 &nbsp; <b>Date:</b> [Date] &nbsp; <b>Due:</b> [Due Date]</p><h2>Bill To</h2><p>Client Name<br>Client Company<br>Client Address</p><h2>Services</h2><p>Description | Quantity | Rate | Amount<br>[Service or product] | 1 | $0.00 | $0.00</p><p><b>Subtotal: $0.00</b><br>Tax: $0.00<br><b>Total Due: $0.00</b></p><p>Thank you for your business.</p>",
  },
  {
    id: "sales-invoice",
    name: "Sales Invoice",
    category: "Invoice",
    description: "An itemized sales invoice with clear totals and terms.",
    content:
      "<h1>SALES INVOICE</h1><p><b>Seller:</b> [Business Name] &nbsp; <b>Invoice #:</b> SI-1001</p><p><b>Customer:</b> [Customer Name] &nbsp; <b>Date:</b> [Date]</p><h2>Order Details</h2><p>Item / Description | Quantity | Unit Price | Line Total<br>[Product name] | 1 | $0.00 | $0.00</p><h2>Summary</h2><p>Subtotal: $0.00<br>Shipping: $0.00<br>Tax: $0.00<br><b>Amount Due: $0.00</b></p><h2>Payment Terms</h2><p>Payment is due within 30 days. Please include the invoice number with your payment.</p>",
  },
  {
    id: "project-report",
    name: "Project Report",
    category: "Report",
    description: "A structured report for project updates and outcomes.",
    content:
      "<h1>Project Report</h1><p><b>Project:</b> [Project Name] &nbsp; <b>Prepared by:</b> [Name]<br><b>Date:</b> [Date]</p><h2>Executive Summary</h2><p>Summarize the project goals, current status, and most important outcomes.</p><h2>Objectives</h2><ul><li>[Objective one]</li><li>[Objective two]</li></ul><h2>Progress and Findings</h2><p>Describe work completed, key findings, and relevant data.</p><h2>Risks and Recommendations</h2><p>Outline open risks and practical next steps.</p><h2>Conclusion</h2><p>Summarize the current outlook and decisions needed.</p>",
  },
  {
    id: "business-report",
    name: "Business Report",
    category: "Report",
    description: "A clean business report for analysis and recommendations.",
    content:
      "<h1>Business Report</h1><p>[Department or Organization] · [Date]</p><h2>Overview</h2><p>State the purpose of this report and the business question it addresses.</p><h2>Key Findings</h2><ul><li>[Finding and supporting evidence]</li><li>[Finding and supporting evidence]</li></ul><h2>Analysis</h2><p>Explain what the findings mean for the organization, customers, or operations.</p><h2>Recommendations</h2><ol><li>[Recommended action]</li><li>[Recommended action]</li></ol><h2>Conclusion</h2><p>Summarize the expected impact and next steps.</p>",
  },
  {
    id: "formal-letter",
    name: "Formal Letter",
    category: "Letter",
    description: "A classic business letter for professional communication.",
    content:
      "<p>[Your Name]<br>[Street Address]<br>[City, State ZIP]<br>[Email Address]<br>[Date]</p><p>[Recipient Name]<br>[Title]<br>[Company Name]<br>[Address]</p><p>Dear [Recipient Name],</p><p>[Begin with the purpose of your letter. Provide the key details in a clear, courteous tone.]</p><p>[Add any supporting information or requested next steps.]</p><p>Sincerely,</p><p>[Your Name]</p>",
  },
  {
    id: "cover-letter",
    name: "Cover Letter",
    category: "Letter",
    description: "A concise cover letter tailored to a role and employer.",
    content:
      "<p>[Your Name] · [Email Address] · [Phone Number]<br>[Date]</p><p>[Hiring Manager Name]<br>[Company Name]</p><p>Dear [Hiring Manager Name],</p><p>I am writing to apply for the [Position Title] role at [Company Name]. My experience in [relevant area] aligns well with your team's goals.</p><p>In my recent role at [Organization], I [relevant achievement]. I would bring strengths in [skill] and [skill] to this position.</p><p>Thank you for your consideration. I look forward to discussing how I can contribute to your team.</p><p>Sincerely,<br>[Your Name]</p>",
  },
  {
    id: "achievement-certificate",
    name: "Achievement Certificate",
    category: "Certificate",
    description: "A celebratory certificate to recognize an achievement.",
    content:
      "<h1>CERTIFICATE OF ACHIEVEMENT</h1><p>This certificate is proudly presented to</p><h1>[Recipient Name]</h1><p>In recognition of outstanding achievement in</p><h2>[Program, Skill, or Accomplishment]</h2><p>Presented on [Date] by [Organization Name]</p><p>[Presenter Name] · [Title]</p>",
  },
  {
    id: "meeting-minutes",
    name: "Meeting Minutes",
    category: "Minutes",
    description: "Keep decisions, attendees, and follow-ups organized.",
    content:
      "<h1>Meeting Minutes</h1><p><b>Meeting:</b> [Meeting Name] &nbsp; <b>Date:</b> [Date]<br><b>Time:</b> [Start–End] &nbsp; <b>Location:</b> [Location]</p><h2>Attendees</h2><p>[Names and roles]</p><h2>Agenda</h2><ol><li>[Agenda item]</li><li>[Agenda item]</li></ol><h2>Discussion and Decisions</h2><p>[Summarize discussion and record decisions.]</p><h2>Action Items</h2><p>Owner | Task | Due Date<br>[Name] | [Action] | [Date]</p><h2>Next Meeting</h2><p>[Date, time, and location]</p>",
  },
];

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const crc32 = (bytes: Uint8Array) => {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
};

const createZip = (files: { name: string; content: string }[]) => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const fileName = encoder.encode(name);
    const data = encoder.encode(content);
    const checksum = crc32(data);
    const localHeader = new Uint8Array(30 + fileName.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, fileName.length, true);
    localHeader.set(fileName, 30);

    const centralHeader = new Uint8Array(46 + fileName.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, fileName.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(fileName, 46);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralDirectory = new Uint8Array(
    centralParts.reduce((total, part) => total + part.length, 0),
  );
  let centralOffset = 0;
  centralParts.forEach((part) => {
    centralDirectory.set(part, centralOffset);
    centralOffset += part.length;
  });

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);

  const archiveLength =
    localParts.reduce((total, part) => total + part.length, 0) +
    centralDirectory.length +
    endRecord.length;
  const archive = new Uint8Array(archiveLength);
  let archiveOffset = 0;
  [...localParts, centralDirectory, endRecord].forEach((part) => {
    archive.set(part, archiveOffset);
    archiveOffset += part.length;
  });

  return new Blob([archive.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

const getDocumentBlocks = (html: string) => {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const collectBlocks = (element: HTMLElement): HTMLElement[] => {
    const tag = element.tagName.toLowerCase();
    if (/^(p|h[1-6]|li|blockquote|pre)$/.test(tag)) return [element];
    return Array.from(element.children).flatMap((child) =>
      child instanceof HTMLElement ? collectBlocks(child) : [],
    );
  };
  const blocks = Array.from(parsed.body.children).flatMap((child) =>
    child instanceof HTMLElement ? collectBlocks(child) : [],
  );
  return blocks.length ? blocks : [parsed.body];
};

const getTextRuns = (
  node: Node,
  style: Omit<DocumentTextRun, "text"> = {
    bold: false,
    italic: false,
    size: 12,
  },
): DocumentTextRun[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    return text ? [{ text, ...style }] : [];
  }

  if (!(node instanceof HTMLElement)) return [];

  const nextStyle = { ...style };
  const tag = node.tagName.toLowerCase();
  if (tag === "b" || tag === "strong") nextStyle.bold = true;
  if (tag === "i" || tag === "em") nextStyle.italic = true;
  if (/^h[1-6]$/.test(tag)) {
    nextStyle.bold = true;
    nextStyle.size = tag === "h1" ? 22 : tag === "h2" ? 17 : 14;
  }
  if (tag === "font" && node.getAttribute("size")) {
    const legacySizes = [8, 10, 12, 14, 18, 24, 32];
    nextStyle.size = legacySizes[Number(node.getAttribute("size")) - 1] ?? 12;
  }
  return Array.from(node.childNodes).flatMap((child) =>
    getTextRuns(child, nextStyle),
  );
};

function Templates() {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate | null>(
    null,
  );
  const [editorContent, setEditorContent] = useState("");
  const [message, setMessage] = useState("");
  const [fontSize, setFontSize] = useState("12");
  const editorRef = useRef<HTMLDivElement>(null);

  const filteredTemplates =
    category === "All"
      ? templates
      : templates.filter((template) => template.category === category);

  const openTemplate = (template: DocumentTemplate) => {
    const savedContent = localStorage.getItem(`vertex-template-${template.id}`);
    const content = savedContent ?? template.content;
    setActiveTemplate(template);
    setEditorContent(content);
    setMessage("");
  };

  const saveTemplate = () => {
    const content = editorRef.current?.innerHTML ?? editorContent;
    setEditorContent(content);
    if (activeTemplate) {
      localStorage.setItem(`vertex-template-${activeTemplate.id}`, content);
      setMessage("Your changes have been saved on this device.");
    }
  };

  const runEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    window.document.execCommand(command, false, value);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadDocx = () => {
    if (!activeTemplate || !editorRef.current) return;
    const blocks = getDocumentBlocks(editorRef.current.innerHTML);
    const paragraphs = blocks
      .map((block) => {
        const tag = block instanceof HTMLElement ? block.tagName.toLowerCase() : "";
        const alignment =
          block instanceof HTMLElement
            ? block.style.textAlign === "center"
              ? "center"
              : block.style.textAlign === "right"
                ? "right"
                : "left"
            : "left";
        const runs = getTextRuns(block);
        const xmlRuns = runs
          .map(({ text, bold, italic, size }) => {
            const properties = [
              bold ? "<w:b/>" : "",
              italic ? "<w:i/>" : "",
              `<w:sz w:val="${Math.round(size * 2)}"/>`,
            ].join("");
            return `<w:r><w:rPr>${properties}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
          })
          .join("");
        const bullet = tag === "li" ? "<w:r><w:t>• </w:t></w:r>" : "";
        return `<w:p><w:pPr><w:jc w:val="${alignment}"/></w:pPr>${bullet}${xmlRuns}</w:p>`;
      })
      .join("");

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
    const relationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const blob = createZip([
      { name: "[Content_Types].xml", content: contentTypes },
      { name: "_rels/.rels", content: relationships },
      { name: "word/document.xml", content: documentXml },
      {
        name: "word/_rels/document.xml.rels",
        content:
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
      },
    ]);

    downloadFile(blob, `${activeTemplate.id}.docx`);
    setMessage("DOCX document downloaded.");
  };

  const downloadPdf = async () => {
    if (!activeTemplate || !editorRef.current) return;

    try {
      const pdf = await PDFDocument.create();
      const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);
      let page = pdf.addPage([595.28, 841.89]);
      let cursorY = page.getHeight() - 55;
      const left = 54;
      const right = page.getWidth() - 54;

      const addPage = () => {
        page = pdf.addPage([595.28, 841.89]);
        cursorY = page.getHeight() - 55;
      };

      getDocumentBlocks(editorRef.current.innerHTML).forEach((block) => {
        const element = block instanceof HTMLElement ? block : null;
        const alignment = element?.style.textAlign ?? "";
        const runs = getTextRuns(block);
        const lines: { text: string; bold: boolean; italic: boolean; size: number }[] = [];
        let currentLine = { text: "", bold: false, italic: false, size: 12 };

        runs.forEach((run) => {
          const font = run.bold ? boldFont : run.italic ? italicFont : regularFont;
          const words = run.text.split(/(\s+)/);
          words.forEach((word) => {
            const candidate = currentLine.text + word;
            if (
              currentLine.text &&
              font.widthOfTextAtSize(candidate, run.size) > right - left
            ) {
              lines.push(currentLine);
              currentLine = { ...run, text: word.trimStart() };
            } else {
              currentLine = { ...run, text: candidate };
            }
          });
        });
        if (currentLine.text) lines.push(currentLine);

        cursorY -= 7;
        lines.forEach((line) => {
          const font = line.bold
            ? boldFont
            : line.italic
              ? italicFont
              : regularFont;
          const width = font.widthOfTextAtSize(line.text, line.size);
          if (cursorY < 50) addPage();
          const x =
            alignment === "center"
              ? (page.getWidth() - width) / 2
              : alignment === "right"
                ? right - width
                : left;
          page.drawText(line.text, {
            x,
            y: cursorY,
            size: line.size,
            font,
            color: rgb(0.16, 0.13, 0.2),
          });
          cursorY -= line.size + 5;
        });
        cursorY -= 5;
      });

      const pdfBytes = await pdf.save();
      const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
      new Uint8Array(pdfBuffer).set(pdfBytes);
      downloadFile(
        new Blob([pdfBuffer], { type: "application/pdf" }),
        `${activeTemplate.id}.pdf`,
      );
      setMessage("PDF document downloaded.");
    } catch {
      setMessage(
        "This content includes characters that the built-in PDF font cannot export. DOCX export supports a wider range of characters.",
      );
    }
  };

  if (activeTemplate) {
    return (
      <div className="templates-page">
        <div className="templates-editor-heading">
          <div>
            <button
              className="templates-back-button"
              onClick={() => {
                setActiveTemplate(null);
                setMessage("");
              }}
            >
              <ArrowLeft size={17} /> Back to templates
            </button>
            <h1>{activeTemplate.name}</h1>
            <p>Edit your document, then save or download a copy.</p>
          </div>
          <div className="templates-export-actions">
            <button className="templates-save-button" onClick={saveTemplate}>
              <Save size={17} /> Save
            </button>
            <button className="templates-download-button" onClick={downloadPdf}>
              <Download size={17} /> PDF
            </button>
            <button className="templates-download-button" onClick={downloadDocx}>
              <Download size={17} /> DOCX
            </button>
          </div>
        </div>

        <div className="template-format-toolbar" aria-label="Document formatting">
          <button
            type="button"
            title="Bold"
            aria-label="Bold"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("bold")}
          >
            <Bold size={17} />
          </button>
          <button
            type="button"
            title="Italic"
            aria-label="Italic"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("italic")}
          >
            <Italic size={17} />
          </button>
          <label className="template-font-size">
            <Type size={16} />
            <select
              aria-label="Font size"
              value={fontSize}
              onChange={(event) => {
                const selectedSize = event.target.value;
                setFontSize(selectedSize);
                const legacySize: Record<string, string> = {
                  "10": "2",
                  "12": "3",
                  "14": "4",
                  "18": "5",
                  "24": "6",
                };
                runEditorCommand("fontSize", legacySize[selectedSize]);
              }}
            >
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="18">18</option>
              <option value="24">24</option>
            </select>
          </label>
          <span className="template-toolbar-divider" />
          <button
            type="button"
            title="Align left"
            aria-label="Align left"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("justifyLeft")}
          >
            <AlignLeft size={17} />
          </button>
          <button
            type="button"
            title="Align center"
            aria-label="Align center"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("justifyCenter")}
          >
            <AlignCenter size={17} />
          </button>
          <button
            type="button"
            title="Align right"
            aria-label="Align right"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("justifyRight")}
          >
            <AlignRight size={17} />
          </button>
          <span className="template-toolbar-divider" />
          <button
            type="button"
            title="Add heading"
            aria-label="Add heading"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runEditorCommand("insertHTML", "<h2>New heading</h2>")
            }
          >
            <Plus size={17} />
            Heading
          </button>
          <button
            type="button"
            title="Add paragraph"
            aria-label="Add paragraph"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              runEditorCommand("insertHTML", "<p>Write your text here.</p>")
            }
          >
            <Plus size={17} />
            Text
          </button>
          <button
            type="button"
            title="Remove selected content"
            aria-label="Remove selected content"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runEditorCommand("delete")}
          >
            <Trash2 size={17} />
          </button>
        </div>

        <div className="template-editor-surface">
          <article
            ref={editorRef}
            className="template-document"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={`${activeTemplate.name} document content`}
            aria-multiline="true"
            dangerouslySetInnerHTML={{ __html: editorContent }}
          />
        </div>

        {message && (
          <p className="template-editor-message" role="status">
            <Check size={16} />
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="templates-page">
      <header className="templates-heading">
        <div>
          <h1>Templates</h1>
          <p>Use ready-to-use templates for your documents.</p>
        </div>
        <div className="templates-heading-icon">
          <FileText size={25} />
        </div>
      </header>

      <nav className="template-category-filters" aria-label="Template categories">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className="template-gallery" aria-label={`${category} templates`}>
        {filteredTemplates.map((template) => (
          <article className="template-card" key={template.id}>
            <div className={`template-preview template-preview-${template.category.toLowerCase()}`}>
              <div className="template-preview-paper">
                <span className="template-preview-title">{template.name}</span>
                <span className="template-preview-rule" />
                <span className="template-preview-line" />
                <span className="template-preview-line short" />
                <span className="template-preview-section" />
                <span className="template-preview-line" />
                <span className="template-preview-line" />
                <span className="template-preview-line short" />
                <span className="template-preview-section" />
                <span className="template-preview-line" />
              </div>
              <span className="template-category-tag">{template.category}</span>
            </div>
            <div className="template-card-content">
              <h2>{template.name}</h2>
              <p>{template.description}</p>
              <button onClick={() => openTemplate(template)}>
                Use Template
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Templates;
