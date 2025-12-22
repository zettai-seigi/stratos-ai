/**
 * Upload Step
 * File selection and upload interface
 */

import React, { useRef, useCallback } from 'react';
import { Button } from '../../shared';
import { Upload, FileSpreadsheet, X, Sparkles } from 'lucide-react';

interface UploadStepProps {
  file: File | null;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  file,
  isProcessing,
  onFileSelect,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && isExcelFile(droppedFile)) {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h2 className="text-lg font-semibold text-text-primary">Smart Import</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Upload any Excel file and our AI will automatically detect entity types and map columns
          to the correct fields. No rigid template required.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            file
              ? 'border-accent-blue bg-accent-blue/5'
              : 'border-border hover:border-accent-blue/50 hover:bg-bg-hover/50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {!file ? (
          <>
            <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Drop your Excel file here
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Supports .xlsx and .xls files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <FileSpreadsheet className="w-10 h-10 text-accent-blue" />
            <div className="text-left">
              <p className="font-medium text-text-primary">{file.name}</p>
              <p className="text-sm text-text-muted">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!isProcessing && (
              <button
                onClick={onClear}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="mt-4">
            <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Analyzing file structure...</p>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FeatureCard
          title="Auto-Detection"
          description="Automatically detects entity types from sheet names and column headers"
        />
        <FeatureCard
          title="Smart Mapping"
          description="AI suggests column-to-field mappings with confidence scores"
        />
        <FeatureCard
          title="Validation"
          description="Validates data and references before import with detailed feedback"
        />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="p-4 bg-bg-hover rounded-lg">
    <h4 className="font-medium text-text-primary text-sm mb-1">{title}</h4>
    <p className="text-xs text-text-muted">{description}</p>
  </div>
);

function isExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  return validTypes.includes(file.type) || /\.xlsx?$/i.test(file.name);
}
