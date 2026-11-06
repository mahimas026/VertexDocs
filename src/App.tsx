import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";

import Upload from "./pages/upload";
import PDFStudio from "./pages/PDFStudio";
import LanguageBridge from "./pages/LanguageBridge";
import Convert from "./pages/Convert";
import Templates from "./pages/Templates";
import AIDocuments from "./pages/AIDocuments";
import Account from "./pages/Account";

import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/pdf-studio" element={<PDFStudio />} />
          <Route path="/language-bridge" element={<LanguageBridge />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/ai-documents" element={<AIDocuments />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;