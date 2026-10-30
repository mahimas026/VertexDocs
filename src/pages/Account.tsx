import { useState } from "react";
import {
  User,
  Lock,
  ShieldCheck,
  FileText,
  Monitor,
  LogOut,
  Save,
  Eye,
  Trash2,
} from "lucide-react";
import "./Account.css";

export default function Account() {
  const [name, setName] = useState("Mahima");
  const [email, setEmail] = useState("mahima@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = () => {
    setMessage("Profile changes saved in this demo.");
  };

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword) {
      setMessage("Please enter both password fields.");
      return;
    }

    setMessage("Password update requires backend integration.");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="account-page">
      <div className="account-heading">
        <h1>Account & Privacy</h1>
        <p>Manage your profile, security and document privacy.</p>
      </div>

      {message && (
        <div className="account-message" role="status">
          {message}
          <button onClick={() => setMessage("")} aria-label="Close message">
            ×
          </button>
        </div>
      )}

      <div className="account-layout">
        <div className="account-main">

          {/* Profile */}
          <section className="account-card">
            <div className="account-card-heading">
              <div className="account-icon">
                <User size={21} />
              </div>
              <div>
                <h2>Profile Information</h2>
                <p>Update your personal account details.</p>
              </div>
            </div>

            <div className="profile-avatar">M</div>

            <div className="account-form">
              <label>
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <button className="account-primary-btn" onClick={handleSave}>
              <Save size={17} />
              Save Changes
            </button>
          </section>

          {/* Password */}
          <section className="account-card">
            <div className="account-card-heading">
              <div className="account-icon">
                <Lock size={21} />
              </div>
              <div>
                <h2>Password & Security</h2>
                <p>Keep your account protected.</p>
              </div>
            </div>

            <div className="account-form">
              <label>
                Current Password
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>

              <label>
                New Password
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
            </div>

            <button
              className="show-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              <Eye size={16} />
              {showPassword ? "Hide Password" : "Show Password"}
            </button>

            <button
              className="account-primary-btn"
              onClick={handlePasswordUpdate}
            >
              <Lock size={17} />
              Update Password
            </button>
          </section>

          {/* Privacy */}
          <section className="account-card">
            <div className="account-card-heading">
              <div className="account-icon">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h2>Document Privacy</h2>
                <p>Understand how your documents are handled.</p>
              </div>
            </div>

            <div className="privacy-info">
              <div className="privacy-row">
                <FileText size={19} />
                <div>
                  <strong>Document Storage</strong>
                  <p>
                    Uploaded documents are not permanently stored by this
                    frontend demo.
                  </p>
                </div>
              </div>

              <div className="privacy-row">
                <ShieldCheck size={19} />
                <div>
                  <strong>External AI Services</strong>
                  <p>
                    No documents are currently sent to external AI or
                    translation providers. This may change after integration.
                  </p>
                </div>
              </div>

              <div className="privacy-row">
                <Trash2 size={19} />
                <div>
                  <strong>Data Retention & Deletion</strong>
                  <p>
                    Document retention and account deletion controls will be
                    available after backend integration.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Side panel */}
        <aside className="account-side">

          <section className="account-card session-card">
            <div className="account-card-heading">
              <div className="account-icon">
                <Monitor size={21} />
              </div>
              <div>
                <h2>Active Session</h2>
                <p>Your current login session.</p>
              </div>
            </div>

            <div className="session-item">
              <Monitor size={22} />
              <div>
                <strong>This Device</strong>
                <p>Current browser session</p>
                <span className="session-status">Current session</span>
              </div>
            </div>

            <button
              className="logout-btn"
              onClick={() =>
                setMessage("Logout functionality requires authentication integration.")
              }
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </section>

          <section className="account-card security-card">
            <ShieldCheck size={28} />
            <h3>Your Privacy Matters</h3>
            <p>
              Vertex Docs is designed to help you manage documents while
              keeping privacy and security in mind.
            </p>
          </section>

        </aside>
      </div>
    </div>
  );
}