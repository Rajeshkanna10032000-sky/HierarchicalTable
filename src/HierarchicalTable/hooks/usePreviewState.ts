import { useState, useCallback } from 'react';
import type { TableNode } from '../types';

export type RowMap = Record<string, Record<string, unknown>[]>;

export interface PreviewActions {
  rowMap: RowMap;
  getRows: (instanceKey: string) => Record<string, unknown>[];
  addRow: (instanceKey: string, node?: TableNode) => void;     // ← Changed to accept 2 params
  deleteRow: (instanceKey: string, rowIdx: number) => void;
  updateCell: (instanceKey: string, rowIdx: number, fieldId: string, value: unknown) => void;
  toggleExpanded: (instanceKey: string, rowIdx: number) => void;
  isExpanded: (instanceKey: string, rowIdx: number) => boolean;
  resetPreview: () => void;
}

const buildEmptyRow = (node: TableNode): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  node.columns.forEach((col) => {
    if (col.hideColumn) return;
    row[col.fieldId] = col.type === 'checkbox' ? false : '';
  });
  return row;
};

export const usePreviewState = (): PreviewActions => {
  const [rowMap, setRowMap] = useState<RowMap>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const getRows = useCallback((instanceKey: string): Record<string, unknown>[] => {
    return rowMap[instanceKey] ?? [];
  }, [rowMap]);

  const addRow = useCallback((instanceKey: string, node?: TableNode) => {
    setRowMap((prev) => ({
      ...prev,
      [instanceKey]: [
        ...(prev[instanceKey] ?? []),
        node ? buildEmptyRow(node) : {}
      ]
    }));
  }, []);

  const deleteRow = useCallback((instanceKey: string, rowIdx: number) => {
    setRowMap((prev) => ({
      ...prev,
      [instanceKey]: (prev[instanceKey] ?? []).filter((_, i) => i !== rowIdx),
    }));

    setExpandedMap((prev) => {
      const newMap = { ...prev };
      delete newMap[`${instanceKey}:r${rowIdx}`];
      return newMap;
    });
  }, []);

  const updateCell = useCallback((
    instanceKey: string,
    rowIdx: number,
    fieldId: string,
    value: unknown
  ) => {
    setRowMap((prev) => {
      const rows = [...(prev[instanceKey] ?? [])];
      if (rows[rowIdx]) {
        rows[rowIdx] = { ...rows[rowIdx], [fieldId]: value };
      }
      return { ...prev, [instanceKey]: rows };
    });
  }, []);

  const toggleExpanded = useCallback((instanceKey: string, rowIdx: number) => {
    const expandedKey = `${instanceKey}:r${rowIdx}`;
    setExpandedMap((prev) => ({
      ...prev,
      [expandedKey]: !prev[expandedKey]
    }));
  }, []);

  const isExpanded = useCallback((instanceKey: string, rowIdx: number): boolean => {
    return !!expandedMap[`${instanceKey}:r${rowIdx}`];
  }, [expandedMap]);

  const resetPreview = useCallback(() => {
    setRowMap({});
    setExpandedMap({});
  }, []);

  return {
    rowMap,
    getRows,
    addRow,
    deleteRow,
    updateCell,
    toggleExpanded,
    isExpanded,
    resetPreview,
  };
};