import type { TableNode, ColumnDef, MetaDataEntry, FormulaToken } from '../types';
import { computeFullRow, toNum, evalMetaFormula } from './calcUtils';

export interface ExportColumn {
  label: string;
  columnId: string;
  value: unknown[];
  computed?: boolean;
}

export interface NestedTableExport {
  nestedTableIndex: number;
  label: string;
  field_id: string;
  value: TableValue;
}

export interface TableValue {
  primaryTable: ExportColumn[];
  nestedTables: NestedTableExport[];
  metaData?: Array<{
    label: string;
    fieldId: string;
    value: unknown;
  }>;
}

export interface ExportTable {
  label: string;
  field_id: string;
  value: TableValue;
}

/* ====================== HELPER ====================== */

const buildColumns = (
  node: TableNode,
  rowsData: Record<string, unknown>[]
): ExportColumn[] => {
  const visibleCols = node.columns.filter((c) => !c.hideColumn);
  const processedRows = rowsData.map((row) => computeFullRow(row, node.columns));

  return visibleCols.map((col: ColumnDef) => {
    let colValues: unknown[];

    if (col.enableRowCalc && col.formula && col.formula.length > 0) {
      colValues = processedRows.map((row) => {
        const val = row[col.fieldId];
        if (val === null || val === undefined || val === '') return null;
        const num = toNum(val);
        return isNaN(num) ? val : num;
      });
    } else {
      colValues = processedRows.map((row) => {
        const raw = row[col.fieldId];
        if (col.type === 'number') {
          return raw === '' || raw === undefined ? null : toNum(raw);
        }
        if (col.type === 'checkbox') return !!raw;
        return raw === '' || raw === undefined ? null : raw;
      });
    }

    const entry: ExportColumn = {
      label: col.label,
      columnId: col.fieldId,
      value: colValues,
    };

    if (col.enableRowCalc) entry.computed = true;
    return entry;
  });
};

// Calculate meta data value based on its configuration
const calculateMetaDataValue = (
  meta: MetaDataEntry,
  rows: Record<string, unknown>[],
  node: TableNode,
  computedMetaValues: Record<string, number> = {}
): number => {
  // Check for Column Aggregation Mode
  if (meta.enableColumnAggregation === true && meta.aggregationColumn) {
    const columnId = meta.aggregationColumn;
    const values = rows.map(row => toNum(row[columnId]));
    if (values.length === 0) return 0;
    
    const op = meta.aggregationOp || 'sum';
    switch (op) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return 0;
    }
  }
  
  // Check for Formula Mode
  if (meta.enableFormulaCalc === true && meta.formula && meta.formula.length > 0) {
    const referencesMeta = meta.formula.some(token => computedMetaValues[token.fieldId] !== undefined);
    if (referencesMeta) {
      // Formula uses other meta fields
      return evalMetaFormula(meta.formula, { ...computedMetaValues }, node.columns, {});
    } else {
      // Formula uses table columns
      const rowValues = rows.map(row => {
        const computedRow = computeFullRow(row, node.columns);
        return evalMetaFormula(meta.formula, computedRow, node.columns, {});
      });
      return rowValues.reduce((sum, val) => sum + val, 0);
    }
  }
  
  // Static value (no calculation enabled)
  return typeof meta.value === 'number' ? meta.value : toNum(meta.value);
};

const buildMetaData = (
  node: TableNode,
  rowsData: Record<string, unknown>[]
): Array<{ label: string; fieldId: string; value: unknown }> => {
  if (!node.metaData || node.metaData.length === 0) return [];

  // Process meta data in order to handle dependencies
  const computedMetaValues: Record<string, number> = {};
  const results: Array<{ label: string; fieldId: string; value: unknown }> = [];

  for (const meta of node.metaData) {
    const value = calculateMetaDataValue(meta, rowsData, node, computedMetaValues);
    computedMetaValues[meta.fieldId] = value;
    
    results.push({
      label: meta.label,
      fieldId: meta.fieldId,
      value: value,
    });
  }

  return results;
};

/* ====================== RECURSIVE BUILDER ====================== */

const buildExportTable = (
  node: TableNode,
  rowMap: Record<string, Record<string, unknown>[]>,
  instanceKey: string
): ExportTable => {
  const rowsData = rowMap[instanceKey] ?? [];
  
  const primaryTable = buildColumns(node, rowsData);
  const metaData = buildMetaData(node, rowsData);

  const nestedTables: NestedTableExport[] = [];

  if (node.children?.length) {
    node.children.forEach((childNode) => {
      rowsData.forEach((_, rowIdx) => {
        const childInstanceKey = `${instanceKey}:r${rowIdx}:${childNode.id}`;
        const childExport = buildExportTable(childNode, rowMap, childInstanceKey);

        if (childExport.value.primaryTable.length > 0 || 
            childExport.value.nestedTables.length > 0) {
          nestedTables.push({
            nestedTableIndex: rowIdx,
            label: childNode.label,
            field_id: childNode.fieldId,
            value: childExport.value,
          });
        }
      });
    });
  }

  const tableValue: TableValue = {
    primaryTable,
    nestedTables,
  };
  
  if (metaData.length > 0) {
    tableValue.metaData = metaData;
  }

  return {
    label: node.label,
    field_id: node.fieldId,
    value: tableValue,
  };
};

export const buildExportPayload = (
  tables: TableNode[],
  rowMap: Record<string, Record<string, unknown>[]>
): ExportTable[] => {
  return tables.map((table) => buildExportTable(table, rowMap, table.id));
};

export const downloadJson = (data: unknown, filename = 'preview-data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};