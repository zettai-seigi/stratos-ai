/**
 * Organization Hierarchy Types - Tier 2 of the organizational hierarchy
 *
 * Represents the organizational structure within each Company:
 * Directorate → Division → Department → Section
 *
 * Note: 'Section' is the lowest level and is operational only (no BSC capability)
 */

// Organization levels within a company (no longer includes 'company' - see corporate.ts)
export type OrgLevel = 'directorate' | 'division' | 'department' | 'section';

// Levels that cannot have BSC (operational only)
export const LEVELS_WITHOUT_BSC: OrgLevel[] = ['section'];

export interface OrgUnit {
  id: string;
  name: string;
  code: string;                    // Short code (e.g., "IT", "FIN-NA")
  level: OrgLevel;
  parentId: string | null;         // null for top-level directorates

  // NEW: Link to corporate entity (which company this belongs to)
  companyId: string;

  description?: string;
  headId?: string;                 // Resource ID of unit head

  // BSC Configuration (Section level cannot have BSC)
  hasBSC: boolean;                 // Does this unit have its own BSC?
  inheritBSCFromId?: string;       // If no BSC, inherit from which parent?

  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgHierarchyConfig {
  levelNames: Record<OrgLevel, string>;  // Configurable labels
  levelsWithBSC: OrgLevel[];             // Which levels can have BSC
  defaultBSCLevel: OrgLevel;
}

export interface OrgUnitMetrics {
  orgUnitId: string;
  directInitiativeCount: number;
  directProjectCount: number;
  totalInitiativeCount: number;    // Includes descendants
  totalProjectCount: number;
  totalBudget: number;
  totalSpentBudget: number;
  weightedRAG: 'green' | 'amber' | 'red' | 'gray';
  ragBreakdown: { green: number; amber: number; red: number };
}

// Helper type for org level ordering
export const ORG_LEVEL_ORDER: Record<OrgLevel, number> = {
  directorate: 1,
  division: 2,
  department: 3,
  section: 4,
};

// Default configuration for organization hierarchy
export const DEFAULT_ORG_CONFIG: OrgHierarchyConfig = {
  levelNames: {
    directorate: 'Directorate',
    division: 'Division',
    department: 'Department',
    section: 'Section',
  },
  levelsWithBSC: ['directorate', 'division', 'department'], // Section excluded
  defaultBSCLevel: 'directorate',
};

// Helper to get child level
export function getChildLevel(level: OrgLevel): OrgLevel | null {
  switch (level) {
    case 'directorate': return 'division';
    case 'division': return 'department';
    case 'department': return 'section';
    case 'section': return null;
  }
}

// Helper to get parent level
export function getParentLevel(level: OrgLevel): OrgLevel | null {
  switch (level) {
    case 'directorate': return null; // Parent is company (corporate entity)
    case 'division': return 'directorate';
    case 'department': return 'division';
    case 'section': return 'department';
  }
}

// Check if a level can have BSC
export function levelCanHaveBSC(level: OrgLevel): boolean {
  return !LEVELS_WITHOUT_BSC.includes(level);
}

// Get all levels that can have BSC
export function getLevelsWithBSC(): OrgLevel[] {
  const allLevels: OrgLevel[] = ['directorate', 'division', 'department', 'section'];
  return allLevels.filter(l => !LEVELS_WITHOUT_BSC.includes(l));
}

/**
 * Create a new org unit with defaults
 */
export function createOrgUnit(
  partial: Partial<OrgUnit> & Pick<OrgUnit, 'name' | 'level' | 'companyId'>
): OrgUnit {
  const now = new Date().toISOString();
  const canHaveBSC = levelCanHaveBSC(partial.level);

  return {
    id: partial.id || `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: partial.name,
    code: partial.code || partial.name.substring(0, 10).toUpperCase().replace(/\s+/g, ''),
    level: partial.level,
    parentId: partial.parentId ?? null,
    companyId: partial.companyId,
    description: partial.description ?? '',
    headId: partial.headId,
    hasBSC: canHaveBSC ? (partial.hasBSC ?? true) : false, // Force false for section
    inheritBSCFromId: partial.inheritBSCFromId,
    displayOrder: partial.displayOrder ?? 0,
    isActive: partial.isActive ?? true,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * Get direct children of an org unit
 */
export function getChildOrgUnits(
  parentId: string,
  orgUnits: OrgUnit[]
): OrgUnit[] {
  return orgUnits
    .filter(u => u.parentId === parentId && u.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get all descendants of an org unit (children, grandchildren, etc.)
 */
export function getDescendantOrgUnits(
  orgUnitId: string,
  orgUnits: OrgUnit[]
): OrgUnit[] {
  const descendants: OrgUnit[] = [];
  const queue = orgUnits.filter(u => u.parentId === orgUnitId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    descendants.push(current);
    const children = orgUnits.filter(u => u.parentId === current.id);
    queue.push(...children);
  }

  return descendants;
}

/**
 * Get ancestor chain of an org unit (parent, grandparent, etc.)
 */
export function getAncestorOrgUnits(
  orgUnitId: string,
  orgUnits: OrgUnit[]
): OrgUnit[] {
  const ancestors: OrgUnit[] = [];
  let current = orgUnits.find(u => u.id === orgUnitId);

  while (current?.parentId) {
    const parent = orgUnits.find(u => u.id === current!.parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Get all org units for a specific company
 */
export function getOrgUnitsForCompany(
  companyId: string,
  orgUnits: OrgUnit[]
): OrgUnit[] {
  return orgUnits
    .filter(u => u.companyId === companyId && u.isActive)
    .sort((a, b) => {
      // Sort by level first, then by displayOrder
      const levelDiff = ORG_LEVEL_ORDER[a.level] - ORG_LEVEL_ORDER[b.level];
      if (levelDiff !== 0) return levelDiff;
      return a.displayOrder - b.displayOrder;
    });
}

/**
 * Get top-level org units (directorates) for a company
 */
export function getTopLevelOrgUnits(
  companyId: string,
  orgUnits: OrgUnit[]
): OrgUnit[] {
  return orgUnits
    .filter(u => u.companyId === companyId && !u.parentId && u.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Validate org unit hierarchy integrity
 */
export function validateOrgHierarchy(
  orgUnits: OrgUnit[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for orphaned units (non-root with invalid parent)
  orgUnits.forEach(u => {
    if (u.parentId) {
      const parent = orgUnits.find(p => p.id === u.parentId);
      if (!parent) {
        errors.push(`Org unit "${u.name}" has invalid parent reference`);
      } else if (parent.companyId !== u.companyId) {
        errors.push(`Org unit "${u.name}" has parent in different company`);
      }
    }
  });

  // Check for section with BSC (not allowed)
  orgUnits.forEach(u => {
    if (u.level === 'section' && u.hasBSC) {
      errors.push(`Section "${u.name}" cannot have BSC capability`);
    }
  });

  // Check hierarchy level consistency
  orgUnits.forEach(u => {
    if (u.parentId) {
      const parent = orgUnits.find(p => p.id === u.parentId);
      if (parent) {
        const expectedParentLevel = getParentLevel(u.level);
        if (expectedParentLevel && parent.level !== expectedParentLevel) {
          errors.push(
            `Org unit "${u.name}" (${u.level}) has invalid parent level: ${parent.level}`
          );
        }
      }
    }
  });

  // Check for circular references
  orgUnits.forEach(u => {
    const visited = new Set<string>();
    let current: OrgUnit | undefined = u;
    while (current?.parentId) {
      if (visited.has(current.id)) {
        errors.push(`Circular reference detected involving "${u.name}"`);
        break;
      }
      visited.add(current.id);
      current = orgUnits.find(p => p.id === current!.parentId);
    }
  });

  return { valid: errors.length === 0, errors };
}
