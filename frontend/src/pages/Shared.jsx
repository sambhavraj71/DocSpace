
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, User, RefreshCw } from "lucide-react";

import api from "../services/api";
import "./Shared.css";

export default function Shared() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/documents/shared-with-me");
      setDocuments(response.data);

    } catch (err) {
      console.error("Shared documents error:", err);
      setError(
        err.response?.data?.detail || "Unable to load shared documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Recently";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="shared-loading">
        <div className="shared-spinner"></div>
        <p>Loading shared documents...</p>
      </div>
    );
  }

  return (
    <div className="shared-page">

      <div className="shared-header">
        <div>
          <h1>Shared With Me</h1>
          <p>Documents that other people have shared with you.</p>
        </div>

        <button
          className="shared-refresh-btn"
          onClick={fetchSharedDocuments}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="shared-error">
          {error}
          <button onClick={fetchSharedDocuments}>Try again</button>
        </div>
      )}

      {!error && documents.length === 0 && (
        <div className="shared-empty">
          <div className="shared-empty-icon">
            <FileText size={32} />
          </div>

          <h2>No shared documents yet</h2>

          <p>
            When someone shares a document with you, it will appear here.
          </p>
        </div>
      )}

      {!error && documents.length > 0 && (
        <>
          <div className="shared-count">
            {documents.length} shared document
            {documents.length !== 1 ? "s" : ""}
          </div>

          <div className="shared-grid">
            {documents.map((document) => (
              <div
                className="shared-card"
                key={document.id}
                onClick={() => navigate(`/editor/${document.id}`)}
              >
                <div className="shared-card-top">
                  <div className="shared-file-icon">
                    <FileText size={23} />
                  </div>

                  <span
                    className={`shared-permission ${document.permission}`}
                  >
                    {document.permission}
                  </span>
                </div>

                <h3>{document.title}</h3>

                <p className="shared-preview">
                  {document.content
                    ? document.content.replace(/<[^>]*>/g, "").slice(0, 110)
                    : "No content available"}
                </p>

                <div className="shared-card-footer">
                  <span>
                    <User size={14} />
                    {document.owner_name || "Document owner"}
                  </span>

                  <span>
                    <Clock size={14} />
                    {formatDate(document.updated_at)}
                  </span>
                </div>

                <button
                  className="shared-open-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/editor/${document.id}`);
                  }}
                >
                  Open Document →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
