/**
 * Smart Import Wizard
 * AI-powered multi-step wizard for importing Excel data
 */

import React, { useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSmartImportWizard } from './useSmartImportWizard';
import { UploadStep } from './steps/UploadStep';
import { SheetSelectorStep } from './steps/SheetSelectorStep';
import { SpreadsheetStep } from './steps/SpreadsheetStep';
import { PreviewStep } from './steps/PreviewStep';
import { ImportResultStep } from './steps/ImportResultStep';
import { Button } from '../shared';
import { WizardStep, SmartImportResult, CellMapping } from '../../types/smartImport';
import {
  Upload,
  FileSpreadsheet,
  Grid3X3,
  Eye,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface SmartImportWizardProps {
  onComplete?: (result: SmartImportResult) => void;
}

const STEP_CONFIG: Record<WizardStep, { label: string; icon: React.ReactNode }> = {
  upload: { label: 'Upload', icon: <Upload className="w-4 h-4" /> },
  sheets: { label: 'Sheets', icon: <FileSpreadsheet className="w-4 h-4" /> },
  spreadsheet: { label: 'Map Data', icon: <Grid3X3 className="w-4 h-4" /> },
  preview: { label: 'Preview', icon: <Eye className="w-4 h-4" /> },
  import: { label: 'Complete', icon: <CheckCircle className="w-4 h-4" /> },
};

const STEP_ORDER: WizardStep[] = ['upload', 'sheets', 'spreadsheet', 'preview', 'import'];

export const SmartImportWizard: React.FC<SmartImportWizardProps> = ({ onComplete }) => {
  const { state: appState, dispatch } = useApp();
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [sheetMappings, setSheetMappings] = useState<Map<string, CellMapping[]>>(new Map());

  const wizard = useSmartImportWizard({
    currentState: appState,
    onImportComplete: (result) => {
      onComplete?.(result);
    },
  });

  const { state, canGoBack, canGoNext, goBack, goNext } = wizard;
  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);

  const handleExecuteImport = () => {
    wizard.executeImport(dispatch);
  };

  // Get enabled sheets for spreadsheet step
  const enabledConfigs = state.sheetConfigs.filter((c) => c.enabled);
  const activeSheet = enabledConfigs[activeSheetIndex];

  // Handle mappings change for active sheet
  const handleMappingsChange = useCallback((mappings: CellMapping[]) => {
    if (activeSheet) {
      setSheetMappings((prev) => {
        const next = new Map(prev);
        next.set(activeSheet.sheetName, mappings);
        return next;
      });
    }
  }, [activeSheet]);

  return (
    <div className="w-full space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {STEP_ORDER.map((step, index) => {
            const config = STEP_CONFIG[step];
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isClickable = index < currentStepIndex && state.currentStep !== 'import';

            return (
              <React.Fragment key={step}>
                {index > 0 && (
                  <div
                    className={`w-8 h-0.5 ${
                      isCompleted ? 'bg-accent-blue' : 'bg-border'
                    }`}
                  />
                )}
                <button
                  onClick={() => isClickable && wizard.goBack()}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${
                      isActive
                        ? 'bg-accent-blue text-white'
                        : isCompleted
                        ? 'bg-accent-blue/20 text-accent-blue cursor-pointer hover:bg-accent-blue/30'
                        : 'bg-bg-card text-text-muted cursor-default'
                    }
                  `}
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-rag-red/10 border border-rag-red/30 rounded-xl p-4">
          <p className="text-sm text-rag-red">{state.error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-bg-card rounded-xl border border-border">
        {state.currentStep === 'upload' && (
          <UploadStep
            file={state.file}
            isProcessing={state.isProcessing}
            onFileSelect={wizard.handleFileSelect}
            onClear={wizard.clearFile}
          />
        )}

        {state.currentStep === 'sheets' && state.workbook && (
          <SheetSelectorStep
            workbook={state.workbook}
            sheetConfigs={state.sheetConfigs}
            onToggleSheet={(sheetName, enabled) =>
              wizard.updateSheetConfig(sheetName, { enabled })
            }
            onSetEntityType={wizard.setSheetEntityType}
          />
        )}

        {state.currentStep === 'spreadsheet' && activeSheet && wizard.getSheetData && (
          <div className="h-[600px]">
            {/* Sheet Tabs */}
            {enabledConfigs.length > 1 && (
              <div className="flex gap-2 px-4 pt-4 border-b border-border">
                {enabledConfigs.map((config, index) => (
                  <button
                    key={config.sheetName}
                    onClick={() => setActiveSheetIndex(index)}
                    className={`
                      px-4 py-2 text-sm font-medium border-b-2 transition-colors
                      ${
                        index === activeSheetIndex
                          ? 'border-accent-blue text-accent-blue'
                          : 'border-transparent text-text-muted hover:text-text-primary'
                      }
                    `}
                  >
                    {config.sheetName}
                  </button>
                ))}
              </div>
            )}
            <SpreadsheetStep
              sheetName={activeSheet.sheetName}
              sheetData={wizard.getSheetData(activeSheet.sheetName)}
              entityType={activeSheet.entityType}
              onEntityTypeChange={(entityType) =>
                wizard.setSheetEntityType(activeSheet.sheetName, entityType)
              }
              appState={appState}
              onMappingsChange={handleMappingsChange}
            />
          </div>
        )}

        {state.currentStep === 'preview' && state.validationResult && (
          <PreviewStep validationResult={state.validationResult} />
        )}

        {state.currentStep === 'import' && (
          <ImportResultStep
            result={state.importResult}
            isProcessing={state.isProcessing}
            onReset={wizard.reset}
          />
        )}
      </div>

      {/* Navigation */}
      {state.currentStep !== 'import' && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={!canGoBack || state.isProcessing}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            {state.isProcessing && (
              <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
            )}

            {state.currentStep === 'preview' ? (
              <Button
                onClick={handleExecuteImport}
                disabled={!canGoNext || state.isProcessing}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                {state.isProcessing ? 'Importing...' : 'Import Data'}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canGoNext || state.isProcessing}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {state.isProcessing ? 'Processing...' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
