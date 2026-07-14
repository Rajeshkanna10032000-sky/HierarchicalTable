import React, { useState } from 'react';
import { useTableState } from './hooks/useTableState';
import TableCard from './components/TableCard';
import PreviewModal from './components/PreviewModal';
import styles from './HierarchicalTable.module.css';

const HierarchicalTable: React.FC = () => {
  const {
    tables,
    updateTable,
    deleteTable,
    addChildTable,
    addRootTable,
    addColumn,
    updateColumn,
    deleteColumn,
  } = useTableState();

  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className={styles.root}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <svg className={styles.logo} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#4f6ef7" />
            <rect x="6" y="8" width="20" height="3" rx="1.5" fill="white" opacity="0.9" />
            <rect x="6" y="14" width="12" height="3" rx="1.5" fill="white" opacity="0.7" />
            <rect x="6" y="20" width="16" height="3" rx="1.5" fill="white" opacity="0.5" />
          </svg>
          <span className={styles.appTitle}>Table Builder</span>
        </div>

        <div className={styles.topBarRight}>
          <button
            className={styles.previewBtn}
            onClick={() => setPreviewOpen(true)}
            disabled={tables.length === 0}
            title="Open user-facing preview"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </button>

          <button className={styles.addRootBtn} onClick={addRootTable}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Table
          </button>
        </div>
      </header>

      {/* ── Builder canvas ────────────────────────────────────────────── */}
      <main className={styles.main}>
        {tables.length === 0 ? (
          <div className={styles.empty}>
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="#ccc" strokeWidth="2">
              <rect x="8" y="8" width="48" height="48" rx="6" />
              <line x1="8" y1="22" x2="56" y2="22" />
              <line x1="8" y1="36" x2="56" y2="36" />
              <line x1="24" y1="22" x2="24" y2="56" />
            </svg>
            <p>No tables yet. Click <strong>Add Root Table</strong> to begin.</p>
          </div>
        ) : (
          tables.map((node) => (
            <TableCard
              key={node.id}
              node={node}
              depth={0}
              onUpdate={updateTable}
              onDelete={deleteTable}
              onAddChild={addChildTable}
              onAddColumn={addColumn}
              onUpdateColumn={updateColumn}
              onDeleteColumn={deleteColumn}
            />
          ))
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span>{tables.length} root table{tables.length !== 1 ? 's' : ''}</span>
        <button
          className={styles.exportBtn}
          onClick={() => {
            const blob = new Blob([JSON.stringify(tables, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tables.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </button>
      </footer>

      {/* ── Preview modal ─────────────────────────────────────────────── */}
      {previewOpen && (
        <PreviewModal tables={tables} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
};

export default HierarchicalTable;