/**
 * Corporate Entity Types - Tier 1 of the organizational hierarchy
 *
 * Represents the legal/corporate structure:
 * Corporation → Holding Companies → Operating Companies
 *
 * Family-tree relationships: grandparent, parent, child, siblings (uncles)
 */

export type CorporateEntityType = 'corporation' | 'holding' | 'company';

/**
 * BSC Scope determines how balanced scorecard metrics are calculated
 * - consolidated: Rolls up metrics from all children
 * - standalone: Only tracks its own metrics
 * - none: No BSC capability (unusual for corporate entities)
 */
export type BSCScope = 'consolidated' | 'standalone' | 'none';

export interface CorporateEntity {
  id: string;
  name: string;
  code: string;                        // Short code (e.g., "ACME", "ACME-NA")
  entityType: CorporateEntityType;

  // Family tree relationships
  parentEntityId: string | null;       // null for root corporation
  ownershipPercentage?: number;        // 0-100, percentage of ownership

  // Metadata
  description?: string;
  registeredCountry?: string;
  currency?: string;
  fiscalYearEnd?: string;              // e.g., "12-31" for December 31

  // BSC Configuration
  hasBSC: boolean;
  bscScope: BSCScope;

  // Status
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Corporate hierarchy configuration - customizable level names
 */
export interface CorporateHierarchyConfig {
  levelNames: {
    corporation: string;
    holding: string;
    company: string;
  };
  enableOwnershipTracking: boolean;
  defaultCurrency: string;
  consolidatedReporting: boolean;
}

/**
 * Default corporate hierarchy configuration
 */
export const DEFAULT_CORPORATE_CONFIG: CorporateHierarchyConfig = {
  levelNames: {
    corporation: 'Corporation',
    holding: 'Holding Company',
    company: 'Operating Company',
  },
  enableOwnershipTracking: true,
  defaultCurrency: 'USD',
  consolidatedReporting: true,
};

/**
 * Metrics aggregated for a corporate entity
 */
export interface CorporateEntityMetrics {
  entityId: string;

  // Initiative/Project counts
  totalInitiatives: number;
  totalProjects: number;
  totalTasks: number;

  // RAG distribution
  greenCount: number;
  amberCount: number;
  redCount: number;

  // Budget
  totalBudget: number;
  totalActualSpend: number;
  budgetVariance: number;

  // Weighted RAG (budget-weighted)
  weightedRAG: 'green' | 'amber' | 'red' | 'gray';

  // Child entity metrics (for consolidated view)
  childEntityCount: number;
  childCompanyCount: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get sibling entities (same parent = uncles of children)
 */
export function getSiblingEntities(
  entityId: string,
  entities: CorporateEntity[]
): CorporateEntity[] {
  const entity = entities.find(e => e.id === entityId);
  if (!entity || !entity.parentEntityId) return [];

  return entities.filter(
    e => e.parentEntityId === entity.parentEntityId && e.id !== entityId
  );
}

/**
 * Get all ancestor entities (parent chain up to root)
 */
export function getAncestorEntities(
  entityId: string,
  entities: CorporateEntity[]
): CorporateEntity[] {
  const ancestors: CorporateEntity[] = [];
  let current = entities.find(e => e.id === entityId);

  while (current?.parentEntityId) {
    const parent = entities.find(e => e.id === current!.parentEntityId);
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
 * Get all descendant entities (children, grandchildren, etc.)
 */
export function getDescendantEntities(
  entityId: string,
  entities: CorporateEntity[]
): CorporateEntity[] {
  const descendants: CorporateEntity[] = [];
  const queue = entities.filter(e => e.parentEntityId === entityId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    descendants.push(current);
    const children = entities.filter(e => e.parentEntityId === current.id);
    queue.push(...children);
  }

  return descendants;
}

/**
 * Get direct children of an entity
 */
export function getChildEntities(
  parentId: string,
  entities: CorporateEntity[]
): CorporateEntity[] {
  return entities
    .filter(e => e.parentEntityId === parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get the root corporation (entity with no parent)
 */
export function getRootCorporation(
  entities: CorporateEntity[]
): CorporateEntity | undefined {
  return entities.find(e => e.entityType === 'corporation' && !e.parentEntityId);
}

/**
 * Get all operating companies (leaf entities for organizational structure)
 */
export function getAllCompanies(
  entities: CorporateEntity[]
): CorporateEntity[] {
  return entities
    .filter(e => e.entityType === 'company' && e.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Find the nearest company ancestor for an org unit
 */
export function findCompanyAncestor(
  entityId: string,
  entities: CorporateEntity[]
): CorporateEntity | undefined {
  const entity = entities.find(e => e.id === entityId);
  if (!entity) return undefined;

  if (entity.entityType === 'company') return entity;

  const ancestors = getAncestorEntities(entityId, entities);
  return ancestors.find(e => e.entityType === 'company');
}

/**
 * Validate corporate hierarchy integrity
 */
export function validateCorporateHierarchy(
  entities: CorporateEntity[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for exactly one root corporation
  const rootCorps = entities.filter(
    e => e.entityType === 'corporation' && !e.parentEntityId
  );
  if (rootCorps.length === 0) {
    errors.push('No root corporation found');
  } else if (rootCorps.length > 1) {
    errors.push('Multiple root corporations found');
  }

  // Check for orphaned entities (non-root with invalid parent)
  entities.forEach(e => {
    if (e.parentEntityId) {
      const parent = entities.find(p => p.id === e.parentEntityId);
      if (!parent) {
        errors.push(`Entity "${e.name}" has invalid parent reference`);
      }
    }
  });

  // Check hierarchy rules: corporation -> holding/company, holding -> company
  entities.forEach(e => {
    if (e.parentEntityId) {
      const parent = entities.find(p => p.id === e.parentEntityId);
      if (parent) {
        if (e.entityType === 'corporation') {
          errors.push(`Corporation "${e.name}" cannot have a parent`);
        }
        if (e.entityType === 'holding' && parent.entityType === 'company') {
          errors.push(`Holding "${e.name}" cannot be under a company`);
        }
      }
    }
  });

  // Check for circular references
  entities.forEach(e => {
    const visited = new Set<string>();
    let current: CorporateEntity | undefined = e;
    while (current?.parentEntityId) {
      if (visited.has(current.id)) {
        errors.push(`Circular reference detected involving "${e.name}"`);
        break;
      }
      visited.add(current.id);
      current = entities.find(p => p.id === current!.parentEntityId);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Create a new corporate entity with defaults
 */
export function createCorporateEntity(
  partial: Partial<CorporateEntity> & Pick<CorporateEntity, 'name' | 'entityType'>
): CorporateEntity {
  const now = new Date().toISOString();
  return {
    id: partial.id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: partial.name,
    code: partial.code || partial.name.substring(0, 10).toUpperCase().replace(/\s+/g, ''),
    entityType: partial.entityType,
    parentEntityId: partial.parentEntityId ?? null,
    ownershipPercentage: partial.ownershipPercentage ?? 100,
    description: partial.description ?? '',
    registeredCountry: partial.registeredCountry,
    currency: partial.currency ?? 'USD',
    fiscalYearEnd: partial.fiscalYearEnd ?? '12-31',
    hasBSC: partial.hasBSC ?? true,
    bscScope: partial.bscScope ?? (partial.entityType === 'company' ? 'standalone' : 'consolidated'),
    isActive: partial.isActive ?? true,
    displayOrder: partial.displayOrder ?? 0,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * Default corporation for new installations
 */
export const DEFAULT_CORPORATION: CorporateEntity = {
  id: 'corp-root',
  name: 'My Corporation',
  code: 'CORP',
  entityType: 'corporation',
  parentEntityId: null,
  ownershipPercentage: 100,
  description: 'Root corporate entity',
  registeredCountry: 'US',
  currency: 'USD',
  fiscalYearEnd: '12-31',
  hasBSC: true,
  bscScope: 'consolidated',
  isActive: true,
  displayOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Default company for new installations (child of default corporation)
 */
export const DEFAULT_COMPANY: CorporateEntity = {
  id: 'company-default',
  name: 'Main Company',
  code: 'MAIN',
  entityType: 'company',
  parentEntityId: 'corp-root',
  ownershipPercentage: 100,
  description: 'Primary operating company',
  registeredCountry: 'US',
  currency: 'USD',
  fiscalYearEnd: '12-31',
  hasBSC: true,
  bscScope: 'standalone',
  isActive: true,
  displayOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
