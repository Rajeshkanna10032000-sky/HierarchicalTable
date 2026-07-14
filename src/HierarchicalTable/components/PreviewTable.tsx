import React from "react";
import type { TableNode, RowCountEntry, MetaDataEntry } from "../types";
import type { PreviewActions } from "../hooks/usePreviewState";
import PreviewCell from "./PreviewCell";
import RowCountCell from "./Rowcountcell";
import BreakdownPanel from "./Breakdownpanel";
import {
  computeFullRow,
  calcColumnFooter,
  colCalcLabel,
  fmt,
  toNum,
  evalMetaFormula,
} from "../utils/calcUtils";
import styles from "./PreviewTable.module.css";

interface Props {
  node: TableNode;
  actions: PreviewActions;
  depth?: number;
  instanceKey: string;
  onUpdateMeta?: (metaId: string, value: unknown) => void;
  onUpdateCell?: (
    instanceKey: string,
    rowIdx: number,
    fieldId: string,
    value: unknown
  ) => void;
}

const DEPTH_COLORS = ["#4f6ef7", "#2ecc71", "#e67e22", "#9b59b6", "#e74c3c"];

// Row-count helpers
const getEntries = (val: unknown): RowCountEntry[] =>
  Array.isArray(val) ? (val as RowCountEntry[]) : [];

const entriesTotal = (val: unknown): number =>
  getEntries(val).reduce((s, e) => s + (e.amount || 0), 0);

// Calculate meta data value based on mode with proper dependency resolution
const calculateMetaValue = (
  meta: MetaDataEntry,
  rows: Record<string, unknown>[],
  node: TableNode,
  computedMetaValues: Record<string, number> = {}
): number => {
  // Column Aggregation Mode
  if (meta.enableColumnAggregation && meta.aggregationColumn) {
    const columnFieldId = meta.aggregationColumn;
    if (!columnFieldId) return 0;

    const values = rows.map((row) => {
      const num = toNum(row[columnFieldId]);
      return isNaN(num) ? 0 : num;
    });

    if (values.length === 0) return 0;

    const op = meta.aggregationOp || "sum";
    let result = 0;
    switch (op) {
      case "sum":
        result = values.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case "min":
        result = Math.min(...values);
        break;
      case "max":
        result = Math.max(...values);
        break;
    }
    return result;
  }

  // Formula Mode - with proper handling for meta references
  if (
    (meta.enableFormulaCalc || meta.enableCalc) &&
    meta.formula &&
    meta.formula.length > 0
  ) {
    // Check if formula references any other meta fields
    const referencesMeta = meta.formula.some(
      (token) => computedMetaValues[token.fieldId] !== undefined
    );

    if (referencesMeta) {
      // Formula uses other meta fields - use aggregated values directly (not per row)
      // This prevents double aggregation
      const rowWithMeta = { ...computedMetaValues };
      return evalMetaFormula(meta.formula, rowWithMeta, node.columns, {});
    } else {
      // Formula only uses table columns - apply per row and sum
      const rowValues = rows.map((row) => {
        const computedRow = computeFullRow(row, node.columns);
        return evalMetaFormula(meta.formula, computedRow, node.columns, {});
      });
      return rowValues.reduce((sum, val) => sum + val, 0);
    }
  }

  // Static value - return the stored value
  return typeof meta.value === "number" ? meta.value : toNum(meta.value);
};

const PreviewTable: React.FC<Props> = ({
  node,
  actions,
  depth = 0,
  instanceKey,
  onUpdateMeta,
}) => {
  const accentColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const rawRows = actions.getRows(instanceKey);
  const hasChildren = !!node.children?.length;

  const allVisible = node.columns.filter((c) => !c.hideColumn);

  // Pre-compute rows with chained formulas
  const rows = rawRows.map((row) => computeFullRow(row, node.columns));

  // Categorise columns
  const splitCols = allVisible.filter((c) => c.type === "split");
  const rowCountCols = allVisible.filter(
    (c) => c.enableRowCount && c.type !== "split"
  );
  const formulaCols = allVisible.filter(
    (c) => c.enableRowCalc && !c.enableRowCount && c.type !== "split"
  );
  const normalCols = allVisible.filter(
    (c) => !c.enableRowCalc && !c.enableRowCount && c.type !== "split"
  );

  const hasFooter = rows.length > 0 && allVisible.some((c) => c.enableColCalc);
  const hasMetaData = node.metaData && node.metaData.length > 0;

  const totalCols =
    normalCols.length +
    formulaCols.length +
    rowCountCols.length +
    splitCols.length +
    (hasChildren ? 1 : 0) +
    2;

  // Breakdown data
  const breakdownData = rowCountCols.map((col) => ({
    col,
    allEntries: rows.flatMap((row) => getEntries(row[col.fieldId])),
  }));

  return (
    <div
      className={styles.wrapper}
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      {/* Header bar */}
      <div className={styles.tableHeader}>
        <div className={styles.tableHeaderLeft}>
          {/* <span className={styles.badge} style={{ background: accentColor }}>
            {depth === 0 ? "Table" : `Nested L${depth}`}
          </span> */}
          <span className={styles.tableLabel}>{node.label}</span>
          {node.helpText && (
            <span className={styles.helpText}>{node.helpText}</span>
          )}
        </div>
        <div className={styles.tableHeaderRight}>
          <button
            className={styles.addRowBtn}
            style={{ color: accentColor, borderColor: accentColor }}
            onClick={() => actions.addRow(instanceKey, node)}
          >
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Row
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {hasChildren && (
                <th className={`${styles.th} ${styles.expandTh}`} />
              )}
              <th className={`${styles.th} ${styles.rowNumTh}`}>#</th>

              {normalCols.map((col) => (
                <th key={col.id} className={styles.th}>
                  <span className={styles.colLabel}>
                    {col.label}
                    {col.required && <span className={styles.req}>*</span>}
                    {col.enableColCalc && (
                      <span className={styles.colCalcTag}>
                        Σ {colCalcLabel[col.colCalcOp ?? "sum"].split(" ")[1]}
                      </span>
                    )}
                  </span>
                  {/* <span className={styles.colType}>{col.type}</span> */}
                </th>
              ))}

              {splitCols.map((col) => (
                <th key={col.id} className={`${styles.th} ${styles.splitTh}`}>
                  <span className={styles.colLabel}>
                    {col.label}
                    <span className={styles.splitTag}>⬡ split</span>
                  </span>
                </th>
              ))}

              {rowCountCols.map((col) => (
                <th key={col.id} className={`${styles.th} ${styles.rcTh}`}>
                  {/* <span className={styles.colLabel}>
                    {col.label}
                    <span className={styles.rcTag}>⊞ breakdown</span>
                  </span> */}
                </th>
              ))}

              {formulaCols.map((col) => (
                <th key={col.id} className={`${styles.th} ${styles.resultTh}`}>
                  <span className={styles.colLabel}>
                    {col.label}
                    {/* <span className={styles.resultTag}>ƒ formula</span> */}
                  </span>
                </th>
              ))}

              <th className={`${styles.th} ${styles.actionTh}`} />
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className={styles.emptyRow}>
                  No rows yet — click <strong>Add Row</strong> to start
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <React.Fragment key={rowIdx}>
                  <tr
                    className={`${styles.tr} ${
                      actions.isExpanded(instanceKey, rowIdx)
                        ? styles.trExpanded
                        : ""
                    }`}
                  >
                    {hasChildren && (
                      <td className={styles.expandTd}>
                        <button
                          className={styles.expandBtn}
                          onClick={() =>
                            actions.toggleExpanded(instanceKey, rowIdx)
                          }
                          style={{ color: accentColor }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="13"
                            height="13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{
                              transform: actions.isExpanded(instanceKey, rowIdx)
                                ? "rotate(90deg)"
                                : "none",
                              transition: "transform 0.18s",
                            }}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </td>
                    )}

                    <td className={styles.rowNumTd}>{rowIdx + 1}</td>

                    {normalCols.map((col) => {
                      const getColumnLabel = (fieldId: string) => {
                        const column = node.columns.find(
                          (c) => c.fieldId === fieldId
                        );
                        return column?.label || fieldId;
                      };

                      return (
                        <PreviewCell
                          key={col.id}
                          col={col}
                          value={row[col.fieldId] ?? ""}
                          onChange={(val) =>
                            actions.updateCell(
                              instanceKey,
                              rowIdx,
                              col.fieldId,
                              val
                            )
                          }
                          allRowValues={row}
                          getColumnLabel={getColumnLabel}
                        />
                      );
                    })}

                    {splitCols.map((col) => (
                      <PreviewCell
                        key={col.id}
                        col={col}
                        value={row[col.fieldId]}
                        onChange={(val) =>
                          actions.updateCell(
                            instanceKey,
                            rowIdx,
                            col.fieldId,
                            val
                          )
                        }
                      />
                    ))}

                    {rowCountCols.map((col) => (
                      <RowCountCell
                        key={col.id}
                        col={col}
                        entries={getEntries(row[col.fieldId])}
                        onChange={(entries) =>
                          actions.updateCell(
                            instanceKey,
                            rowIdx,
                            col.fieldId,
                            entries
                          )
                        }
                      />
                    ))}

                    {formulaCols.map((col) => {
                      const result = row[col.fieldId];
                      const displayValue =
                        typeof result === "string" || typeof result === "number"
                          ? result
                          : "—";
                      return (
                        <td key={col.id} className={styles.resultCell}>
                          <div className={styles.resultValue}>
                            <span className={styles.resultIcon}>ƒ</span>
                            <strong>{displayValue}</strong>
                          </div>
                        </td>
                      );
                    })}

                    <td className={styles.actionTd}>
                      <button
                        className={styles.deleteRowBtn}
                        onClick={() => actions.deleteRow(instanceKey, rowIdx)}
                        title="Delete row"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {/* Nested Tables */}
                  {hasChildren && actions.isExpanded(instanceKey, rowIdx) && (
                    <tr className={styles.nestedRow}>
                      <td
                        colSpan={totalCols}
                        className={styles.nestedTd}
                        style={{ borderLeft: `3px solid ${accentColor}` }}
                      >
                        <div className={styles.nestedLabel}>
                          <svg
                            viewBox="0 0 24 24"
                            width="12"
                            height="12"
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="2"
                          >
                            <path d="M8 6L4 12l4 6" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                          </svg>
                          Nested tables for row {rowIdx + 1}
                        </div>
                        {node.children!.map((child) => {
                          const childInstanceKey = `${instanceKey}:r${rowIdx}:${child.id}`;
                          return (
                            <PreviewTable
                              key={childInstanceKey}
                              node={child}
                              actions={actions}
                              depth={depth + 1}
                              instanceKey={childInstanceKey}
                              onUpdateMeta={onUpdateMeta}
                            />
                          );
                        })}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>

          {/* Footer - Original Column Footers */}
          {hasFooter && (
            <tfoot>
              <tr className={styles.footerRow}>
                {hasChildren && <td className={styles.footerTd} />}
                <td className={`${styles.footerTd} ${styles.footerLabel}`}>
                  Total
                </td>

                {normalCols.map((col) => {
                  const val = calcColumnFooter(rows, col);
                  return (
                    <td key={col.id} className={styles.footerTd}>
                      {val && (
                        <div className={styles.footerValue}>
                          <span className={styles.footerOp}>
                            {colCalcLabel[col.colCalcOp ?? "sum"]}
                          </span>
                          <strong>{val}</strong>
                        </div>
                      )}
                    </td>
                  );
                })}

                {rowCountCols.map((col) => {
                  if (!col.enableColCalc)
                    return <td key={col.id} className={styles.footerTd} />;
                  const grandTotal = rows.reduce(
                    (s, row) => s + entriesTotal(row[col.fieldId]),
                    0
                  );
                  return (
                    <td key={col.id} className={styles.footerTd}>
                      <div className={styles.footerValue}>
                        <span
                          className={styles.footerOp}
                          style={{ color: "#9b59b6" }}
                        >
                          ⊞ Total
                        </span>
                        <strong style={{ color: "#9b59b6" }}>
                          {grandTotal.toLocaleString()}
                        </strong>
                      </div>
                    </td>
                  );
                })}

                {formulaCols.map((col) => {
                  if (!col.enableColCalc)
                    return <td key={col.id} className={styles.footerTd} />;
                  const computed = rows.map(
                    (r) => r[col.fieldId] as string | number
                  );
                  const nums = computed.map((v) => toNum(v));
                  const op = col.colCalcOp ?? "sum";
                  let agg: number = 0;
                  if (op === "sum") agg = nums.reduce((a, b) => a + b, 0);
                  else if (op === "avg")
                    agg = nums.length
                      ? nums.reduce((a, b) => a + b, 0) / nums.length
                      : 0;
                  else if (op === "min")
                    agg = nums.length ? Math.min(...nums) : 0;
                  else agg = nums.length ? Math.max(...nums) : 0;

                  return (
                    <td key={col.id} className={styles.footerTd}>
                      <div className={styles.footerValue}>
                        <span className={styles.footerOp}>
                          {colCalcLabel[op]}
                        </span>
                        <strong>{fmt(agg)}</strong>
                      </div>
                    </td>
                  );
                })}

                <td className={styles.footerTd} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Meta Data Footer - Table Style */}
      {hasMetaData && (
        <div
          style={{
            width: "500px",
            marginLeft: "auto", // This pushes the div to the right
          }}
          className={styles.metaDataFooter}
        >
          <table className={styles.metaDataTable}>
            <tbody>
              {(() => {
                // Compute meta values in order to handle dependencies
                const computedMetaValues: Record<string, number> = {};
                const metaResults: Array<{
                  meta: MetaDataEntry;
                  value: number;
                  isEditable: boolean;
                  calculationInfo: string;
                }> = [];

                // Process each meta field in order
                for (const meta of node.metaData || []) {
                  const isStatic =
                    !meta.enableColumnAggregation &&
                    !meta.enableFormulaCalc &&
                    !meta.enableCalc;
                  const isAggregation = !!meta.enableColumnAggregation;
                  const isFormula =
                    !isAggregation &&
                    !isStatic &&
                    (!!meta.enableFormulaCalc || !!meta.enableCalc);

                  let calculationInfo = "";
                  if (isAggregation && meta.aggregationColumn) {
                    const column = node.columns.find(
                      (c) => c.fieldId === meta.aggregationColumn
                    );
                    const op = meta.aggregationOp || "sum";
                    const opLabel =
                      op === "sum"
                        ? "Sum"
                        : op === "avg"
                        ? "Average"
                        : op === "min"
                        ? "Min"
                        : "Max";
                    calculationInfo = `${opLabel} of ${
                      column?.label || meta.aggregationColumn
                    }`;
                  } else if (isFormula) {
                    calculationInfo = `Formula (${
                      meta.formula?.length || 0
                    } terms)`;
                  } else {
                    calculationInfo = "Static";
                  }

                  const value = calculateMetaValue(
                    meta,
                    rows,
                    node,
                    computedMetaValues
                  );
                  computedMetaValues[meta.fieldId] = value;

                  metaResults.push({
                    meta,
                    value,
                    isEditable: isStatic,
                    calculationInfo,
                  });
                }

                return metaResults.map(({ meta, value, isEditable }) => (
                  <tr key={meta.id}>
                    <td>
                      <div className={styles.metaDataLabel}>{meta.label}</div>
                      {/* <div className={styles.metaDataType}>
                          {calculationInfo}
                        </div> */}
                    </td>
                    <td className={styles.metaDataValue}>
                      {isEditable ? (
                        <input
                          type="number"
                          className={styles.metaDataInput}
                          value={value}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value);
                            if (!isNaN(newValue) && onUpdateMeta) {
                              onUpdateMeta(meta.id, newValue);
                            }
                          }}
                        />
                      ) : (
                        <span className={styles.metaDataCalculated}>
                          {typeof value === "number"
                            ? value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : String(value)}
                        </span>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      <BreakdownPanel breakdownCols={breakdownData} />
    </div>
  );
};

export default PreviewTable;
