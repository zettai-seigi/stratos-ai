import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseExcelFile, ImportValidationResult } from '../utils/excelImport';
import { Button } from '../components/shared';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  X,
  FolderKanban,
  ListTodo,
} from 'lucide-react';

export const ImportPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);
    setImportComplete(false);
    setIsProcessing(true);

    try {
      const result = await parseExcelFile(file, state);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.'],
        warnings: [],
        projects: [],
        tasks: [],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!validationResult || !validationResult.isValid) return;

    // Import projects first, then tasks
    validationResult.projects.forEach((project) => {
      dispatch({ type: 'ADD_PROJECT', payload: project });
    });

    validationResult.tasks.forEach((task) => {
      dispatch({ type: 'ADD_TASK', payload: task });
    });

    setImportComplete(true);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setImportComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Import Data</h1>
        <p className="text-text-secondary mt-1">
          Import Projects and Tasks from an Excel template.
        </p>
      </div>

      {/* Import Complete Message */}
      {importComplete && (
        <div className="bg-rag-green/10 border border-rag-green/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-rag-green" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Import Successful!</h2>
              <p className="text-sm text-text-secondary">
                {validationResult?.projects.length} projects and {validationResult?.tasks.length} tasks
                have been imported.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="secondary">
              Import Another File
            </Button>
            <Button onClick={() => window.location.href = '/portfolio'}>
              View Portfolio
            </Button>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      {!importComplete && (
        <div className="bg-bg-card rounded-xl border border-border p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFile ? 'border-accent-blue bg-accent-blue/5' : 'border-border hover:border-accent-blue/50'
            }`}
          >
            {!selectedFile ? (
              <>
                <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Drop your Excel file here
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  or click to browse for a file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
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
                  <p className="font-medium text-text-primary">{selectedFile.name}</p>
                  <p className="text-sm text-text-muted">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-bg-card rounded-xl border border-border p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Validating file...</p>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && !importComplete && (
        <div className="space-y-4">
          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <div className="bg-rag-red/10 border border-rag-red/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-rag-red" />
                <h3 className="font-semibold text-rag-red">
                  Validation Errors ({validationResult.errors.length})
                </h3>
              </div>
              <ul className="space-y-2">
                {validationResult.errors.map((error, i) => (
                  <li key={i} className="text-sm text-text-primary flex items-start gap-2">
                    <span className="text-rag-red">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="bg-rag-amber/10 border border-rag-amber/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rag-amber" />
                <h3 className="font-semibold text-rag-amber">
                  Warnings ({validationResult.warnings.length})
                </h3>
              </div>
              <ul className="space-y-2">
                {validationResult.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-text-primary flex items-start gap-2">
                    <span className="text-rag-amber">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Preview */}
          {validationResult.isValid && (
            <div className="bg-bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-rag-green" />
                <h3 className="font-semibold text-text-primary">Ready to Import</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-bg-hover rounded-lg">
                  <FolderKanban className="w-8 h-8 text-accent-blue" />
                  <div>
                    <p className="text-2xl font-bold text-text-primary">
                      {validationResult.projects.length}
                    </p>
                    <p className="text-sm text-text-muted">New Projects</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-bg-hover rounded-lg">
                  <ListTodo className="w-8 h-8 text-accent-purple" />
                  <div>
                    <p className="text-2xl font-bold text-text-primary">
                      {validationResult.tasks.length}
                    </p>
                    <p className="text-sm text-text-muted">New Tasks</p>
                  </div>
                </div>
              </div>

              {/* Preview Tables */}
              {validationResult.projects.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">
                    Projects Preview
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-hover">
                          <th className="px-3 py-2 text-left text-text-secondary">Name</th>
                          <th className="px-3 py-2 text-left text-text-secondary">Initiative</th>
                          <th className="px-3 py-2 text-left text-text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.projects.slice(0, 5).map((project) => {
                          const initiative = state.initiatives.find(
                            (i) => i.id === project.initiativeId
                          );
                          return (
                            <tr key={project.id} className="border-t border-border">
                              <td className="px-3 py-2 text-text-primary">{project.name}</td>
                              <td className="px-3 py-2 text-text-secondary">
                                {initiative?.name}
                              </td>
                              <td className="px-3 py-2 text-text-secondary capitalize">
                                {project.status.replace('_', ' ')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {validationResult.projects.length > 5 && (
                      <p className="text-xs text-text-muted mt-2">
                        ...and {validationResult.projects.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleReset} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={handleImport}>
                  Import {validationResult.projects.length} Projects & {validationResult.tasks.length} Tasks
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
