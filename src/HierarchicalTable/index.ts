export { default } from './HierarchicalTable';

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  TableNode, ColumnDef, ColumnType,
  ColCalcOp, FormulaToken, FormulaOp,
  RowCountEntry, SplitEntry,
} from './types';
export type { ExportTable, ExportColumn } from './utils/exportUtils';

// ── Hooks ──────────────────────────────────────────────────────────────────
export type { PreviewActions } from './hooks/usePreviewState';
export { usePreviewState }    from './hooks/usePreviewState';
export { useTableState }      from './hooks/useTableState';

// ── Components ─────────────────────────────────────────────────────────────
export { default as PreviewTable }    from './components/PreviewTable';
export { default as PreviewModal }    from './components/PreviewModal';
export { default as FormulaBuilder }  from './components/FormulaBuilder';
export { default as RowCountCell }    from './components/Rowcountcell';
export { default as BreakdownPanel }  from './components/Breakdownpanel';

// ── Utils ──────────────────────────────────────────────────────────────────
export * from './utils/calcUtils';
export * from './utils/exportUtils';
export * from './utils/tableUtils';