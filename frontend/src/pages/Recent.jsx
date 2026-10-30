import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./Recent.css";

function getDocumentText(content) {
  if (!content) return "";

  try {
    const parsed =
      typeof content === "string" ? JSON.parse(content) : content;

    const extractText = (node) => {
      if (!node) return "";

      if (Array.isArray(node)) {
        return node.map(extractText).join(" ");
      }

      if (typeof node === "object") {
        if (node.type === "text") return node.text || "";

        return (node.content || []).map(extractText).join(" ");
      }

      return "";
    };

    return extractText(parsed).replace(/\s+/g, " ").trim();
  } catch {
    return String(content).replace(/<[^>]*>/g, " ").trim();
  }
}

function formatDate(dateString) {
  if (!dateString) return "Recently updated";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Recently updated";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Recent() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const fetchRecentDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/documents/recent");
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Recent documents error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load recent documents. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentDocuments();
  }, [fetchRecentDocuments]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const openDocument = (id) => {
    navigate(`/editor/${id}`);
  };

  return (
    <div className="recent-page">
      <Navbar
        user={user}
        search=""
        setSearch={() => {}}
        onCreate={() => navigate("/")}
        onLogout={logout}
      />

      <div className="recent-layout">
        <Sidebar onCreate={() => navigate("/")} />

        <main className="recent-main">
          <div className="recent-header">
            <div className="recent-heading">
              <div className="recent-heading-icon">
                <Clock size={23} />
              </div>

              <div>
                <h1>Recent Documents</h1>
                <p>
                  Quickly access documents you've worked on recently.
                </p>
              </div>
            </div>

            <button
              className="recent-refresh-btn"
              onClick={fetchRecentDocuments}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "recent-spinning" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="recent-count">
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </div>

          {loading && (
            <div className="recent-state">
              <div className="recent-spinner" />
              <p>Loading recent documents...</p>
            </div>
          )}

          {!loading && error && (
            <div className="recent-error">
              <AlertCircle size={20} />
              <div>
                <strong>Something went wrong</strong>
                <p>{error}</p>
                <button onClick={fetchRecentDocuments}>Try again</button>
              </div>
            </div>
          )}

          {!loading && !error && documents.length === 0 && (
            <div className="recent-empty">
              <div className="recent-empty-icon">
                <FileText size={30} />
              </div>

              <h2>No recent documents</h2>
              <p>
                Documents you create or edit will appear here.
              </p>

              <button onClick={() => navigate("/")}>
                Go to My Documents
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {!loading && !error && documents.length > 0 && (
            <div className="recent-grid">
              {documents.map((doc) => {
                const preview = getDocumentText(doc.content);

                return (
                  <button
                    type="button"
                    className="recent-card"
                    key={doc.id}
                    onClick={() => openDocument(doc.id)}
                  >
                    <div className="recent-card-top">
                      <div className="recent-file-icon">
                        <FileText size={21} />
                      </div>

                      <span className="recent-card-date">
                        {formatDate(doc.updated_at)}
                      </span>
                    </div>

                    <h2>{doc.title || "Untitled Document"}</h2>

                    <p className="recent-preview">
                      {preview || "No content yet. Open this document to start writing."}
                    </p>

                    <div className="recent-card-footer">
                      <span>Open document</span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}