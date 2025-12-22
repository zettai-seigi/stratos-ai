// Migration Utility for Organization Hierarchy
// Handles backward compatibility when loading existing data without org units
// Note: This is the legacy migration. The main migration now happens in corporateMigration.ts

import { AppState } from '../types';
import { OrgUnit } from '../types/organization';
import { DEFAULT_ORG_CONFIG } from './orgDefaults';

/**
 * Check if the state needs org migration (no orgUnits defined)
 * Note: This is now mainly a passthrough - corporate migration handles the main setup
 */
export function needsOrgMigration(state: AppState): boolean {
  // Legacy migration is no longer needed since corporate migration handles everything
  // We keep this function for backward compatibility but it always returns false
  return false;
}

/**
 * Legacy migrate function - now just returns state unchanged.
 * The real migration happens in corporateMigration.ts which creates:
 * - Corporate entities (Corporation, Holdings, Companies)
 * - Organization units with companyId references
 */
export function migrateToOrgHierarchy(state: AppState): AppState {
  // Legacy migration is now handled by corporateMigration.ts
  // Just ensure orgConfig is set
  if (!state.orgConfig) {
    return {
      ...state,
      orgConfig: DEFAULT_ORG_CONFIG,
    };
  }
  return state;
}

/**
 * Validate org unit references in the state.
 * Returns array of issues found (empty = valid).
 * Now also validates companyId references against corporate entities.
 */
export function validateOrgReferences(state: AppState): string[] {
  const issues: string[] = [];
  const orgUnitIds = new Set((state.orgUnits || []).map(u => u.id));
  const corporateEntityIds = new Set((state.corporateEntities || []).map(e => e.id));
  const allValidIds = new Set([...orgUnitIds, ...corporateEntityIds]);

  // Check pillar references
  state.pillars.forEach(pillar => {
    if (pillar.orgUnitId && !allValidIds.has(pillar.orgUnitId)) {
      issues.push(`Pillar "${pillar.name}" references non-existent org unit/entity: ${pillar.orgUnitId}`);
    }
  });

  // Check initiative references
  state.initiatives.forEach(initiative => {
    if (initiative.orgUnitId && !allValidIds.has(initiative.orgUnitId)) {
      issues.push(`Initiative "${initiative.name}" references non-existent org unit/entity: ${initiative.orgUnitId}`);
    }
  });

  // Check project references
  state.projects.forEach(project => {
    if (project.orgUnitId && !allValidIds.has(project.orgUnitId)) {
      issues.push(`Project "${project.name}" references non-existent org unit/entity: ${project.orgUnitId}`);
    }
  });

  // Check resource references
  state.resources.forEach(resource => {
    if (resource.orgUnitId && !allValidIds.has(resource.orgUnitId)) {
      issues.push(`Resource "${resource.name}" references non-existent org unit/entity: ${resource.orgUnitId}`);
    }
  });

  // Check org unit parent references
  (state.orgUnits || []).forEach(unit => {
    if (unit.parentId && !orgUnitIds.has(unit.parentId)) {
      issues.push(`Org unit "${unit.name}" references non-existent parent: ${unit.parentId}`);
    }
    if (unit.inheritBSCFromId && !orgUnitIds.has(unit.inheritBSCFromId)) {
      issues.push(`Org unit "${unit.name}" inherits BSC from non-existent unit: ${unit.inheritBSCFromId}`);
    }
    if (unit.companyId && !corporateEntityIds.has(unit.companyId)) {
      issues.push(`Org unit "${unit.name}" references non-existent company: ${unit.companyId}`);
    }
  });

  return issues;
}

/**
 * Get the effective BSC org unit for a given unit.
 * If the unit has its own BSC, returns itself.
 * Otherwise, follows inheritBSCFromId chain until finding a unit with BSC.
 */
export function getEffectiveBSCUnit(
  orgUnitId: string,
  orgUnits: OrgUnit[]
): OrgUnit | undefined {
  const visited = new Set<string>();
  let currentId: string | undefined = orgUnitId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const unit = orgUnits.find(u => u.id === currentId);

    if (!unit) return undefined;
    if (unit.hasBSC) return unit;

    // Follow inheritance chain
    currentId = unit.inheritBSCFromId || unit.parentId || undefined;
  }

  // Fallback to first directorate with BSC if no BSC found in chain
  return orgUnits.find(u => u.level === 'directorate' && u.hasBSC);
}

/**
 * Reassign entities when an org unit is deleted.
 * Moves all entities to the parent unit or undefined (company level).
 */
export function reassignOnOrgDelete(
  state: AppState,
  deletedOrgUnitId: string
): AppState {
  const orgUnits = state.orgUnits || [];
  const deletedUnit = orgUnits.find(u => u.id === deletedOrgUnitId);

  if (!deletedUnit) return state;

  // Find the parent to reassign to (or undefined for company level via corporate entities)
  const newOrgUnitId = deletedUnit.parentId || undefined;

  return {
    ...state,
    pillars: state.pillars.map(p =>
      p.orgUnitId === deletedOrgUnitId ? { ...p, orgUnitId: newOrgUnitId } : p
    ),
    initiatives: state.initiatives.map(i =>
      i.orgUnitId === deletedOrgUnitId ? { ...i, orgUnitId: newOrgUnitId } : i
    ),
    projects: state.projects.map(p =>
      p.orgUnitId === deletedOrgUnitId ? { ...p, orgUnitId: newOrgUnitId } : p
    ),
    resources: state.resources.map(r =>
      r.orgUnitId === deletedOrgUnitId ? { ...r, orgUnitId: newOrgUnitId } : r
    ),
    // Update org units - remove deleted and update children's parentId
    orgUnits: orgUnits
      .filter(u => u.id !== deletedOrgUnitId)
      .map(u => {
        if (u.parentId === deletedOrgUnitId) {
          return { ...u, parentId: deletedUnit.parentId };
        }
        if (u.inheritBSCFromId === deletedOrgUnitId) {
          const newBSCId = deletedUnit.inheritBSCFromId || deletedUnit.parentId;
          return { ...u, inheritBSCFromId: newBSCId || undefined };
        }
        return u;
      }),
  };
}
