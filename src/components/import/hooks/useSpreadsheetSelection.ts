/**
 * Spreadsheet Selection Hook
 * Manages cell selection, label assignments, and editing state
 */

import { useState, useCallback, useMemo } from 'react';
import {
  CellAddress,
  CellMapping,
  AvailableLabel,
  SpreadsheetState,
  ImportEntityType,
} from '../../../types/smartImport';

// Generate unique ID for mappings
const generateId = () => Math.random().toString(36).substring(2, 9);

// Convert row/col to cell address string
export const toCellAddress = (row: number, col: number): CellAddress => `${row}:${col}`;

// Parse cell address to row/col
export const parseCellAddress = (address: CellAddress): { row: number; col: number } => {
  const [row, col] = address.split(':').map(Number);
  return { row, col };
};

// Convert column index to Excel-style letter (0=A, 1=B, ..., 26=AA)
export const colToLetter = (col: number): string => {
  let result = '';
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
};

interface UseSpreadsheetSelectionProps {
  initialData: unknown[][];
  sheetName: string;
  entityType: ImportEntityType;
}

interface UseSpreadsheetSelectionReturn {
  // State
  selectedCells: Set<CellAddress>;
  mappings: CellMapping[];
  editingCell: CellAddress | null;
  data: unknown[][];

  // Selection actions
  selectCell: (row: number, col: number, mode: 'single' | 'add' | 'range') => void;
  selectRange: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  selectColumn: (col: number) => void;
  selectRow: (row: number) => void;
  clearSelection: () => void;
  isSelected: (row: number, col: number) => boolean;

  // Mapping actions
  assignLabel: (label: AvailableLabel) => void;
  removeMapping: (mappingId: string) => void;
  getMappingForCell: (row: number, col: number) => CellMapping | undefined;

  // Editing actions
  startEditing: (row: number, col: number) => void;
  stopEditing: () => void;
  updateCellValue: (row: number, col: number, value: unknown) => void;

  // Selection info
  selectionBounds: { minRow: number; maxRow: number; minCol: number; maxCol: number } | null;
  selectionCount: number;
}

export function useSpreadsheetSelection({
  initialData,
  sheetName,
  entityType,
}: UseSpreadsheetSelectionProps): UseSpreadsheetSelectionReturn {
  const [data, setData] = useState<unknown[][]>(initialData);
  const [selectedCells, setSelectedCells] = useState<Set<CellAddress>>(new Set());
  const [mappings, setMappings] = useState<CellMapping[]>([]);
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [rangeStart, setRangeStart] = useState<{ row: number; col: number } | null>(null);

  // Calculate selection bounds
  const selectionBounds = useMemo(() => {
    if (selectedCells.size === 0) return null;

    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    selectedCells.forEach((address) => {
      const { row, col } = parseCellAddress(address);
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    });

    return { minRow, maxRow, minCol, maxCol };
  }, [selectedCells]);

  const selectionCount = selectedCells.size;

  // Check if a cell is selected
  const isSelected = useCallback(
    (row: number, col: number): boolean => {
      return selectedCells.has(toCellAddress(row, col));
    },
    [selectedCells]
  );

  // Select a single cell (with mode: single, add to selection, or range)
  const selectCell = useCallback(
    (row: number, col: number, mode: 'single' | 'add' | 'range') => {
      const address = toCellAddress(row, col);

      if (mode === 'single') {
        // Single click - replace selection
        setSelectedCells(new Set([address]));
        setRangeStart({ row, col });
      } else if (mode === 'add') {
        // Ctrl/Cmd+Click - toggle cell in selection
        setSelectedCells((prev) => {
          const next = new Set(prev);
          if (next.has(address)) {
            next.delete(address);
          } else {
            next.add(address);
          }
          return next;
        });
        setRangeStart({ row, col });
      } else if (mode === 'range' && rangeStart) {
        // Shift+Click - select range from rangeStart to current
        const minRow = Math.min(rangeStart.row, row);
        const maxRow = Math.max(rangeStart.row, row);
        const minCol = Math.min(rangeStart.col, col);
        const maxCol = Math.max(rangeStart.col, col);

        const newSelection = new Set<CellAddress>();
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newSelection.add(toCellAddress(r, c));
          }
        }
        setSelectedCells(newSelection);
      }
    },
    [rangeStart]
  );

  // Select a rectangular range
  const selectRange = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      const newSelection = new Set<CellAddress>();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelection.add(toCellAddress(r, c));
        }
      }
      setSelectedCells(newSelection);
      setRangeStart({ row: startRow, col: startCol });
    },
    []
  );

  // Select entire column
  const selectColumn = useCallback(
    (col: number) => {
      const newSelection = new Set<CellAddress>();
      for (let r = 0; r < data.length; r++) {
        newSelection.add(toCellAddress(r, col));
      }
      setSelectedCells(newSelection);
    },
    [data.length]
  );

  // Select entire row
  const selectRow = useCallback(
    (row: number) => {
      if (!data[row]) return;
      const newSelection = new Set<CellAddress>();
      for (let c = 0; c < data[row].length; c++) {
        newSelection.add(toCellAddress(row, c));
      }
      setSelectedCells(newSelection);
    },
    [data]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setRangeStart(null);
  }, []);

  // Assign a label to currently selected cells
  const assignLabel = useCallback(
    (label: AvailableLabel) => {
      if (selectedCells.size === 0) return;

      const cells = Array.from(selectedCells);

      // Check if selection is a single column
      const cols = new Set(cells.map((c) => parseCellAddress(c).col));
      const columnIndex = cols.size === 1 ? Array.from(cols)[0] : undefined;

      // Remove any existing mappings for these cells
      setMappings((prev) => {
        // Filter out mappings that overlap with new selection
        const filtered = prev.filter((m) => {
          const overlap = m.cells.some((c) => selectedCells.has(c));
          return !overlap;
        });

        // Add new mapping
        return [
          ...filtered,
          {
            id: generateId(),
            cells,
            label,
            columnIndex,
          },
        ];
      });

      // Clear selection after assignment
      clearSelection();
    },
    [selectedCells, clearSelection]
  );

  // Remove a mapping
  const removeMapping = useCallback((mappingId: string) => {
    setMappings((prev) => prev.filter((m) => m.id !== mappingId));
  }, []);

  // Get mapping for a specific cell
  const getMappingForCell = useCallback(
    (row: number, col: number): CellMapping | undefined => {
      const address = toCellAddress(row, col);
      return mappings.find((m) => m.cells.includes(address));
    },
    [mappings]
  );

  // Start editing a cell
  const startEditing = useCallback((row: number, col: number) => {
    setEditingCell(toCellAddress(row, col));
  }, []);

  // Stop editing
  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Update cell value
  const updateCellValue = useCallback(
    (row: number, col: number, value: unknown) => {
      setData((prev) => {
        const newData = prev.map((r) => [...r]);
        if (newData[row]) {
          newData[row][col] = value;
        }
        return newData;
      });
    },
    []
  );

  return {
    // State
    selectedCells,
    mappings,
    editingCell,
    data,

    // Selection actions
    selectCell,
    selectRange,
    selectColumn,
    selectRow,
    clearSelection,
    isSelected,

    // Mapping actions
    assignLabel,
    removeMapping,
    getMappingForCell,

    // Editing actions
    startEditing,
    stopEditing,
    updateCellValue,

    // Selection info
    selectionBounds,
    selectionCount,
  };
}

export default useSpreadsheetSelection;
