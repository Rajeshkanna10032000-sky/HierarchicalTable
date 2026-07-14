import type { ColumnDef, TableNode } from '../types';

export const generateId = (prefix = 'id'): string =>
  `${prefix}-${Math.floor(Math.random() * 90000000 + 10000000)}`;

export const createColumn = (): ColumnDef => ({
  id: generateId('col'),
  fieldId: `column_${Math.floor(Math.random() * 100)}`,
  label: 'New Column',
  type: 'text',
  required: false,
  readOnly: false,
  hideColumn: false,
  codeBlock: false,
  placeholder: ''
});

export const createTable = (label = 'Data Table'): TableNode => ({
  id: generateId('table'),
  label,
  fieldId: generateId('table'),
  placeholder: '',
  helpText: '',
  required: false,
  columns: [createColumn()],
  rows: [],
  children: [],
});

export const updateNodeById = (
  nodes: TableNode[],
  targetId: string,
  updater: (node: TableNode) => TableNode
): TableNode[] =>
  nodes.map((node) => {
    if (node.id === targetId) return updater(node);
    if (node.children?.length) {
      return { ...node, children: updateNodeById(node.children, targetId, updater) };
    }
    return node;
  });

export const deleteNodeById = (nodes: TableNode[], targetId: string): TableNode[] =>
  nodes
    .filter((n) => n.id !== targetId)
    .map((n) => ({
      ...n,
      children: n.children ? deleteNodeById(n.children, targetId) : [],
    }));

export const addChildToNode = (
  nodes: TableNode[],
  parentId: string,
  child: TableNode
): TableNode[] =>
  nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), child] };
    }
    if (node.children?.length) {
      return { ...node, children: addChildToNode(node.children, parentId, child) };
    }
    return node;
  });