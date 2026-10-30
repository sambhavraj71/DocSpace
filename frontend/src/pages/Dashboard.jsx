import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Plus, Upload, FileText } from "lucide-react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DocumentCard from "../components/DocumentCard";

import "./Dashboard.css";

// Extract readable text from TipTap JSON content
function getDocumentText(content) {
  if (!content) return "";

  try {
    const parsed =
      typeof content === "string"
        ? JSON.parse(content)
        : content;

    const extractText = (node) => {
      if (!node) return "";

      if (Array.isArray(node)) {
        return node.map(extractText).join(" ");
      }

      if (typeof node === "object") {
        return [
          node.text || "",
          extractText(node.content),
        ].join(" ");
      }

      return "";
    };

    return extractText(parsed);
  } catch {
    return String(content).replace(/<[^>]*>/g, " ");
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  });

  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const response = await api.get("/documents/");
      setDocuments(response.data);
    } catch (error) {
      console.error("Fetch documents error:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Create new document
  const createDocument = async () => {
    try {
      const response = await api.post("/documents/", {
        title: "Untitled Document",
        content: "",
      });

      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      console.error("Create document error:", error);
      alert("Unable to create document.");
    }
  };

  // Upload TXT / MD file
  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["txt", "md"].includes(extension)) {
      alert("Only TXT and MD files are supported.");
      return;
    }

    if (file.size > 1024 * 1024) {
      alert("File size must be less than 1 MB.");
      return;
    }

    try {
      const text = await file.text();

      if (!text.trim()) {
        alert("Cannot upload an empty file.");
        return;
      }

      // Convert plain text into TipTap-compatible JSON
      const content = {
        type: "doc",
        content: text.split(/\r?\n/).map((line) => ({
          type: "paragraph",
          ...(line
            ? {
                content: [
                  {
                    type: "text",
                    text: line,
                  },
                ],
              }
            : {}),
        })),
      };

      const title = file.name.replace(/\.(txt|md)$/i, "");

      const response = await api.post("/documents/", {
        title: title || "Imported Document",
        content: JSON.stringify(content),
      });

      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Unable to upload this file.");
    }
  };

  // Rename document
  const renameDocument = async (id, newTitle) => {
    try {
      await api.put(`/documents/${id}`, {
        title: newTitle,
      });

      setDocuments((previous) =>
        previous.map((doc) =>
          doc.id === id
            ? { ...doc, title: newTitle }
            : doc
        )
      );
    } catch (error) {
      console.error("Rename document error:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to rename document."
      );
    }
  };

  // Delete document
  const deleteDocument = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await api.delete(`/documents/${id}`);

      setDocuments((previous) =>
        previous.filter((doc) => doc.id !== id)
      );
    } catch (error) {
      console.error("Delete document error:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete document."
      );
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    navigate("/login");
  };

  // Search documents by title and content
  const searchTerm = search.trim().toLowerCase();

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;

    const title = (doc.title || "").toLowerCase();

    const content = getDocumentText(
      doc.content
    ).toLowerCase();

    return (
      title.includes(searchTerm) ||
      content.includes(searchTerm)
    );
  });

  return (
    <div className="dashboard-page">

      {/* Navbar */}
      <Navbar
        user={user}
        search={search}
        setSearch={setSearch}
        onCreate={createDocument}
        onLogout={logout}
        onClearSearch={() => setSearch("")}
      />

      <div className="dashboard-body">

        {/* Sidebar */}
        <Sidebar onCreate={createDocument} />

        {/* Main Content */}
        <main className="dashboard-main">

          {/* Page Header */}
          <div className="dashboard-page-header">

            <div>
              <h1>My Documents</h1>

              <p>
                Create, manage and organize your documents.
              </p>
            </div>

            {/* Header Actions */}
            <div className="dashboard-page-actions">

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={uploadDocument}
                className="dashboard-file-input"
              />

              {/* Upload Button */}
              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="dashboard-upload-btn"
              >
                <Upload size={17} />
                Upload File
              </button>

              {/* New Document Button */}
              <button
                onClick={createDocument}
                className="dashboard-new-btn"
              >
                <Plus size={18} />
                New Document
              </button>

            </div>
          </div>

          {/* Document Count */}
          <div className="dashboard-document-count">

            {searchTerm ? (
              <>
                <strong>
                  {filteredDocuments.length}
                </strong>{" "}
                {filteredDocuments.length === 1
                  ? "search result"
                  : "search results"}{" "}
                found
              </>
            ) : (
              <>
                <strong>{documents.length}</strong>{" "}
                {documents.length === 1
                  ? "document"
                  : "documents"}
              </>
            )}

          </div>

          {/* Loading State */}
          {loading && (
            <div className="dashboard-loading">
              <div className="dashboard-spinner"></div>
              <p>Loading your documents...</p>
            </div>
          )}

          {/* Empty Documents State */}
          {!loading && documents.length === 0 && (
            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                <FileText size={30} />
              </div>

              <h2>No documents yet</h2>

              <p>
                Create your first document and start writing.
              </p>

              <button
                onClick={createDocument}
                className="dashboard-new-btn"
              >
                <Plus size={18} />
                Create your first document
              </button>

            </div>
          )}

          {/* Search Empty State */}
          {!loading &&
            documents.length > 0 &&
            filteredDocuments.length === 0 && (
              <div className="dashboard-empty">

                <div className="dashboard-empty-icon">
                  <FileText size={30} />
                </div>

                <h2>No documents found</h2>

                <p>
                  No documents match "{search}".
                  Try another keyword.
                </p>

                <button
                  onClick={() => setSearch("")}
                  className="dashboard-clear-search"
                >
                  Clear search
                </button>

              </div>
            )}

          {/* Documents Grid */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="dashboard-documents-grid">

              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={() =>
                    navigate(`/editor/${doc.id}`)
                  }
                  onRename={renameDocument}
                  onDelete={deleteDocument}
                />
              ))}

            </div>
          )}

        </main>

      </div>
    </div>
  );
}