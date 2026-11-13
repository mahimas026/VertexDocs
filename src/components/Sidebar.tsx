import { useState } from "react";

import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Languages,
  RefreshCw,
  Upload,
  Bot,
  Settings,
  HelpCircle,
  Files,
} from "lucide-react";

function Sidebar() {

  const [logoError, setLogoError] = useState(false);

  return (
    <aside className="sidebar">

      {/* COMPANY LOGO */}

      {!logoError ? (

        <img
          src="/company-logo-transparent.png"
          alt="Company Logo"
          className="company-logo"

          onError={() => setLogoError(true)}
        />

      ) : (

        <div className="company-logo-fallback">
          VertexDocs
        </div>

      )}

      {/* WORKSPACE */}

      <p className="menu-label">
        WORKSPACE
      </p>

      <nav>

        <NavLink to="/" end>
          <LayoutDashboard />
          Dashboard
        </NavLink>

        <NavLink to="/upload">
          <Upload />
          Upload Documents
        </NavLink>

        <NavLink to="/pdf-studio">
          <FileText />
          PDF Studio
        </NavLink>

        <NavLink to="/language-bridge">
          <Languages />
          Language Bridge
        </NavLink>

        <NavLink to="/convert">
          <RefreshCw />
          Convert Files
        </NavLink>

        <NavLink to="/templates">
          <Files />
          Templates
        </NavLink>

        <NavLink to="/ai-documents">
          <Bot />
          AI Documents
        </NavLink>

      </nav>

      {/* SIDEBAR BOTTOM */}

      <div className="sidebar-bottom">

        <NavLink to="/help-support">
          <HelpCircle />
          Help & Support
        </NavLink>

        <NavLink to="/account">
          <Settings />
          Account Settings
        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;