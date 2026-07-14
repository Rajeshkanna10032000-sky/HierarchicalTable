import React, { useEffect, useState, useMemo } from "react";
import type { TableNode } from "../types";
import PreviewTable from "./PreviewTable";
import { usePreviewState } from "../hooks/usePreviewState";
import { buildExportPayload, downloadJson } from "../utils/exportUtils";
import styles from "./PreviewModal.module.css";

interface Props {
  tables: TableNode[];
  onClose: () => void;
  onUpdateTable?: (updatedTable: TableNode) => void;
}

const PreviewModal: React.FC<Props> = ({ tables, onClose, onUpdateTable }) => {
  const previewActions = usePreviewState();
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTables, setCurrentTables] = useState<TableNode[]>(tables);

  // Update currentTables when tables prop changes
  useEffect(() => {
    setCurrentTables(tables);
  }, [tables]);

  // Build the live export payload whenever rows or tables change
  const exportPayload = useMemo(
    () => buildExportPayload(currentTables, previewActions.rowMap),
    [currentTables, previewActions.rowMap]
  );

  const jsonString = JSON.stringify(exportPayload, null, 2);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showJson) {
          setShowJson(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showJson]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    downloadJson(exportPayload, "preview-data.json");
  };

  // Handle updating meta data values
  const handleUpdateMeta = (
    tableId: string,
    metaId: string,
    value: unknown
  ) => {
    const updateTableMeta = (tableList: TableNode[]): TableNode[] => {
      return tableList.map((table) => {
        if (table.id === tableId) {
          const updatedTable = {
            ...table,
            metaData: (table.metaData || []).map((meta) =>
              meta.id === metaId ? { ...meta, value } : meta
            ),
          };
          // Notify parent if callback provided
          if (onUpdateTable) {
            onUpdateTable(updatedTable);
          }
          return updatedTable;
        }
        if (table.children && table.children.length > 0) {
          return {
            ...table,
            children: updateTableMeta(table.children),
          };
        }
        return table;
      });
    };

    setCurrentTables((prev) => updateTableMeta(prev));
  };

  // Handle updating cell values (for static meta values)
  const handleUpdateCell = (
    instanceKey: string,
    rowIdx: number,
    fieldId: string,
    value: unknown
  ) => {
    previewActions.updateCell(instanceKey, rowIdx, fieldId, value);
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${styles.modal} ${showJson ? styles.modalWide : ""}`}>
        {/* ── Modal header ───────────────────────────────────────── */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="#4f6ef7"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className={styles.modalTitle}>Preview</span>
          </div>

          <div className={styles.headerRight}>
            {/* Toggle JSON panel */}
            <button
              className={`${styles.jsonToggleBtn} ${
                showJson ? styles.jsonToggleBtnActive : ""
              }`}
              onClick={() => setShowJson((p) => !p)}
              title="View exported JSON"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              {showJson ? "Hide JSON" : "View JSON"}
            </button>

            {/* Download JSON */}
            <button
              className={styles.downloadBtn}
              onClick={handleDownload}
              title="Download preview-data.json"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export JSON
            </button>

            {/* Reset */}
            <button
              className={styles.resetBtn}
              onClick={previewActions.resetPreview}
              title="Clear all preview data"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
              </svg>
              Reset
            </button>

            {/* Close */}
            <button
              className={styles.closeBtn}
              onClick={onClose}
              title="Close (Esc)"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Notice banner ──────────────────────────────────────── */}
        {/* <div className={styles.noticeBanner}>
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
        </div> */}

        {/* ── Split body: table preview + optional JSON panel ─────── */}
        <div className={styles.splitBody}>
          {/* Left: Table preview */}
          <div className={styles.previewPane}>
            {currentTables.length === 0 ? (
              <div className={styles.empty}>
                <svg
                  viewBox="0 0 64 64"
                  width="48"
                  height="48"
                  fill="none"
                  stroke="#ddd"
                  strokeWidth="2"
                >
                  <rect x="8" y="8" width="48" height="48" rx="6" />
                  <line x1="8" y1="22" x2="56" y2="22" />
                  <line x1="24" y1="22" x2="24" y2="56" />
                </svg>
                <p>No tables defined yet.</p>
              </div>
            ) : (
              currentTables.map((node) => (
                <PreviewTable
                  key={node.id}
                  node={node}
                  actions={previewActions}
                  depth={0}
                  instanceKey={node.id}
                  onUpdateMeta={(metaId, value) =>
                    handleUpdateMeta(node.id, metaId, value)
                  }
                  onUpdateCell={handleUpdateCell}
                />
              ))
            )}
          </div>

          {/* Right: JSON panel (slide in) */}
          {showJson && (
            <div className={styles.jsonPane}>
              <div className={styles.jsonPaneHeader}>
                <span className={styles.jsonPaneTitle}>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Export JSON
                </span>

                <div className={styles.jsonPaneActions}>
                  <button
                    className={`${styles.copyBtn} ${
                      copied ? styles.copyBtnSuccess : ""
                    }`}
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    className={styles.downloadBtnSm}
                    onClick={handleDownload}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>

              {/* Highlighted JSON */}
              <div className={styles.jsonScroll}>
                <JsonHighlight json={exportPayload} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Lightweight JSON syntax highlighter ───────────────────────────────────────
const JsonHighlight: React.FC<{ json: unknown }> = ({ json }) => {
  const highlighted = syntaxHighlight(JSON.stringify(json, null, 2));
  return (
    <pre
      className={styles.jsonCode}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};

function syntaxHighlight(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-num";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-str";
        } else if (/true|false/.test(match)) {
          cls = "json-bool";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export default PreviewModal;
