import React, { useState } from 'react';
import type { ColumnDef } from '../types';
import styles from './RowCountCell.module.css';

// Define the missing type here (or better to put it in '../types.ts')
export interface RowCountEntry {
  label: string;
  amount: number;
}

interface Props {
  col: ColumnDef;
  entries: RowCountEntry[];
  onChange: (entries: RowCountEntry[]) => void;
}

const RowCountCell: React.FC<Props> = ({ col, entries, onChange }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const nameLabel = col.rowCountLabel || 'Item';
  const amountLabel = col.rowCountAmount || 'Amount';

  const total = entries.reduce((s, e) => s + (isNaN(e.amount) ? 0 : e.amount), 0);

  const addEntry = () => {
    const amt = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amt)) return;

    onChange([...entries, { label: newLabel.trim(), amount: amt }]);
    setNewLabel('');
    setNewAmount('');
  };

  const removeEntry = (idx: number) => {
    onChange(entries.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
  };

  const updateEntry = (idx: number, patch: Partial<RowCountEntry>) => {
    onChange(entries.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  return (
    <td className={styles.td}>
      <div className={styles.cell}>
        {/* Existing entries */}
        {entries.length > 0 && (
          <div className={styles.entryList}>
            {entries.map((entry, idx) => (
              <div key={idx} className={styles.entryRow}>
                {editIdx === idx ? (
                  // Edit mode
                  <>
                    <input
                      className={styles.editInput}
                      value={entry.label}
                      onChange={(e) => updateEntry(idx, { label: e.target.value })}
                      placeholder={nameLabel}
                    />
                    <input
                      className={`${styles.editInput} ${styles.editAmount}`}
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateEntry(idx, { amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <button
                      className={styles.doneBtn}
                      onClick={() => setEditIdx(null)}
                      title="Done"
                    >
                      ✓
                    </button>
                  </>
                ) : (
                  // View mode
                  <>
                    <span className={styles.entryLabel}>{entry.label}</span>
                    <span className={styles.entryAmount}>
                      {isNaN(entry.amount) ? '—' : entry.amount.toLocaleString()}
                    </span>
                    <button
                      className={styles.editBtn}
                      onClick={() => setEditIdx(idx)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeEntry(idx)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            ))}

            <div className={styles.subTotal}>
              <span>Total</span>
              <strong>{total.toLocaleString()}</strong>
            </div>
          </div>
        )}

        {/* Add new entry */}
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            placeholder={nameLabel}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          />
          <input
            className={`${styles.addInput} ${styles.addAmount}`}
            type="number"
            placeholder={amountLabel}
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          />
          <button
            className={styles.addBtn}
            onClick={addEntry}
            disabled={!newLabel.trim() || !newAmount}
            title="Add entry"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </td>
  );
};

export default RowCountCell;