
import { useEffect, useState } from "react";
import {
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import "./DocumentCard.css";
export default function DocumentCard({
  document,
  onClick,
  onDelete,
  onRename,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);

  useEffect(() => {
    setNewTitle(document.title);
  }, [document.title]);

  const handleRename = (e) => {
    e.stopPropagation();

    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      alert("Document title cannot be empty.");
      return;
    }

    if (trimmedTitle === document.title) {
      setIsRenaming(false);
      return;
    }

    onRename(document.id, trimmedTitle);
    setIsRenaming(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(document.id);
  };

  const formattedDate = document.updated_at
    ? new Date(document.updated_at).toLocaleDateString()
    : "Recently created";

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
        ].filter(Boolean).join(" ");
      }

      return "";
    };

    return extractText(parsed).replace(/\s+/g, " ").trim();
  } catch {
    return String(content).replace(/<[^>]*>/g, " ").trim();
  }
}


  return (
    <div
      onClick={isRenaming ? undefined : onClick}
      className="document-card"
    >
      {/* Card Header */}
      <div className="mb-5 flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FileText size={23} />
        </div>

        <div className="flex items-center gap-1">

          {!isRenaming && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                title="Rename document"
                className="rounded-lg p-2 text-gray-400 opacity-0 transition hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
              >
                <Pencil size={17} />
              </button>

              <button
                onClick={handleDelete}
                title="Delete document"
                className="rounded-lg p-2 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              >
                <Trash2 size={17} />
              </button>
            </>
          )}

          <button
            onClick={(e) => e.stopPropagation()}
            title="More options"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <MoreVertical size={18} />
          </button>

        </div>
      </div>

      {/* Document Title */}
      {isRenaming ? (
        <div
          className="mb-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(e);
              if (e.key === "Escape") {
                setNewTitle(document.title);
                setIsRenaming(false);
              }
            }}
            maxLength={200}
            className="w-full rounded-lg border border-blue-400 px-3 py-2 text-sm font-semibold outline-none"
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={handleRename}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
            >
              <Check size={14} />
              Save
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewTitle(document.title);
                setIsRenaming(false);
              }}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <h3 className="mb-2 truncate font-semibold text-gray-800">
          {document.title || "Untitled Document"}
        </h3>
      )}

      {/* Document Preview */}
      <p className="mb-5 line-clamp-2 min-h-10 text-sm text-gray-500">
        {getDocumentText(document.content) || "No content yet. Start writing..."}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">
          Updated {formattedDate}
        </span>

        <span className="text-xs font-medium text-blue-600">
          Open document →
        </span>
      </div>

    </div>
  );
}
