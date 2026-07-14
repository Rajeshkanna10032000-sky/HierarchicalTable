import React from 'react';
import type { CrossColumnValidation, ColumnDef, ValidationOperator } from '../types';
import styles from './CrossColumnValidationPanel.module.css';

interface Props {
  validation: CrossColumnValidation | undefined;
  allColumns: ColumnDef[];
  currentColumnId: string;
  onChange: (validation: CrossColumnValidation | undefined) => void;
}

const VALIDATION_OPERATORS: { value: ValidationOperator; label: string; symbol: string }[] = [
  { value: 'eq', label: 'Equal to', symbol: '=' },
  { value: 'neq', label: 'Not equal to', symbol: '≠' },
  { value: 'gt', label: 'Greater than', symbol: '>' },
  { value: 'gte', label: 'Greater than or equal', symbol: '≥' },
  { value: 'lt', label: 'Less than', symbol: '<' },
  { value: 'lte', label: 'Less than or equal', symbol: '≤' },
  { value: 'between', label: 'Between', symbol: 'between' },
];

const CrossColumnValidationPanel: React.FC<Props> = ({
  validation,
  allColumns,
  currentColumnId,
  onChange,
}) => {
  const [showPanel, setShowPanel] = React.useState(!!validation);

  // Get available columns (exclude current column and non-number columns)
  const availableColumns = allColumns.filter(
    (col) => col.id !== currentColumnId && col.type === 'number'
  );

  const handleEnableValidation = (enabled: boolean) => {
    setShowPanel(enabled);
    if (!enabled) {
      onChange(undefined);
    } else {
      // Create a complete validation object with required fields
      const newValidation: CrossColumnValidation = {
        targetFieldId: availableColumns[0]?.fieldId || '',
        operator: 'eq',
        errorMessage: '',
      };
      onChange(newValidation);
    }
  };

  const updateValidation = (updates: Partial<CrossColumnValidation>) => {
    if (!validation) return;
    // Ensure targetFieldId and operator are always present
    const updatedValidation: CrossColumnValidation = {
      targetFieldId: updates.targetFieldId ?? validation.targetFieldId,
      operator: updates.operator ?? validation.operator,
      value: updates.value !== undefined ? updates.value : validation.value,
      errorMessage: updates.errorMessage !== undefined ? updates.errorMessage : validation.errorMessage,
      dependentFields: updates.dependentFields !== undefined ? updates.dependentFields : validation.dependentFields,
    };
    onChange(updatedValidation);
  };

  if (!showPanel) {
    return (
      <div className={styles.validationToggle}>
        <button
          className={styles.enableBtn}
          onClick={() => handleEnableValidation(true)}
          disabled={availableColumns.length === 0}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12L7 2M22 12L17 2M2 12H22M12 2V22" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          Cross-Column Validation
          {/* {availableColumns.length === 0 && (
            <span className={styles.disabledHint}>(Need another number column)</span>
          )} */}
        </button>
      </div>
    );
  }

  const getOperatorSymbol = (op: ValidationOperator) => {
    return VALIDATION_OPERATORS.find(o => o.value === op)?.symbol || op;
  };

  const getPreviewText = () => {
    if (!validation) return '';
    const targetCol = allColumns.find(c => c.fieldId === validation.targetFieldId);
    const targetLabel = targetCol?.label || validation.targetFieldId;
    
    if (validation.operator === 'between' && validation.value) {
      return `${targetLabel} ${getOperatorSymbol(validation.operator)} ${validation.value}`;
    }
    return `${targetLabel} ${getOperatorSymbol(validation.operator)} ${validation.value || '?'}`;
  };

  return (
    <div className={styles.validationPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12L7 2M22 12L17 2M2 12H22M12 2V22" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          Cross-Column Validation
        </span>
        <button
          className={styles.closeBtn}
          onClick={() => handleEnableValidation(false)}
          title="Remove validation"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className={styles.validationContent}>
        {/* Target Column Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Compare with column:</label>
          <select
            className={styles.select}
            value={validation?.targetFieldId || ''}
            onChange={(e) => updateValidation({ targetFieldId: e.target.value })}
          >
            <option value="" disabled>Select column...</option>
            {availableColumns.map((col) => (
              <option key={col.id} value={col.fieldId}>
                {col.label} ({col.fieldId})
              </option>
            ))}
          </select>
        </div>

        {/* Operator Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Condition:</label>
          <div className={styles.operatorGrid}>
            {VALIDATION_OPERATORS.map((op) => (
              <button
                key={op.value}
                className={`${styles.operatorBtn} ${
                  validation?.operator === op.value ? styles.operatorBtnActive : ''
                }`}
                onClick={() => updateValidation({ operator: op.value })}
              >
                <span className={styles.operatorSymbol}>{op.symbol}</span>
                <span className={styles.operatorLabel}>{op.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Value Input (for operators that need a value) */}
        {validation?.operator !== 'between' && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Compare value:</label>
            <input
              type="number"
              className={styles.input}
              value={validation?.value ?? ''}
              onChange={(e) => updateValidation({ value: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Enter value to compare"
            />
          </div>
        )}

        {/* Custom Error Message */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Custom Error Message (Optional):</label>
          <input
            type="text"
            className={styles.input}
            value={validation?.errorMessage ?? ''}
            onChange={(e) => updateValidation({ errorMessage: e.target.value })}
            placeholder={`e.g., "Value must be ${getPreviewText()}"`}
          />
        </div>

        {/* Preview */}
        {validation?.targetFieldId && validation.targetFieldId !== '' && (
          <div className={styles.previewSection}>
            <div className={styles.previewTitle}>Validation Rule:</div>
            <div className={styles.previewRule}>
              <code className={styles.previewCode}>
                This value must be {getPreviewText()}
              </code>
            </div>
          </div>
        )}

        {/* Example */}
        <div className={styles.exampleSection}>
          <div className={styles.exampleTitle}>Example:</div>
          <div className={styles.exampleText}>
            If you set condition: <strong>Age {'>'} 18</strong>, then any age value entered must be greater than 18.
            <br />
            If condition fails, user will see an error message.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossColumnValidationPanel;