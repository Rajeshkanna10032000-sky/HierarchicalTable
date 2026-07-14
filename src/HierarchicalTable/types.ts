export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'email'
  | 'url'
  | 'textarea'
  | 'split';

export type ColCalcOp = 'sum' | 'avg' | 'min' | 'max';
export type FormulaOp = '+' | '-' | '*' | '/';
export type ValidationOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';

export interface FormulaToken {
  fieldId: string;
  op: FormulaOp;
}

export interface RowCountEntry {
  label: string;
  amount: number;
}

export interface SplitEntry {
  label: string;
  amount: number;
}

// Validation rules for number columns
export interface NumberValidation {
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  customErrorMsg?: string;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  decimalPlaces?: number;
  greaterThan?: number;
  lessThan?: number;
  crossColumnValidation?: CrossColumnValidation;
}

export interface CrossColumnValidation {
  targetFieldId: string;
  operator: ValidationOperator;
  value?: number;
  errorMessage?: string;
  dependentFields?: string[];
}

export interface ColumnDef {
  placeholder: string;
  id: string;
  fieldId: string;
  label: string;
  type: ColumnType;

  required?: boolean;
  readOnly?: boolean;
  hideColumn?: boolean;
  codeBlock?: boolean;
  dropdownOptions?: string[];

  enableColCalc?: boolean;
  colCalcOp?: ColCalcOp;

  enableRowCalc?: boolean;
  formula?: FormulaToken[];

  enableRowCount?: boolean;
  rowCountLabel?: string;
  rowCountAmount?: string;

  splitTotalLabel?: string;
  splitItemLabel?: string;
  splitAmountLabel?: string;
  
  validation?: NumberValidation;
}

// ── Meta Data (Summary Section) ─────────────────────────────
export interface MetaDataEntry {
  id: string;
  label: string;
  fieldId: string;
  value?: unknown;
  formula?: FormulaToken[];
  
  // Legacy support
  enableCalc?: boolean;
  
  // New properties
  enableFormulaCalc?: boolean;      // For Formula Mode
  enableColumnAggregation?: boolean; // For Column Aggregation Mode
  aggregationColumn?: string;        // FieldId of column to aggregate
  aggregationOp?: ColCalcOp;         // sum, avg, min, max
}

export interface TableNode {
  id: string;
  label: string;
  fieldId: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  children?: TableNode[];
  metaData?: MetaDataEntry[];
}