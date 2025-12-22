/**
 * Sheet Selector Step
 * Select sheets and assign entity types
 */

import React from 'react';
import {
  ParsedWorkbook,
  SheetConfig,
  ImportEntityType,
  ENTITY_TYPE_LABELS,
} from '../../../types/smartImport';
import {
  FileSpreadsheet,
  Check,
  AlertCircle,
  Target,
  Briefcase,
  FolderKanban,
  ListTodo,
  Users,
  Flag,
  BarChart3,
} from 'lucide-react';

interface SheetSelectorStepProps {
  workbook: ParsedWorkbook;
  sheetConfigs: SheetConfig[];
  onToggleSheet: (sheetName: string, enabled: boolean) => void;
  onSetEntityType: (sheetName: string, entityType: ImportEntityType) => void;
}

const ENTITY_ICONS: Record<ImportEntityType, React.ReactNode> = {
  pillar: <Target className="w-4 h-4" />,
  kpi: <BarChart3 className="w-4 h-4" />,
  initiative: <Briefcase className="w-4 h-4" />,
  project: <FolderKanban className="w-4 h-4" />,
  task: <ListTodo className="w-4 h-4" />,
  resource: <Users className="w-4 h-4" />,
  milestone: <Flag className="w-4 h-4" />,
};

const ENTITY_TYPES: ImportEntityType[] = [
  'pillar',
  'kpi',
  'initiative',
  'project',
  'task',
  'resource',
  'milestone',
];

export const SheetSelectorStep: React.FC<SheetSelectorStepProps> = ({
  workbook,
  sheetConfigs,
  onToggleSheet,
  onSetEntityType,
}) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Select Sheets to Import
        </h2>
        <p className="text-sm text-text-secondary">
          We detected {workbook.sheets.length} sheets in your file. Select which ones to import
          and verify the entity type for each.
        </p>
      </div>

      {/* Sheet List */}
      <div className="space-y-3">
        {workbook.sheets.map((sheet) => {
          const config = sheetConfigs.find((c) => c.sheetName === sheet.sheetName);
          const isEnabled = config?.enabled ?? false;
          const entityType = config?.entityType ?? 'task';

          return (
            <div
              key={sheet.sheetName}
              className={`
                p-4 rounded-lg border transition-all
                ${
                  isEnabled
                    ? 'border-accent-blue bg-accent-blue/5'
                    : 'border-border bg-bg-hover/50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => onToggleSheet(sheet.sheetName, !isEnabled)}
                  className={`
                    mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center
                    transition-colors
                    ${
                      isEnabled
                        ? 'bg-accent-blue border-accent-blue text-white'
                        : 'border-border hover:border-accent-blue/50'
                    }
                  `}
                >
                  {isEnabled && <Check className="w-3 h-3" />}
                </button>

                {/* Sheet Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-text-muted" />
                    <span className="font-medium text-text-primary truncate">
                      {sheet.sheetName}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({sheet.rowCount} rows, {sheet.columnCount} columns)
                    </span>
                  </div>

                  {/* Column Preview */}
                  <p className="text-xs text-text-muted mb-3 truncate">
                    Columns: {sheet.headers.slice(0, 5).join(', ')}
                    {sheet.headers.length > 5 && ` +${sheet.headers.length - 5} more`}
                  </p>

                  {/* Entity Type Detection */}
                  {sheet.suggestedEntityType && sheet.entityConfidence > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-text-muted">Detected:</span>
                      <span
                        className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${
                            sheet.entityConfidence >= 70
                              ? 'bg-rag-green/20 text-rag-green'
                              : sheet.entityConfidence >= 40
                              ? 'bg-rag-amber/20 text-rag-amber'
                              : 'bg-text-muted/20 text-text-muted'
                          }
                        `}
                      >
                        {ENTITY_TYPE_LABELS[sheet.suggestedEntityType]} ({sheet.entityConfidence}%)
                      </span>
                    </div>
                  )}

                  {/* Entity Type Selector */}
                  {isEnabled && (
                    <div className="flex flex-wrap gap-2">
                      {ENTITY_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => onSetEntityType(sheet.sheetName, type)}
                          className={`
                            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                            transition-colors
                            ${
                              entityType === type
                                ? 'bg-accent-blue text-white'
                                : 'bg-bg-card hover:bg-bg-hover text-text-secondary'
                            }
                          `}
                        >
                          {ENTITY_ICONS[type]}
                          {ENTITY_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Match Reasons */}
              {isEnabled && sheet.entityMatchReasons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted">
                    {sheet.entityMatchReasons.slice(0, 3).join(' • ')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {workbook.sheets.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No data sheets found in the file</p>
        </div>
      )}

      {/* Selection Summary */}
      {sheetConfigs.filter((c) => c.enabled).length > 0 && (
        <div className="mt-6 p-4 bg-bg-hover rounded-lg">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">
              {sheetConfigs.filter((c) => c.enabled).length}
            </span>{' '}
            sheet(s) selected for import
          </p>
        </div>
      )}
    </div>
  );
};
