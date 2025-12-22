/**
 * Smart Import Utilities
 * Export barrel for AI-powered Excel import functionality
 */

// Types
export * from '../../types/smartImport';

// Excel parsing
export { parseExcelFile, getSheetData, getWorkbook, isDataSheet } from './excelParser';

// Column analysis
export { analyzeColumns, analyzeColumn, isTypeCompatible } from './columnAnalyzer';

// Field schemas
export {
  ENTITY_SCHEMAS,
  ENTITY_TYPE_KEYWORDS,
  getEntitySchema,
  getFieldSchema,
  getRequiredFields,
  getAllFieldAliases,
} from './fieldSchemas';

// Fuzzy matching
export {
  normalize,
  fuzzyMatch,
  findBestMatch,
  compositeMatch,
  fuzzyMatchWithAbbreviations,
} from './fuzzyMatcher';

// Mapping engine
export {
  generateMappingSuggestions,
  getConfidenceLevel,
  getConfidenceColor,
  validateRequiredMappings,
} from './mappingEngine';

// Validation
export { validateImport } from './validationPipeline';

// Data transformation
export {
  transformValue,
  parseDate,
  parseNumber,
  parseBoolean,
  applyDefaults,
  cleanEntityData,
} from './dataTransformer';
