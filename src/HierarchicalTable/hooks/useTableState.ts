import { useState, useCallback } from 'react';
import type { TableNode, ColumnDef } from '../types';
import {
  createTable,
  createColumn,
  updateNodeById,
  deleteNodeById,
  addChildToNode,
} from '../utils/tableUtils';

export const useTableState = (initial?: TableNode[]) => {
  const [tables, setTables] = useState<TableNode[]>(initial ?? [createTable()]);

  // ── Table-level ops ────────────────────────────────────────────────────────
  const updateTable = useCallback(
    (id: string, patch: Partial<TableNode>) =>
      setTables((prev) =>
        updateNodeById(prev, id, (node) => ({ ...node, ...patch }))
      ),
    []
  );

  const deleteTable = useCallback(
    (id: string) => setTables((prev) => deleteNodeById(prev, id)),
    []
  );

  const addChildTable = useCallback((parentId: string) => {
    const child = createTable('Nested Table');
    setTables((prev) => addChildToNode(prev, parentId, child));
  }, []);

  const addRootTable = useCallback(() => {
    setTables((prev) => [...prev, createTable()]);
  }, []);

  // ── Column ops ─────────────────────────────────────────────────────────────
  const addColumn = useCallback(
    (tableId: string) =>
      setTables((prev) =>
        updateNodeById(prev, tableId, (node) => ({
          ...node,
          columns: [...node.columns, createColumn()],
        }))
      ),
    []
  );

  const updateColumn = useCallback(
    (tableId: string, colId: string, patch: Partial<ColumnDef>) =>
      setTables((prev) =>
        updateNodeById(prev, tableId, (node) => ({
          ...node,
          columns: node.columns.map((c) =>
            c.id === colId ? { ...c, ...patch } : c
          ),
        }))
      ),
    []
  );

  const deleteColumn = useCallback(
    (tableId: string, colId: string) =>
      setTables((prev) =>
        updateNodeById(prev, tableId, (node) => ({
          ...node,
          columns: node.columns.filter((c) => c.id !== colId),
        }))
      ),
    []
  );

  return {
    tables,
    updateTable,
    deleteTable,
    addChildTable,
    addRootTable,
    addColumn,
    updateColumn,
    deleteColumn,
  };
};  