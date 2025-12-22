import React from 'react';
import { SmartImportWizard } from '../components/import';
import { Upload, Sparkles } from 'lucide-react';

export const ImportPage: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Import Data</h1>
          <p className="text-text-secondary mt-1">
            Import Projects, Tasks, and other entities from Excel files using AI-powered mapping.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <span className="text-sm text-text-secondary">Smart Import</span>
        </div>
      </div>

      {/* Smart Import Wizard */}
      <SmartImportWizard
        onComplete={(result) => {
          console.log('Import completed:', result);
        }}
      />
    </div>
  );
};
