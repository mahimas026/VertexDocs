import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Languages,
  RefreshCw,
  Upload,
  ArrowUpRight,
  Clock,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  getDocuments,
  downloadDocument,
} from "../services/documentApi";

interface BackendDocument {
  document_id: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  file_type: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadRecentDocuments = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getDocuments();
        if (active) {
          setDocuments(result.documents || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load recent documents"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRecentDocuments();

    return () => {
      active = false;
    };
  }, []);

  const formatSize = (size: number) => {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

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

      {loading ? (
        <section className="recent-card">
          <Clock size={30} style={{ animation: "spin 2s linear infinite" }} />
          <h3>Loading recent documents...</h3>
          <p>Please wait while we fetch your documents.</p>
        </section>
      ) : error ? (
        <section className="recent-card">
          <AlertCircle size={30} style={{ color: "#d14343" }} />
          <h3>Unable to load recent documents</h3>
          <p>{error}</p>
          <button
            className="primary-btn"
            style={{ marginTop: "15px" }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </section>
      ) : documents.length === 0 ? (
        <section className="recent-card">
          <Clock size={30} />
          <h3>No documents yet</h3>
          <p>Your recently uploaded documents will appear here.</p>
          <button
            className="primary-btn"
            style={{ marginTop: "15px" }}
            onClick={() => navigate("/upload")}
          >
            Upload Document
          </button>
        </section>
      ) : (
        <div className="file-list">
          {documents.slice(0, 5).map((doc) => (
            <div className="file-item" key={doc.document_id}>
              <div className="file-icon">
                <FileText />
              </div>
              <div className="file-details">
                <h3>{doc.original_filename}</h3>
                <p>{formatSize(doc.file_size)}</p>
              </div>
              <button
                className="remove-file-btn"
                onClick={() =>
                  window.open(downloadDocument(doc.document_id), "_blank")
                }
                aria-label={`Download ${doc.original_filename}`}
                title="Download Document"
              >
                <Download size={18} />
              </button>
            </div>
          ))}
          {documents.length > 5 && (
            <button
              className="primary-btn"
              style={{ alignSelf: "flex-start", marginTop: "10px" }}
              onClick={() => navigate("/upload")}
            >
              View all ({documents.length}) documents
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;