/**
 * Preview Step
 * Show validation results and data preview before import
 */

import React, { useState } from 'react';
import {
  ImportValidationResult,
  SheetValidationResult,
  RowValidationResult,
  ENTITY_TYPE_LABELS,
} from '../../../types/smartImport';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';

interface PreviewStepProps {
  validationResult: ImportValidationResult;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ validationResult }) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Review & Import
        </h2>
        <p className="text-sm text-text-secondary">
          Review the validation results before importing. Fix any errors to proceed.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Total Rows"
          value={validationResult.totalRows}
          icon={<FileSpreadsheet className="w-5 h-5" />}
          variant="neutral"
        />
        <SummaryCard
          label="Valid Rows"
          value={validationResult.validRows}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="success"
        />
        <SummaryCard
          label="Errors"
          value={validationResult.errorRows}
          icon={<AlertCircle className="w-5 h-5" />}
          variant={validationResult.errorRows > 0 ? 'error' : 'neutral'}
        />
      </div>

      {/* Global Errors */}
      {validationResult.globalErrors.length > 0 && (
        <div className="mb-6 p-4 bg-rag-red/10 border border-rag-red/30 rounded-lg">
          <div className="flex items-center gap-2 text-rag-red font-medium mb-2">
            <AlertCircle className="w-5 h-5" />
            Global Errors
          </div>
          <ul className="space-y-1">
            {validationResult.globalErrors.map((error, i) => (
              <li key={i} className="text-sm text-text-primary">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sheet Results */}
      <div className="space-y-4">
        {validationResult.sheets.map((sheet) => (
          <SheetResultCard key={sheet.sheetName} sheet={sheet} />
        ))}
      </div>

      {/* Can Proceed Banner */}
      {validationResult.canProceed && (
        <div className="mt-6 p-4 bg-rag-green/10 border border-rag-green/30 rounded-lg">
          <div className="flex items-center gap-2 text-rag-green">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Ready to import {validationResult.validRows} records
            </span>
          </div>
        </div>
      )}

      {/* Cannot Proceed Warning */}
      {!validationResult.canProceed && (
        <div className="mt-6 p-4 bg-rag-red/10 border border-rag-red/30 rounded-lg">
          <div className="flex items-center gap-2 text-rag-red">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              Cannot proceed - please fix the errors above
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: 'success' | 'error' | 'neutral';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, variant }) => {
  const variantStyles = {
    success: 'bg-rag-green/10 border-rag-green/30 text-rag-green',
    error: 'bg-rag-red/10 border-rag-red/30 text-rag-red',
    neutral: 'bg-bg-hover border-border text-text-muted',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  );
};

interface SheetResultCardProps {
  sheet: SheetValidationResult;
}

const SheetResultCard: React.FC<SheetResultCardProps> = ({ sheet }) => {
  const [isExpanded, setIsExpanded] = useState(sheet.errorCount > 0);
  const [showOnlyErrors, setShowOnlyErrors] = useState(true);

  const displayRows = showOnlyErrors
    ? sheet.rowResults.filter((r) => !r.isValid || r.warnings.length > 0)
    : sheet.rowResults;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-bg-hover hover:bg-bg-hover/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
          <FileSpreadsheet className="w-5 h-5 text-accent-blue" />
          <div className="text-left">
            <p className="font-medium text-text-primary">{sheet.sheetName}</p>
            <p className="text-xs text-text-muted">
              {ENTITY_TYPE_LABELS[sheet.entityType]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {sheet.validCount > 0 && (
            <span className="flex items-center gap-1 text-rag-green">
              <CheckCircle className="w-4 h-4" />
              {sheet.validCount} valid
            </span>
          )}
          {sheet.errorCount > 0 && (
            <span className="flex items-center gap-1 text-rag-red">
              <AlertCircle className="w-4 h-4" />
              {sheet.errorCount} errors
            </span>
          )}
          {sheet.warningCount > 0 && (
            <span className="flex items-center gap-1 text-rag-amber">
              <AlertTriangle className="w-4 h-4" />
              {sheet.warningCount} warnings
            </span>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Filter Toggle */}
          {sheet.rowResults.length > 0 && (
            <div className="px-4 py-2 bg-bg-card border-b border-border">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyErrors}
                  onChange={(e) => setShowOnlyErrors(e.target.checked)}
                  className="rounded border-border"
                />
                Show only rows with errors or warnings
              </label>
            </div>
          )}

          {/* Row Results */}
          <div className="max-h-80 overflow-y-auto">
            {displayRows.length === 0 ? (
              <div className="p-4 text-center text-text-muted">
                {showOnlyErrors
                  ? 'No errors or warnings found'
                  : 'No rows to display'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayRows.slice(0, 50).map((row) => (
                  <RowResultItem key={row.rowNumber} row={row} />
                ))}
                {displayRows.length > 50 && (
                  <div className="p-3 text-center text-sm text-text-muted">
                    ...and {displayRows.length - 50} more rows
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface RowResultItemProps {
  row: RowValidationResult;
}

const RowResultItem: React.FC<RowResultItemProps> = ({ row }) => {
  return (
    <div
      className={`px-4 py-3 ${
        !row.isValid
          ? 'bg-rag-red/5'
          : row.warnings.length > 0
          ? 'bg-rag-amber/5'
          : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {row.isValid ? (
          row.warnings.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-rag-amber" />
          ) : (
            <CheckCircle className="w-4 h-4 text-rag-green" />
          )
        ) : (
          <AlertCircle className="w-4 h-4 text-rag-red" />
        )}
        <span className="text-sm font-medium text-text-primary">
          Row {row.rowNumber}
        </span>
      </div>

      {/* Errors */}
      {row.errors.length > 0 && (
        <ul className="ml-6 space-y-1">
          {row.errors.map((error, i) => (
            <li key={i} className="text-sm text-rag-red">
              {error.fieldLabel}: {error.message}
            </li>
          ))}
        </ul>
      )}

      {/* Warnings */}
      {row.warnings.length > 0 && (
        <ul className="ml-6 space-y-1">
          {row.warnings.map((warning, i) => (
            <li key={i} className="text-sm text-rag-amber">
              {warning.fieldLabel}: {warning.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
