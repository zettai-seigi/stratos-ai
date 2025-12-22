/**
 * Excel Parser for Smart Import
 * Generic Excel parsing that can handle any structure
 */

import * as XLSX from 'xlsx';
import { ParsedWorkbook, SheetAnalysis, ImportEntityType } from '../../types/smartImport';
import { ENTITY_TYPE_KEYWORDS } from './fieldSchemas';
import { normalize, fuzzyMatch } from './fuzzyMatcher';

// =============================================================================
// MAIN PARSING FUNCTION
// =============================================================================

/**
 * Parse an Excel file and analyze its structure
 */
export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const parseErrors: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    const sheets: SheetAnalysis[] = [];

    for (const sheetName of workbook.SheetNames) {
      try {
        const sheet = workbook.Sheets[sheetName];
        const analysis = analyzeSheet(sheet, sheetName);
        sheets.push(analysis);
      } catch (error) {
        parseErrors.push(`Error parsing sheet "${sheetName}": ${error}`);
      }
    }

    return {
      fileName: file.name,
      sheets,
      parseErrors,
    };
  } catch (error) {
    return {
      fileName: file.name,
      sheets: [],
      parseErrors: [`Failed to parse Excel file: ${error}`],
    };
  }
}

// =============================================================================
// SHEET ANALYSIS
// =============================================================================

/**
 * Analyze a single sheet's structure
 */
function analyzeSheet(sheet: XLSX.WorkSheet, sheetName: string): SheetAnalysis {
  // Get sheet range
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rowCount = range.e.r - range.s.r; // Excluding header
  const columnCount = range.e.c - range.s.c + 1;

  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  // Extract headers (first row)
  const headers: string[] = [];
  if (jsonData.length > 0) {
    for (let i = 0; i < columnCount; i++) {
      const headerValue = jsonData[0]?.[i];
      headers.push(headerValue != null ? String(headerValue) : `Column ${i + 1}`);
    }
  }

  // Extract sample data (rows 2-11)
  const sampleData: unknown[][] = [];
  for (let i = 1; i <= Math.min(10, jsonData.length - 1); i++) {
    if (jsonData[i]) {
      sampleData.push(jsonData[i]);
    }
  }

  // Detect entity type
  const { entityType, confidence, reasons } = detectEntityType(sheetName, headers);

  return {
    sheetName,
    headers,
    sampleData,
    rowCount: Math.max(0, rowCount),
    columnCount,
    suggestedEntityType: entityType,
    entityConfidence: confidence,
    entityMatchReasons: reasons,
  };
}

// =============================================================================
// ENTITY TYPE DETECTION
// =============================================================================

/**
 * Detect the most likely entity type for a sheet
 */
function detectEntityType(
  sheetName: string,
  headers: string[]
): { entityType: ImportEntityType | null; confidence: number; reasons: string[] } {
  const scores: Record<ImportEntityType, { score: number; reasons: string[] }> = {
    pillar: { score: 0, reasons: [] },
    kpi: { score: 0, reasons: [] },
    initiative: { score: 0, reasons: [] },
    project: { score: 0, reasons: [] },
    task: { score: 0, reasons: [] },
    resource: { score: 0, reasons: [] },
    milestone: { score: 0, reasons: [] },
  };

  const normalizedSheetName = normalize(sheetName);

  // Score based on sheet name
  for (const [entityType, keywords] of Object.entries(ENTITY_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedSheetName.includes(normalize(keyword))) {
        scores[entityType as ImportEntityType].score += 40;
        scores[entityType as ImportEntityType].reasons.push(`Sheet name contains "${keyword}"`);
        break;
      }
    }
  }

  // Score based on headers
  const headerKeywords: Record<ImportEntityType, string[]> = {
    pillar: ['pillar', 'perspective', 'bsc'],
    kpi: ['target value', 'current value', 'kpi', 'metric', 'unit'],
    initiative: ['initiative', 'program', 'portfolio', 'sponsor'],
    project: ['project', 'work id', 'department', 'category', 'fiscal year', 'manager', 'budget'],
    task: ['task', 'assignee', 'kanban', 'wbs', 'estimated hours', 'due date', 'priority'],
    resource: ['email', 'capacity', 'hourly rate', 'team', 'role'],
    milestone: ['milestone', 'target date', 'completed date', 'gate'],
  };

  for (const header of headers) {
    const normalizedHeader = normalize(header);

    for (const [entityType, keywords] of Object.entries(headerKeywords)) {
      for (const keyword of keywords) {
        const matchScore = fuzzyMatch(normalizedHeader, normalize(keyword));
        if (matchScore >= 70) {
          const points = Math.round(matchScore / 10);
          scores[entityType as ImportEntityType].score += points;
          if (matchScore >= 85) {
            scores[entityType as ImportEntityType].reasons.push(`Header "${header}" matches "${keyword}"`);
          }
        }
      }
    }
  }

  // Special detection patterns
  // KPI: has both target and current value columns
  if (
    headers.some(h => normalize(h).includes('target')) &&
    headers.some(h => normalize(h).includes('current'))
  ) {
    scores.kpi.score += 20;
    scores.kpi.reasons.push('Has target and current value columns');
  }

  // Task: has status/kanban and hours columns
  if (
    headers.some(h => normalize(h).includes('status') || normalize(h).includes('kanban')) &&
    headers.some(h => normalize(h).includes('hour'))
  ) {
    scores.task.score += 15;
    scores.task.reasons.push('Has status and hours columns');
  }

  // Resource: has email pattern
  if (headers.some(h => normalize(h).includes('email'))) {
    scores.resource.score += 15;
    scores.resource.reasons.push('Has email column');
  }

  // Project: has budget and dates
  if (
    headers.some(h => normalize(h).includes('budget')) &&
    headers.some(h => normalize(h).includes('date'))
  ) {
    scores.project.score += 10;
    scores.project.reasons.push('Has budget and date columns');
  }

  // Find best match
  let bestType: ImportEntityType | null = null;
  let bestScore = 0;
  let bestReasons: string[] = [];

  for (const [entityType, { score, reasons }] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = entityType as ImportEntityType;
      bestReasons = reasons;
    }
  }

  // Calculate confidence (0-100)
  const confidence = Math.min(100, bestScore);

  // Only suggest if confidence is above threshold
  if (confidence < 30) {
    return { entityType: null, confidence: 0, reasons: [] };
  }

  return { entityType: bestType, confidence, reasons: bestReasons };
}

// =============================================================================
// DATA EXTRACTION
// =============================================================================

/**
 * Get raw data from a sheet (excluding header row)
 */
export function getSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string
): unknown[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  // Return all rows except header
  return jsonData.slice(1);
}

/**
 * Get raw XLSX workbook from file (for use in other functions)
 */
export async function getWorkbook(file: File): Promise<XLSX.WorkBook> {
  const arrayBuffer = await file.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a sheet appears to be empty or a reference/lookup sheet
 */
export function isDataSheet(analysis: SheetAnalysis): boolean {
  // Skip sheets with very few rows
  if (analysis.rowCount < 1) return false;

  // Skip sheets with common reference/lookup names
  const skipPatterns = ['lookup', 'reference', 'ref', 'instruction', 'help', 'summary', 'dashboard', 'codes'];
  const normalizedName = normalize(analysis.sheetName);

  for (const pattern of skipPatterns) {
    if (normalizedName.includes(pattern)) {
      return false;
    }
  }

  // Skip hidden lookup sheets (start with underscore)
  if (analysis.sheetName.startsWith('_')) {
    return false;
  }

  return true;
}

/**
 * Get non-empty cells count for a column
 */
export function getColumnFillRate(sampleData: unknown[][], columnIndex: number): number {
  if (sampleData.length === 0) return 0;

  let nonEmpty = 0;
  for (const row of sampleData) {
    if (row[columnIndex] != null && row[columnIndex] !== '') {
      nonEmpty++;
    }
  }

  return nonEmpty / sampleData.length;
}

/**
 * Extract unique values from a column
 */
export function getUniqueValues(sampleData: unknown[][], columnIndex: number): unknown[] {
  const values = new Set<unknown>();

  for (const row of sampleData) {
    const value = row[columnIndex];
    if (value != null && value !== '') {
      values.add(value);
    }
  }

  return Array.from(values);
}
