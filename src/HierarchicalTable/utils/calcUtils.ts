import type {
  ColumnDef,
  FormulaToken,
  FormulaOp,
  ColCalcOp,
  MetaDataEntry,
  TableNode,
} from "../types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export const toNum = (v: unknown): number => {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? 0 : n;
};

export const fmt = (n: number): string => {
  if (!isFinite(n)) return "∞";
  return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(6)).toString();
};

// ─────────────────────────────────────────────
// Formula Evaluation (Row Level)
// ─────────────────────────────────────────────
export const evalFormula = (
  formula: FormulaToken[] = [],
  row: Record<string, unknown>,
  _allColumns: ColumnDef[],
  computedValues: Record<string, unknown> = {}
): string => {
  if (!formula.length) return "—";

  const expr: (number | FormulaOp)[] = [];

  formula.forEach((token, idx) => {
    const value =
      computedValues[token.fieldId] !== undefined
        ? toNum(computedValues[token.fieldId])
        : toNum(row[token.fieldId]);

    expr.push(value);
    if (idx < formula.length - 1) expr.push(token.op);
  });

  // Pass 1 (* /)
  let i = 1;
  const pass1 = [...expr];
  while (i < pass1.length) {
    const op = pass1[i];
    if (op === "*" || op === "/") {
      const left = pass1[i - 1] as number;
      const right = pass1[i + 1] as number;
      const result = op === "*" ? left * right : right === 0 ? 0 : left / right;
      pass1.splice(i - 1, 3, result);
    } else {
      i += 2;
    }
  }

  // Pass 2 (+ -)
  let acc = pass1[0] as number;
  for (let j = 1; j < pass1.length; j += 2) {
    const op = pass1[j] as FormulaOp;
    const right = pass1[j + 1] as number;
    acc += op === "+" ? right : -right;
  }

  return fmt(acc);
};

// ─────────────────────────────────────────────
// Compute Full Row (Supports chained formulas)
// ─────────────────────────────────────────────
export const computeFullRow = (
  rawRow: Record<string, unknown>,
  columns: ColumnDef[]
): Record<string, unknown> => {
  const computedRow = { ...rawRow };
  const computedValues: Record<string, unknown> = {};

  for (const col of columns) {
    if (col.enableRowCalc && col.formula?.length) {
      const result = evalFormula(col.formula, rawRow, columns, computedValues);
      computedRow[col.fieldId] = result;
      computedValues[col.fieldId] = result;
    }
  }

  return computedRow;
};

// ─────────────────────────────────────────────
// Column Footer Calculation
// ─────────────────────────────────────────────
export const calcColumnFooter = (
  rows: Record<string, unknown>[],
  col: ColumnDef,
  computedRows?: string[]
): string => {
  if (!col.enableColCalc) return "";

  const nums =
    col.enableRowCalc && computedRows
      ? computedRows.map(toNum)
      : rows.map((r) => toNum(r[col.fieldId]));

  if (!nums.length) return "—";

  const op = col.colCalcOp ?? "sum";

  let result = 0;
  switch (op) {
    case "sum":
      result = nums.reduce((a, b) => a + b, 0);
      break;
    case "avg":
      result = nums.reduce((a, b) => a + b, 0) / nums.length;
      break;
    case "min":
      result = Math.min(...nums);
      break;
    case "max":
      result = Math.max(...nums);
      break;
  }

  return fmt(result);
};

export const colCalcLabel: Record<ColCalcOp, string> = {
  sum: "Σ Sum",
  avg: "⌀ Avg",
  min: "↓ Min",
  max: "↑ Max",
};

// ─────────────────────────────────────────────
// Formula UI Helpers
// ─────────────────────────────────────────────
export const OP_SYMBOLS: Record<FormulaOp, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

export const OP_LABELS: Record<FormulaOp, string> = {
  "+": "+ Add",
  "-": "− Subtract",
  "*": "× Multiply",
  "/": "÷ Divide",
};

export const ALL_OPS: FormulaOp[] = ["+", "-", "*", "/"];

export const formulaToString = (
  formula: FormulaToken[] = [],
  labelMap: Record<string, string>
) => {
  if (!formula.length) return "(empty)";

  return formula
    .map((t, i) => {
      const name = labelMap[t.fieldId] ?? t.fieldId;
      return i < formula.length - 1
        ? `${name} ${OP_SYMBOLS[t.op]}`
        : name;
    })
    .join(" ");
};

// ─────────────────────────────────────────────
// Meta Formula Evaluation
// ─────────────────────────────────────────────
export const evalMetaFormula = (
  formula: FormulaToken[] = [],
  row: Record<string, unknown>,
  _allColumns: ColumnDef[],
  computedValues: Record<string, unknown> = {}
): number => {
  if (!formula.length) return 0;

  const expr: (number | FormulaOp)[] = [];

  formula.forEach((token, idx) => {
    // Try to get value from computedValues first, then row
    let rawValue = computedValues[token.fieldId];
    if (rawValue === undefined) {
      rawValue = row[token.fieldId];
    }
    
    // Handle string values that might be numbers
    let value: number;
    if (typeof rawValue === 'string') {
      value = parseFloat(rawValue);
      value = isNaN(value) ? 0 : value;
    } else {
      value = toNum(rawValue);
    }
    
    expr.push(value);
    if (idx < formula.length - 1) expr.push(token.op);
  });

  // Pass 1 (* /)
  let i = 1;
  const pass1 = [...expr];
  while (i < pass1.length) {
    const op = pass1[i];
    if (op === "*" || op === "/") {
      const left = pass1[i - 1] as number;
      const right = pass1[i + 1] as number;
      const result = op === "*" ? left * right : right === 0 ? 0 : left / right;
      pass1.splice(i - 1, 3, result);
    } else {
      i += 2;
    }
  }

  // Pass 2 (+ -)
  let acc = pass1[0] as number;
  for (let j = 1; j < pass1.length; j += 2) {
    const op = pass1[j] as FormulaOp;
    const right = pass1[j + 1] as number;
    acc += op === "+" ? right : -right;
  }

  return acc;
};

// Make sure this is in your calcUtils.ts exports
export const aggregateColumnMeta = (
  aggregationColumn: string,
  aggregationOp: ColCalcOp,
  rows: Record<string, unknown>[]
): number => {
  const values = rows.map(row => toNum(row[aggregationColumn]));
  
  if (values.length === 0) return 0;
  
  switch (aggregationOp) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
};

// ─────────────────────────────────────────────
// Calculate Meta Data Value (Supports all modes)
// ─────────────────────────────────────────────
export const calculateMetaValue = (
  meta: MetaDataEntry,
  rows: Record<string, unknown>[],
  node: TableNode
): number => {
  // Column Aggregation Mode
  if (meta.enableColumnAggregation && meta.aggregationColumn) {
    return aggregateColumnMeta(meta.aggregationColumn, meta.aggregationOp || 'sum', rows);
  }
  
  // Formula Mode (new)
  if (meta.enableFormulaCalc && meta.formula && meta.formula.length > 0) {
    const rowValues = rows.map(row => {
      const computedRow = computeFullRow(row, node.columns);
      return evalMetaFormula(meta.formula, computedRow, node.columns, {});
    });
    return rowValues.reduce((sum, val) => sum + val, 0);
  }
  
  // Legacy Formula Mode
  if (meta.enableCalc && meta.formula && meta.formula.length > 0) {
    const rowValues = rows.map(row => {
      const computedRow = computeFullRow(row, node.columns);
      return evalMetaFormula(meta.formula, computedRow, node.columns, {});
    });
    return rowValues.reduce((sum, val) => sum + val, 0);
  }
  
  // Static value
  return toNum(meta.value);
};

// ─────────────────────────────────────────────
// Meta Calculation Per Row
// ─────────────────────────────────────────────
export const calculateMetaForRow = (
  meta: MetaDataEntry,
  row: Record<string, unknown>,
  node: TableNode
): number => {
  // Column Aggregation Mode doesn't make sense per row
  if (meta.enableColumnAggregation) {
    return 0;
  }
  
  // Formula Mode (new)
  if (meta.enableFormulaCalc && meta.formula?.length) {
    const computedRow = computeFullRow(row, node.columns);
    return evalMetaFormula(meta.formula, computedRow, node.columns);
  }
  
  // Legacy Formula Mode
  if (meta.enableCalc && meta.formula?.length) {
    const computedRow = computeFullRow(row, node.columns);
    return evalMetaFormula(meta.formula, computedRow, node.columns);
  }

  return toNum(meta.value);
};

// ─────────────────────────────────────────────
// Compute Meta Data Values (All Rows)
// ─────────────────────────────────────────────
export const computeMetaDataValues = (
  rows: Record<string, unknown>[],
  columns: ColumnDef[],
  metaData: MetaDataEntry[]
): MetaDataEntry[] => {
  if (!metaData.length) return [];

  const aggregatedMeta: Record<string, number> = {};

  for (const meta of metaData) {
    // Column Aggregation Mode
    if (meta.enableColumnAggregation && meta.aggregationColumn) {
      aggregatedMeta[meta.fieldId] = aggregateColumnMeta(
        meta.aggregationColumn,
        meta.aggregationOp || 'sum',
        rows
      );
    }
    // Formula Mode (new)
    else if (meta.enableFormulaCalc && meta.formula?.length) {
      const rowTotals = rows.map((row) => {
        const computedRow = computeFullRow(row, columns);
        return evalMetaFormula(meta.formula, computedRow, columns, {});
      });
      aggregatedMeta[meta.fieldId] = rowTotals.reduce((sum, val) => sum + val, 0);
    }
    // Legacy Formula Mode
    else if (meta.enableCalc && meta.formula?.length) {
      const rowTotals = rows.map((row) => {
        const computedRow = computeFullRow(row, columns);
        return evalMetaFormula(meta.formula, computedRow, columns, {});
      });
      aggregatedMeta[meta.fieldId] = rowTotals.reduce((sum, val) => sum + val, 0);
    }
    // Static value
    else {
      aggregatedMeta[meta.fieldId] = toNum(meta.value);
    }
  }

  return metaData.map((meta) => ({
    ...meta,
    value: aggregatedMeta[meta.fieldId] ?? 0,
  }));
};

// ─────────────────────────────────────────────
// Aggregate Single Meta (Legacy - kept for compatibility)
// ─────────────────────────────────────────────
export const aggregateMetaData = (
  meta: MetaDataEntry,
  rows: Record<string, unknown>[],
  node: TableNode
): number => {
  // Column Aggregation Mode
  if (meta.enableColumnAggregation && meta.aggregationColumn) {
    return aggregateColumnMeta(meta.aggregationColumn, meta.aggregationOp || 'sum', rows);
  }
  
  // Formula Mode (new)
  if (meta.enableFormulaCalc && meta.formula && meta.formula.length > 0) {
    const rowValues = rows.map(row => {
      const computedRow = computeFullRow(row, node.columns);
      return evalMetaFormula(meta.formula, computedRow, node.columns, {});
    });
    return rowValues.reduce((sum, val) => sum + val, 0);
  }
  
  // Legacy Formula Mode
  if (meta.enableCalc && meta.formula && meta.formula.length > 0) {
    const rowValues = rows.map(row => {
      const computedRow = computeFullRow(row, node.columns);
      return evalMetaFormula(meta.formula, computedRow, node.columns, {});
    });
    return rowValues.reduce((sum, val) => sum + val, 0);
  }
  
  return toNum(meta.value);
};

// ─────────────────────────────────────────────
// Calculate Meta Data Value with dependency resolution
// ─────────────────────────────────────────────
export const calculateMetaValueWithDependencies = (
  meta: MetaDataEntry,
  rows: Record<string, unknown>[],
  node: TableNode,
  computedMetaValues: Record<string, number> = {}
): number => {
  // Column Aggregation Mode
  if (meta.enableColumnAggregation && meta.aggregationColumn) {
    return aggregateColumnMeta(meta.aggregationColumn, meta.aggregationOp || 'sum', rows);
  }
  
  // Formula Mode - with dependency support
  if ((meta.enableFormulaCalc || meta.enableCalc) && meta.formula && meta.formula.length > 0) {
    // For formula mode, we want to apply the formula to each row and then sum
    // But if the formula references other meta fields (which are already aggregated),
    // we should treat them as constants per row
    const rowValues = rows.map(row => {
      const computedRow = computeFullRow(row, node.columns);
      const rowWithMeta = { ...computedRow, ...computedMetaValues };
      return evalMetaFormula(meta.formula, rowWithMeta, node.columns, {});
    });
    return rowValues.reduce((sum, val) => sum + val, 0);
  }
  
  return toNum(meta.value);
};

// ─────────────────────────────────────────────
// Compute all meta data values with proper dependency order
// ─────────────────────────────────────────────
export const computeMetaDataWithDependencies = (
  rows: Record<string, unknown>[],
  node: TableNode
): Record<string, number> => {
  const metaValues: Record<string, number> = {};
  const metaData = node.metaData || [];
  
  // Process meta data in order (they should be added in dependency order)
  for (const meta of metaData) {
    const value = calculateMetaValueWithDependencies(meta, rows, node, metaValues);
    metaValues[meta.fieldId] = value;
  }
  
  return metaValues;
};


// ─────────────────────────────────────────────
// Get calculation info for display
// ─────────────────────────────────────────────
export const getMetaCalculationInfo = (
  meta: MetaDataEntry,
  getColumnLabel: (fieldId: string) => string
): string => {
  // Column Aggregation Mode
  if (meta.enableColumnAggregation && meta.aggregationColumn) {
    const columnLabel = getColumnLabel(meta.aggregationColumn);
    const op = meta.aggregationOp || 'sum';
    const opLabel = op === 'sum' ? 'Sum' : op === 'avg' ? 'Average' : op === 'min' ? 'Minimum' : 'Maximum';
    return `${opLabel} of ${columnLabel}`;
  }
  
  // Formula Mode
  if ((meta.enableFormulaCalc || meta.enableCalc) && meta.formula && meta.formula.length > 0) {
    const labelMap: Record<string, string> = {};
    meta.formula.forEach(token => {
      labelMap[token.fieldId] = getColumnLabel(token.fieldId);
    });
    return `Formula: ${formulaToString(meta.formula, labelMap)}`;
  }
  
  return 'Static value';
};