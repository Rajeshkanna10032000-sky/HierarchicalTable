import React from 'react';
import type { FormulaToken, FormulaOp, ColumnDef } from '../types';
import { ALL_OPS, OP_SYMBOLS, OP_LABELS, formulaToString } from '../utils/calcUtils';
import styles from './FormulaBuilder.module.css';

interface Props {
  formula: FormulaToken[];
  /** Number columns available as operands (not this column itself) */
  availableCols: ColumnDef[];
  onChange: (formula: FormulaToken[]) => void;
}

const FormulaBuilder: React.FC<Props> = ({ formula, availableCols, onChange }) => {
  const labelMap = Object.fromEntries(availableCols.map((c) => [c.fieldId, c.label]));

  // ── Add a new token at the end ────────────────────────────────────────────
  const addToken = (fieldId: string) => {
    if (formula.find((t) => t.fieldId === fieldId)) return; // already used
    onChange([...formula, { fieldId, op: '+' }]);
  };

  // ── Remove token at index ─────────────────────────────────────────────────
  const removeToken = (idx: number) => {
    onChange(formula.filter((_, i) => i !== idx));
  };

  // ── Change operator AFTER token at idx ────────────────────────────────────
  const setOp = (idx: number, op: FormulaOp) => {
    onChange(formula.map((t, i) => (i === idx ? { ...t, op } : t)));
  };

  // ── Move token left / right ───────────────────────────────────────────────
  const moveToken = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= formula.length) return;
    const arr = [...formula];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  };

  const unusedCols = availableCols.filter((c) => !formula.find((t) => t.fieldId === c.fieldId));

  return (
    <div className={styles.builder}>
      {/* ── Formula display ─────────────────────────────────────── */}
      {formula.length > 0 && (
        <div className={styles.formulaDisplay}>
          <span className={styles.formulaLabel}>Formula:</span>
          <span className={styles.formulaStr}>
            {formulaToString(formula, labelMap)}
            <span className={styles.formulaEq}> = <strong>{`${formula.map(t => labelMap[t.fieldId] ?? t.fieldId).join('…')}`}</strong></span>
          </span>
        </div>
      )}

      {/* ── Token chain ─────────────────────────────────────────── */}
      <div className={styles.tokenChain}>
        {formula.length === 0 && (
          <div className={styles.emptyChain}>
            Pick columns below to build your formula
          </div>
        )}

        {formula.map((token, idx) => {
          const isLast = idx === formula.length - 1;
          const col = availableCols.find((c) => c.fieldId === token.fieldId);

          return (
            <React.Fragment key={token.fieldId}>
              {/* ── Column token chip ─────────────────────── */}
              <div className={styles.tokenChip}>
                <div className={styles.chipTop}>
                  <span className={styles.chipLabel}>{col?.label ?? token.fieldId}</span>
                  <code className={styles.chipFieldId}>{token.fieldId}</code>
                </div>
                <div className={styles.chipActions}>
                  <button
                    className={styles.chipBtn}
                    onClick={() => moveToken(idx, -1)}
                    disabled={idx === 0}
                    title="Move left"
                  >◀</button>
                  <button
                    className={styles.chipBtn}
                    onClick={() => moveToken(idx, 1)}
                    disabled={isLast}
                    title="Move right"
                  >▶</button>
                  <button
                    className={`${styles.chipBtn} ${styles.chipRemove}`}
                    onClick={() => removeToken(idx)}
                    title="Remove"
                  >✕</button>
                </div>
              </div>

              {/* ── Operator selector between tokens ─────── */}
              {!isLast && (
                <div className={styles.opSelector}>
                  {ALL_OPS.map((op) => (
                    <button
                      key={op}
                      className={`${styles.opBtn} ${token.op === op ? styles.opBtnActive : ''}`}
                      onClick={() => setOp(idx, op)}
                      title={OP_LABELS[op]}
                    >
                      {OP_SYMBOLS[op]}
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Available column picker ──────────────────────────────── */}
      <div className={styles.pickerSection}>
        <div className={styles.pickerLabel}>
          {unusedCols.length > 0
            ? 'Click to add to formula:'
            : formula.length === 0
            ? 'No number columns available in this table yet.'
            : 'All number columns are used.'}
        </div>
        <div className={styles.pickerGrid}>
          {unusedCols.map((col) => (
            <button
              key={col.id}
              className={styles.pickerBtn}
              onClick={() => addToken(col.fieldId)}
              title={`Add ${col.label} to formula`}
            >
              <span className={styles.pickerPlus}>+</span>
              <span>{col.label}</span>
              <code>{col.fieldId}</code>
            </button>
          ))}
        </div>
      </div>

      {/* ── Precedence note ─────────────────────────────────────── */}
      {formula.length > 1 && (
        <div className={styles.bodmasNote}>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r=".5" fill="currentColor"/>
          </svg>
          BODMAS order: × and ÷ are evaluated before + and −
        </div>
      )}
    </div>
  );
};

export default FormulaBuilder;