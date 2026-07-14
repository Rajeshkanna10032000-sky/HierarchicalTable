import { useState } from "react";
import React from "react";
import type { ColumnDef } from "../types";
import styles from "./PreviewCell.module.css";
import {
  validateNumber,
  formatNumberWithValidation,
  getValidationSummary,
} from "../utils/validationUtils";

interface Props {
  col: ColumnDef;
  value: unknown;
  onChange: (value: unknown) => void;
  allRowValues?: Record<string, unknown>;
  getColumnLabel?: (fieldId: string) => string;
}

const PreviewCell: React.FC<Props> = ({ 
  col, 
  value, 
  onChange, 
  allRowValues = {},
  getColumnLabel 
}) => {
  const disabled = col.readOnly;
  const [error, setError] = useState<string | undefined>();
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [localValue, setLocalValue] = useState<string>(() => {
    if (col.type === "number") {
      return value !== undefined && value !== null && value !== ""
        ? String(value)
        : "";
    }
    return String(value ?? "");
  });

  const base = styles.cell;
  const hasValidation = col.type === "number" && col.validation;
  const validationRules = hasValidation ? getValidationSummary(col.validation, col.label) : [];

  const handleNumberChange = (inputValue: string) => {
    setLocalValue(inputValue);

    if (inputValue === "") {
      setError(undefined);
      onChange("");
      return;
    }

    const numValue = Number(inputValue);

    if (isNaN(numValue)) {
      setError(`Please enter a valid number for "${col.label}"`);
      return;
    }

    if (col.validation) {
      const result = validateNumber(
        numValue,
        col.validation,
        col.label,
        allRowValues,
        getColumnLabel
      );
      if (!result.isValid) {
        setError(result.errorMessage);
        return;
      }

      const formattedValue = formatNumberWithValidation(
        numValue,
        col.validation
      );
      setError(undefined);
      onChange(formattedValue);
    } else {
      setError(undefined);
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    if (col.type === "number" && localValue !== "") {
      const numValue = Number(localValue);
      if (!isNaN(numValue) && col.validation) {
        const formattedValue = formatNumberWithValidation(
          numValue,
          col.validation
        );
        setLocalValue(String(formattedValue));
      }
    }
    setTimeout(() => setShowValidationHint(false), 200);
  };

  const handleFocus = () => {
    if (hasValidation && validationRules.length > 0) {
      setShowValidationHint(true);
    }
  };

  const renderNumberCell = () => (
    <td className={styles.td}>
      <div className={styles.numberCellWrapper}>
        <input
          type="number"
          className={`${base} ${error ? styles.inputError : ""} ${hasValidation ? styles.hasValidation : ""}`}
          value={localValue}
          disabled={disabled}
          placeholder={col.placeholder || `Enter ${col.label.toLowerCase()}...`}
          onChange={(e) => handleNumberChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          step={col.validation?.decimalPlaces === 0 ? "1" : "any"}
        />
        
        {/* Validation Rules Tooltip */}
        {/* {showValidationHint && hasValidation && validationRules.length > 0 && !error && (
          <div className={styles.validationTooltip}>
            <div className={styles.validationTooltipTitle}>Validation Rules:</div>
            <ul className={styles.validationRulesList}>
              {validationRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        )} */}
        
        {/* Error Tooltip */}
        {error && (
          <div className={styles.errorTooltip}>
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        
        {/* Success Indicator */}
        {!error && localValue !== "" && hasValidation && (
          <div className={styles.successIndicator}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="#28a745"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        
        {/* Required Indicator */}
        {hasValidation && localValue === "" && (
          <div className={styles.requiredIndicator}>
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="#ffc107"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )}
      </div>
    </td>
  );

  switch (col.type) {
    case "checkbox":
      return (
        <td className={`${styles.td} ${styles.centerTd}`}>
          <input
            type="checkbox"
            className={styles.check}
            checked={!!value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
        </td>
      );

    case "dropdown":
      return (
        <td className={styles.td}>
          <select
            className={`${base} ${styles.select}`}
            value={String(value ?? "")}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">— select —</option>
            {(col.dropdownOptions ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </td>
      );

    case "date":
      return (
        <td className={styles.td}>
          <input
            type="date"
            className={`${base} ${styles.dateInput}`}
            value={String(value ?? "")}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </td>
      );

    case "number":
      return renderNumberCell();

    case "email":
      return (
        <td className={styles.td}>
          <input
            type="email"
            className={base}
            value={String(value ?? "")}
            disabled={disabled}
            placeholder="email@example.com"
            onChange={(e) => onChange(e.target.value)}
          />
        </td>
      );

    case "url":
      return (
        <td className={styles.td}>
          <input
            type="url"
            className={base}
            value={String(value ?? "")}
            disabled={disabled}
            placeholder="https://"
            onChange={(e) => onChange(e.target.value)}
          />
        </td>
      );

    case "textarea":
      return (
        <td className={styles.td}>
          <textarea
            className={`${base} ${styles.textarea}`}
            value={String(value ?? "")}
            disabled={disabled}
            placeholder="Enter text…"
            rows={2}
            onChange={(e) => onChange(e.target.value)}
          />
        </td>
      );

    default: // text
      return (
        <td className={styles.td}>
          <input
            type="text"
            className={base}
            value={String(value ?? "")}
            disabled={disabled}
            placeholder={`Enter ${col.label.toLowerCase()}…`}
            onChange={(e) => onChange(e.target.value)}
          />
        </td>
      );
  }
};

export default PreviewCell;