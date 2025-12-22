/**
 * Smart Import Wizard Hook
 * Manages state and logic for the multi-step import wizard
 */

import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  WizardStep,
  SmartImportWizardState,
  ParsedWorkbook,
  SheetConfig,
  MappingSuggestion,
  ImportValidationResult,
  SmartImportResult,
  ImportEntityType,
  ColumnMapping,
} from '../../types/smartImport';
import {
  parseExcelFile,
  getWorkbook,
  getSheetData,
  analyzeColumns,
  generateMappingSuggestions,
  validateImport,
  isDataSheet,
} from '../../utils/smartImport';
import { AppState, AppAction } from '../../types';

interface UseSmartImportWizardProps {
  currentState: AppState;
  onImportComplete: (result: SmartImportResult) => void;
}

const INITIAL_STATE: SmartImportWizardState = {
  currentStep: 'upload',
  file: null,
  workbook: null,
  sheetConfigs: [],
  mappingSuggestions: new Map(),
  validationResult: null,
  importResult: null,
  isProcessing: false,
  error: null,
};

const STEP_ORDER: WizardStep[] = ['upload', 'sheets', 'spreadsheet', 'preview', 'import'];

export function useSmartImportWizard({ currentState, onImportComplete }: UseSmartImportWizardProps) {
  const [state, setState] = useState<SmartImportWizardState>(INITIAL_STATE);
  const [xlsxWorkbook, setXlsxWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Step navigation
  const currentStepIndex = useMemo(
    () => STEP_ORDER.indexOf(state.currentStep),
    [state.currentStep]
  );

  const canGoBack = currentStepIndex > 0 && state.currentStep !== 'import';
  const canGoNext = useMemo(() => {
    switch (state.currentStep) {
      case 'upload':
        return state.workbook !== null;
      case 'sheets':
        return state.sheetConfigs.some(c => c.enabled);
      case 'spreadsheet':
        // For now, allow proceeding as long as there are enabled sheets
        return state.sheetConfigs.some(c => c.enabled);
      case 'preview':
        return state.validationResult?.canProceed === true;
      default:
        return false;
    }
  }, [state]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setState(prev => ({
      ...prev,
      currentStep: STEP_ORDER[currentStepIndex - 1],
      error: null,
    }));
  }, [canGoBack, currentStepIndex]);

  const goNext = useCallback(async () => {
    if (!canGoNext) return;

    const nextStep = STEP_ORDER[currentStepIndex + 1];

    // Handle transitions that need processing
    if (state.currentStep === 'spreadsheet' && nextStep === 'preview') {
      // Run validation
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      try {
        const sheetData = new Map<string, unknown[][]>();
        const enabledConfigs = state.sheetConfigs.filter(c => c.enabled);

        for (const config of enabledConfigs) {
          if (xlsxWorkbook) {
            const data = getSheetData(xlsxWorkbook, config.sheetName);
            sheetData.set(config.sheetName, data);
          }
        }

        const validationResult = validateImport(enabledConfigs, sheetData, currentState);

        setState(prev => ({
          ...prev,
          currentStep: nextStep,
          validationResult,
          isProcessing: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: `Validation failed: ${error}`,
        }));
      }
    } else {
      setState(prev => ({ ...prev, currentStep: nextStep, error: null }));
    }
  }, [canGoNext, currentStepIndex, state.currentStep, state.sheetConfigs, xlsxWorkbook, currentState]);

  // File handling
  const handleFileSelect = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null, file }));

    try {
      // Parse the file
      const [parsedWorkbook, workbook] = await Promise.all([
        parseExcelFile(file),
        getWorkbook(file),
      ]);

      setXlsxWorkbook(workbook);

      // Create initial sheet configs
      const dataSheets = parsedWorkbook.sheets.filter(isDataSheet);
      const sheetConfigs: SheetConfig[] = dataSheets.map(sheet => ({
        sheetName: sheet.sheetName,
        entityType: sheet.suggestedEntityType || 'task',
        columnMappings: [],
        skipRows: 0,
        enabled: sheet.suggestedEntityType !== null,
      }));

      setState(prev => ({
        ...prev,
        workbook: parsedWorkbook,
        sheetConfigs,
        isProcessing: false,
        error: parsedWorkbook.parseErrors.length > 0
          ? parsedWorkbook.parseErrors.join('; ')
          : null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: `Failed to parse file: ${error}`,
      }));
    }
  }, []);

  const clearFile = useCallback(() => {
    setState(INITIAL_STATE);
    setXlsxWorkbook(null);
  }, []);

  // Sheet config handling
  const updateSheetConfig = useCallback((sheetName: string, updates: Partial<SheetConfig>) => {
    setState(prev => {
      const newConfigs = prev.sheetConfigs.map(config =>
        config.sheetName === sheetName ? { ...config, ...updates } : config
      );
      return { ...prev, sheetConfigs: newConfigs };
    });
  }, []);

  const setSheetEntityType = useCallback((sheetName: string, entityType: ImportEntityType) => {
    const sheet = state.workbook?.sheets.find(s => s.sheetName === sheetName);
    if (!sheet || !xlsxWorkbook) return;

    // Analyze columns for this sheet
    const sheetData = getSheetData(xlsxWorkbook, sheetName);
    const columnAnalyses = analyzeColumns(sheet.headers, sheetData.slice(0, 10));

    // Generate mapping suggestions
    const suggestions = generateMappingSuggestions(columnAnalyses, entityType);

    // Create column mappings from suggestions
    const columnMappings: ColumnMapping[] = suggestions.map(s => ({
      sourceColumnIndex: s.sourceColumnIndex,
      sourceColumnName: s.sourceColumnName,
      targetField: s.confidence >= 50 ? s.targetField : null,
    }));

    // Update state
    setState(prev => {
      const newSuggestions = new Map(prev.mappingSuggestions);
      newSuggestions.set(sheetName, suggestions);

      const newConfigs = prev.sheetConfigs.map(config =>
        config.sheetName === sheetName
          ? { ...config, entityType, columnMappings }
          : config
      );

      return {
        ...prev,
        sheetConfigs: newConfigs,
        mappingSuggestions: newSuggestions,
      };
    });
  }, [state.workbook, xlsxWorkbook]);

  const updateColumnMapping = useCallback(
    (sheetName: string, columnIndex: number, targetField: string | null) => {
      setState(prev => {
        const newConfigs = prev.sheetConfigs.map(config => {
          if (config.sheetName !== sheetName) return config;

          const newMappings = config.columnMappings.map(mapping =>
            mapping.sourceColumnIndex === columnIndex
              ? { ...mapping, targetField }
              : mapping
          );

          return { ...config, columnMappings: newMappings };
        });

        return { ...prev, sheetConfigs: newConfigs };
      });
    },
    []
  );

  // Import execution
  const executeImport = useCallback(async (
    dispatch: React.Dispatch<AppAction>
  ) => {
    if (!state.validationResult?.canProceed) return;

    setState(prev => ({ ...prev, isProcessing: true, currentStep: 'import' }));

    const startTime = Date.now();
    const result: SmartImportResult = {
      success: true,
      sheets: [],
      totalAttempted: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      duration: 0,
    };

    try {
      // Import in dependency order
      for (const sheetResult of state.validationResult.sheets) {
        const sheetImportResult = {
          sheetName: sheetResult.sheetName,
          entityType: sheetResult.entityType,
          attempted: 0,
          successful: 0,
          failed: 0,
          results: [] as { rowNumber: number; success: boolean; entityId?: string; error?: string }[],
        };

        for (const rowResult of sheetResult.rowResults) {
          if (!rowResult.isValid) {
            sheetImportResult.failed++;
            sheetImportResult.results.push({
              rowNumber: rowResult.rowNumber,
              success: false,
              error: rowResult.errors[0]?.message,
            });
            continue;
          }

          sheetImportResult.attempted++;

          try {
            const actionType = getAddActionType(sheetResult.entityType);
            // Type assertion needed because payload type varies by entity
            dispatch({ type: actionType, payload: rowResult.transformedData } as unknown as AppAction);

            sheetImportResult.successful++;
            sheetImportResult.results.push({
              rowNumber: rowResult.rowNumber,
              success: true,
              entityId: rowResult.transformedData.id as string,
            });
          } catch (error) {
            sheetImportResult.failed++;
            sheetImportResult.results.push({
              rowNumber: rowResult.rowNumber,
              success: false,
              error: String(error),
            });
          }
        }

        result.sheets.push(sheetImportResult);
        result.totalAttempted += sheetImportResult.attempted;
        result.totalSuccessful += sheetImportResult.successful;
        result.totalFailed += sheetImportResult.failed;
      }

      result.duration = Date.now() - startTime;
      result.success = result.totalFailed === 0;

      setState(prev => ({
        ...prev,
        importResult: result,
        isProcessing: false,
      }));

      onImportComplete(result);
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;

      setState(prev => ({
        ...prev,
        importResult: result,
        isProcessing: false,
        error: `Import failed: ${error}`,
      }));
    }
  }, [state.validationResult, onImportComplete]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setXlsxWorkbook(null);
  }, []);

  // Get raw sheet data for spreadsheet view
  const getSheetDataForView = useCallback((sheetName: string): unknown[][] => {
    if (!xlsxWorkbook) return [];
    return getSheetData(xlsxWorkbook, sheetName);
  }, [xlsxWorkbook]);

  return {
    state,
    canGoBack,
    canGoNext,
    goBack,
    goNext,
    handleFileSelect,
    clearFile,
    updateSheetConfig,
    setSheetEntityType,
    updateColumnMapping,
    executeImport,
    reset,
    getSheetData: getSheetDataForView,
  };
}

// Action type literals for type-safe dispatch
type AddActionType =
  | 'ADD_PILLAR'
  | 'ADD_KPI'
  | 'ADD_INITIATIVE'
  | 'ADD_PROJECT'
  | 'ADD_TASK'
  | 'ADD_RESOURCE'
  | 'ADD_MILESTONE';

// Helper to get the action type for each entity
function getAddActionType(entityType: ImportEntityType): AddActionType {
  const actionMap: Record<ImportEntityType, AddActionType> = {
    pillar: 'ADD_PILLAR',
    kpi: 'ADD_KPI',
    initiative: 'ADD_INITIATIVE',
    project: 'ADD_PROJECT',
    task: 'ADD_TASK',
    resource: 'ADD_RESOURCE',
    milestone: 'ADD_MILESTONE',
  };
  return actionMap[entityType];
}
