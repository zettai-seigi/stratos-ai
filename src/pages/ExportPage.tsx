import React from 'react';
import { useApp } from '../context/AppContext';
import { generateExcelTemplate, exportFullData, exportStrategicCascade } from '../utils/excelExport';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Database, CheckCircle, Info, Upload, GitBranch, Layers } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const { state } = useApp();

  const handleExportTemplate = () => {
    generateExcelTemplate(state);
  };

  const handleExportBackup = () => {
    exportFullData(state);
  };

  const handleExportCascade = () => {
    exportStrategicCascade(state);
  };

  // Calculate some summary stats
  const greenProjects = state.projects.filter(p => p.ragStatus === 'green').length;
  const amberProjects = state.projects.filter(p => p.ragStatus === 'amber').length;
  const redProjects = state.projects.filter(p => p.ragStatus === 'red').length;
  const completedTasks = state.tasks.filter(t => t.kanbanStatus === 'done').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Export Data</h1>
          <p className="text-text-secondary mt-1">
            Export your portfolio data in various formats for reporting or offline editing.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Upload className="w-5 h-5 text-accent-blue" />
          <span className="text-sm text-text-secondary">Data Export</span>
        </div>
      </div>

      {/* Current Data Summary */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-accent-blue" />
          Current Portfolio Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.pillars.length}</p>
            <p className="text-xs text-text-muted">Pillars</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.kpis.length}</p>
            <p className="text-xs text-text-muted">KPIs</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.initiatives.length}</p>
            <p className="text-xs text-text-muted">Initiatives</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{state.projects.length}</p>
            <p className="text-xs text-text-muted">Projects</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-rag-green">{greenProjects}</p>
            <p className="text-xs text-text-muted">On Track</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-rag-amber">{amberProjects}</p>
            <p className="text-xs text-text-muted">At Risk</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-rag-red">{redProjects}</p>
            <p className="text-xs text-text-muted">Critical</p>
          </div>
          <div className="p-3 bg-bg-hover rounded-lg text-center">
            <p className="text-2xl font-bold text-text-primary">{completedTasks}/{state.tasks.length}</p>
            <p className="text-xs text-text-muted">Tasks Done</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Export */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent-blue/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Import Template
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Structured Excel for adding new Projects & Tasks offline.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-text-primary">Includes:</h4>
            <div className="space-y-2">
              {[
                'Instructions & Work ID guide',
                'Reference sheets (Pillars, Initiatives, Resources)',
                'Existing Projects with Work IDs',
                'Projects input with dropdowns',
                'Tasks input with dropdowns',
                'Dept/Category code reference',
                'Portfolio summary dashboard',
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
            className="w-full"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>

        {/* Strategic Cascade */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent-cyan/20 rounded-lg">
              <GitBranch className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Strategic Cascade
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Golden Thread view - hierarchy from Strategy to Execution.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-text-primary">Includes:</h4>
            <div className="space-y-2">
              {[
                'Hierarchical cascade view',
                'Pillar → Initiative → Project → Task',
                'Work IDs for all projects',
                'RAG status at each level',
                'Budget & completion tracking',
                'Owner/Manager assignments',
                'Perfect for board presentations',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-accent-cyan" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExportCascade}
            variant="secondary"
            className="w-full"
          >
            <Download className="w-4 h-4" />
            Download Cascade
          </Button>
        </div>

        {/* Full Backup */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent-purple/20 rounded-lg">
              <Database className="w-6 h-6 text-accent-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Full Data Backup
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Complete export with IDs for backup or migration.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-text-primary">Includes:</h4>
            <div className="space-y-2">
              {[
                'All Pillars with UUIDs',
                'All KPIs with pillar linkage',
                'All Initiatives with owners',
                'All Projects with Work IDs',
                'All Tasks with assignments',
                'All Resources with departments',
                'Summary sheet with counts',
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
            className="w-full"
          >
            <Download className="w-4 h-4" />
            Download Backup
          </Button>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 bg-accent-blue/10 rounded-lg border border-accent-blue/30">
          <Layers className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-accent-blue mb-1">Work ID System</p>
            <p>
              Projects are coded using the format <code className="text-accent-blue bg-accent-blue/20 px-1 rounded">DEPT-YY-CATEGORY-SEQ</code>.
              Example: <code className="text-accent-blue bg-accent-blue/20 px-1 rounded">IT-25-GROW-001</code> means IT department,
              FY2025, Growth category, sequence #1.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-accent-cyan/10 rounded-lg border border-accent-cyan/30">
          <Info className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-accent-cyan mb-1">Data Validation</p>
            <p>
              The import template includes dropdown lists for Initiatives, Resources, Departments,
              and Categories to ensure data integrity. Work IDs are auto-generated on import.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
