/**
 * Mapping Engine for Smart Import
 * AI/Heuristic-based column-to-field mapping suggestions
 */

import {
  ImportEntityType,
  MappingSuggestion,
  AlternativeMapping,
  ColumnAnalysis,
  HeuristicScore,
  ConfidenceResult,
} from '../../types/smartImport';
import { FieldSchema, ENTITY_SCHEMAS } from './fieldSchemas';
import { compositeMatch, normalize, fuzzyMatchWithAbbreviations } from './fuzzyMatcher';
import { isTypeCompatible } from './columnAnalyzer';

// =============================================================================
// HEURISTIC WEIGHTS
// =============================================================================

const WEIGHTS = {
  headerNameMatch: 0.40,
  dataTypeMatch: 0.25,
  patternMatch: 0.20,
  semanticMatch: 0.15,
};

// =============================================================================
// MAIN MAPPING FUNCTION
// =============================================================================

/**
 * Generate mapping suggestions for all columns to an entity type's fields
 */
export function generateMappingSuggestions(
  columns: ColumnAnalysis[],
  entityType: ImportEntityType
): MappingSuggestion[] {
  const schema = ENTITY_SCHEMAS[entityType];
  const suggestions: MappingSuggestion[] = [];
  const usedFields = new Set<string>();

  // Score each column against each field
  const allScores: Array<{
    column: ColumnAnalysis;
    field: FieldSchema;
    confidence: ConfidenceResult;
  }> = [];

  for (const column of columns) {
    for (const field of schema.fields) {
      const confidence = calculateConfidence(column, field);
      if (confidence.totalConfidence > 0) {
        allScores.push({ column, field, confidence });
      }
    }
  }

  // Sort by confidence descending
  allScores.sort((a, b) => b.confidence.totalConfidence - a.confidence.totalConfidence);

  // Greedy assignment - best matches first
  const assignedColumns = new Set<number>();

  for (const { column, field, confidence } of allScores) {
    // Skip if column or field already assigned
    if (assignedColumns.has(column.columnIndex) || usedFields.has(field.name)) {
      continue;
    }

    // Only assign if confidence is above threshold
    if (confidence.totalConfidence >= 30) {
      // Find alternatives for this column
      const alternatives = findAlternatives(column, schema.fields, field.name, usedFields);

      suggestions.push({
        sourceColumnIndex: column.columnIndex,
        sourceColumnName: column.headerName,
        targetField: field.name,
        targetFieldLabel: field.label,
        confidence: confidence.totalConfidence,
        matchReason: formatMatchReason(confidence.scores),
        isRequired: field.required,
        alternatives,
      });

      assignedColumns.add(column.columnIndex);
      usedFields.add(field.name);
    }
  }

  // Add unassigned columns with no suggestions
  for (const column of columns) {
    if (!assignedColumns.has(column.columnIndex)) {
      // Find potential alternatives even for unmapped columns
      const alternatives = findAlternatives(column, schema.fields, null, usedFields);

      suggestions.push({
        sourceColumnIndex: column.columnIndex,
        sourceColumnName: column.headerName,
        targetField: '',
        targetFieldLabel: '',
        confidence: 0,
        matchReason: 'No confident match found',
        isRequired: false,
        alternatives,
      });
    }
  }

  // Sort by column index for display
  return suggestions.sort((a, b) => a.sourceColumnIndex - b.sourceColumnIndex);
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

/**
 * Calculate overall confidence score using multiple heuristics
 */
function calculateConfidence(
  column: ColumnAnalysis,
  field: FieldSchema
): ConfidenceResult {
  const scores: HeuristicScore[] = [];

  // Strategy 1: Header Name Match (40%)
  const headerScore = calculateHeaderScore(column.headerName, field);
  scores.push({
    strategy: 'Header Match',
    score: headerScore.score,
    weight: WEIGHTS.headerNameMatch,
    reason: headerScore.reason,
  });

  // Strategy 2: Data Type Compatibility (25%)
  const typeScore = calculateTypeScore(column, field);
  scores.push({
    strategy: 'Type Match',
    score: typeScore.score,
    weight: WEIGHTS.dataTypeMatch,
    reason: typeScore.reason,
  });

  // Strategy 3: Pattern Match (20%)
  const patternScore = calculatePatternScore(column, field);
  scores.push({
    strategy: 'Pattern Match',
    score: patternScore.score,
    weight: WEIGHTS.patternMatch,
    reason: patternScore.reason,
  });

  // Strategy 4: Semantic Match (15%)
  const semanticScore = calculateSemanticScore(column.headerName, field);
  scores.push({
    strategy: 'Semantic Match',
    score: semanticScore.score,
    weight: WEIGHTS.semanticMatch,
    reason: semanticScore.reason,
  });

  // Calculate weighted total
  const totalConfidence = Math.round(
    scores.reduce((sum, s) => sum + s.score * s.weight, 0)
  );

  return {
    totalConfidence,
    scores,
    topMatch: totalConfidence >= 30 ? field.name : null,
  };
}

// =============================================================================
// INDIVIDUAL HEURISTICS
// =============================================================================

/**
 * Strategy 1: Header Name Match
 * Fuzzy matching with aliases and abbreviations
 */
function calculateHeaderScore(
  headerName: string,
  field: FieldSchema
): { score: number; reason: string } {
  // Check exact match with field name
  if (normalize(headerName) === normalize(field.name)) {
    return { score: 100, reason: `Exact match: "${field.name}"` };
  }

  // Check exact match with label
  if (normalize(headerName) === normalize(field.label)) {
    return { score: 100, reason: `Exact match: "${field.label}"` };
  }

  // Use composite matching (includes aliases and abbreviations)
  const result = compositeMatch(headerName, field.name, [field.label, ...field.aliases]);

  return {
    score: result.score,
    reason: result.reason,
  };
}

/**
 * Strategy 2: Data Type Compatibility
 */
function calculateTypeScore(
  column: ColumnAnalysis,
  field: FieldSchema
): { score: number; reason: string } {
  // Direct type match
  if (column.inferredDataType === field.type) {
    return { score: 100, reason: `Type match: ${field.type}` };
  }

  // Check compatibility
  if (isTypeCompatible(column.inferredDataType, field.type)) {
    return { score: 70, reason: `Compatible type: ${column.inferredDataType} → ${field.type}` };
  }

  // String can be converted to most types
  if (column.inferredDataType === 'string') {
    return { score: 40, reason: 'String can be converted' };
  }

  return { score: 0, reason: 'Incompatible types' };
}

/**
 * Strategy 3: Pattern Match
 * Check if column values match expected patterns for the field
 */
function calculatePatternScore(
  column: ColumnAnalysis,
  field: FieldSchema
): { score: number; reason: string } {
  // Check field-specific patterns
  if (field.patterns && field.patterns.length > 0) {
    const sampleStrings = column.sampleValues.map(v => String(v));
    let matchCount = 0;

    for (const value of sampleStrings) {
      if (field.patterns.some((pattern: RegExp) => pattern.test(value))) {
        matchCount++;
      }
    }

    if (sampleStrings.length > 0) {
      const matchRate = matchCount / sampleStrings.length;
      if (matchRate >= 0.8) {
        return { score: 100, reason: 'Values match expected pattern' };
      }
      if (matchRate >= 0.5) {
        return { score: 70, reason: 'Some values match pattern' };
      }
    }
  }

  // Check detected patterns against field type
  if (field.type === 'date' && column.detectedPatterns.some(p => p.includes('date'))) {
    return { score: 90, reason: 'Date pattern detected' };
  }

  if (field.type === 'number' && column.detectedPatterns.some(p => ['currency', 'percentage'].includes(p))) {
    return { score: 80, reason: 'Numeric pattern detected' };
  }

  // Check enum values
  if (field.type === 'enum' && field.enumValues && column.possibleEnumValues) {
    const overlap = column.possibleEnumValues.filter(v =>
      field.enumValues!.some((e: string) => normalize(String(v)) === normalize(e))
    );
    if (overlap.length > 0) {
      const overlapRate = overlap.length / column.possibleEnumValues.length;
      return {
        score: Math.round(overlapRate * 100),
        reason: `${overlap.length} enum values match`,
      };
    }
  }

  return { score: 50, reason: 'No specific pattern match' };
}

/**
 * Strategy 4: Semantic Match
 * Check header keywords against field semantic tags
 */
function calculateSemanticScore(
  headerName: string,
  field: FieldSchema
): { score: number; reason: string } {
  if (!field.semanticTags || field.semanticTags.length === 0) {
    return { score: 50, reason: 'No semantic tags defined' };
  }

  const normalizedHeader = normalize(headerName);

  // Semantic keyword mappings
  const semanticKeywords: Record<string, string[]> = {
    name: ['name', 'title', 'label', 'identifier', 'id'],
    description: ['desc', 'detail', 'about', 'summary', 'note'],
    date: ['date', 'when', 'time', 'day', 'month', 'year'],
    start: ['start', 'begin', 'from', 'kick', 'launch'],
    end: ['end', 'finish', 'to', 'due', 'deadline', 'target'],
    budget: ['budget', 'cost', 'amount', 'price', 'spend', 'money', 'dollar'],
    hours: ['hour', 'time', 'effort', 'duration'],
    person: ['owner', 'manager', 'assignee', 'responsible', 'lead', 'resource'],
    status: ['status', 'state', 'phase', 'stage'],
    rag: ['rag', 'health', 'traffic', 'light', 'color'],
    parent: ['parent', 'linked', 'related', 'ref'],
    department: ['dept', 'department', 'function', 'team', 'unit'],
    priority: ['priority', 'urgent', 'important', 'level'],
    percentage: ['percent', 'pct', 'progress', 'complete'],
    email: ['email', 'mail', 'contact'],
  };

  // Check if header contains keywords from any of the field's semantic tags
  for (const tag of field.semanticTags) {
    const keywords = semanticKeywords[tag] || [];
    for (const keyword of keywords) {
      if (normalizedHeader.includes(normalize(keyword))) {
        return { score: 85, reason: `Contains "${keyword}" (${tag})` };
      }
    }
  }

  // Partial tag match
  for (const tag of field.semanticTags) {
    if (normalizedHeader.includes(normalize(tag))) {
      return { score: 70, reason: `Contains semantic tag "${tag}"` };
    }
  }

  return { score: 30, reason: 'Weak semantic match' };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find alternative mapping suggestions for a column
 */
function findAlternatives(
  column: ColumnAnalysis,
  fields: FieldSchema[],
  excludeField: string | null,
  usedFields: Set<string>
): AlternativeMapping[] {
  const alternatives: AlternativeMapping[] = [];

  for (const field of fields) {
    // Skip the already-assigned field and used fields
    if (field.name === excludeField || usedFields.has(field.name)) {
      continue;
    }

    const confidence = calculateConfidence(column, field);
    if (confidence.totalConfidence >= 30) {
      alternatives.push({
        targetField: field.name,
        confidence: confidence.totalConfidence,
        reason: formatMatchReason(confidence.scores),
      });
    }
  }

  // Sort by confidence and take top 3
  return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * Format match reasons from heuristic scores
 */
function formatMatchReason(scores: HeuristicScore[]): string {
  const significantScores = scores.filter(s => s.score >= 60);

  if (significantScores.length === 0) {
    return 'Low confidence match';
  }

  // Return the highest scoring reason
  const bestScore = significantScores.reduce((best, s) =>
    s.score * s.weight > best.score * best.weight ? s : best
  );

  return bestScore.reason;
}

// =============================================================================
// CONFIDENCE LEVEL HELPERS
// =============================================================================

/**
 * Get confidence level label
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' | 'none' {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  if (confidence >= 30) return 'low';
  return 'none';
}

/**
 * Get confidence color class for UI
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-rag-green';
  if (confidence >= 50) return 'text-rag-amber';
  if (confidence >= 30) return 'text-rag-red';
  return 'text-text-muted';
}

/**
 * Check if all required fields have mappings
 */
export function validateRequiredMappings(
  suggestions: MappingSuggestion[],
  entityType: ImportEntityType
): { isValid: boolean; missingFields: string[] } {
  const schema = ENTITY_SCHEMAS[entityType];
  const mappedFields = new Set(suggestions.filter(s => s.targetField).map(s => s.targetField));

  const missingFields: string[] = [];

  for (const field of schema.fields) {
    if (field.required && !mappedFields.has(field.name)) {
      missingFields.push(field.label);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
