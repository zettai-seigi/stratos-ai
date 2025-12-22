/**
 * Corporate Structure Migration Utility
 *
 * Handles migration from the old single-company organization structure
 * to the new two-tier corporate/organization hierarchy.
 *
 * Migration path:
 * 1. Create default Corporation and Company if no corporate entities exist
 * 2. Migrate old 'company' level org units to corporate entities
 * 3. Update remaining org units with companyId
 * 4. Preserve all existing data references
 */

import type { AppState, OrgUnit, OrgLevel } from '../types';
import type { CorporateEntity } from '../types/corporate';
import {
  DEFAULT_CORPORATION,
  DEFAULT_COMPANY,
  createCorporateEntity,
} from '../types/corporate';
import { createOrgUnit, DEFAULT_ORG_CONFIG } from '../types/organization';
import {
  DEFAULT_ADMIN_USER,
  DEFAULT_ADMIN_ASSIGNMENT,
} from '../types/rbac';

/**
 * Check if migration to corporate structure is needed
 */
export function needsCorporateMigration(state: AppState): boolean {
  // Migration needed if no corporate entities exist
  return !state.corporateEntities || state.corporateEntities.length === 0;
}

/**
 * Migrate state to the new corporate structure
 */
export function migrateToCorporateStructure(state: AppState): AppState {
  if (!needsCorporateMigration(state)) {
    return state;
  }

  console.log('[Migration] Starting corporate structure migration...');

  const corporateEntities: CorporateEntity[] = [];
  const migratedOrgUnits: OrgUnit[] = [];
  const orgUnitToCompanyMap = new Map<string, string>(); // old org ID -> company ID

  // Step 1: Create root corporation
  const rootCorp: CorporateEntity = {
    ...DEFAULT_CORPORATION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  corporateEntities.push(rootCorp);

  // Step 2: Check for old org units and migrate them
  const oldOrgUnits = state.orgUnits || [];

  // Check if any old units have the legacy 'company' level (as a string check for migration)
  // We use 'as unknown as string' to allow comparison with legacy data that may have 'company' level
  const hasLegacyCompanyLevel = oldOrgUnits.some(
    (u) => (u.level as unknown as string) === 'company'
  );

  if (hasLegacyCompanyLevel) {
    // Filter legacy company-level units
    const oldCompanyUnits = oldOrgUnits.filter(
      (u) => (u.level as unknown as string) === 'company'
    );

    // Migrate each old company-level org unit to a CorporateEntity
    oldCompanyUnits.forEach((oldUnit, index) => {
      const companyEntity = createCorporateEntity({
        id: `company-${oldUnit.id}`,
        name: oldUnit.name,
        code: oldUnit.code,
        entityType: 'company',
        parentEntityId: rootCorp.id,
        description: oldUnit.description || `Migrated from org unit: ${oldUnit.name}`,
        hasBSC: oldUnit.hasBSC,
        bscScope: 'standalone',
        displayOrder: index,
        isActive: oldUnit.isActive,
      });
      corporateEntities.push(companyEntity);
      orgUnitToCompanyMap.set(oldUnit.id, companyEntity.id);
    });

    // Migrate non-company org units with updated companyId
    const nonCompanyUnits = oldOrgUnits.filter(
      (u) => (u.level as unknown as string) !== 'company'
    );

    nonCompanyUnits.forEach((unit) => {
      // Find which company this unit belongs to
      let companyId = findCompanyIdForOrgUnit(unit, oldOrgUnits, orgUnitToCompanyMap);

      // If no company found, use default
      if (!companyId) {
        companyId = corporateEntities.find((e) => e.entityType === 'company')?.id || DEFAULT_COMPANY.id;
      }

      const migratedUnit = createOrgUnit({
        ...unit,
        level: unit.level as OrgLevel,
        companyId,
        // Update parentId if parent was a company (now null since company is in corporate tier)
        parentId: orgUnitToCompanyMap.has(unit.parentId || '')
          ? null
          : unit.parentId,
      });

      migratedOrgUnits.push(migratedUnit);
    });
  } else if (oldOrgUnits.length > 0) {
    // Existing org units but no legacy company level - add companyId to each
    const defaultCompany: CorporateEntity = {
      ...DEFAULT_COMPANY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    corporateEntities.push(defaultCompany);

    oldOrgUnits.forEach((unit) => {
      // Add companyId to existing units if missing
      const migratedUnit = createOrgUnit({
        ...unit,
        level: unit.level as OrgLevel,
        companyId: (unit as OrgUnit & { companyId?: string }).companyId || defaultCompany.id,
      });
      migratedOrgUnits.push(migratedUnit);
    });
  } else {
    // No old company units - create default company and migrate existing org units
    const defaultCompany: CorporateEntity = {
      ...DEFAULT_COMPANY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    corporateEntities.push(defaultCompany);

    // Assign all existing org units to the default company
    oldOrgUnits.forEach((unit) => {
      const migratedUnit = createOrgUnit({
        ...unit,
        level: unit.level as OrgLevel,
        companyId: defaultCompany.id,
      });
      migratedOrgUnits.push(migratedUnit);
    });
  }

  // Step 3: Set up default RBAC
  const users = state.users || [{ ...DEFAULT_ADMIN_USER }];
  const userAssignments = state.userAssignments || [{ ...DEFAULT_ADMIN_ASSIGNMENT }];

  // Step 4: Build migrated state
  const migratedState: AppState = {
    ...state,
    corporateEntities,
    corporateConfig: state.corporateConfig,
    orgUnits: migratedOrgUnits,
    orgConfig: state.orgConfig || DEFAULT_ORG_CONFIG,
    users,
    userAssignments,
    currentUserId: state.currentUserId || DEFAULT_ADMIN_USER.id,
    setupWizardCompleted: state.setupWizardCompleted ?? false,
  };

  console.log('[Migration] Corporate structure migration complete:', {
    corporateEntities: corporateEntities.length,
    orgUnits: migratedOrgUnits.length,
    users: users.length,
  });

  return migratedState;
}

/**
 * Find the company ID for an org unit by traversing up the hierarchy
 */
function findCompanyIdForOrgUnit(
  unit: OrgUnit,
  allUnits: OrgUnit[],
  companyMap: Map<string, string>
): string | null {
  // If this unit's parent is a migrated company, return that company ID
  if (unit.parentId && companyMap.has(unit.parentId)) {
    return companyMap.get(unit.parentId) || null;
  }

  // Traverse up the hierarchy
  let current = unit;
  while (current.parentId) {
    if (companyMap.has(current.parentId)) {
      return companyMap.get(current.parentId) || null;
    }
    const parent = allUnits.find((u) => u.id === current.parentId);
    if (!parent) break;
    current = parent;
  }

  return null;
}

/**
 * Validate corporate structure integrity after migration
 */
export function validateCorporateStructure(state: AppState): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const corporateEntities = state.corporateEntities || [];
  const orgUnits = state.orgUnits || [];

  // Check for root corporation
  const rootCorps = corporateEntities.filter(
    (e) => e.entityType === 'corporation' && !e.parentEntityId
  );
  if (rootCorps.length === 0) {
    errors.push('No root corporation found');
  } else if (rootCorps.length > 1) {
    errors.push('Multiple root corporations found');
  }

  // Check for at least one company
  const companies = corporateEntities.filter((e) => e.entityType === 'company');
  if (companies.length === 0) {
    errors.push('No operating companies found');
  }

  // Check all org units have valid companyId
  orgUnits.forEach((unit) => {
    if (!unit.companyId) {
      errors.push(`Org unit "${unit.name}" has no company assignment`);
    } else if (!corporateEntities.some((e) => e.id === unit.companyId)) {
      errors.push(`Org unit "${unit.name}" references non-existent company`);
    }
  });

  // Check entity references in pillars, initiatives, projects
  const companyIds = new Set(corporateEntities.map((e) => e.id));
  const orgUnitIds = new Set(orgUnits.map((u) => u.id));

  (state.pillars || []).forEach((p) => {
    if (p.orgUnitId && !orgUnitIds.has(p.orgUnitId) && !companyIds.has(p.orgUnitId)) {
      warnings.push(`Pillar "${p.name}" references unknown org unit/entity`);
    }
  });

  (state.initiatives || []).forEach((i) => {
    if (i.orgUnitId && !orgUnitIds.has(i.orgUnitId) && !companyIds.has(i.orgUnitId)) {
      warnings.push(`Initiative "${i.name}" references unknown org unit/entity`);
    }
  });

  (state.projects || []).forEach((p) => {
    if (p.orgUnitId && !orgUnitIds.has(p.orgUnitId) && !companyIds.has(p.orgUnitId)) {
      warnings.push(`Project "${p.name}" references unknown org unit/entity`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Handle deletion of a corporate entity
 * - If company is deleted, reassign or delete associated org units
 * - Update any references in pillars/initiatives/projects
 */
export function handleCorporateEntityDeletion(
  state: AppState,
  entityId: string,
  reassignTo?: string
): AppState {
  const entity = state.corporateEntities?.find((e) => e.id === entityId);
  if (!entity) return state;

  // Cannot delete root corporation
  if (entity.entityType === 'corporation' && !entity.parentEntityId) {
    console.warn('Cannot delete root corporation');
    return state;
  }

  let updatedOrgUnits = state.orgUnits || [];
  let updatedPillars = state.pillars;
  let updatedInitiatives = state.initiatives;
  let updatedProjects = state.projects;

  // If this is a company, handle associated org units
  if (entity.entityType === 'company') {
    if (reassignTo) {
      // Reassign org units to another company
      updatedOrgUnits = updatedOrgUnits.map((u) =>
        u.companyId === entityId ? { ...u, companyId: reassignTo } : u
      );
    } else {
      // Delete org units associated with this company
      updatedOrgUnits = updatedOrgUnits.filter((u) => u.companyId !== entityId);
    }

    // Update references (set to undefined or reassign)
    updatedPillars = updatedPillars.map((p) =>
      p.orgUnitId === entityId
        ? { ...p, orgUnitId: reassignTo || undefined }
        : p
    );
    updatedInitiatives = updatedInitiatives.map((i) =>
      i.orgUnitId === entityId
        ? { ...i, orgUnitId: reassignTo || undefined }
        : i
    );
    updatedProjects = updatedProjects.map((p) =>
      p.orgUnitId === entityId
        ? { ...p, orgUnitId: reassignTo || undefined }
        : p
    );
  }

  // Remove the entity
  const updatedCorporateEntities = (state.corporateEntities || []).filter(
    (e) => e.id !== entityId
  );

  // Also remove any child entities
  const childIds = new Set<string>();
  const queue = [entityId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = (state.corporateEntities || []).filter(
      (e) => e.parentEntityId === currentId
    );
    children.forEach((c) => {
      childIds.add(c.id);
      queue.push(c.id);
    });
  }

  const finalCorporateEntities = updatedCorporateEntities.filter(
    (e) => !childIds.has(e.id)
  );

  return {
    ...state,
    corporateEntities: finalCorporateEntities,
    orgUnits: updatedOrgUnits,
    pillars: updatedPillars,
    initiatives: updatedInitiatives,
    projects: updatedProjects,
  };
}

/**
 * Handle deletion of an org unit
 * - Reassign children to parent or delete them
 * - Update references in pillars/initiatives/projects
 */
export function handleOrgUnitDeletion(
  state: AppState,
  orgUnitId: string,
  reassignChildrenTo?: string
): AppState {
  const orgUnits = state.orgUnits || [];
  const unit = orgUnits.find((u) => u.id === orgUnitId);
  if (!unit) return state;

  let updatedOrgUnits = [...orgUnits];
  let updatedPillars = state.pillars;
  let updatedInitiatives = state.initiatives;
  let updatedProjects = state.projects;

  // Handle children
  const children = orgUnits.filter((u) => u.parentId === orgUnitId);
  if (reassignChildrenTo) {
    // Reassign children to specified parent
    updatedOrgUnits = updatedOrgUnits.map((u) =>
      u.parentId === orgUnitId ? { ...u, parentId: reassignChildrenTo } : u
    );
  } else {
    // Delete children recursively
    const idsToDelete = new Set([orgUnitId]);
    const queue = [...children.map((c) => c.id)];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      idsToDelete.add(currentId);
      const grandchildren = orgUnits.filter((u) => u.parentId === currentId);
      queue.push(...grandchildren.map((c) => c.id));
    }
    updatedOrgUnits = updatedOrgUnits.filter((u) => !idsToDelete.has(u.id));
  }

  // Remove the unit itself
  updatedOrgUnits = updatedOrgUnits.filter((u) => u.id !== orgUnitId);

  // Update references
  updatedPillars = updatedPillars.map((p) =>
    p.orgUnitId === orgUnitId
      ? { ...p, orgUnitId: reassignChildrenTo || undefined }
      : p
  );
  updatedInitiatives = updatedInitiatives.map((i) =>
    i.orgUnitId === orgUnitId
      ? { ...i, orgUnitId: reassignChildrenTo || undefined }
      : i
  );
  updatedProjects = updatedProjects.map((p) =>
    p.orgUnitId === orgUnitId
      ? { ...p, orgUnitId: reassignChildrenTo || undefined }
      : p
  );

  return {
    ...state,
    orgUnits: updatedOrgUnits,
    pillars: updatedPillars,
    initiatives: updatedInitiatives,
    projects: updatedProjects,
  };
}

/**
 * Generate example corporate structure for demo/testing
 */
export function generateExampleCorporateStructure(): {
  corporateEntities: CorporateEntity[];
  orgUnits: OrgUnit[];
} {
  const now = new Date().toISOString();

  // Corporate structure
  const corporation: CorporateEntity = {
    id: 'corp-acme',
    name: 'ACME Corporation',
    code: 'ACME',
    entityType: 'corporation',
    parentEntityId: null,
    ownershipPercentage: 100,
    description: 'Global technology and innovation company',
    registeredCountry: 'US',
    currency: 'USD',
    hasBSC: true,
    bscScope: 'consolidated',
    isActive: true,
    displayOrder: 0,
    createdAt: now,
    updatedAt: now,
  };

  const holdingNA: CorporateEntity = {
    id: 'holding-na',
    name: 'ACME Holdings NA',
    code: 'ACME-NA',
    entityType: 'holding',
    parentEntityId: 'corp-acme',
    ownershipPercentage: 100,
    description: 'North American regional holding company',
    registeredCountry: 'US',
    currency: 'USD',
    hasBSC: true,
    bscScope: 'consolidated',
    isActive: true,
    displayOrder: 0,
    createdAt: now,
    updatedAt: now,
  };

  const companyUSA: CorporateEntity = {
    id: 'company-usa',
    name: 'ACME USA Inc.',
    code: 'ACME-US',
    entityType: 'company',
    parentEntityId: 'holding-na',
    ownershipPercentage: 100,
    description: 'US operating company',
    registeredCountry: 'US',
    currency: 'USD',
    hasBSC: true,
    bscScope: 'standalone',
    isActive: true,
    displayOrder: 0,
    createdAt: now,
    updatedAt: now,
  };

  const companyCanada: CorporateEntity = {
    id: 'company-canada',
    name: 'ACME Canada Ltd.',
    code: 'ACME-CA',
    entityType: 'company',
    parentEntityId: 'holding-na',
    ownershipPercentage: 100,
    description: 'Canadian operating company',
    registeredCountry: 'CA',
    currency: 'CAD',
    hasBSC: true,
    bscScope: 'standalone',
    isActive: true,
    displayOrder: 1,
    createdAt: now,
    updatedAt: now,
  };

  // Organization structure for USA company
  const techDirectorate = createOrgUnit({
    id: 'org-tech',
    name: 'Technology Directorate',
    code: 'TECH',
    level: 'directorate',
    parentId: null,
    companyId: 'company-usa',
    description: 'Technology and Engineering',
    hasBSC: true,
    displayOrder: 0,
  });

  const engDivision = createOrgUnit({
    id: 'org-eng',
    name: 'Engineering Division',
    code: 'ENG',
    level: 'division',
    parentId: 'org-tech',
    companyId: 'company-usa',
    description: 'Software Engineering',
    hasBSC: true,
    displayOrder: 0,
  });

  const frontendDept = createOrgUnit({
    id: 'org-frontend',
    name: 'Frontend Department',
    code: 'FE',
    level: 'department',
    parentId: 'org-eng',
    companyId: 'company-usa',
    description: 'Frontend Development',
    hasBSC: true,
    displayOrder: 0,
  });

  const reactSection = createOrgUnit({
    id: 'org-react',
    name: 'React Section',
    code: 'REACT',
    level: 'section',
    parentId: 'org-frontend',
    companyId: 'company-usa',
    description: 'React Development Team',
    hasBSC: false, // Section cannot have BSC
    displayOrder: 0,
  });

  return {
    corporateEntities: [corporation, holdingNA, companyUSA, companyCanada],
    orgUnits: [techDirectorate, engDivision, frontendDept, reactSection],
  };
}
