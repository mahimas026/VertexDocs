# VertexDocs 📄✨

**VertexDocs** is a modern, all-in-one document productivity and management workspace built with **React 19**, **TypeScript**, and **Vite**. It provides a suite of tools for uploading, editing, translating, converting, and generating documents directly in the browser.

---

## 🚀 Live Development Server

To run the project locally:

```bash
# Navigate to the project directory
cd VertexDocs

# Install dependencies (if not already installed)
npm install

# Start the local development server
npm run dev
```

The application will be accessible at: **[http://localhost:5173/](http://localhost:5173/)**

---

## 🛠️ Tech Stack & Libraries

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vite.dev/)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **PDF Engine:** [`pdf-lib`](https://pdf-lib.js.org/) (Client-side PDF generation, editing, page merging & manipulation)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linter:** [Oxlint](https://oxc.rs/)
- **Styling:** Custom modern CSS architecture with modular component stylesheets, glassmorphic UI, and responsive layouts.

---

## 📋 Completed Features & Modules

### 1. 📊 Dashboard (`/`)
- Welcome hero banner with fast onboarding and direct actions.
- **Quick Action Cards** to jump directly to PDF Studio, Language Bridge, File Converter, and Upload.
- Recent documents preview widget.

### 2. 📤 Document Upload (`/upload`)
- Drag-and-drop file upload area and manual file browser picker.
- Multi-file handling with support for `PDF`, `DOC`, `DOCX`, `XLS`, `XLSX`, `PNG`, `JPG`, `JPEG`, and `TXT`.
- File validation (size limit enforcement up to 20 MB per file, extension filtering).
- Simulated upload progress indicators, item removal, and file status badges (`Ready`, `Uploading`, `Completed`).

### 3. 📑 PDF Studio (`/pdf-studio`)
Client-side PDF editing and generation powered by `pdf-lib`:
- **Document Creation & Loading:**
  - Create new blank A4 PDF documents with real-time text typing.
  - Open and import existing PDF files directly via client-side array buffers.
- **Page Management:**
  - Dynamic page thumbnail sidebar showing active page selection and total page count.
  - Add blank pages, insert pages from another external PDF file, and delete pages.
  - Reorder pages with **Move Up** and **Move Down** controls.
  - **Extract Page:** Split and instantly download individual pages as standalone PDFs.
- **Annotation & Editing Tools:**
  - Insert custom text and color-coded annotations.
  - Insert images (`PNG` and `JPEG`) with proportional scaling.
  - Add highlight overlays and line drawings.
  - 90-degree page rotation.
- **History & Preview:**
  - Multi-level **Undo** and **Redo** history stack for all document mutations and blank page edits.
  - Live embedded PDF iframe preview.
  - Direct PDF export and download with custom naming.

### 4. 🌐 Language Bridge (`/language-bridge`)
A dedicated translation and bilingual review workspace tailored for **Tamil ⇄ English**:
- 3-step structured translation journey:
  1. **Original Tamil** (Document upload or text input).
  2. **English Translation** (Review and edit stage).
  3. **Revised Tamil Translation** (Synchronized back-translation).
- File upload support (`PDF`, `DOCX`, `TXT`).
- Stage-by-stage text file download (`original-tamil.txt`, `english-translation.txt`, `revised-tamil.txt`).
- Translation verification workflow with **Accept** and **Reject** review actions.
- Official disclaimer notices for legal and financial document safety.

### 5. 🔄 File Converter & Compressor (`/convert`)
- Document format conversion interface supporting `PDF`, `DOCX`, `TXT`, `PNG`, and `JPG`.
- **In-Browser Image Compression Engine:**
  - Canvas-based image compression for PNG and JPEG files.
  - Adjustable quality presets: **Low (85%)**, **Medium (70%)**, and **High (50%)**.
  - Real-time client-side compression calculating new file sizes and percentage saved.
  - Instant download of compressed files.
- Simulated conversion progress feedback for planned backend conversion pipelines.

### 6. 📝 Document Templates (`/templates`)
- Pre-made template library organized by categories:
  - **Resumes:** Professional Resume, Fresher Resume.
  - **Invoices:** Business Invoice, Sales Invoice.
  - **Reports:** Project Report, Business Report.
  - **Letters, Certificates, and Meeting Minutes.**
- Category filter buttons (`All`, `Resume`, `Invoice`, `Report`, etc.).
- Integrated rich-text template editor with formatting controls:
  - Text formatting (Bold, Italic, Normal/Heading sizing).
  - Text alignment (Left, Center, Right).
- Client-side PDF compilation: Generates styled A4 PDFs directly from template content for instant download.

### 7. 🤖 AI Documents (`/ai-documents`)
- Intelligent conversational assistant interface designed for document Q&A and analysis.
- Animated vector SVG robot mascot with conversational greeting bubble.
- One-click prompt suggestions:
  - *"Summarize my document"*
  - *"Explain this document in simple words"*
  - *"Find important points"*
  - *"Generate questions from my document"*
- Interactive chat message stream with clear chat functionality.

### 8. 👤 Account & Privacy (`/account`)
- User profile management (Name, Email update simulation).
- Security controls (Password updating fields with visibility toggle).
- Privacy preferences and data retention configuration.
- Storage usage breakdown indicator.

### 9. 👑 Vertex Premium Modal (`PremiumPlansModal`)
- Accessible modal dialog (`role="dialog"`, ESC key dismissal, focus trap, and exit animations).
- Tier breakdown with feature comparisons (Pro, Enterprise, Student, and Team packages).
- Interactive checkout demo trigger.

### 10. ❓ Help & Support (`/help-support`)
- Frequently Asked Questions (FAQ) accordion with live instant search filtering.
- Support request submission form.
- Direct quick-help navigation cards.

---

## 📂 Project Structure

```
verteexdocs/
└── VertexDocs/
    ├── public/                 # Static assets
    ├── src/
    │   ├── assets/             # Application icons & images
    │   ├── components/         # Reusable UI components
    │   │   ├── PremiumPlansModal.tsx
    │   │   ├── PremiumPlansModal.css
    │   │   └── Sidebar.tsx
    │   ├── pages/              # Main route views
    │   │   ├── Account.tsx / .css
    │   │   ├── AIDocuments.tsx / .css
    │   │   ├── Convert.tsx / .css
    │   │   ├── Dashboard.tsx
    │   │   ├── HelpSupport.tsx
    │   │   ├── LanguageBridge.tsx
    │   │   ├── PDFStudio.tsx / .css
    │   │   ├── Templates.tsx / .css
    │   │   └── upload.tsx
    │   ├── App.tsx             # Root layout & route configuration
    │   ├── App.css             # Main layout & dashboard styling
    │   ├── index.css           # Global resets and CSS variables
    │   └── main.tsx            # Application entry point
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 📜 Available NPM Scripts

In the `VertexDocs` directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR at `http://localhost:5173/` |
| `npm run build` | Type-checks with TypeScript and compiles the production bundle |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs the high-performance Oxlint linter across the project |
