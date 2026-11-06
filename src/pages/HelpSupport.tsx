import { useState } from "react";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  FileText,
  Upload,
  Languages,
  RefreshCw,
  ChevronDown,
  Search,
  Send,
  CircleHelp,
} from "lucide-react";

const faqs = [
  {
    question: "How do I upload a document?",
    answer:
      "Go to Upload Documents from the sidebar. Select your file or drag and drop it into the upload area. Supported formats include PDF, DOC, DOCX, XLS, XLSX, PNG and JPG.",
  },
  {
    question: "How can I edit a PDF?",
    answer:
      "Open PDF Studio from the sidebar. Upload your PDF and use the available tools to rotate, reorder, insert, extract or delete pages.",
  },
  {
    question: "How does Language Bridge work?",
    answer:
      "Language Bridge provides a workspace for Tamil and English document translation. You can edit the translated text and review the changes before downloading.",
  },
  {
    question: "Which file formats are supported?",
    answer:
      "VertexDocs supports PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG and TXT for supported upload workflows.",
  },
  {
    question: "Can I download my edited documents?",
    answer:
      "Yes. Use the Save or Download option available in the respective document workspace to export your document.",
  },
];

function HelpSupport() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filteredFAQs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !issue.trim()) {
      return;
    }

    setSubmitted(true);
    setEmail("");
    setIssue("");
  };

  return (
    <div className="help-page">
      <header className="help-header">
        <div>
          <h1>Help & Support</h1>
          <p>
            Find answers to your questions and get assistance with VertexDocs.
          </p>
        </div>
      </header>

      <section className="help-hero">
        <div className="help-hero-icon">
          <HelpCircle size={34} />
        </div>

        <h2>How can we help you?</h2>
        <p>
          Explore our frequently asked questions or contact our support team.
        </p>

        <div className="help-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <section className="help-options">
        <div className="help-option-card">
          <div className="help-option-icon purple">
            <FileText size={25} />
          </div>
          <h3>PDF Studio</h3>
          <p>Get help with editing, managing and saving PDF documents.</p>
        </div>

        <div className="help-option-card">
          <div className="help-option-icon blue">
           < Upload size={25} />
          </div>
          <h3>Document Upload</h3>
          <p>Learn how to upload and manage your documents.</p>
        </div>

        <div className="help-option-card">
          <div className="help-option-icon green">
            <Languages size={25} />
          </div>
          <h3>Language Bridge</h3>
          <p>Find help with Tamil and English document translation.</p>
        </div>

        <div className="help-option-card">
          <div className="help-option-icon orange">
            <RefreshCw size={25} />
          </div>
          <h3>File Conversion</h3>
          <p>Get assistance with converting documents into other formats.</p>
        </div>
      </section>

      <section className="faq-section">
        <div className="help-section-heading">
          <div>
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions.</p>
          </div>
          <CircleHelp size={28} />
        </div>

        <div className="faq-list">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const originalIndex = faqs.indexOf(faq);

              return (
                <div className="faq-item" key={faq.question}>
                  <button
                    className="faq-question"
                    onClick={() =>
                      setOpenFAQ(
                        openFAQ === originalIndex ? null : originalIndex
                      )
                    }
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={20}
                      className={
                        openFAQ === originalIndex ? "faq-arrow active" : "faq-arrow"
                      }
                    />
                  </button>

                  {openFAQ === originalIndex && (
                    <p className="faq-answer">{faq.answer}</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="faq-empty">
              No matching questions found. Try another search.
            </p>
          )}
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-info">
          <div className="contact-icon">
            <MessageSquare size={28} />
          </div>

          <h2>Still need help?</h2>
          <p>
            Couldn't find the answer you were looking for? Tell us about your
            issue using the form.
          </p>

          <div className="contact-detail">
            <Mail size={19} />
            <span>Contact Support</span>
          </div>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          <h3>Report an Issue</h3>

          {submitted && (
            <div className="success-message">
              Your issue has been submitted successfully!
            </div>
          )}

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Describe your issue</label>
          <textarea
            placeholder="Tell us how we can help..."
            rows={5}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            required
          />

          <button type="submit" className="support-submit">
            <Send size={17} />
            Submit Issue
          </button>
        </form>
      </section>
    </div>
  );
}

export default HelpSupport;