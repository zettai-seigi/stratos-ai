/**
 * Spreadsheet Step for Smart Import
 * Excel-like grid view with cell selection and label assignment
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ImportEntityType,
  ENTITY_TYPE_LABELS,
  AvailableLabel,
  CellMapping,
} from '../../../types/smartImport';
import { AppState } from '../../../types';
import { useSpreadsheetSelection, toCellAddress, colToLetter } from '../hooks/useSpreadsheetSelection';
import { LabelSidebar } from './LabelSidebar';
import { X, ChevronDown, GripHorizontal } from 'lucide-react';

interface SpreadsheetStepProps {
  sheetName: string;
  sheetData: unknown[][];
  entityType: ImportEntityType;
  onEntityTypeChange: (entityType: ImportEntityType) => void;
  appState: AppState;
  onMappingsChange: (mappings: CellMapping[]) => void;
}

// Color palette for mapping labels
const LABEL_COLORS = [
  'bg-accent-blue/20 border-accent-blue',
  'bg-accent-purple/20 border-accent-purple',
  'bg-rag-green/20 border-rag-green',
  'bg-rag-amber/20 border-rag-amber',
  'bg-accent-teal/20 border-accent-teal',
  'bg-rag-red/20 border-rag-red',
  'bg-pink-500/20 border-pink-500',
  'bg-cyan-500/20 border-cyan-500',
];

export const SpreadsheetStep: React.FC<SpreadsheetStepProps> = ({
  sheetName,
  sheetData,
  entityType,
  onEntityTypeChange,
  appState,
  onMappingsChange,
}) => {
  const [selectedLabel, setSelectedLabel] = useState<AvailableLabel | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    selectedCells,
    mappings,
    editingCell,
    data,
    selectCell,
    selectRange,
    selectColumn,
    selectRow,
    clearSelection,
    isSelected,
    assignLabel,
    removeMapping,
    getMappingForCell,
    startEditing,
    stopEditing,
    updateCellValue,
    selectionCount,
  } = useSpreadsheetSelection({
    initialData: sheetData,
    sheetName,
    entityType,
  });

  // Notify parent of mapping changes
  useEffect(() => {
    onMappingsChange(mappings);
  }, [mappings, onMappingsChange]);

  // Get mapping color by index
  const getMappingColor = useCallback((mappingId: string): string => {
    const index = mappings.findIndex((m) => m.id === mappingId);
    return LABEL_COLORS[index % LABEL_COLORS.length];
  }, [mappings]);

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number, event: React.MouseEvent) => {
      if (event.shiftKey) {
        selectCell(row, col, 'range');
      } else if (event.metaKey || event.ctrlKey) {
        selectCell(row, col, 'add');
      } else {
        selectCell(row, col, 'single');
      }
    },
    [selectCell]
  );

  // Handle cell double-click for editing
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      startEditing(row, col);
    },
    [startEditing]
  );

  // Handle mouse down for drag selection
  const handleMouseDown = useCallback(
    (row: number, col: number, event: React.MouseEvent) => {
      if (event.button !== 0) return; // Only left click
      setIsDragging(true);
      setDragStart({ row, col });

      if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
        selectCell(row, col, 'single');
      }
    },
    [selectCell]
  );

  // Handle mouse enter during drag
  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (isDragging && dragStart) {
        selectRange(dragStart.row, dragStart.col, row, col);
      }
    },
    [isDragging, dragStart, selectRange]
  );

  // Handle mouse up to end drag
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle keyboard navigation and editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) {
        if (e.key === 'Escape') {
          stopEditing();
        }
        return;
      }

      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, stopEditing, clearSelection]);

  // Handle assign label
  const handleAssign = useCallback(() => {
    if (selectedLabel) {
      assignLabel(selectedLabel);
      setSelectedLabel(null);
    }
  }, [selectedLabel, assignLabel]);

  // Column headers (A, B, C, ...)
  const columnCount = useMemo(() => {
    return Math.max(...data.map((row) => row.length), 0);
  }, [data]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-text-primary">
            {sheetName}
          </h2>

          {/* Entity Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Import as:</span>
            <div className="relative">
              <select
                value={entityType}
                onChange={(e) => onEntityTypeChange(e.target.value as ImportEntityType)}
                className="appearance-none bg-bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          Select cells and assign labels from the sidebar. Click to select, drag to select range, Ctrl/Cmd+click to add to selection.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Spreadsheet Grid */}
        <div className="flex-1 overflow-auto" ref={gridRef}>
          <table className="border-collapse min-w-full">
            {/* Column Headers */}
            <thead className="sticky top-0 z-10">
              <tr>
                {/* Corner cell */}
                <th className="bg-bg-hover border border-border w-12 h-8 text-xs text-text-muted" />
                {/* Column letters */}
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    onClick={() => selectColumn(colIndex)}
                    className="bg-bg-hover border border-border min-w-[100px] h-8 text-xs font-medium text-text-muted cursor-pointer hover:bg-bg-card"
                  >
                    {colToLetter(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {/* Row number */}
                  <td
                    onClick={() => selectRow(rowIndex)}
                    className="bg-bg-hover border border-border w-12 h-8 text-xs text-text-muted text-center font-medium cursor-pointer hover:bg-bg-card sticky left-0 z-5"
                  >
                    {rowIndex + 1}
                  </td>
                  {/* Data cells */}
                  {Array.from({ length: columnCount }).map((_, colIndex) => {
                    const cellValue = row[colIndex];
                    const address = toCellAddress(rowIndex, colIndex);
                    const cellSelected = isSelected(rowIndex, colIndex);
                    const mapping = getMappingForCell(rowIndex, colIndex);
                    const isEditing = editingCell === address;
                    const colorClass = mapping ? getMappingColor(mapping.id) : '';

                    return (
                      <td
                        key={colIndex}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                        onMouseDown={(e) => handleMouseDown(rowIndex, colIndex, e)}
                        onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                        className={`
                          border border-border min-w-[100px] h-8 text-sm transition-colors relative
                          ${cellSelected
                            ? 'bg-accent-blue/30 border-accent-blue'
                            : mapping
                            ? colorClass
                            : 'bg-bg-card hover:bg-bg-hover'
                          }
                          ${isEditing ? 'p-0' : 'px-2'}
                        `}
                      >
                        {isEditing ? (
                          <CellEditor
                            value={cellValue}
                            onSave={(value) => {
                              updateCellValue(rowIndex, colIndex, value);
                              stopEditing();
                            }}
                            onCancel={stopEditing}
                          />
                        ) : (
                          <span className="truncate block">
                            {formatCellValue(cellValue)}
                          </span>
                        )}
                        {/* Mapping indicator */}
                        {mapping && !cellSelected && (
                          <span className="absolute top-0 right-0 text-[8px] px-1 bg-bg-hover text-text-muted">
                            {mapping.label.displayName.slice(0, 8)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Label Sidebar */}
        <div className="w-64 flex-shrink-0">
          <LabelSidebar
            entityType={entityType}
            appState={appState}
            selectedLabel={selectedLabel}
            onSelectLabel={setSelectedLabel}
            selectionCount={selectionCount}
            onAssign={handleAssign}
          />
        </div>
      </div>

      {/* Current Mappings */}
      {mappings.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-bg-hover">
          <div className="flex items-center gap-2 mb-2">
            <GripHorizontal className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">
              Current Mappings ({mappings.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mappings.map((mapping) => (
              <div
                key={mapping.id}
                className={`
                  flex items-center gap-2 px-2 py-1 rounded border text-sm
                  ${getMappingColor(mapping.id)}
                `}
              >
                <span className="font-medium">{mapping.label.displayName}</span>
                <span className="text-text-muted">
                  ({mapping.cells.length} cell{mapping.cells.length > 1 ? 's' : ''})
                </span>
                <button
                  onClick={() => removeMapping(mapping.id)}
                  className="text-text-muted hover:text-rag-red transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Cell Editor Component
interface CellEditorProps {
  value: unknown;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const CellEditor: React.FC<CellEditorProps> = ({ value, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState(formatCellValue(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(editValue)}
      className="w-full h-full px-2 bg-white text-text-primary outline-none border-2 border-accent-blue"
    />
  );
};

// Format cell value for display
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') {
    // Check if it's a date serial number (Excel dates)
    if (value > 25569 && value < 100000) {
      // Excel date serial - convert to date string
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toLocaleDateString();
    }
    return value.toLocaleString();
  }
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export default SpreadsheetStep;
