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
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">V</div>
        <h2>Vertex Docs</h2>
      </div>

      <p className="menu-label">WORKSPACE</p>

      <nav>
        <NavLink to="/" end>
          <LayoutDashboard /> Dashboard
        </NavLink>

        <NavLink to="/upload">
          <Upload /> Upload Documents
        </NavLink>

        <NavLink to="/pdf-studio">
          <FileText /> PDF Studio
        </NavLink>

        <NavLink to="/language-bridge">
          <Languages /> Language Bridge
        </NavLink>

        <NavLink to="/convert">
          <RefreshCw /> Convert Files
        </NavLink>

        <NavLink to="/ai-documents">
          <Bot /> AI Documents
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <a><HelpCircle /> Help & Support</a>
        <NavLink to="/account">
          <Settings /> Account Settings
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;