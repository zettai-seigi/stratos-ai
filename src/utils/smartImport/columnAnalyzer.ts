/**
 * Column Analyzer for Smart Import
 * Analyzes Excel column data to infer types and patterns
 */

import { ColumnAnalysis, InferredDataType } from '../../types/smartImport';

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/|www\.)[^\s]+$/i,
  date_iso: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/,
  date_us: /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  date_eu: /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,
  currency: /^\$?-?\d{1,3}(,\d{3})*(\.\d{2})?$/,
  percentage: /^-?\d+(\.\d+)?%$/,
  boolean_true: /^(yes|true|1|y|t|on)$/i,
  boolean_false: /^(no|false|0|n|f|off)$/i,
  integer: /^-?\d+$/,
  decimal: /^-?\d+\.\d+$/,
};

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

/**
 * Analyze all columns in sample data
 */
export function analyzeColumns(
  headers: string[],
  sampleData: unknown[][]
): ColumnAnalysis[] {
  const analyses: ColumnAnalysis[] = [];

  for (let i = 0; i < headers.length; i++) {
    const columnValues = sampleData.map(row => row[i]);
    const analysis = analyzeColumn(i, headers[i], columnValues);
    analyses.push(analysis);
  }

  return analyses;
}

/**
 * Analyze a single column
 */
export function analyzeColumn(
  columnIndex: number,
  headerName: string,
  values: unknown[]
): ColumnAnalysis {
  const nonNullValues = values.filter(v => v != null && v !== '');
  const stringValues = nonNullValues.map(v => String(v));

  // Get unique values
  const uniqueSet = new Set(stringValues);
  const uniqueCount = uniqueSet.size;

  // Sample values (first 5 non-null)
  const sampleValues = nonNullValues.slice(0, 5);

  // Detect patterns
  const detectedPatterns = detectPatterns(stringValues);

  // Infer data type
  const inferredDataType = inferDataType(nonNullValues, detectedPatterns, uniqueCount);

  // Check for possible enum
  let possibleEnumValues: string[] | undefined;
  if (inferredDataType === 'enum' || (inferredDataType === 'string' && uniqueCount <= 10 && uniqueCount > 0)) {
    possibleEnumValues = Array.from(uniqueSet).slice(0, 20);
  }

  return {
    columnIndex,
    headerName,
    inferredDataType,
    sampleValues,
    uniqueCount,
    nullCount: values.length - nonNullValues.length,
    totalCount: values.length,
    detectedPatterns,
    possibleEnumValues,
  };
}

// =============================================================================
// PATTERN DETECTION
// =============================================================================

/**
 * Detect patterns in column values
 */
function detectPatterns(values: string[]): string[] {
  if (values.length === 0) return [];

  const patterns: string[] = [];

  // Check each pattern
  const patternChecks: Record<string, RegExp> = {
    email: PATTERNS.email,
    url: PATTERNS.url,
    'date (ISO)': PATTERNS.date_iso,
    'date (US)': PATTERNS.date_us,
    'date (EU)': PATTERNS.date_eu,
    currency: PATTERNS.currency,
    percentage: PATTERNS.percentage,
  };

  for (const [name, regex] of Object.entries(patternChecks)) {
    const matchCount = values.filter(v => regex.test(v)).length;
    const matchRate = matchCount / values.length;

    if (matchRate >= 0.5) {
      patterns.push(name);
    }
  }

  return patterns;
}

// =============================================================================
// TYPE INFERENCE
// =============================================================================

/**
 * Infer the data type of a column
 */
function inferDataType(
  values: unknown[],
  patterns: string[],
  uniqueCount: number
): InferredDataType {
  if (values.length === 0) return 'string';

  // Check patterns first
  if (patterns.includes('email')) return 'email';
  if (patterns.includes('url')) return 'url';
  if (patterns.some(p => p.startsWith('date'))) return 'date';
  if (patterns.includes('currency')) return 'currency';
  if (patterns.includes('percentage')) return 'percentage';

  // Type counts
  let numberCount = 0;
  let booleanCount = 0;
  let dateCount = 0;
  let stringCount = 0;

  for (const value of values) {
    const type = getValueType(value);
    switch (type) {
      case 'number':
        numberCount++;
        break;
      case 'boolean':
        booleanCount++;
        break;
      case 'date':
        dateCount++;
        break;
      default:
        stringCount++;
    }
  }

  const total = values.length;

  // Determine dominant type (80% threshold)
  if (numberCount / total >= 0.8) return 'number';
  if (booleanCount / total >= 0.8) return 'boolean';
  if (dateCount / total >= 0.8) return 'date';

  // Check for enum pattern (low cardinality)
  if (uniqueCount <= 10 && uniqueCount / total < 0.3) {
    return 'enum';
  }

  // Mixed types
  if (numberCount > 0 && stringCount > 0) return 'mixed';

  return 'string';
}

/**
 * Get the type of a single value
 */
function getValueType(value: unknown): 'number' | 'boolean' | 'date' | 'string' {
  // Check for actual number type
  if (typeof value === 'number' && !isNaN(value)) {
    return 'number';
  }

  // Check for actual boolean
  if (typeof value === 'boolean') {
    return 'boolean';
  }

  // Check for Date object
  if (value instanceof Date) {
    return 'date';
  }

  // Check string representations
  const strValue = String(value);

  // Boolean strings
  if (PATTERNS.boolean_true.test(strValue) || PATTERNS.boolean_false.test(strValue)) {
    return 'boolean';
  }

  // Number strings
  if (PATTERNS.integer.test(strValue) || PATTERNS.decimal.test(strValue)) {
    return 'number';
  }

  // Date strings
  if (
    PATTERNS.date_iso.test(strValue) ||
    PATTERNS.date_us.test(strValue) ||
    PATTERNS.date_eu.test(strValue)
  ) {
    return 'date';
  }

  return 'string';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a column appears to be an identifier/key column
 */
export function isIdentifierColumn(analysis: ColumnAnalysis): boolean {
  // High uniqueness
  if (analysis.uniqueCount === analysis.totalCount - analysis.nullCount) {
    return true;
  }

  // Header suggests ID
  const idKeywords = ['id', 'key', 'code', 'identifier', 'uuid'];
  const normalizedHeader = analysis.headerName.toLowerCase();

  return idKeywords.some(keyword => normalizedHeader.includes(keyword));
}

/**
 * Check if a column appears to be a reference/foreign key
 */
export function isReferenceColumn(analysis: ColumnAnalysis, headerName: string): boolean {
  const refKeywords = ['parent', 'reference', 'ref', 'linked', 'related'];
  const normalizedHeader = headerName.toLowerCase();

  return refKeywords.some(keyword => normalizedHeader.includes(keyword));
}

/**
 * Get column fill percentage
 */
export function getColumnFillPercentage(analysis: ColumnAnalysis): number {
  if (analysis.totalCount === 0) return 0;
  return ((analysis.totalCount - analysis.nullCount) / analysis.totalCount) * 100;
}

/**
 * Check if column data matches expected field type
 */
export function isTypeCompatible(
  columnType: InferredDataType,
  expectedType: string
): boolean {
  const compatibilityMap: Record<string, InferredDataType[]> = {
    string: ['string', 'email', 'url', 'mixed'],
    number: ['number', 'currency', 'percentage'],
    date: ['date'],
    boolean: ['boolean'],
    enum: ['enum', 'string'],
    reference: ['string', 'number', 'mixed'],
  };

  const compatibleTypes = compatibilityMap[expectedType] || ['string'];
  return compatibleTypes.includes(columnType);
}
