import React from 'react';
import { useApp } from '../context/AppContext';
import { generateExcelTemplate, exportFullData } from '../utils/excelExport';
import { Button } from '../components/shared';
import { Download, FileSpreadsheet, Database, CheckCircle, Info } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const { state } = useApp();

  const handleExportTemplate = () => {
    generateExcelTemplate(state);
  };

  const handleExportBackup = () => {
    exportFullData(state);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Export Data</h1>
        <p className="text-text-secondary mt-1">
          Export your BSC structure as a template or create a full backup.
        </p>
      </div>

      {/* Current Data Summary */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-accent-blue" />
          Current Data Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.pillars.length}</p>
            <p className="text-sm text-text-muted">Pillars</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.kpis.length}</p>
            <p className="text-sm text-text-muted">KPIs</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.initiatives.length}</p>
            <p className="text-sm text-text-muted">Initiatives</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.projects.length}</p>
            <p className="text-sm text-text-muted">Projects</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.tasks.length}</p>
            <p className="text-sm text-text-muted">Tasks</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.resources.length}</p>
            <p className="text-sm text-text-muted">Resources</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Export */}
        <div className="bg-bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent-blue/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Export Execution Template
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Generate an Excel template with your BSC structure pre-populated.
                Use this to add new Projects and Tasks offline.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-text-primary">Template includes:</h4>
            <div className="space-y-2">
              {[
                'Strategy Pillars (read-only reference)',
                'Initiatives with BSC linkage (read-only)',
                'Resources list (read-only)',
                'Projects sheet with Initiative dropdown',
                'Tasks sheet with Project & Assignee dropdowns',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-rag-green" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExportTemplate}
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            Download Template
          </Button>
        </div>

        {/* Full Backup */}
        <div className="bg-bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent-purple/20 rounded-lg">
              <Database className="w-6 h-6 text-accent-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Export Full Backup
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Download all your data as an Excel file for backup or migration purposes.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-text-primary">Backup includes:</h4>
            <div className="space-y-2">
              {[
                'All Strategy Pillars with IDs',
                'All KPIs with pillar linkage',
                'All Initiatives with full details',
                'All Projects with status and budgets',
                'All Tasks with assignments',
                'All Resources',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-accent-purple" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExportBackup}
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            Download Backup
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-accent-blue/10 rounded-lg border border-accent-blue/30">
        <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-secondary">
          <p className="font-medium text-accent-blue mb-1">Strategic Cascade Workflow</p>
          <p>
            The template ensures your Projects and Tasks are always aligned with your
            Balanced Scorecard. Users can only select from pre-defined Initiatives
            and Resources, maintaining the "Golden Thread" from strategy to execution.
          </p>
        </div>
      </div>
    </div>
  );
};
