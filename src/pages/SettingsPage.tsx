import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/shared';
import { RefreshCw, Database, AlertTriangle, Info, Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { state, resetToSeedData } = useApp();

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data to the demo dataset? This cannot be undone.')) {
      resetToSeedData();
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      localStorage.removeItem('stratos-ai-data');
      window.location.reload();
    }
  };

  // Calculate storage usage
  const storageUsed = new Blob([JSON.stringify(state)]).size;
  const storageUsedKB = (storageUsed / 1024).toFixed(2);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage application data and preferences.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Settings className="w-5 h-5 text-accent-cyan" />
          <span className="text-sm text-text-secondary">Configuration</span>
        </div>
      </div>

      {/* Storage Info */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-text-primary">Data Storage</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Storage Used</span>
            <span className="text-text-primary font-medium">{storageUsedKB} KB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Storage Type</span>
            <span className="text-text-primary">Browser localStorage</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Total Records</span>
            <span className="text-text-primary">
              {state.pillars.length + state.kpis.length + state.initiatives.length +
               state.projects.length + state.tasks.length + state.resources.length}
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-accent-blue/10 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-accent-blue mt-0.5" />
            <p className="text-xs text-text-secondary">
              Data is stored in your browser's localStorage. Export a backup before clearing
              your browser data to avoid losing your work.
            </p>
          </div>
        </div>
      </div>

      {/* Data Actions */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-accent-purple" />
          <h2 className="text-lg font-semibold text-text-primary">Data Management</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-hover rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-text-primary">Reset to Demo Data</h3>
              <p className="text-xs text-text-muted mt-1">
                Restore the sample Balanced Scorecard data for testing.
              </p>
            </div>
            <Button
              onClick={handleResetData}
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-rag-red/10 rounded-lg border border-rag-red/20">
            <div>
              <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rag-red" />
                Clear All Data
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Permanently delete all data. This cannot be undone.
              </p>
            </div>
            <Button
              onClick={handleClearData}
              variant="danger"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">About StratOS AI</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Version:</strong> 1.0.0
          </p>
          <p>
            <strong className="text-text-primary">Description:</strong> AI-driven Integrated
            Strategy & Delivery Platform connecting Balanced Scorecard to execution.
          </p>
          <p className="pt-2">
            Built with React, TypeScript, TailwindCSS, and Recharts.
          </p>
        </div>
      </div>
    </div>
  );
};
