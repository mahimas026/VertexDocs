import {
  FileText,
  Languages,
  RefreshCw,
  Upload,
  ArrowUpRight,
  Clock,
} from "lucide-react";

function Dashboard() {
  return (
    <div className="dashboard">

      <header className="top-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Manage all your documents in one place.</p>
        </div>

        <button className="upload-btn">
          <Upload size={18} /> Upload Document
        </button>
      </header>

      <section className="welcome-card">
        <div>
          <h1>Your documents, simplified.</h1>
          <p>
            Upload, edit, translate and manage your documents
            with Vertex Docs.
          </p>
          <button className="primary-btn">Get Started</button>
        </div>
      </section>

      <h2 className="section-title">Quick Actions</h2>

      <section className="quick-actions">

        <div className="action-card">
          <FileText />
          <h3>PDF Studio</h3>
          <p>Edit, annotate and manage PDF documents.</p>
          <span>Open Studio <ArrowUpRight size={16} /></span>
        </div>

        <div className="action-card">
          <Languages />
          <h3>Language Bridge</h3>
          <p>Translate Tamil and English documents.</p>
          <span>Start Translation <ArrowUpRight size={16} /></span>
        </div>

        <div className="action-card">
          <RefreshCw />
          <h3>Convert Files</h3>
          <p>Convert documents into different formats.</p>
          <span>Convert Now <ArrowUpRight size={16} /></span>
        </div>

        <div className="action-card">
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