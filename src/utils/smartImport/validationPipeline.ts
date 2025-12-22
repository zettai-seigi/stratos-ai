/**
 * Validation Pipeline for Smart Import
 * Multi-stage validation of mapped data before import
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ImportEntityType,
  SheetConfig,
  ColumnMapping,
  RowValidationResult,
  SheetValidationResult,
  ImportValidationResult,
  ValidationError,
  ValidationWarning,
  DuplicateInfo,
} from '../../types/smartImport';
import { ENTITY_SCHEMAS, FieldSchema, EntitySchema } from './fieldSchemas';
import { AppState, DepartmentCode, ProjectCategory, ImportEnforcementConfig } from '../../types';
import { transformValue, parseDate, parseNumber, parseBoolean } from './dataTransformer';
import { normalize, findBestMatch } from './fuzzyMatcher';
import { generateWorkId, getNextSequenceNumber } from '../workId';
import { DEFAULT_IMPORT_CONFIG } from '../configDefaults';

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate all configured sheets
 * @param sheetConfigs - Sheet configuration from the import wizard
 * @param sheetData - Raw data from Excel sheets
 * @param currentState - Current application state for reference lookups
 * @param enforcementConfig - Optional enforcement configuration (uses defaults if not provided)
 */
export function validateImport(
  sheetConfigs: SheetConfig[],
  sheetData: Map<string, unknown[][]>,
  currentState: AppState,
  enforcementConfig?: ImportEnforcementConfig
): ImportValidationResult {
  const globalErrors: string[] = [];
  const sheets: SheetValidationResult[] = [];

  // Use provided config or defaults
  const config = enforcementConfig ?? DEFAULT_IMPORT_CONFIG;

  // Build lookup maps for references
  const lookups = buildEntityLookups(currentState);

  // Validate in dependency order
  const orderedConfigs = orderByDependency(sheetConfigs);

  for (const sheetConfig of orderedConfigs) {
    if (!sheetConfig.enabled) continue;

    const data = sheetData.get(sheetConfig.sheetName);
    if (!data || data.length === 0) {
      globalErrors.push(`Sheet "${sheetConfig.sheetName}" has no data`);
      continue;
    }

    const result = validateSheet(sheetConfig, data, lookups, currentState, config);
    sheets.push(result);

    // Add newly validated entities to lookups for subsequent sheets
    updateLookups(lookups, result, sheetConfig.entityType);
  }

  // Calculate totals
  const totalRows = sheets.reduce((sum, s) => sum + s.rowResults.length, 0);
  const validRows = sheets.reduce((sum, s) => sum + s.validCount, 0);
  const errorRows = sheets.reduce((sum, s) => sum + s.errorCount, 0);

  // If treatWarningsAsErrors, recalculate
  let effectiveValidRows = validRows;
  let effectiveErrorRows = errorRows;

  if (config.fields.treatWarningsAsErrors) {
    const rowsWithWarnings = sheets.reduce(
      (sum, s) => sum + s.rowResults.filter(r => r.isValid && r.warnings.length > 0).length,
      0
    );
    effectiveValidRows -= rowsWithWarnings;
    effectiveErrorRows += rowsWithWarnings;
  }

  return {
    isValid: globalErrors.length === 0 && effectiveErrorRows === 0,
    canProceed: globalErrors.length === 0 && effectiveValidRows > 0,
    sheets,
    totalRows,
    validRows: effectiveValidRows,
    errorRows: effectiveErrorRows,
    globalErrors,
  };
}

// =============================================================================
// SHEET VALIDATION
// =============================================================================

/**
 * Validate a single sheet's data
 */
function validateSheet(
  sheetConfig: SheetConfig,
  data: unknown[][],
  lookups: EntityLookups,
  currentState: AppState,
  enforcementConfig: ImportEnforcementConfig
): SheetValidationResult {
  const schema = ENTITY_SCHEMAS[sheetConfig.entityType];
  const rowResults: RowValidationResult[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 for 1-indexed + header row

    // Skip empty rows
    if (isEmptyRow(row)) continue;

    const result = validateRow(row, rowNumber, sheetConfig, schema, lookups, currentState, enforcementConfig);
    rowResults.push(result);
  }

  const validCount = rowResults.filter(r => r.isValid).length;
  const errorCount = rowResults.filter(r => !r.isValid).length;
  const warningCount = rowResults.reduce((sum, r) => sum + r.warnings.length, 0);
  const duplicateCount = rowResults.filter(r => r.duplicate).length;

  return {
    sheetName: sheetConfig.sheetName,
    entityType: sheetConfig.entityType,
    rowResults,
    validCount,
    errorCount,
    warningCount,
    duplicateCount,
  };
}

/**
 * Validate a single row
 */
function validateRow(
  row: unknown[],
  rowNumber: number,
  sheetConfig: SheetConfig,
  schema: EntitySchema,
  lookups: EntityLookups,
  currentState: AppState,
  enforcementConfig: ImportEnforcementConfig
): RowValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const transformedData: Record<string, unknown> = {};

  // Stage 1: Extract mapped values
  for (const mapping of sheetConfig.columnMappings) {
    if (!mapping.targetField) continue;

    const field = schema.fields.find((f: FieldSchema) => f.name === mapping.targetField);
    if (!field) continue;

    const rawValue = row[mapping.sourceColumnIndex];
    extractAndValidateField(rawValue, field, transformedData, errors, warnings, enforcementConfig);
  }

  // Stage 2: Check required fields (schema-defined)
  for (const field of schema.fields) {
    if (field.required && (transformedData[field.name] === undefined || transformedData[field.name] === '')) {
      // Check if there's a default value
      if (field.defaultValue !== undefined) {
        transformedData[field.name] = field.defaultValue;
      } else {
        errors.push({
          field: field.name,
          fieldLabel: field.label,
          message: `Required field "${field.label}" is empty`,
          value: null,
        });
      }
    }
  }

  // Stage 2b: Check additional required fields from config
  const entityType = sheetConfig.entityType as keyof typeof enforcementConfig.fields.additionalRequired;
  const additionalRequired = enforcementConfig.fields.additionalRequired[entityType] || [];
  for (const fieldName of additionalRequired) {
    if (transformedData[fieldName] === undefined || transformedData[fieldName] === '') {
      const field = schema.fields.find((f: FieldSchema) => f.name === fieldName);
      errors.push({
        field: fieldName,
        fieldLabel: field?.label || fieldName,
        message: `Field "${field?.label || fieldName}" is required by import policy`,
        value: null,
      });
    }
  }

  // Stage 3: Resolve references
  for (const field of schema.fields.filter((f: FieldSchema) => f.type === 'reference')) {
    const value = transformedData[field.name];
    if (value === undefined || value === '') continue;

    const resolved = resolveReference(
      String(value),
      field.referenceType!,
      lookups,
      enforcementConfig.references
    );

    if (resolved) {
      transformedData[field.name] = resolved;
    } else {
      errors.push({
        field: field.name,
        fieldLabel: field.label,
        message: `Cannot find ${field.referenceType} named "${value}"`,
        value,
      });
    }
  }

  // Stage 4: Apply business rules
  applyBusinessRules(sheetConfig.entityType, transformedData, errors, warnings, currentState, enforcementConfig);

  // Stage 5: Detect duplicates
  const duplicate = detectDuplicate(
    sheetConfig.entityType,
    transformedData,
    currentState,
    enforcementConfig.references.fuzzyMatchThreshold
  );

  // Stage 6: Generate ID if valid
  if (errors.length === 0) {
    transformedData.id = uuidv4();

    // Generate Work ID for projects
    if (sheetConfig.entityType === 'project') {
      generateProjectWorkId(transformedData, currentState);
    }
  }

  return {
    rowNumber,
    isValid: errors.length === 0,
    errors,
    warnings,
    transformedData,
    rawData: row,
    duplicate,
  };
}

// =============================================================================
// FIELD EXTRACTION AND VALIDATION
// =============================================================================

/**
 * Extract and validate a single field value
 */
function extractAndValidateField(
  rawValue: unknown,
  field: FieldSchema,
  transformedData: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  enforcementConfig: ImportEnforcementConfig
): void {
  // Handle null/undefined
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    if (field.defaultValue !== undefined) {
      transformedData[field.name] = field.defaultValue;
    }
    return;
  }

  // Transform based on type
  const transformed = transformValue(rawValue, field.type);

  if (transformed.error) {
    errors.push({
      field: field.name,
      fieldLabel: field.label,
      message: transformed.error,
      value: rawValue,
    });
    return;
  }

  if (transformed.warning) {
    warnings.push({
      field: field.name,
      fieldLabel: field.label,
      message: transformed.warning,
      value: rawValue,
    });
  }

  // Validate enum values
  if (field.type === 'enum' && field.enumValues) {
    const normalizedValue = normalize(String(transformed.value));
    const matchedEnum = field.enumValues.find((e: string) => normalize(e) === normalizedValue);

    if (matchedEnum) {
      transformedData[field.name] = matchedEnum;
    } else {
      // Try fuzzy match if allowed
      const { allowFuzzyMatching, fuzzyMatchThreshold } = enforcementConfig.references;
      const fuzzyMatch = allowFuzzyMatching ? findBestMatch(String(transformed.value), field.enumValues) : null;

      if (fuzzyMatch && fuzzyMatch.score >= fuzzyMatchThreshold) {
        transformedData[field.name] = field.enumValues[fuzzyMatch.index];
        warnings.push({
          field: field.name,
          fieldLabel: field.label,
          message: `Value "${rawValue}" matched to "${field.enumValues[fuzzyMatch.index]}" (${fuzzyMatch.score}% confidence)`,
          value: rawValue,
        });
      } else if (field.defaultValue !== undefined) {
        transformedData[field.name] = field.defaultValue;
        warnings.push({
          field: field.name,
          fieldLabel: field.label,
          message: `Invalid value "${rawValue}", using default "${field.defaultValue}"`,
          value: rawValue,
        });
      } else {
        errors.push({
          field: field.name,
          fieldLabel: field.label,
          message: `Invalid value "${rawValue}". Expected: ${field.enumValues.join(', ')}`,
          value: rawValue,
        });
      }
    }
    return;
  }

  // Validate patterns
  if (field.patterns && field.patterns.length > 0) {
    const strValue = String(transformed.value);
    const matchesPattern = field.patterns.some((p: RegExp) => p.test(strValue));
    if (!matchesPattern) {
      warnings.push({
        field: field.name,
        fieldLabel: field.label,
        message: `Value "${strValue}" doesn't match expected pattern`,
        value: rawValue,
      });
    }
  }

  transformedData[field.name] = transformed.value;
}

// =============================================================================
// REFERENCE RESOLUTION
// =============================================================================

type EntityLookups = Map<ImportEntityType, Map<string, string>>;

/**
 * Build lookup maps from current state
 */
function buildEntityLookups(state: AppState): EntityLookups {
  const lookups: EntityLookups = new Map();

  // Pillars
  const pillarMap = new Map<string, string>();
  for (const pillar of state.pillars) {
    pillarMap.set(normalize(pillar.name), pillar.id);
  }
  lookups.set('pillar', pillarMap);

  // Initiatives
  const initiativeMap = new Map<string, string>();
  for (const initiative of state.initiatives) {
    initiativeMap.set(normalize(initiative.name), initiative.id);
  }
  lookups.set('initiative', initiativeMap);

  // Projects
  const projectMap = new Map<string, string>();
  for (const project of state.projects) {
    projectMap.set(normalize(project.name), project.id);
  }
  lookups.set('project', projectMap);

  // Resources
  const resourceMap = new Map<string, string>();
  for (const resource of state.resources) {
    resourceMap.set(normalize(resource.name), resource.id);
  }
  lookups.set('resource', resourceMap);

  // KPIs
  const kpiMap = new Map<string, string>();
  for (const kpi of state.kpis) {
    kpiMap.set(normalize(kpi.name), kpi.id);
  }
  lookups.set('kpi', kpiMap);

  // Tasks (for parent task references)
  const taskMap = new Map<string, string>();
  for (const task of state.tasks) {
    taskMap.set(normalize(task.title), task.id);
  }
  lookups.set('task', taskMap);

  // Milestones
  const milestoneMap = new Map<string, string>();
  for (const milestone of state.milestones || []) {
    milestoneMap.set(normalize(milestone.name), milestone.id);
  }
  lookups.set('milestone', milestoneMap);

  return lookups;
}

/**
 * Update lookups with newly validated entities
 */
function updateLookups(
  lookups: EntityLookups,
  result: SheetValidationResult,
  entityType: ImportEntityType
): void {
  const map = lookups.get(entityType) || new Map();

  for (const row of result.rowResults) {
    if (row.isValid) {
      const nameField = entityType === 'task' ? 'title' : 'name';
      const name = row.transformedData[nameField];
      const id = row.transformedData.id;

      if (name && id) {
        map.set(normalize(String(name)), String(id));
      }
    }
  }

  lookups.set(entityType, map);
}

/**
 * Resolve a reference value to an ID
 */
function resolveReference(
  value: string,
  referenceType: ImportEntityType,
  lookups: EntityLookups,
  referenceConfig: ImportEnforcementConfig['references']
): string | null {
  const map = lookups.get(referenceType);
  if (!map) return null;

  // Try exact match first
  const normalizedValue = normalize(value);
  if (map.has(normalizedValue)) {
    return map.get(normalizedValue)!;
  }

  // If fuzzy matching is disabled, stop here
  if (!referenceConfig.allowFuzzyMatching) {
    return null;
  }

  // Try fuzzy match with configurable threshold
  const entries = Array.from(map.entries());
  const names = entries.map(([name]) => name);
  const match = findBestMatch(normalizedValue, names);

  if (match && match.score >= referenceConfig.fuzzyMatchThreshold) {
    return entries[match.index][1];
  }

  // Fallback: Try substring match (always allowed as it's exact partial matching)
  for (const [name, id] of entries) {
    if (name.includes(normalizedValue) || normalizedValue.includes(name)) {
      return id;
    }
  }

  return null;
}

// =============================================================================
// BUSINESS RULES
// =============================================================================

/**
 * Apply entity-specific business rules
 */
function applyBusinessRules(
  entityType: ImportEntityType,
  data: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  state: AppState,
  enforcementConfig: ImportEnforcementConfig
): void {
  switch (entityType) {
    case 'project':
      validateProjectRules(data, errors, warnings, enforcementConfig.businessRules);
      break;
    case 'task':
      validateTaskRules(data, errors, warnings, enforcementConfig.businessRules);
      break;
    case 'initiative':
      validateInitiativeRules(data, errors, warnings, enforcementConfig.businessRules);
      break;
    case 'milestone':
      validateMilestoneRules(data, errors, warnings);
      break;
  }
}

function validateProjectRules(
  data: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  rules: ImportEnforcementConfig['businessRules']
): void {
  // Start date before end date
  if (rules.enforceProjectDateRange && data.startDate && data.endDate) {
    if (new Date(String(data.startDate)) > new Date(String(data.endDate))) {
      errors.push({
        field: 'dates',
        fieldLabel: 'Dates',
        message: 'Start date must be before end date',
        value: `${data.startDate} - ${data.endDate}`,
      });
    }
  }

  // Budget should be positive
  if (rules.enforceBudgetPositive && data.budget !== undefined && Number(data.budget) < 0) {
    errors.push({
      field: 'budget',
      fieldLabel: 'Budget',
      message: 'Budget cannot be negative',
      value: data.budget,
    });
  }

  // Completion percentage 0-100
  if (rules.enforceCompletionRange && data.completionPercentage !== undefined) {
    const pct = Number(data.completionPercentage);
    if (pct < 0 || pct > 100) {
      warnings.push({
        field: 'completionPercentage',
        fieldLabel: 'Completion %',
        message: 'Completion percentage should be between 0 and 100',
        value: data.completionPercentage,
      });
      data.completionPercentage = Math.max(0, Math.min(100, pct));
    }
  }
}

function validateTaskRules(
  data: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  rules: ImportEnforcementConfig['businessRules']
): void {
  // Due date in the past (compare dates only, not time)
  if (data.dueDate) {
    const dueDate = new Date(String(data.dueDate));
    // Set both dates to midnight for date-only comparison
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    if (dueDateMidnight < todayMidnight) {
      if (rules.rejectOverdueTasks) {
        errors.push({
          field: 'dueDate',
          fieldLabel: 'Due Date',
          message: 'Due date is in the past (overdue tasks rejected by policy)',
          value: data.dueDate,
        });
      } else {
        warnings.push({
          field: 'dueDate',
          fieldLabel: 'Due Date',
          message: 'Due date is in the past',
          value: data.dueDate,
        });
      }
    }
  }

  // Hours should be positive
  if (data.estimatedHours !== undefined && Number(data.estimatedHours) < 0) {
    data.estimatedHours = 0;
    warnings.push({
      field: 'estimatedHours',
      fieldLabel: 'Estimated Hours',
      message: 'Hours adjusted to 0 (was negative)',
      value: data.estimatedHours,
    });
  }
}

function validateInitiativeRules(
  data: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  rules: ImportEnforcementConfig['businessRules']
): void {
  // Spent budget should not exceed budget
  if (data.budget && data.spentBudget) {
    if (Number(data.spentBudget) > Number(data.budget)) {
      if (rules.rejectOverBudgetInitiatives) {
        errors.push({
          field: 'spentBudget',
          fieldLabel: 'Spent Budget',
          message: 'Spent budget exceeds allocated budget (rejected by policy)',
          value: data.spentBudget,
        });
      } else {
        warnings.push({
          field: 'spentBudget',
          fieldLabel: 'Spent Budget',
          message: 'Spent budget exceeds allocated budget',
          value: data.spentBudget,
        });
      }
    }
  }
}

function validateMilestoneRules(
  data: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Completed date after target date warning
  if (data.completedDate && data.targetDate) {
    if (new Date(String(data.completedDate)) > new Date(String(data.targetDate))) {
      warnings.push({
        field: 'completedDate',
        fieldLabel: 'Completed Date',
        message: 'Milestone was completed after target date',
        value: data.completedDate,
      });
    }
  }
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

/**
 * Detect if an entity already exists in the current state
 */
function detectDuplicate(
  entityType: ImportEntityType,
  data: Record<string, unknown>,
  state: AppState,
  fuzzyThreshold: number
): DuplicateInfo | undefined {
  // Get the name/identifier field for this entity type
  const nameField = entityType === 'task' ? 'title' : 'name';
  const importedName = data[nameField] as string;

  if (!importedName) return undefined;

  // Get the existing entities collection
  const existingEntities = getExistingEntities(entityType, state);
  if (existingEntities.length === 0) return undefined;

  const normalizedImportName = normalize(importedName);

  // Check for exact match first
  for (const entity of existingEntities) {
    const existingName = (entity as Record<string, unknown>)[nameField] as string;
    if (normalize(existingName) === normalizedImportName) {
      return {
        existingId: (entity as Record<string, unknown>).id as string,
        existingName,
        confidence: 100,
        matchType: 'exact',
      };
    }
  }

  // Check for fuzzy match
  const entityNames = existingEntities.map(e => (e as Record<string, unknown>)[nameField] as string);
  const fuzzyMatch = findBestMatch(importedName, entityNames);

  if (fuzzyMatch && fuzzyMatch.score >= fuzzyThreshold) {
    const matchedEntity = existingEntities[fuzzyMatch.index];
    return {
      existingId: (matchedEntity as Record<string, unknown>).id as string,
      existingName: entityNames[fuzzyMatch.index],
      confidence: fuzzyMatch.score,
      matchType: 'fuzzy',
    };
  }

  return undefined;
}

/**
 * Get existing entities from state by type
 */
function getExistingEntities(entityType: ImportEntityType, state: AppState): unknown[] {
  switch (entityType) {
    case 'pillar': return state.pillars;
    case 'kpi': return state.kpis;
    case 'initiative': return state.initiatives;
    case 'project': return state.projects;
    case 'task': return state.tasks;
    case 'resource': return state.resources;
    case 'milestone': return state.milestones || [];
    default: return [];
  }
}

// =============================================================================
// WORK ID GENERATION
// =============================================================================

/**
 * Generate Work ID for a project
 */
function generateProjectWorkId(
  data: Record<string, unknown>,
  state: AppState
): void {
  const deptCode = ((data.departmentCode as string) || 'IT') as DepartmentCode;
  const category = ((data.category as string) || 'GROW') as ProjectCategory;
  const fiscalYear = (data.fiscalYear as number) || new Date().getFullYear();

  const sequenceNumber = getNextSequenceNumber(state.projects, deptCode, fiscalYear, category);
  const workId = generateWorkId(deptCode, fiscalYear, category, sequenceNumber);

  data.sequenceNumber = sequenceNumber;
  data.workId = workId;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a row is empty
 */
function isEmptyRow(row: unknown[]): boolean {
  return row.every(cell => cell === null || cell === undefined || cell === '');
}

/**
 * Order sheet configs by dependency (pillars first, then initiatives, etc.)
 */
function orderByDependency(configs: SheetConfig[]): SheetConfig[] {
  const order: ImportEntityType[] = [
    'pillar',
    'resource',
    'kpi',
    'initiative',
    'project',
    'task',
    'milestone',
  ];

  return [...configs].sort((a, b) => {
    return order.indexOf(a.entityType) - order.indexOf(b.entityType);
  });
}
