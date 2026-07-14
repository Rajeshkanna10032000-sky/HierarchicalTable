import React from 'react';
import type { FormulaToken, FormulaOp, ColumnDef } from '../types';
import { ALL_OPS, OP_SYMBOLS, OP_LABELS, formulaToString } from '../utils/calcUtils';
import styles from './FormulaBuilder.module.css';

interface Props {
  formula: FormulaToken[] | undefined;
  availableCols: ColumnDef[];
  onChange: (formula: FormulaToken[]) => void;
}

const MetaFormulaBuilder: React.FC<Props> = ({ formula = [], availableCols, onChange }) => {
  const labelMap = Object.fromEntries(availableCols.map((c) => [c.fieldId, c.label]));

  const addToken = (fieldId: string) => {
    if (formula.find((t) => t.fieldId === fieldId)) return;
    onChange([...formula, { fieldId, op: '+' }]);
  };

  const removeToken = (idx: number) => {
    onChange(formula.filter((_, i) => i !== idx));
  };

  const setOp = (idx: number, op: FormulaOp) => {
    onChange(formula.map((t, i) => (i === idx ? { ...t, op } : t)));
  };

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
      {formula.length > 0 && (
        <div className={styles.formulaDisplay}>
          <span className={styles.formulaLabel}>Formula:</span>
          <span className={styles.formulaStr}>
            {formulaToString(formula, labelMap)}
            <span className={styles.formulaEq}> = <strong>Σ (across all rows)</strong></span>
          </span>
        </div>
      )}

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
              <div className={styles.tokenChip}>
                <div className={styles.chipTop}>
                  <span className={styles.chipLabel}>{col?.label ?? token.fieldId}</span>
                  <code className={styles.chipFieldId}>{token.fieldId}</code>
                  {col?.enableColCalc && (
                    <span className={styles.calcBadge}>Σ</span>
                  )}
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

      <div className={styles.pickerSection}>
        {/* <div className={styles.pickerLabel}>
          {unusedCols.length > 0 ? (
            <>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Click to add column to formula (Σ = Column Calc enabled):
            </>
          ) : formula.length === 0 ? (
            'No columns with Column Calc enabled in this table yet.'
          ) : (
            'All available columns are used.'
          )}
        </div> */}
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
              {col.enableColCalc && (
                <span className={styles.colCalcIndicator}>Σ</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* {formula.length > 1 && (
        <div className={styles.bodmasNote}>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r=".5" fill="currentColor"/>
          </svg>
          BODMAS order: × and ÷ are evaluated before + and − | Formula summed across all rows
        </div>
      )} */}
    </div>
  );
};

export default MetaFormulaBuilder;