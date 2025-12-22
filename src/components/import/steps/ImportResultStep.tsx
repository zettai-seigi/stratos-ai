/**
 * Import Result Step
 * Show final import results and success/failure status
 */

import React from 'react';
import { Button } from '../../shared';
import { SmartImportResult, ENTITY_TYPE_LABELS } from '../../../types/smartImport';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';

interface ImportResultStepProps {
  result: SmartImportResult | null;
  isProcessing: boolean;
  onReset: () => void;
}

export const ImportResultStep: React.FC<ImportResultStepProps> = ({
  result,
  isProcessing,
  onReset,
}) => {
  // Processing state
  if (isProcessing) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-16 h-16 text-accent-blue animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Importing Data...
        </h2>
        <p className="text-text-secondary">
          Please wait while we import your data into the system.
        </p>
      </div>
    );
  }

  // No result yet
  if (!result) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          No Import Data
        </h2>
        <p className="text-text-secondary mb-6">
          Something went wrong. Please try again.
        </p>
        <Button onClick={onReset} icon={<RefreshCw className="w-4 h-4" />}>
          Start Over
        </Button>
      </div>
    );
  }

  // Success result
  if (result.success) {
    return (
      <div className="p-6">
        {/* Success Banner */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-rag-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-rag-green" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Import Successful!
          </h2>
          <p className="text-text-secondary">
            {result.totalSuccessful} records have been imported successfully.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Records Imported"
            value={result.totalSuccessful}
            icon={<CheckCircle className="w-5 h-5 text-rag-green" />}
          />
          <StatCard
            label="Sheets Processed"
            value={result.sheets.length}
            icon={<FileSpreadsheet className="w-5 h-5 text-accent-blue" />}
          />
          <StatCard
            label="Time Taken"
            value={`${(result.duration / 1000).toFixed(1)}s`}
            icon={<Clock className="w-5 h-5 text-text-muted" />}
          />
        </div>

        {/* Per-Sheet Breakdown */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Import Details by Sheet
          </h3>
          <div className="space-y-2">
            {result.sheets.map((sheet) => (
              <div
                key={sheet.sheetName}
                className="flex items-center justify-between p-3 bg-bg-hover rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {sheet.sheetName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {ENTITY_TYPE_LABELS[sheet.entityType]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-rag-green">
                    {sheet.successful} imported
                  </span>
                  {sheet.failed > 0 && (
                    <span className="text-sm text-rag-red">
                      {sheet.failed} failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            onClick={onReset}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Import More Data
          </Button>
          <Button
            onClick={() => (window.location.href = '/portfolio')}
            icon={<LayoutDashboard className="w-4 h-4" />}
          >
            View Portfolio
          </Button>
        </div>
      </div>
    );
  }

  // Partial failure or complete failure
  return (
    <div className="p-6">
      {/* Warning/Error Banner */}
      <div className="text-center mb-8">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            result.totalSuccessful > 0
              ? 'bg-rag-amber/20'
              : 'bg-rag-red/20'
          }`}
        >
          <AlertCircle
            className={`w-10 h-10 ${
              result.totalSuccessful > 0 ? 'text-rag-amber' : 'text-rag-red'
            }`}
          />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {result.totalSuccessful > 0
            ? 'Import Completed with Issues'
            : 'Import Failed'}
        </h2>
        <p className="text-text-secondary">
          {result.totalSuccessful} of {result.totalAttempted} records were imported.
          {result.totalFailed > 0 && ` ${result.totalFailed} records failed.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Successfully Imported"
          value={result.totalSuccessful}
          icon={<CheckCircle className="w-5 h-5 text-rag-green" />}
        />
        <StatCard
          label="Failed"
          value={result.totalFailed}
          icon={<AlertCircle className="w-5 h-5 text-rag-red" />}
        />
        <StatCard
          label="Time Taken"
          value={`${(result.duration / 1000).toFixed(1)}s`}
          icon={<Clock className="w-5 h-5 text-text-muted" />}
        />
      </div>

      {/* Error Details */}
      {result.sheets.some((s) => s.failed > 0) && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Failed Records
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {result.sheets.map((sheet) =>
              sheet.results
                .filter((r) => !r.success)
                .map((failedResult) => (
                  <div
                    key={`${sheet.sheetName}-${failedResult.rowNumber}`}
                    className="p-3 bg-rag-red/10 border border-rag-red/30 rounded-lg"
                  >
                    <p className="text-sm font-medium text-text-primary">
                      {sheet.sheetName} - Row {failedResult.rowNumber}
                    </p>
                    <p className="text-sm text-rag-red">
                      {failedResult.error || 'Unknown error'}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          onClick={onReset}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Try Again
        </Button>
        {result.totalSuccessful > 0 && (
          <Button
            onClick={() => (window.location.href = '/portfolio')}
            icon={<LayoutDashboard className="w-4 h-4" />}
          >
            View Imported Data
          </Button>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div className="p-4 bg-bg-hover rounded-lg text-center">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-2xl font-bold text-text-primary">{value}</p>
    <p className="text-xs text-text-muted">{label}</p>
  </div>
);
