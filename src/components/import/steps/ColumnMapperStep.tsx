/**
 * Column Mapper Step
 * Map Excel columns to entity fields with AI suggestions
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SheetConfig,
  MappingSuggestion,
  ParsedWorkbook,
  ImportEntityType,
  ENTITY_TYPE_LABELS,
} from '../../../types/smartImport';
import { ENTITY_SCHEMAS } from '../../../utils/smartImport';
import {
  Columns3,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

interface ColumnMapperStepProps {
  sheetConfigs: SheetConfig[];
  mappingSuggestions: Map<string, MappingSuggestion[]>;
  workbook: ParsedWorkbook | null;
  onUpdateMapping: (sheetName: string, columnIndex: number, targetField: string | null) => void;
}

export const ColumnMapperStep: React.FC<ColumnMapperStepProps> = ({
  sheetConfigs,
  mappingSuggestions,
  workbook,
  onUpdateMapping,
}) => {
  const enabledConfigs = sheetConfigs.filter((c) => c.enabled);
  const [activeSheet, setActiveSheet] = useState<string>(
    enabledConfigs[0]?.sheetName || ''
  );

  const currentConfig = enabledConfigs.find((c) => c.sheetName === activeSheet);
  const currentSuggestions = mappingSuggestions.get(activeSheet) || [];
  const currentSheetAnalysis = workbook?.sheets.find((s) => s.sheetName === activeSheet);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Map Columns to Fields
        </h2>
        <p className="text-sm text-text-secondary">
          Review and adjust how Excel columns map to entity fields. AI suggestions are shown
          with confidence scores.
        </p>
      </div>

      {/* Sheet Tabs */}
      {enabledConfigs.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {enabledConfigs.map((config) => (
            <button
              key={config.sheetName}
              onClick={() => setActiveSheet(config.sheetName)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                transition-colors
                ${
                  activeSheet === config.sheetName
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {config.sheetName}
              <span className="ml-2 text-xs opacity-75">
                ({ENTITY_TYPE_LABELS[config.entityType]})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Mapping Table */}
      {currentConfig && (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-bg-hover text-xs font-medium text-text-muted uppercase tracking-wider">
            <div className="col-span-4">Excel Column</div>
            <div className="col-span-1 text-center">
              <ArrowRight className="w-4 h-4 mx-auto" />
            </div>
            <div className="col-span-4">Map To Field</div>
            <div className="col-span-2 text-center">Confidence</div>
            <div className="col-span-1"></div>
          </div>

          {/* Mapping Rows */}
          <div className="divide-y divide-border">
            {currentConfig.columnMappings.map((mapping) => {
              const suggestion = currentSuggestions.find(
                (s) => s.sourceColumnIndex === mapping.sourceColumnIndex
              );
              const sampleValues = currentSheetAnalysis?.sampleData
                .slice(0, 3)
                .map((row) => row[mapping.sourceColumnIndex])
                .filter((v) => v != null && v !== '');

              return (
                <MappingRow
                  key={mapping.sourceColumnIndex}
                  columnName={mapping.sourceColumnName}
                  currentField={mapping.targetField}
                  suggestion={suggestion}
                  entityType={currentConfig.entityType}
                  sampleValues={sampleValues}
                  onFieldChange={(field) =>
                    onUpdateMapping(activeSheet, mapping.sourceColumnIndex, field)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Required Fields Warning */}
      {currentConfig && (
        <RequiredFieldsCheck
          entityType={currentConfig.entityType}
          mappings={currentConfig.columnMappings}
        />
      )}
    </div>
  );
};

interface MappingRowProps {
  columnName: string;
  currentField: string | null;
  suggestion?: MappingSuggestion;
  entityType: ImportEntityType;
  sampleValues?: unknown[];
  onFieldChange: (field: string | null) => void;
}

const MappingRow: React.FC<MappingRowProps> = ({
  columnName,
  currentField,
  suggestion,
  entityType,
  sampleValues,
  onFieldChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const schema = ENTITY_SCHEMAS[entityType];
  const availableFields = schema.fields;

  const selectedField = availableFields.find((f) => f.name === currentField);
  const confidence = suggestion?.confidence || 0;

  // Calculate dropdown position when opening
  const handleToggleDropdown = () => {
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-bg-hover/50">
      {/* Source Column */}
      <div className="col-span-4">
        <div className="flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-text-muted" />
          <div>
            <p className="text-sm font-medium text-text-primary">{columnName}</p>
            {sampleValues && sampleValues.length > 0 && (
              <p className="text-xs text-text-muted truncate max-w-[200px]">
                e.g., {sampleValues.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="col-span-1 text-center">
        <ArrowRight
          className={`w-4 h-4 mx-auto ${
            currentField ? 'text-accent-blue' : 'text-text-muted'
          }`}
        />
      </div>

      {/* Target Field Dropdown */}
      <div className="col-span-4">
        <button
          ref={buttonRef}
          onClick={handleToggleDropdown}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-lg border
            text-sm transition-colors
            ${
              currentField
                ? 'border-accent-blue/50 bg-accent-blue/5 text-text-primary'
                : 'border-border bg-bg-card text-text-muted'
            }
          `}
        >
          <span className="flex items-center gap-2">
            {currentField && suggestion && confidence >= 80 && (
              <Sparkles className="w-3 h-3 text-accent-purple" />
            )}
            {selectedField ? (
              <>
                {selectedField.label}
                {selectedField.required && (
                  <span className="text-rag-red text-xs">*</span>
                )}
              </>
            ) : (
              'Select field...'
            )}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Dropdown - Rendered via Portal to escape z-index issues */}
        {isDropdownOpen && createPortal(
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setIsDropdownOpen(false)}
            />
            <div
              style={dropdownStyle}
              className="bg-bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {/* Skip option */}
              <button
                onClick={() => {
                  onFieldChange(null);
                  setIsDropdownOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-sm hover:bg-bg-hover
                  ${!currentField ? 'bg-bg-hover' : ''}
                `}
              >
                <span className="text-text-muted italic">Skip this column</span>
              </button>

              {/* Field options */}
              {availableFields.map((field) => (
                <button
                  key={field.name}
                  onClick={() => {
                    onFieldChange(field.name);
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-bg-hover flex items-center justify-between
                    ${currentField === field.name ? 'bg-accent-blue/10' : ''}
                  `}
                >
                  <span>
                    {field.label}
                    {field.required && (
                      <span className="text-rag-red ml-1">*</span>
                    )}
                  </span>
                  {currentField === field.name && (
                    <Check className="w-4 h-4 text-accent-blue" />
                  )}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Confidence */}
      <div className="col-span-2 text-center">
        {suggestion && currentField && (
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${
                confidence >= 80
                  ? 'bg-rag-green/20 text-rag-green'
                  : confidence >= 50
                  ? 'bg-rag-amber/20 text-rag-amber'
                  : 'bg-text-muted/20 text-text-muted'
              }
            `}
          >
            {confidence >= 80 && <Sparkles className="w-3 h-3" />}
            {confidence}%
          </span>
        )}
      </div>

      {/* Clear Button */}
      <div className="col-span-1 text-right">
        {currentField && (
          <button
            onClick={() => onFieldChange(null)}
            className="p-1 text-text-muted hover:text-rag-red transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface RequiredFieldsCheckProps {
  entityType: ImportEntityType;
  mappings: { sourceColumnIndex: number; targetField: string | null }[];
}

const RequiredFieldsCheck: React.FC<RequiredFieldsCheckProps> = ({
  entityType,
  mappings,
}) => {
  const schema = ENTITY_SCHEMAS[entityType];
  const requiredFields = schema.fields.filter((f) => f.required);
  const mappedFields = new Set(mappings.filter((m) => m.targetField).map((m) => m.targetField));

  const missingRequired = requiredFields.filter((f) => !mappedFields.has(f.name));

  if (missingRequired.length === 0) {
    return (
      <div className="mt-4 p-3 bg-rag-green/10 border border-rag-green/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-rag-green">
          <Check className="w-4 h-4" />
          All required fields are mapped
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-rag-amber/10 border border-rag-amber/30 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-rag-amber mb-2">
        <AlertCircle className="w-4 h-4" />
        Missing required field mappings:
      </div>
      <ul className="text-sm text-text-secondary">
        {missingRequired.map((field) => (
          <li key={field.name} className="flex items-center gap-1">
            <span className="text-rag-red">•</span>
            {field.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
