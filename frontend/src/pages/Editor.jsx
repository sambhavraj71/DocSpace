
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";

import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Share2, X
} from "lucide-react";

import api from "../services/api";
import "./Editor.css";

function ToolbarButton({ icon: Icon, label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`toolbar-btn ${active ? "active" : ""}`}
    >
      <Icon size={18} />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="toolbar-divider" />;
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [contentVersion, setContentVersion] = useState(0);

  const [permission, setPermission] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("viewer");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  const lastSavedSnapshot = useRef("");
  const saveInProgress = useRef(false);

  const canEdit = permission !== "viewer";
  const isOwner = permission === "owner";

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CharacterCount,
    ],
    content: "<p></p>",
    onUpdate: () => {
      setContentVersion((version) => version + 1);
      setSaveStatus("Unsaved changes");
    },
    editorProps: {
      attributes: {
        class: "document-content",
      },
    },
  });

  // Fetch document
  useEffect(() => {
    if (!editor) return;

    let cancelled = false;

    const fetchDocument = async () => {
      setLoading(true);
      setLoaded(false);

      try {
        const response = await api.get(`/documents/${id}`);

        if (cancelled) return;

        const documentTitle = response.data.title;
        const documentPermission = response.data.permission;

        setTitle(documentTitle);
        setPermission(documentPermission);

        editor.setEditable(documentPermission !== "viewer");

        let content = "<p></p>";

        if (response.data.content) {
          try {
            content = JSON.parse(response.data.content);
          } catch {
            content = response.data.content;
          }
        }

        editor.commands.setContent(content);

        lastSavedSnapshot.current = JSON.stringify({
          title: documentTitle,
          content: JSON.stringify(editor.getJSON()),
        });

        setLoaded(true);
        setSaveStatus("Saved");

      } catch (error) {
        if (cancelled) return;

        alert(error.response?.data?.detail || "Unable to load document.");
        navigate("/");

      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDocument();

    return () => {
      cancelled = true;
    };
  }, [id, editor, navigate]);

  // Auto-save
  useEffect(() => {
    if (!loaded || !editor || !canEdit) return;

    const currentContent = JSON.stringify(editor.getJSON());

    const snapshot = JSON.stringify({
      title,
      content: currentContent,
    });

    if (snapshot === lastSavedSnapshot.current) return;

    const timer = setTimeout(async () => {
      if (saveInProgress.current) return;

      try {
        saveInProgress.current = true;
        setSaving(true);
        setSaveStatus("Saving...");

        await api.put(`/documents/${id}`, {
          title,
          content: currentContent,
        });

        lastSavedSnapshot.current = snapshot;
        setSaveStatus("Saved");

      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("Save failed");

      } finally {
        saveInProgress.current = false;
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, contentVersion, loaded, editor, id, canEdit]);

  // Share document
  const handleShare = async (e) => {
    e.preventDefault();

    setShareError("");
    setShareSuccess("");

    if (!shareEmail.trim()) {
      setShareError("Please enter an email address.");
      return;
    }

    try {
      setSharing(true);

      const response = await api.post(`/documents/${id}/share`, {
        email: shareEmail.trim(),
        permission: sharePermission,
      });

      setShareSuccess(
        response.data.message || "Document shared successfully."
      );

      setShareEmail("");
      setSharePermission("viewer");

    } catch (error) {
      setShareError(
        error.response?.data?.detail || "Unable to share document."
      );
    } finally {
      setSharing(false);
    }
  };

  if (loading || !editor) {
    return (
      <div className="editor-loading">
        <p>Loading document...</p>
      </div>
    );
  }

  const words = editor.storage.characterCount.words();
  const characters = editor.storage.characterCount.characters();

  return (
    <div className="editor-page">

      <header className="editor-header">

        <div className="editor-header-left">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>

          <div>
            <input
              className="document-title"
              value={title}
              disabled={!canEdit}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus("Unsaved changes");
              }}
              placeholder="Untitled Document"
            />

            <div className="document-subtitle">
              DocSpace Document
              {permission && (
                <span className="permission-badge">{permission}</span>
              )}
            </div>
          </div>
        </div>

        <div className="editor-header-right">

          <span className={`save-status ${saveStatus === "Save failed" ? "error" : ""}`}>
            {saving ? "Saving..." : saveStatus === "Saved" ? "✓ All changes saved" : saveStatus}
          </span>

          {isOwner && (
            <button
              className="share-btn"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 size={16} />
              Share
            </button>
          )}

        </div>
      </header>

      {!canEdit && (
        <div className="viewer-notice">
          You have viewer access. You can read this document but cannot edit it.
        </div>
      )}

      <main className="editor-main">
        <div className="document-card">

          {canEdit && (
            <div className="editor-toolbar">

              <ToolbarButton icon={Bold} label="Bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()} />

              <ToolbarButton icon={Italic} label="Italic"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()} />

              <ToolbarButton icon={UnderlineIcon} label="Underline"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()} />

              <ToolbarDivider />

              <ToolbarButton icon={Heading1} label="Heading 1"
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />

              <ToolbarButton icon={Heading2} label="Heading 2"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />

              <ToolbarButton icon={Heading3} label="Heading 3"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

              <ToolbarDivider />

              <ToolbarButton icon={List} label="Bullet List"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()} />

              <ToolbarButton icon={ListOrdered} label="Numbered List"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()} />

              <ToolbarDivider />

              <ToolbarButton icon={AlignLeft} label="Align Left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()} />

              <ToolbarButton icon={AlignCenter} label="Align Center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()} />

              <ToolbarButton icon={AlignRight} label="Align Right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()} />

              <ToolbarButton icon={AlignJustify} label="Justify"
                active={editor.isActive({ textAlign: "justify" })}
                onClick={() => editor.chain().focus().setTextAlign("justify").run()} />

              <ToolbarDivider />

              <ToolbarButton icon={Undo2} label="Undo"
                disabled={!editor.can().chain().focus().undo().run()}
                onClick={() => editor.chain().focus().undo().run()} />

              <ToolbarButton icon={Redo2} label="Redo"
                disabled={!editor.can().chain().focus().redo().run()}
                onClick={() => editor.chain().focus().redo().run()} />

            </div>
          )}

          <EditorContent editor={editor} />

          <footer className="editor-footer">
            <div>
              <span>Words: {words}</span>
              <span>Characters: {characters}</span>
            </div>
            <span>DocSpace Editor</span>
          </footer>

        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && isOwner && (
        <div className="modal-overlay">
          <div className="share-modal">

            <div className="modal-header">
              <div>
                <h2>Share Document</h2>
                <p>Invite someone to access this document.</p>
              </div>

              <button
                className="close-modal-btn"
                onClick={() => setShowShareModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleShare}>

              <label>Email address</label>
              <input
                type="email"
                required
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter user's email"
              />

              <label>Permission</label>
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
              >
                <option value="viewer">Viewer - Can view only</option>
                <option value="editor">Editor - Can edit document</option>
              </select>

              {shareError && <p className="share-error">{shareError}</p>}
              {shareSuccess && <p className="share-success">{shareSuccess}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowShareModal(false)}
                >
                  Close
                </button>

                <button type="submit" className="share-submit-btn" disabled={sharing}>
                  {sharing ? "Sharing..." : "Share Document"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
