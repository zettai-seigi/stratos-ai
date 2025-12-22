// Organization Hierarchy Roll-up Calculations

import { AppState, RAGStatus, Initiative, Project } from '../types';
import { OrgUnit, OrgUnitMetrics } from '../types/organization';

/**
 * Get all descendant org unit IDs (children, grandchildren, etc.)
 */
export function getDescendantIds(orgUnitId: string, orgUnits: OrgUnit[]): string[] {
  const descendants: string[] = [];
  const queue = orgUnits.filter((u) => u.parentId === orgUnitId && u.isActive);

  while (queue.length > 0) {
    const unit = queue.shift()!;
    descendants.push(unit.id);
    const children = orgUnits.filter((u) => u.parentId === unit.id && u.isActive);
    queue.push(...children);
  }

  return descendants;
}

/**
 * Calculate weighted RAG status based on budget.
 * - If red items make up > 20% of total budget weight → RED
 * - If red + amber items make up > 30% of total budget weight → AMBER
 * - Otherwise → GREEN
 */
export function calculateWeightedRAG(
  items: Array<{ ragStatus: RAGStatus; budget: number }>
): RAGStatus {
  if (items.length === 0) return 'green';

  const totalBudget = items.reduce((sum, item) => sum + (item.budget || 0), 0);

  if (totalBudget === 0) {
    // If no budget, fall back to simple count-based calculation
    const redCount = items.filter((i) => i.ragStatus === 'red').length;
    const amberCount = items.filter((i) => i.ragStatus === 'amber').length;
    const total = items.length;

    if (redCount / total > 0.2) return 'red';
    if ((redCount + amberCount) / total > 0.3) return 'amber';
    return 'green';
  }

  const redBudget = items
    .filter((i) => i.ragStatus === 'red')
    .reduce((sum, i) => sum + (i.budget || 0), 0);

  const amberBudget = items
    .filter((i) => i.ragStatus === 'amber')
    .reduce((sum, i) => sum + (i.budget || 0), 0);

  const redWeight = redBudget / totalBudget;
  const amberWeight = amberBudget / totalBudget;

  if (redWeight > 0.2) return 'red';
  if (redWeight + amberWeight > 0.3) return 'amber';
  return 'green';
}

/**
 * Calculate RAG breakdown (count by status)
 */
export function calculateRAGBreakdown(
  items: Array<{ ragStatus: RAGStatus }>
): { green: number; amber: number; red: number } {
  return {
    green: items.filter((i) => i.ragStatus === 'green').length,
    amber: items.filter((i) => i.ragStatus === 'amber').length,
    red: items.filter((i) => i.ragStatus === 'red').length,
  };
}

/**
 * Calculate full metrics for an org unit including all descendants
 */
export function calculateOrgUnitMetrics(
  orgUnitId: string,
  state: AppState
): OrgUnitMetrics {
  const orgUnits = state.orgUnits || [];
  const descendantIds = getDescendantIds(orgUnitId, orgUnits);
  const allOrgIds = new Set([orgUnitId, ...descendantIds]);

  // Direct items (owned by this org unit specifically)
  const directInitiatives = state.initiatives.filter(
    (i) => (i.orgUnitId || 'org-company') === orgUnitId
  );
  const directProjects = state.projects.filter(
    (p) => (p.orgUnitId || 'org-company') === orgUnitId
  );

  // Total items (including descendants)
  const totalInitiatives = state.initiatives.filter((i) =>
    allOrgIds.has(i.orgUnitId || 'org-company')
  );
  const totalProjects = state.projects.filter((p) =>
    allOrgIds.has(p.orgUnitId || 'org-company')
  );

  // Budget calculations
  const totalBudget = totalInitiatives.reduce((sum, i) => sum + (i.budget || 0), 0) +
    totalProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const totalSpentBudget = totalInitiatives.reduce((sum, i) => sum + (i.spentBudget || 0), 0) +
    totalProjects.reduce((sum, p) => sum + (p.spentBudget || 0), 0);

  // RAG calculations - combine initiatives and projects
  const allItems = [
    ...totalInitiatives.map((i) => ({ ragStatus: i.ragStatus, budget: i.budget })),
    ...totalProjects.map((p) => ({ ragStatus: p.ragStatus, budget: p.budget })),
  ];

  const weightedRAG = calculateWeightedRAG(allItems);
  const ragBreakdown = calculateRAGBreakdown(allItems);

  return {
    orgUnitId,
    directInitiativeCount: directInitiatives.length,
    directProjectCount: directProjects.length,
    totalInitiativeCount: totalInitiatives.length,
    totalProjectCount: totalProjects.length,
    totalBudget,
    totalSpentBudget,
    weightedRAG,
    ragBreakdown,
  };
}

/**
 * Get metrics for all org units at a specific level
 */
export function getMetricsByLevel(
  state: AppState,
  level: 'company' | 'directorate' | 'division' | 'department'
): Map<string, OrgUnitMetrics> {
  const orgUnits = state.orgUnits || [];
  const unitsAtLevel = orgUnits.filter((u) => u.level === level && u.isActive);

  const metricsMap = new Map<string, OrgUnitMetrics>();
  for (const unit of unitsAtLevel) {
    metricsMap.set(unit.id, calculateOrgUnitMetrics(unit.id, state));
  }

  return metricsMap;
}

/**
 * Calculate aggregate pillar health for an org unit
 */
export function calculatePillarHealthForOrg(
  orgUnitId: string,
  state: AppState
): { healthy: number; atRisk: number; critical: number; total: number } {
  const orgUnits = state.orgUnits || [];
  const descendantIds = getDescendantIds(orgUnitId, orgUnits);
  const allOrgIds = new Set([orgUnitId, ...descendantIds]);

  // Get pillars for this org and descendants
  const pillars = state.pillars.filter((p) =>
    allOrgIds.has(p.orgUnitId || 'org-company')
  );

  return {
    healthy: pillars.filter((p) => p.ragStatus === 'green').length,
    atRisk: pillars.filter((p) => p.ragStatus === 'amber').length,
    critical: pillars.filter((p) => p.ragStatus === 'red').length,
    total: pillars.length,
  };
}

/**
 * Get budget utilization percentage for an org unit
 */
export function getBudgetUtilization(metrics: OrgUnitMetrics): number {
  if (metrics.totalBudget === 0) return 0;
  return Math.round((metrics.totalSpentBudget / metrics.totalBudget) * 100);
}

/**
 * Format currency for display
 */
export function formatBudget(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}
