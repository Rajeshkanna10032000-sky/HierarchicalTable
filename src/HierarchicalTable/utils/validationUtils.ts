import type { NumberValidation, ValidationOperator, CrossColumnValidation } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

// Helper function to get operator text for error messages
const getOperatorText = (operator: ValidationOperator): string => {
  switch (operator) {
    case 'eq': return 'equal to';
    case 'neq': return 'not equal to';
    case 'gt': return 'greater than';
    case 'gte': return 'greater than or equal to';
    case 'lt': return 'less than';
    case 'lte': return 'less than or equal to';
    case 'between': return 'between';
    default: return '';
  }
};

// Get operator symbol for display
export const getOperatorSymbol = (operator: ValidationOperator): string => {
  switch (operator) {
    case 'eq': return '=';
    case 'neq': return '≠';
    case 'gt': return '>';
    case 'gte': return '≥';
    case 'lt': return '<';
    case 'lte': return '≤';
    case 'between': return 'between';
    default: return '';
  }
};

// Evaluate cross-column validation
export const evaluateCrossColumnValidation = (
  currentValue: number,
  targetValue: unknown,
  operator: ValidationOperator,
  compareValue?: number
): boolean => {
  const targetNum = typeof targetValue === 'number' ? targetValue : Number(targetValue);
  
  if (isNaN(targetNum)) return true; // Skip validation if target is invalid
  
  switch (operator) {
    case 'eq':
      return currentValue === targetNum;
    case 'neq':
      return currentValue !== targetNum;
    case 'gt':
      return currentValue > targetNum;
    case 'gte':
      return currentValue >= targetNum;
    case 'lt':
      return currentValue < targetNum;
    case 'lte':
      return currentValue <= targetNum;
    case 'between':
      return compareValue !== undefined && 
             currentValue >= targetNum && 
             currentValue <= compareValue;
    default:
      return true;
  }
};

// Validate a single number against all validation rules
export const validateNumber = (
  value: unknown,
  validation: NumberValidation | undefined,
  columnLabel: string,
  allRowValues?: Record<string, unknown>,
  getColumnLabel?: (fieldId: string) => string
): ValidationResult => {
  if (!validation) {
    return { isValid: true };
  }

  // Convert to number
  const num = typeof value === 'number' ? value : Number(value);
  
  // Check if it's a valid number
  if (isNaN(num)) {
    return {
      isValid: false,
      errorMessage: validation.customErrorMsg || `"${columnLabel}" must be a valid number`
    };
  }

  // Check if value is empty/undefined and required
  if (value === '' || value === undefined || value === null) {
    // Skip validation if not required
    return { isValid: true };
  }

  // Check negative numbers
  if (validation.allowNegative === false && num < 0) {
    return {
      isValid: false,
      errorMessage: validation.customErrorMsg || `"${columnLabel}" cannot be negative. Please enter a positive number.`
    };
  }

  // Check decimals
  if (validation.allowDecimal === false && !Number.isInteger(num)) {
    return {
      isValid: false,
      errorMessage: validation.customErrorMsg || `"${columnLabel}" must be a whole number (no decimals).`
    };
  }

  // Check decimal places
  if (validation.decimalPlaces !== undefined && !Number.isInteger(num)) {
    const decimalStr = num.toString().split('.')[1];
    if (decimalStr && decimalStr.length > validation.decimalPlaces) {
      return {
        isValid: false,
        errorMessage: validation.customErrorMsg || `"${columnLabel}" can have at most ${validation.decimalPlaces} decimal place${validation.decimalPlaces !== 1 ? 's' : ''}.`
      };
    }
  }

  // Check min value
  if (validation.min !== undefined) {
    const isValid = validation.minInclusive ? num >= validation.min : num > validation.min;
    if (!isValid) {
      const operator = validation.minInclusive ? '≥' : '>';
      const defaultMsg = validation.minInclusive 
        ? `"${columnLabel}" must be greater than or equal to ${validation.min}.`
        : `"${columnLabel}" must be greater than ${validation.min}.`;
      return {
        isValid: false,
        errorMessage: validation.customErrorMsg || defaultMsg
      };
    }
  }

  // Check max value
  if (validation.max !== undefined) {
    const isValid = validation.maxInclusive ? num <= validation.max : num < validation.max;
    if (!isValid) {
      const operator = validation.maxInclusive ? '≤' : '<';
      const defaultMsg = validation.maxInclusive 
        ? `"${columnLabel}" must be less than or equal to ${validation.max}.`
        : `"${columnLabel}" must be less than ${validation.max}.`;
      return {
        isValid: false,
        errorMessage: validation.customErrorMsg || defaultMsg
      };
    }
  }

  // Cross-column validation
  if (validation.crossColumnValidation && allRowValues) {
    const { targetFieldId, operator, value: compareValue, errorMessage } = validation.crossColumnValidation;
    
    // Skip if targetFieldId is not specified
    if (!targetFieldId) {
      return { isValid: true };
    }
    
    const targetValue = allRowValues[targetFieldId];
    
    // Skip validation if target value is undefined or empty
    if (targetValue === undefined || targetValue === '' || targetValue === null) {
      return { isValid: true };
    }
    
    const isValid = evaluateCrossColumnValidation(num, targetValue, operator, compareValue);
    
    if (!isValid) {
      // Get target column label for better error message
      let targetLabel = targetFieldId;
      if (getColumnLabel) {
        targetLabel = getColumnLabel(targetFieldId) || targetFieldId;
      }
      
      let defaultMsg = '';
      if (operator === 'between' && compareValue !== undefined) {
        defaultMsg = `"${columnLabel}" must be between ${targetValue} and ${compareValue}.`;
      } else {
        const operatorText = getOperatorText(operator);
        defaultMsg = `"${columnLabel}" must be ${operatorText} ${targetLabel} (current value: ${targetValue}).`;
      }
      
      return {
        isValid: false,
        errorMessage: errorMessage || defaultMsg
      };
    }
  }

  return { isValid: true };
};

// Format number according to validation rules
export const formatNumberWithValidation = (
  value: unknown,
  validation: NumberValidation | undefined
): number => {
  let num = typeof value === 'number' ? value : Number(value);
  
  if (isNaN(num)) return 0;
  
  // Apply decimal places restriction
  if (validation?.decimalPlaces !== undefined) {
    num = parseFloat(num.toFixed(validation.decimalPlaces));
  }
  
  // Apply min/max clamping
  if (validation?.min !== undefined) {
    if (validation.minInclusive && num < validation.min) {
      num = validation.min;
    } else if (!validation.minInclusive && num <= validation.min) {
      num = validation.min + 0.01;
    }
  }
  
  if (validation?.max !== undefined) {
    if (validation.maxInclusive && num > validation.max) {
      num = validation.max;
    } else if (!validation.maxInclusive && num >= validation.max) {
      num = validation.max - 0.01;
    }
  }
  
  // Apply negative number restriction
  if (validation?.allowNegative === false && num < 0) {
    num = 0;
  }
  
  // Ensure decimal places after clamping
  if (validation?.decimalPlaces !== undefined) {
    num = parseFloat(num.toFixed(validation.decimalPlaces));
  }
  
  return num;
};

// Validate multiple numbers in a row (for cross-column validation across multiple fields)
export const validateRow = (
  row: Record<string, unknown>,
  validations: Map<string, NumberValidation>,
  getColumnLabel: (fieldId: string) => string
): Map<string, string> => {
  const errors = new Map<string, string>();
  
  for (const [fieldId, validation] of validations.entries()) {
    const value = row[fieldId];
    const columnLabel = getColumnLabel(fieldId);
    
    const result = validateNumber(value, validation, columnLabel, row, getColumnLabel);
    
    if (!result.isValid && result.errorMessage) {
      errors.set(fieldId, result.errorMessage);
    }
  }
  
  return errors;
};

// Check if a value is within allowed range
export const isWithinRange = (
  value: number,
  validation: NumberValidation | undefined
): boolean => {
  if (!validation) return true;
  
  if (validation.min !== undefined) {
    if (validation.minInclusive && value < validation.min) return false;
    if (!validation.minInclusive && value <= validation.min) return false;
  }
  
  if (validation.max !== undefined) {
    if (validation.maxInclusive && value > validation.max) return false;
    if (!validation.maxInclusive && value >= validation.max) return false;
  }
  
  return true;
};

// Get validation summary for a column
export const getValidationSummary = (
  validation: NumberValidation | undefined,
  columnLabel: string
): string[] => {
  const rules: string[] = [];
  
  if (!validation) return rules;
  
  if (validation.min !== undefined) {
    const operator = validation.minInclusive ? '≥' : '>';
    rules.push(`${operator} ${validation.min}`);
  }
  
  if (validation.max !== undefined) {
    const operator = validation.maxInclusive ? '≤' : '<';
    rules.push(`${operator} ${validation.max}`);
  }
  
  if (validation.allowNegative === false) {
    rules.push('Positive numbers only');
  }
  
  if (validation.allowDecimal === false) {
    rules.push('Whole numbers only');
  }
  
  if (validation.decimalPlaces !== undefined) {
    rules.push(`Max ${validation.decimalPlaces} decimal place${validation.decimalPlaces !== 1 ? 's' : ''}`);
  }
  
  if (validation.crossColumnValidation) {
    const { operator, targetFieldId } = validation.crossColumnValidation;
    const operatorText = getOperatorText(operator);
    rules.push(`${operatorText} ${targetFieldId}`);
  }
  
  return rules;
};