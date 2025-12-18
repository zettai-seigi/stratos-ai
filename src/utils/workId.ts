/**
 * Work ID Generation and Management Utilities
 *
 * Work ID Format: [DEPT]-[YY]-[CATEGORY]-[SEQ]
 * Example: OPS-25-GROW-012
 */

import {
  DepartmentCode,
  ProjectCategory,
  Project,
  DEPARTMENTS,
  PROJECT_CATEGORIES,
} from '../types';

/**
 * Generate a Work ID from components
 * @param departmentCode - Department code (e.g., "OPS")
 * @param fiscalYear - Full year (e.g., 2025)
 * @param category - Project category (e.g., "GROW")
 * @param sequenceNumber - Sequence number within category
 * @returns Formatted Work ID string
 */
export function generateWorkId(
  departmentCode: DepartmentCode,
  fiscalYear: number,
  category: ProjectCategory,
  sequenceNumber: number
): string {
  const yearShort = fiscalYear.toString().slice(-2);
  const seqPadded = sequenceNumber.toString().padStart(3, '0');
  return `${departmentCode}-${yearShort}-${category}-${seqPadded}`;
}

/**
 * Parse a Work ID into its components
 * @param workId - The Work ID string to parse
 * @returns Object with parsed components or null if invalid
 */
export function parseWorkId(workId: string): {
  departmentCode: DepartmentCode;
  fiscalYear: number;
  category: ProjectCategory;
  sequenceNumber: number;
} | null {
  const parts = workId.split('-');
  if (parts.length !== 4) return null;

  const [dept, year, cat, seq] = parts;

  // Validate department code
  if (!Object.keys(DEPARTMENTS).includes(dept)) return null;

  // Validate category
  if (!Object.keys(PROJECT_CATEGORIES).includes(cat)) return null;

  // Parse year (assumes 2000s)
  const fiscalYear = 2000 + parseInt(year, 10);
  if (isNaN(fiscalYear)) return null;

  // Parse sequence number
  const sequenceNumber = parseInt(seq, 10);
  if (isNaN(sequenceNumber)) return null;

  return {
    departmentCode: dept as DepartmentCode,
    fiscalYear,
    category: cat as ProjectCategory,
    sequenceNumber,
  };
}

/**
 * Get the next sequence number for a given department, year, and category
 * @param projects - Existing projects array
 * @param departmentCode - Department code
 * @param fiscalYear - Fiscal year
 * @param category - Project category
 * @returns Next available sequence number
 */
export function getNextSequenceNumber(
  projects: Project[],
  departmentCode: DepartmentCode,
  fiscalYear: number,
  category: ProjectCategory
): number {
  const matchingProjects = projects.filter(
    (p) =>
      p.departmentCode === departmentCode &&
      p.fiscalYear === fiscalYear &&
      p.category === category
  );

  if (matchingProjects.length === 0) return 1;

  const maxSeq = Math.max(...matchingProjects.map((p) => p.sequenceNumber));
  return maxSeq + 1;
}

/**
 * Create a new project with auto-generated Work ID
 * @param projects - Existing projects array
 * @param projectData - Project data without Work ID fields
 * @returns Project data with Work ID fields populated
 */
export function createProjectWithWorkId(
  projects: Project[],
  projectData: Omit<Project, 'workId' | 'sequenceNumber'> & {
    departmentCode: DepartmentCode;
    category: ProjectCategory;
    fiscalYear: number;
  }
): Project {
  const sequenceNumber = getNextSequenceNumber(
    projects,
    projectData.departmentCode,
    projectData.fiscalYear,
    projectData.category
  );

  const workId = generateWorkId(
    projectData.departmentCode,
    projectData.fiscalYear,
    projectData.category,
    sequenceNumber
  );

  return {
    ...projectData,
    sequenceNumber,
    workId,
  };
}

/**
 * Validate a Work ID format
 * @param workId - The Work ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidWorkId(workId: string): boolean {
  return parseWorkId(workId) !== null;
}

/**
 * Get department display info
 * @param code - Department code
 * @returns Department info or undefined
 */
export function getDepartmentInfo(code: DepartmentCode) {
  return DEPARTMENTS[code];
}

/**
 * Get category display info
 * @param code - Category code
 * @returns Category info or undefined
 */
export function getCategoryInfo(code: ProjectCategory) {
  return PROJECT_CATEGORIES[code];
}

/**
 * Get current fiscal year based on date
 * Assumes fiscal year starts in January
 * @param date - Optional date, defaults to current date
 * @returns Fiscal year number
 */
export function getCurrentFiscalYear(date: Date = new Date()): number {
  return date.getFullYear();
}

/**
 * Format Work ID for display with department and category names
 * @param project - Project with Work ID
 * @returns Formatted display string
 */
export function formatWorkIdDisplay(project: Project): string {
  const dept = DEPARTMENTS[project.departmentCode];
  const cat = PROJECT_CATEGORIES[project.category];
  return `${project.workId} (${dept?.name} - ${cat?.name})`;
}
