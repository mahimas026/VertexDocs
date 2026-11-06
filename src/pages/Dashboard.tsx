import { useNavigate } from "react-router-dom";
import {
  FileText,
  Languages,
  RefreshCw,
  Upload,
  ArrowUpRight,
  Clock,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="top-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Manage all your documents in one place.</p>
        </div>

        <button
          className="upload-btn"
          onClick={() => navigate("/upload")}
        >
          <Upload size={18} />
          Upload Document
        </button>
      </header>

      <section className="welcome-card">
        <div>
          <h1>Your documents, simplified.</h1>
          <p>
            Upload, edit, translate and manage your documents
            with Vertex Docs.
          </p>
          <button
            className="primary-btn"
            onClick={() => navigate("/pdf-studio")}
          >
           Get Started
          </button>
        </div>
      </section>

      <h2 className="section-title">Quick Actions</h2>

      <section className="quick-actions">
        <div
          className="action-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/pdf-studio")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/pdf-studio");
            }
          }}
        >
          <FileText />
          <h3>PDF Studio</h3>
          <p>Edit, annotate and manage PDF documents.</p>
          <span>Open Studio <ArrowUpRight size={16} /></span>
        </div>

        <div
          className="action-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/language-bridge")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/language-bridge");
            }
          }}
        >
          <Languages />
          <h3>Language Bridge</h3>
          <p>Translate Tamil and English documents.</p>
          <span>Start Translation <ArrowUpRight size={16} /></span>
        </div>

        <div
          className="action-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/convert")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/convert");
            }
          }}
        >
          <RefreshCw />
          <h3>Convert Files</h3>
          <p>Convert documents into different formats.</p>
          <span>Convert Now <ArrowUpRight size={16} /></span>
        </div>

        <div
          className="action-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/upload")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/upload");
            }
          }}
        >
          <Upload />
          <h3>Upload Documents</h3>
          <p>Upload and organize your files.</p>
          <span>Upload Now <ArrowUpRight size={16} /></span>
        </div>
      </section>

      <h2 className="section-title">Recent Documents</h2>

      <section className="recent-card">
        <Clock size={30} />
        <h3>No documents yet</h3>
        <p>Your recently uploaded documents will appear here.</p>
      </section>
    </div>
  );
}

export default Dashboard;