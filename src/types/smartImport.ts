/**
 * Smart Import Types
 * Type definitions for the AI-powered Excel import feature
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/** Entity types that can be imported */
export type ImportEntityType =
  | 'pillar'
  | 'kpi'
  | 'initiative'
  | 'project'
  | 'task'
  | 'resource'
  | 'milestone';

/** Display names for entity types */
export const ENTITY_TYPE_LABELS: Record<ImportEntityType, string> = {
  pillar: 'Strategy Pillar',
  kpi: 'Strategic KPI',
  initiative: 'Initiative',
  project: 'Project',
  task: 'Task',
  resource: 'Resource',
  milestone: 'Milestone',
};

// =============================================================================
// SHEET ANALYSIS
// =============================================================================

/** Analysis result for a single Excel sheet */
export interface SheetAnalysis {
  sheetName: string;
  headers: string[];
  sampleData: unknown[][];
  rowCount: number;
  columnCount: number;
  suggestedEntityType: ImportEntityType | null;
  entityConfidence: number;
  entityMatchReasons: string[];
}

/** Parsed Excel workbook with analysis */
export interface ParsedWorkbook {
  fileName: string;
  sheets: SheetAnalysis[];
  parseErrors: string[];
}

// =============================================================================
// COLUMN ANALYSIS
// =============================================================================

/** Inferred data type for a column */
export type InferredDataType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'email'
  | 'url'
  | 'currency'
  | 'percentage'
  | 'enum'
  | 'mixed';

/** Analysis of a single column */
export interface ColumnAnalysis {
  columnIndex: number;
  headerName: string;
  inferredDataType: InferredDataType;
  sampleValues: unknown[];
  uniqueCount: number;
  nullCount: number;
  totalCount: number;
  detectedPatterns: string[];
  possibleEnumValues?: string[];
}

// =============================================================================
// FIELD SCHEMAS
// =============================================================================

/** Expected field type in entity schema */
export type FieldType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'enum'
  | 'reference';

/** Schema definition for an entity field */
export interface FieldSchema {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  aliases: string[];
  semanticTags: string[];
  patterns?: RegExp[];
  enumValues?: string[];
  referenceType?: ImportEntityType;
  defaultValue?: unknown;
}

/** Complete schema for an entity type */
export interface EntitySchema {
  entityType: ImportEntityType;
  fields: FieldSchema[];
  identifierField: string;
  parentField?: string;
  parentType?: ImportEntityType;
}

// =============================================================================
// MAPPING
// =============================================================================

/** Alternative mapping suggestion */
export interface AlternativeMapping {
  targetField: string;
  confidence: number;
  reason: string;
}

/** AI-generated mapping suggestion */
export interface MappingSuggestion {
  sourceColumnIndex: number;
  sourceColumnName: string;
  targetField: string;
  targetFieldLabel: string;
  confidence: number;
  matchReason: string;
  isRequired: boolean;
  alternatives: AlternativeMapping[];
}

/** User-confirmed column mapping */
export interface ColumnMapping {
  sourceColumnIndex: number;
  sourceColumnName: string;
  targetField: string | null;
}

/** Configuration for a single sheet's import */
export interface SheetConfig {
  sheetName: string;
  entityType: ImportEntityType;
  columnMappings: ColumnMapping[];
  skipRows: number;
  enabled: boolean;
}

// =============================================================================
// VALIDATION
// =============================================================================

/** Validation error */
export interface ValidationError {
  field: string;
  fieldLabel: string;
  message: string;
  value: unknown;
}

/** Validation warning (non-blocking) */
export interface ValidationWarning {
  field: string;
  fieldLabel: string;
  message: string;
  value: unknown;
}

/** Duplicate detection result */
export interface DuplicateInfo {
  /** ID of existing entity that matches */
  existingId: string;
  /** Name/identifier of existing entity */
  existingName: string;
  /** Match confidence (0-100) */
  confidence: number;
  /** How the match was determined */
  matchType: 'exact' | 'fuzzy';
}

/** User action for handling duplicates */
export type DuplicateAction = 'skip' | 'replace' | 'keep_both' | 'ask';

/** Validation result for a single row */
export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  transformedData: Record<string, unknown>;
  rawData: unknown[];
  /** Duplicate detection result */
  duplicate?: DuplicateInfo;
  /** User-selected action for this duplicate */
  duplicateAction?: DuplicateAction;
}

/** Validation result for a sheet */
export interface SheetValidationResult {
  sheetName: string;
  entityType: ImportEntityType;
  rowResults: RowValidationResult[];
  validCount: number;
  errorCount: number;
  warningCount: number;
  /** Number of rows that match existing entities */
  duplicateCount: number;
}

/** Overall import validation result */
export interface ImportValidationResult {
  isValid: boolean;
  canProceed: boolean;
  sheets: SheetValidationResult[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  globalErrors: string[];
}

// =============================================================================
// IMPORT RESULT
// =============================================================================

/** Result of importing a single entity */
export interface EntityImportResult {
  rowNumber: number;
  success: boolean;
  entityId?: string;
  error?: string;
}

/** Result of importing a sheet */
export interface SheetImportResult {
  sheetName: string;
  entityType: ImportEntityType;
  attempted: number;
  successful: number;
  failed: number;
  results: EntityImportResult[];
}

/** Overall import result */
export interface SmartImportResult {
  success: boolean;
  sheets: SheetImportResult[];
  totalAttempted: number;
  totalSuccessful: number;
  totalFailed: number;
  duration: number;
}

// =============================================================================
// WIZARD STATE
// =============================================================================

/** Steps in the import wizard */
export type WizardStep =
  | 'upload'
  | 'sheets'
  | 'spreadsheet'
  | 'preview'
  | 'import';

/** Complete wizard state */
export interface SmartImportWizardState {
  currentStep: WizardStep;
  file: File | null;
  workbook: ParsedWorkbook | null;
  sheetConfigs: SheetConfig[];
  mappingSuggestions: Map<string, MappingSuggestion[]>;
  validationResult: ImportValidationResult | null;
  importResult: SmartImportResult | null;
  isProcessing: boolean;
  error: string | null;
}

// =============================================================================
// HEURISTIC SCORING
// =============================================================================

/** Individual heuristic score */
export interface HeuristicScore {
  strategy: string;
  score: number;
  weight: number;
  reason: string;
}

/** Combined confidence calculation */
export interface ConfidenceResult {
  totalConfidence: number;
  scores: HeuristicScore[];
  topMatch: string | null;
}

// =============================================================================
// SPREADSHEET UI TYPES
// =============================================================================

/** Cell address in "row:col" format */
export type CellAddress = string;

/** Label type - either an entity field or a reference to existing data */
export type LabelType = 'field' | 'reference';

/** Available label for assignment */
export interface AvailableLabel {
  id: string;
  name: string;
  displayName: string;
  type: LabelType;
  category: string;
  required?: boolean;
  dataType?: FieldType;
  enumValues?: string[];
}

/** Cell to label mapping */
export interface CellMapping {
  id: string;
  cells: CellAddress[];
  label: AvailableLabel;
  columnIndex?: number; // If mapping is for entire column
}

/** Spreadsheet cell data with metadata */
export interface SpreadsheetCell {
  value: unknown;
  row: number;
  col: number;
  isHeader: boolean;
  isEditing: boolean;
  mappingId?: string;
  validationError?: string;
}

/** Spreadsheet state for a single sheet */
export interface SpreadsheetState {
  sheetName: string;
  data: unknown[][];
  headers: string[];
  selectedCells: Set<CellAddress>;
  mappings: CellMapping[];
  editingCell: CellAddress | null;
  entityType: ImportEntityType;
}
