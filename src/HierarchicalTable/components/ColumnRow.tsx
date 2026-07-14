import React from "react";
import type { ColumnDef, ColumnType, ColCalcOp, FormulaToken } from "../types";
import { colCalcLabel } from "../utils/calcUtils";
import FormulaBuilder from "./FormulaBuilder";
import styles from "./ColumnRow.module.css";
import NumberValidationPanel from "./NumberValidationPanel";
import CrossColumnValidationPanel from "./CrossColumnValidationPanel";

const COLUMN_TYPES: ColumnType[] = [
  "text",
  "number",
  "date",
  "dropdown",
  "checkbox",
  "email",
  "url",
  "textarea",
];

const COL_CALC_OPS: ColCalcOp[] = ["sum", "avg", "min", "max"];

interface Props {
  column: ColumnDef;
  allColumns: ColumnDef[];
  onChange: (patch: Partial<ColumnDef>) => void;
  onDelete: () => void;
}

const ColumnRow: React.FC<Props> = ({
  column,
  allColumns,
  onChange,
  onDelete,
}) => {
  const isNumber = column.type === "number";

  // ── FIXED: Now we allow previously computed (row-formula) columns ──
  // We only exclude: the current column itself + hidden columns
  const availableSources = allColumns.filter(
    (c) =>
      c.id !== column.id && // not itself
      c.type === "number" && // must be number
      !c.hideColumn // not hidden
  );

  return (
    <div className={styles.wrapper}>
      {/* ── Top row ─────────────────────────────────────────────── */}
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="field_id"
          value={column.fieldId}
          onChange={(e) => onChange({ fieldId: e.target.value })}
        />
        <input
          className={styles.input}
          placeholder="Column Label"
          value={column.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />
        <select
          className={styles.select}
          value={column.type}
          onChange={(e) => {
            const t = e.target.value as ColumnType;
            onChange({
              type: t,
              enableColCalc: t === "number" ? column.enableColCalc : false,
              enableRowCalc: t === "number" ? column.enableRowCalc : false,
              formula: t === "number" ? column.formula : [],
            });
          }}
        >
          {COLUMN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          className={styles.deleteBtn}
          onClick={onDelete}
          title="Remove column"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
      </div>
      {/* ── Dropdown options ─────────────────────────────────────── */}
      {column.type === "dropdown" && (
        <div className={styles.dropdownOptions}>
          <label className={styles.optionsLabel}>
            Options (comma-separated)
          </label>
          <input
            className={styles.input}
            placeholder="Option A, Option B, Option C"
            value={(column.dropdownOptions ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                dropdownOptions: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}
      {/* ── Standard flags ───────────────────────────────────────── */}
      <div className={styles.flags}>
        {(
          [
            ["codeBlock", "Code Block"],
            ["readOnly", "Read Only"],
            ["required", "Required"],
            ["hideColumn", "Hide Column"],
          ] as [keyof ColumnDef, string][]
        ).map(([key, label]) => (
          <label key={key} className={styles.flag}>
            <input
              type="checkbox"
              checked={!!column[key]}
              onChange={(e) => onChange({ [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}

        {/* ── Column Calc ─────────────────────────────────────── */}
        <label
          className={`${styles.flag} ${styles.calcFlag} ${
            !isNumber ? styles.flagDisabled : ""
          }`}
          title={
            !isNumber
              ? "Only for number columns"
              : "Show column aggregation in footer"
          }
        >
          <input
            type="checkbox"
            checked={!!column.enableColCalc}
            disabled={!isNumber}
            onChange={(e) =>
              onChange({
                enableColCalc: e.target.checked,
                colCalcOp: column.colCalcOp ?? "sum",
              })
            }
          />
          <span className={styles.calcBadge} style={{ background: "#4f6ef7" }}>
            Σ
          </span>
          Column Calc
        </label>

        {/* ── Row Calc (formula) ───────────────────────────────── */}
        <label
          className={`${styles.flag} ${styles.calcFlag} ${
            !isNumber ? styles.flagDisabled : ""
          }`}
          title={
            !isNumber
              ? "Only for number columns"
              : "Build a mixed formula for this column"
          }
        >
          <input
            type="checkbox"
            checked={!!column.enableRowCalc}
            disabled={!isNumber}
            onChange={(e) =>
              onChange({
                enableRowCalc: e.target.checked,
                formula: column.formula ?? [],
              })
            }
          />
          <span className={styles.calcBadge} style={{ background: "#e67e22" }}>
            ƒ
          </span>
          Row Formula
        </label>
      </div>
      {/* ── Validation Panel for Number Columns ─────────────────────────────── */}
      {isNumber && (
        <NumberValidationPanel
          validation={column.validation}
          onChange={(validation) => onChange({ validation })}
          columnLabel={column.label}
        />
      )}

      {/* ── Cross-Column Validation Panel for Number Columns ─────────────────────────────── */}
      {isNumber && (
        <CrossColumnValidationPanel
          validation={column.validation?.crossColumnValidation}
          allColumns={allColumns}
          currentColumnId={column.id}
          onChange={(crossValidation) => {
            // Create a new validation object preserving existing validations
            const currentValidation = column.validation || {};
            const updatedValidation = {
              ...currentValidation,
              crossColumnValidation: crossValidation,
            };
            // Remove crossColumnValidation if it's undefined
            if (!crossValidation) {
              delete updatedValidation.crossColumnValidation;
            }
            onChange({ validation: updatedValidation });
          }}
        />
      )}
      {/* ── Column Calc sub-panel ────────────────────────────────── */}
      {isNumber && column.enableColCalc && (
        <div className={styles.calcPanel} style={{ borderColor: "#4f6ef7" }}>
          <div className={styles.calcOpRow}>
            {COL_CALC_OPS.map((op) => (
              <button
                key={op}
                className={`${styles.opBtn} ${
                  (column.colCalcOp ?? "sum") === op ? styles.opBtnActive : ""
                }`}
                style={
                  (column.colCalcOp ?? "sum") === op
                    ? {
                        background: "#4f6ef7",
                        color: "#fff",
                        borderColor: "#4f6ef7",
                      }
                    : {}
                }
                onClick={() => onChange({ colCalcOp: op })}
              >
                {colCalcLabel[op]}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ── Row Formula sub-panel (FormulaBuilder) ───────────────── */}
      {isNumber && column.enableRowCalc && (
        <div className={styles.calcPanel} style={{ borderColor: "#e67e22" }}>
          <div className={styles.calcPanelHeader} style={{ color: "#e67e22" }}>
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="9" x2="9" y2="21" />
            </svg>
            Mixed Formula — computed per row in preview (supports BODMAS)
          </div>

          {availableSources.length === 0 ? (
            <p className={styles.noSources}>
              No number columns available in this table yet.
            </p>
          ) : (
            <FormulaBuilder
              formula={column.formula ?? []}
              availableCols={availableSources}
              onChange={(formula: FormulaToken[]) => onChange({ formula })}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnRow;
