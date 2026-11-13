import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ThemeSwitcher from "./components/ThemeSwitcher";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/upload";
import PDFStudio from "./pages/PDFStudio";
import LanguageBridge from "./pages/LanguageBridge";
import Convert from "./pages/Convert";
import Templates from "./pages/Templates";
import AIDocuments from "./pages/AIDocuments";
import Account from "./pages/Account";
import HelpSupport from "./pages/HelpSupport";

import FloatingAssistant from "./components/FloatingAssistant";

import { ThemeProvider } from "./context/ThemeContext";

import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <div className="app-container">

        {/* FIXED SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT */}
        <main className="main-content">

          <div className="page-content">

            <Routes>
              <Route path="/" element={<Dashboard />} />

              <Route path="/upload" element={<Upload />} />

              <Route path="/pdf-studio" element={<PDFStudio />} />

              <Route path="/language-bridge" element={<LanguageBridge />} />

              <Route path="/convert" element={<Convert />} />

              <Route path="/templates" element={<Templates />} />

              <Route path="/ai-documents" element={<AIDocuments />} />

              <Route path="/account" element={<Account />} />

              <Route path="/help-support" element={<HelpSupport />} />

            </Routes>

          </div>

        </main>

        {/* FIXED TOP-RIGHT THEME BUTTON */}
        <div className="global-topbar">
          <ThemeSwitcher />
        </div>

      </div>

      <FloatingAssistant />

    </ThemeProvider>
  );
}

export default App;