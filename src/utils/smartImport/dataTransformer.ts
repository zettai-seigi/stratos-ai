/**
 * Data Transformer for Smart Import
 * Type conversions and data transformations
 */

import * as XLSX from 'xlsx';
import { FieldType } from '../../types/smartImport';

// =============================================================================
// VALUE TRANSFORMATION
// =============================================================================

export interface TransformResult {
  value: unknown;
  error?: string;
  warning?: string;
}

/**
 * Transform a raw value to the expected type
 */
export function transformValue(value: unknown, targetType: FieldType): TransformResult {
  if (value === null || value === undefined || value === '') {
    return { value: undefined };
  }

  switch (targetType) {
    case 'string':
      return transformToString(value);
    case 'number':
      return transformToNumber(value);
    case 'date':
      return transformToDate(value);
    case 'boolean':
      return transformToBoolean(value);
    case 'enum':
      return transformToString(value); // Enum validation happens elsewhere
    case 'reference':
      return transformToString(value); // Reference resolution happens elsewhere
    default:
      return { value: String(value) };
  }
}

// =============================================================================
// TYPE-SPECIFIC TRANSFORMERS
// =============================================================================

/**
 * Transform to string
 */
function transformToString(value: unknown): TransformResult {
  if (typeof value === 'string') {
    return { value: value.trim() };
  }
  return { value: String(value).trim() };
}

/**
 * Transform to number
 */
function transformToNumber(value: unknown): TransformResult {
  // Already a number
  if (typeof value === 'number' && !isNaN(value)) {
    return { value };
  }

  // String conversion
  const strValue = String(value).trim();

  // Handle currency format ($1,234.56)
  const cleanedValue = strValue
    .replace(/[$€£¥]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '');

  // Handle percentage (remove % and divide by 100 if needed)
  if (strValue.endsWith('%')) {
    const numValue = parseFloat(cleanedValue);
    if (!isNaN(numValue)) {
      return { value: numValue }; // Keep as percentage value, not decimal
    }
  }

  const numValue = parseFloat(cleanedValue);
  if (isNaN(numValue)) {
    return { value: undefined, error: `Invalid number: "${value}"` };
  }

  return { value: numValue };
}

/**
 * Transform to date (ISO string format)
 */
function transformToDate(value: unknown): TransformResult {
  // Already a Date
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return { value: undefined, error: 'Invalid date object' };
    }
    return { value: formatDate(value) };
  }

  // Excel serial date number
  if (typeof value === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        const date = new Date(parsed.y, parsed.m - 1, parsed.d);
        return { value: formatDate(date) };
      }
    } catch {
      // Fall through to string parsing
    }
  }

  // String parsing
  const strValue = String(value).trim();

  // ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(strValue)) {
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      return { value: formatDate(date) };
    }
  }

  // US format (MM/DD/YYYY) - require 4-digit year
  const usMatch = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return { value: formatDate(date) };
    }
  }

  // EU format (DD.MM.YYYY or DD/MM/YYYY) - require 4-digit year
  const euMatch = strValue.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return { value: formatDate(date) };
    }
  }

  // Reject 2-digit years explicitly
  const twoDigitYearMatch = strValue.match(/\/(\d{2})$|\.(\d{2})$/);
  if (twoDigitYearMatch) {
    return { value: undefined, error: `Invalid date "${value}": Please use 4-digit year (e.g., 2025)` };
  }

  // Try native Date parsing as last resort
  const date = new Date(strValue);
  if (!isNaN(date.getTime())) {
    return {
      value: formatDate(date),
      warning: 'Date format may be ambiguous',
    };
  }

  return { value: undefined, error: `Invalid date: "${value}"` };
}

/**
 * Transform to boolean
 */
function transformToBoolean(value: unknown): TransformResult {
  // Already a boolean
  if (typeof value === 'boolean') {
    return { value };
  }

  // Number (0 = false, anything else = true)
  if (typeof value === 'number') {
    return { value: value !== 0 };
  }

  // String
  const strValue = String(value).toLowerCase().trim();

  const trueValues = ['true', 'yes', 'y', '1', 'on', 'x', 'checked'];
  const falseValues = ['false', 'no', 'n', '0', 'off', '', 'unchecked'];

  if (trueValues.includes(strValue)) {
    return { value: true };
  }

  if (falseValues.includes(strValue)) {
    return { value: false };
  }

  return {
    value: false,
    warning: `Unrecognized boolean value "${value}", defaulting to false`,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string (convenience export)
 */
export function parseDate(value: unknown): string | null {
  const result = transformToDate(value);
  return result.value ? String(result.value) : null;
}

/**
 * Parse number (convenience export)
 */
export function parseNumber(value: unknown): number | null {
  const result = transformToNumber(value);
  return typeof result.value === 'number' ? result.value : null;
}

/**
 * Parse boolean (convenience export)
 */
export function parseBoolean(value: unknown): boolean {
  const result = transformToBoolean(value);
  return result.value === true;
}

// =============================================================================
// ENTITY TRANSFORMATION
// =============================================================================

/**
 * Apply default values to entity data
 */
export function applyDefaults(
  data: Record<string, unknown>,
  entityType: string
): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    pillar: {
      displayOrder: 0,
      ragStatus: 'green',
    },
    kpi: {
      previousValue: 0,
      unit: 'number',
    },
    initiative: {
      budget: 0,
      spentBudget: 0,
      ragStatus: 'green',
      description: '',
      ownerId: '',
    },
    project: {
      status: 'not_started',
      ragStatus: 'green',
      completionPercentage: 0,
      budget: 0,
      spentBudget: 0,
      departmentCode: 'IT',
      category: 'GROW',
      fiscalYear: new Date().getFullYear(),
      description: '',
      managerId: '',
    },
    task: {
      kanbanStatus: 'todo',
      estimatedHours: 8,
      actualHours: 0,
      priority: 'medium',
      isMilestone: false,
      description: '',
      assigneeId: '',
    },
    resource: {
      weeklyCapacity: 40,
      departmentCode: 'IT',
      email: '',
      role: '',
      team: '',
      // avatarColor is set dynamically based on name below
    },
    milestone: {
      status: 'pending',
      displayOrder: 0,
      linkedTaskIds: [],
    },
  };

  const entityDefaults = defaults[entityType] || {};

  // Apply defaults for undefined values
  for (const [key, defaultValue] of Object.entries(entityDefaults)) {
    if (data[key] === undefined) {
      data[key] = defaultValue;
    }
  }

  // Special handling: generate deterministic avatar color for resources based on name
  if (entityType === 'resource' && data.avatarColor === undefined) {
    data.avatarColor = getAvatarColor(String(data.name || ''));
  }

  return data;
}

/** Available avatar colors */
const AVATAR_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1',
  '#64748b', '#78716c',
];

/**
 * Generate a deterministic avatar color based on a string (e.g., name)
 * Same name will always produce the same color
 */
function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];

  // Simple hash function: sum of character codes
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Clean entity data by removing undefined values
 */
export function cleanEntityData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
