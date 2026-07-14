import React, { useState } from "react";
import type { TableNode } from "../types";
import ColumnRow from "./ColumnRow";
import type { ColumnDef } from "../types";
import styles from "./TableCard.module.css";
import MetaFormulaBuilder from "./MetaFormulaBuilder";

interface Props {
  node: TableNode;
  depth?: number;
  onUpdate: (id: string, patch: Partial<TableNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddColumn: (tableId: string) => void;
  onUpdateColumn: (
    tableId: string,
    colId: string,
    patch: Partial<ColumnDef>
  ) => void;
  onDeleteColumn: (tableId: string, colId: string) => void;
}

const DEPTH_COLORS = ["#4f6ef7", "#2ecc71", "#e67e22", "#9b59b6", "#e74c3c"];

const TableCard: React.FC<Props> = ({
  node,
  depth = 0,
  onUpdate,
  onDelete,
  onAddChild,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const accentColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  // Helper function to safely convert value to string for input
  const getValueAsString = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div
      className={styles.card}
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed((p) => !p)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                transform: collapsed ? "rotate(-90deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {/* <span
            className={styles.depthBadge}
            style={{ background: accentColor }}
          >
            {depth === 0 ? "Root" : `L${depth}`}
          </span> */}
          <span className={styles.tableTitle}>{node.label}</span>
          <code className={styles.fieldIdPill}>{node.fieldId}</code>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.iconBtn}
            onClick={() => onAddChild(node.id)}
            title="Add nested table"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M17.5 14v6M14.5 17h6" />
            </svg>
            Nest Table
          </button>
          <button
            className={`${styles.iconBtn} ${styles.danger}`}
            onClick={() => onDelete(node.id)}
            title="Delete table"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className={styles.body}>
          {/* Meta fields */}
          <div className={styles.metaGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Label</label>
              <input
                className={styles.metaInput}
                value={node.label}
                onChange={(e) => onUpdate(node.id, { label: e.target.value })}
                placeholder="Table label"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Field ID</label>
              <input
                className={`${styles.metaInput} ${styles.mono}`}
                value={node.fieldId}
                onChange={(e) => onUpdate(node.id, { fieldId: e.target.value })}
                placeholder="table-fieldid"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Placeholder</label>
              <input
                className={styles.metaInput}
                value={node.placeholder ?? ""}
                onChange={(e) =>
                  onUpdate(node.id, { placeholder: e.target.value })
                }
                placeholder="Placeholder text"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Help Text</label>
              <input
                className={styles.metaInput}
                value={node.helpText ?? ""}
                onChange={(e) =>
                  onUpdate(node.id, { helpText: e.target.value })
                }
                placeholder="Helpful description"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                <input
                  type="checkbox"
                  checked={!!node.required}
                  onChange={(e) =>
                    onUpdate(node.id, { required: e.target.checked })
                  }
                />
                &nbsp; Required
              </label>
            </div>
          </div>

          {/* Columns */}
          <div className={styles.sectionTitle}>
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="9" x2="9" y2="21" />
            </svg>
            Columns
          </div>

          <div className={styles.columns}>
            {node.columns.map((col) => (
              <ColumnRow
                key={col.id}
                column={col}
                allColumns={node.columns}
                onChange={(patch) => onUpdateColumn(node.id, col.id, patch)}
                onDelete={() => onDeleteColumn(node.id, col.id)}
              />
            ))}
          </div>

          <button
            className={styles.addColBtn}
            onClick={() => onAddColumn(node.id)}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Column
          </button>

          {/* Meta Data (Summary Section) */}
          <div
            className={styles.sectionTitle}
            style={{ color: accentColor, marginTop: "20px" }}
          >
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3" />
              <path d="M12 2v8M9 7l3 3 3-3" />
              <path d="M5 12h14" />
            </svg>
            Summary
          </div>

          <div className={styles.metaDataSection}>
            {(node.metaData ?? []).map((meta, idx) => {
              // Get available number columns that have Column Calc enabled
              const availableTableColumns = node.columns.filter(
                (col) =>
                  col.type === "number" &&
                  col.enableColCalc === true &&
                  !col.hideColumn
              );

              // Get previously created meta data fields (excluding current one)
              const availableMetaFields = (node.metaData ?? [])
                .filter((m, i) => i !== idx && m.fieldId !== meta.fieldId)
                .map((m) => ({
                  id: m.id,
                  fieldId: m.fieldId,
                  label: m.label,
                  type: "number" as const,
                  enableColCalc: true,
                })) as ColumnDef[];

              // Combined sources for formula mode
              const availableSources = [
                ...availableTableColumns,
                ...availableMetaFields,
              ];

              return (
                <div key={meta.id} className={styles.metaCard}>
                  <div className={styles.metaRow}>
                    <input
                      className={styles.metaInput}
                      placeholder="Label (e.g. Grand Total)"
                      value={meta.label}
                      onChange={(e) =>
                        onUpdate(node.id, {
                          metaData: (node.metaData ?? []).map((m, i) =>
                            i === idx ? { ...m, label: e.target.value } : m
                          ),
                        })
                      }
                    />
                    <input
                      className={`${styles.metaInput} ${styles.mono}`}
                      placeholder="fieldId"
                      value={meta.fieldId}
                      onChange={(e) =>
                        onUpdate(node.id, {
                          metaData: (node.metaData ?? []).map((m, i) =>
                            i === idx ? { ...m, fieldId: e.target.value } : m
                          ),
                        })
                      }
                    />
                    <input
                      className={styles.metaInput}
                      type="text"
                      placeholder="Default value (if no calculation)"
                      value={getValueAsString(meta.value)}
                      onChange={(e) => {
                        let parsedValue: unknown = e.target.value;
                        if (
                          !isNaN(Number(e.target.value)) &&
                          e.target.value.trim() !== ""
                        ) {
                          parsedValue = Number(e.target.value);
                        }
                        onUpdate(node.id, {
                          metaData: (node.metaData ?? []).map((m, i) =>
                            i === idx
                              ? {
                                  ...m,
                                  value: parsedValue,
                                  calculationMode: undefined,
                                  enableFormulaCalc: false,
                                  enableColumnAggregation: false,
                                }
                              : m
                          ),
                        });
                      }}
                    />
                    <button
                      className={styles.deleteMetaBtn}
                      onClick={() =>
                        onUpdate(node.id, {
                          metaData: (node.metaData ?? []).filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      title="Delete meta field"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Two Calculation Mode Checkboxes */}
                  <div className={styles.calculationModes}>
                    {/* Option 1: Formula Mode */}
                    <label className={styles.calcModeLabel}>
                      <input
                        type="checkbox"
                        checked={meta.enableFormulaCalc === true}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          onUpdate(node.id, {
                            metaData: (node.metaData ?? []).map((m, i) =>
                              i === idx
                                ? {
                                    ...m,
                                    enableFormulaCalc: isChecked,
                                    enableColumnAggregation: isChecked
                                      ? false
                                      : m.enableColumnAggregation,
                                    calculationMode: isChecked
                                      ? "formula"
                                      : m.enableColumnAggregation
                                      ? "column_aggregation"
                                      : undefined,
                                    formula: isChecked ? m.formula ?? [] : [],
                                  }
                                : m
                            ),
                          });
                        }}
                      />
                      <span
                        className={styles.calcBadge}
                        style={{ background: "#e67e22" }}
                      >
                        ƒ
                      </span>
                      Formula Mode
                    </label>

                    {/* Option 2: Column Aggregation Mode */}
                    <label className={styles.calcModeLabel}>
                      <input
                        type="checkbox"
                        checked={meta.enableColumnAggregation === true}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          onUpdate(node.id, {
                            metaData: (node.metaData ?? []).map((m, i) =>
                              i === idx
                                ? {
                                    ...m,
                                    enableColumnAggregation: isChecked,
                                    enableFormulaCalc: isChecked
                                      ? false
                                      : m.enableFormulaCalc,
                                    calculationMode: isChecked
                                      ? "column_aggregation"
                                      : m.enableFormulaCalc
                                      ? "formula"
                                      : undefined,
                                    aggregationColumn: isChecked
                                      ? m.aggregationColumn ||
                                        availableTableColumns[0]?.fieldId
                                      : undefined,
                                    aggregationOp: isChecked
                                      ? m.aggregationOp || "sum"
                                      : undefined,
                                  }
                                : m
                            ),
                          });
                        }}
                      />
                      <span
                        className={styles.calcBadge}
                        style={{ background: "#4f6ef7" }}
                      >
                        Σ
                      </span>
                      Column Aggregation Mode 
                    </label>
                  </div>

                  {/* Formula Mode Content */}
                  {meta.enableFormulaCalc === true && (
                    <div className={styles.formulaBuilderWrapper}>
                      {availableSources.length === 0 ? (
                        <div className={styles.noSourcesWarning}>
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="#ffc107"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div>
                            <strong>
                              No sources available for formula calculation.
                            </strong>
                            <br />
                            Please add{" "}
                            <strong>
                              number columns with Column Calc enabled
                            </strong>{" "}
                            or <strong>other Meta Data fields</strong> first.
                          </div>
                        </div>
                      ) : (
                        <MetaFormulaBuilder
                          formula={meta.formula ?? []}
                          availableCols={availableSources}
                          onChange={(newFormula) =>
                            onUpdate(node.id, {
                              metaData: (node.metaData ?? []).map((m, i) =>
                                i === idx ? { ...m, formula: newFormula } : m
                              ),
                            })
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Column Aggregation Mode Content */}
                  {meta.enableColumnAggregation === true && (
                    <div className={styles.aggregationWrapper}>
                      {availableTableColumns.length === 0 ? (
                        <div className={styles.noSourcesWarning}>
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="#ffc107"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div>
                            <strong>
                              No columns available for aggregation.
                            </strong>
                            <br />
                            Please enable <strong>"Column Calc"</strong> on
                            number columns in this table first.
                          </div>
                        </div>
                      ) : (
                        <div className={styles.aggregationPanel}>
                          {/* Column Selection */}
                          <div className={styles.aggFieldGroup}>
                            <label className={styles.aggFieldLabel}>
                              Select Column:
                            </label>
                            <select
                              className={styles.aggSelect}
                              value={meta.aggregationColumn || ""}
                              onChange={(e) =>
                                onUpdate(node.id, {
                                  metaData: (node.metaData ?? []).map((m, i) =>
                                    i === idx
                                      ? {
                                          ...m,
                                          aggregationColumn: e.target.value,
                                        }
                                      : m
                                  ),
                                })
                              }
                            >
                              <option value="" disabled>
                                Choose a column...
                              </option>
                              {availableTableColumns.map((col) => (
                                <option key={col.id} value={col.fieldId}>
                                  {col.label} ({col.fieldId})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              className={styles.addMetaBtn}
              onClick={() =>
                onUpdate(node.id, {
                  metaData: [
                    ...(node.metaData ?? []),
                    {
                      id: `meta-${Date.now()}`,
                      label: "New Meta Field",
                      fieldId: `meta-${Date.now()}`,
                      value: 0,
                      enableFormulaCalc: false,
                      enableColumnAggregation: false,
                      formula: [],
                    },
                  ],
                })
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add Meta Data
            </button>
          </div>

          {/* Formula Token Display (Optional) */}
          {node.metaData?.some((m) => m.formula && m.formula.length > 0) && (
            <div className={styles.formulaSection}>
              <div
                className={styles.sectionTitle}
                style={{ color: accentColor }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 7h16M4 12h16M4 17h10" />
                  <path d="M18 17l2-2-2-2" />
                </svg>
                Formula Configuration
              </div>
              {node.metaData.map(
                (meta) =>
                  meta.formula &&
                  meta.formula.length > 0 && (
                    <div key={meta.id} className={styles.formulaRow}>
                      <span className={styles.formulaLabel}>{meta.label}:</span>
                      <code className={styles.formulaCode}>
                        {JSON.stringify(meta.formula)}
                      </code>
                    </div>
                  )
              )}
            </div>
          )}

          {/* Children / Nested Tables */}
          {node.children && node.children.length > 0 && (
            <div className={styles.children}>
              <div
                className={styles.sectionTitle}
                style={{ color: accentColor }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 6L4 12l4 6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
                Nested Tables ({node.children.length})
              </div>
              {node.children.map((child) => (
                <TableCard
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  onAddColumn={onAddColumn}
                  onUpdateColumn={onUpdateColumn}
                  onDeleteColumn={onDeleteColumn}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableCard;
