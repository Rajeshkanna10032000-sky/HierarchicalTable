import React from 'react';
import type { NumberValidation } from '../types';
import styles from './NumberValidationPanel.module.css';

interface Props {
  validation: NumberValidation | undefined;
  onChange: (validation: NumberValidation | undefined) => void;
  columnLabel: string;
}

const NumberValidationPanel: React.FC<Props> = ({ validation, onChange, columnLabel }) => {
  const [showPanel, setShowPanel] = React.useState(!!validation);

  const handleEnableValidation = (enabled: boolean) => {
    setShowPanel(enabled);
    if (!enabled) {
      onChange(undefined);
    } else {
      onChange({
        min: undefined,
        max: undefined,
        minInclusive: true,
        maxInclusive: true,
        allowNegative: true,
        allowDecimal: true,
        decimalPlaces: undefined,
      });
    }
  };

  const updateValidation = (updates: Partial<NumberValidation>) => {
    onChange({ ...validation, ...updates });
  };

  if (!showPanel) {
    return (
      <div className={styles.validationToggle}>
        <button
          className={styles.enableBtn}
          onClick={() => handleEnableValidation(true)}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Add Validation
        </button>
      </div>
    );
  }

  return (
    <div className={styles.validationPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Validation Rules
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
        {/* Range validation */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Range Validation</label>
          <div className={styles.rangeRow}>
            <div className={styles.inputGroup}>
              <label>Min Value</label>
              <input
                type="number"
                className={styles.input}
                value={validation?.min ?? ''}
                onChange={(e) => updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="No minimum"
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={validation?.minInclusive ?? true}
                  onChange={(e) => updateValidation({ minInclusive: e.target.checked })}
                />
                Inclusive (≥)
              </label>
            </div>
            <div className={styles.inputGroup}>
              <label>Max Value</label>
              <input
                type="number"
                className={styles.input}
                value={validation?.max ?? ''}
                onChange={(e) => updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="No maximum"
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={validation?.maxInclusive ?? true}
                  onChange={(e) => updateValidation({ maxInclusive: e.target.checked })}
                />
                Inclusive (≤)
              </label>
            </div>
          </div>
        </div>

        {/* Advanced options */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Advanced Options</label>
          <div className={styles.optionsRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={validation?.allowNegative ?? true}
                onChange={(e) => updateValidation({ allowNegative: e.target.checked })}
              />
              Allow Negative Numbers
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={validation?.allowDecimal ?? true}
                onChange={(e) => updateValidation({ allowDecimal: e.target.checked })}
              />
              Allow Decimals
            </label>
          </div>
          {validation?.allowDecimal && (
            <div className={styles.inputGroup}>
              <label>Decimal Places (0 = whole numbers only)</label>
              <input
                type="number"
                min="0"
                max="10"
                className={styles.input}
                value={validation?.decimalPlaces ?? ''}
                onChange={(e) => updateValidation({ decimalPlaces: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="No restriction"
              />
            </div>
          )}
        </div>

        {/* Custom error message */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Custom Error Message (Optional)</label>
          <input
            type="text"
            className={styles.input}
            value={validation?.customErrorMsg ?? ''}
            onChange={(e) => updateValidation({ customErrorMsg: e.target.value })}
            placeholder={`e.g., "${columnLabel}" must be between 1 and 100`}
          />
        </div>

        {/* Preview of rules */}
        <div className={styles.previewSection}>
          <div className={styles.previewTitle}>Active Rules:</div>
          <ul className={styles.rulesList}>
            {validation?.min !== undefined && (
              <li>✓ Value must be {validation.minInclusive ? '≥' : '>'} {validation.min}</li>
            )}
            {validation?.max !== undefined && (
              <li>✓ Value must be {validation.maxInclusive ? '≤' : '<'} {validation.max}</li>
            )}
            {validation?.allowNegative === false && (
              <li>✓ Only positive numbers allowed</li>
            )}
            {validation?.allowDecimal === false && (
              <li>✓ Whole numbers only (no decimals)</li>
            )}
            {validation?.decimalPlaces !== undefined && (
              <li>✓ Maximum {validation.decimalPlaces} decimal place{validation.decimalPlaces !== 1 ? 's' : ''}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NumberValidationPanel;