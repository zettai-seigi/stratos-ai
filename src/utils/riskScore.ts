/**
 * Comprehensive Risk Score Calculation
 *
 * Calculates risk based on the PPM holy trinity (Cost, Scope, Time) plus
 * resource and quality dimensions. Uses Earned Value Management (EVM)
 * principles where applicable.
 *
 * Risk Score: 0 = healthy, 100 = critical
 */

import {
  Initiative,
  Project,
  Task,
  Resource,
  RiskScoreBreakdown,
  RiskFactor,
  RiskScoreConfig,
} from '../types';
import { DEFAULT_RISK_SCORE_CONFIG } from './configDefaults';

// =============================================================================
// DEFAULT CONFIGURATION - Used when no config is provided
// =============================================================================

const DEFAULT_WEIGHTS = DEFAULT_RISK_SCORE_CONFIG.weights;
const DEFAULT_THRESHOLDS = DEFAULT_RISK_SCORE_CONFIG.thresholds;
const DEFAULT_RISK_LEVELS = DEFAULT_RISK_SCORE_CONFIG.riskLevels;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Calculate percentage of time elapsed in a date range
 */
function getTimeElapsedPercentage(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  const totalDuration = daysBetween(start, end);
  if (totalDuration <= 0) return 100;

  const elapsed = daysBetween(start, now);
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}

/**
 * Convert a 0-1 performance index to a risk score (0-100)
 * Lower performance = higher risk
 */
function performanceToRisk(index: number): number {
  if (index >= 1.0) return 0;
  if (index >= 0.95) return 10;
  if (index >= 0.9) return 25;
  if (index >= 0.85) return 40;
  if (index >= 0.8) return 55;
  if (index >= 0.7) return 70;
  if (index >= 0.6) return 85;
  return 100;
}

/**
 * Determine severity based on score
 */
function getSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

/**
 * Determine overall risk level based on config thresholds
 */
function getRiskLevel(
  totalScore: number,
  riskLevels: RiskScoreConfig['riskLevels'] = DEFAULT_RISK_LEVELS
): 'low' | 'medium' | 'high' | 'critical' {
  if (totalScore <= riskLevels.low) return 'low';
  if (totalScore <= riskLevels.medium) return 'medium';
  if (totalScore <= riskLevels.high) return 'high';
  return 'critical';
}

// =============================================================================
// SCHEDULE (TIME) RISK CALCULATION
// =============================================================================

interface ScheduleRiskResult {
  score: number;
  spi: number;
  factors: RiskFactor[];
}

function calculateScheduleRisk(
  initiative: Initiative,
  projects: Project[],
  tasks: Task[],
  thresholds: RiskScoreConfig['thresholds'] = DEFAULT_THRESHOLDS
): ScheduleRiskResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Calculate SPI (Schedule Performance Index)
  // SPI = % Complete / % Time Elapsed
  const avgCompletion = projects.length > 0
    ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length
    : 0;
  const timeElapsed = getTimeElapsedPercentage(initiative.startDate, initiative.endDate);

  // Use override if provided, otherwise calculate
  const spi = initiative.spiOverride ?? (timeElapsed > 0 ? avgCompletion / timeElapsed : 1);
  const spiRisk = performanceToRisk(spi);

  if (spiRisk > 0) {
    factors.push({
      category: 'schedule',
      name: 'Schedule Performance Index',
      description: spi < thresholds.spi.warning
        ? `Behind schedule: ${(spi * 100).toFixed(0)}% of planned progress achieved`
        : `Slightly behind schedule: SPI = ${spi.toFixed(2)}`,
      score: spiRisk,
      weight: 0.4,
      severity: getSeverity(spiRisk),
      rawValue: spi,
      threshold: 'SPI < 1.0 indicates behind schedule',
    });
    totalScore += spiRisk * 0.4;
  }

  // 2. Overdue tasks ratio
  const today = new Date();
  const incompleteTasks = tasks.filter(t => t.kanbanStatus !== 'done');
  const overdueTasks = incompleteTasks.filter(t => new Date(t.dueDate) < today);
  const overdueRatio = incompleteTasks.length > 0
    ? overdueTasks.length / incompleteTasks.length
    : 0;

  if (overdueRatio > thresholds.overdueRatio.good) {
    const overdueRisk = overdueRatio > thresholds.overdueRatio.critical ? 100
      : overdueRatio > thresholds.overdueRatio.warning ? 60
      : 30;

    factors.push({
      category: 'schedule',
      name: 'Overdue Tasks',
      description: `${overdueTasks.length} of ${incompleteTasks.length} tasks are overdue (${(overdueRatio * 100).toFixed(0)}%)`,
      score: overdueRisk,
      weight: 0.35,
      severity: getSeverity(overdueRisk),
      rawValue: overdueTasks.length,
      threshold: `>${(thresholds.overdueRatio.good * 100).toFixed(0)}% overdue triggers warning`,
    });
    totalScore += overdueRisk * 0.35;
  }

  // 3. Projects behind schedule (RAG status or completion)
  const behindScheduleProjects = projects.filter(p => {
    const projectTimeElapsed = getTimeElapsedPercentage(p.startDate, p.endDate);
    return p.completionPercentage < projectTimeElapsed - 15; // 15% buffer
  });

  if (behindScheduleProjects.length > 0) {
    const behindRatio = behindScheduleProjects.length / projects.length;
    const behindRisk = behindRatio > 0.5 ? 80 : behindRatio > 0.25 ? 50 : 25;

    factors.push({
      category: 'schedule',
      name: 'Projects Behind Schedule',
      description: `${behindScheduleProjects.length} of ${projects.length} projects are significantly behind schedule`,
      score: behindRisk,
      weight: 0.25,
      severity: getSeverity(behindRisk),
      rawValue: behindScheduleProjects.length,
    });
    totalScore += behindRisk * 0.25;
  }

  return { score: Math.min(100, totalScore), spi, factors };
}

// =============================================================================
// COST RISK CALCULATION
// =============================================================================

interface CostRiskResult {
  score: number;
  cpi: number;
  factors: RiskFactor[];
}

function calculateCostRisk(
  initiative: Initiative,
  projects: Project[],
  thresholds: RiskScoreConfig['thresholds'] = DEFAULT_THRESHOLDS
): CostRiskResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Calculate CPI (Cost Performance Index)
  // CPI = Earned Value / Actual Cost
  // Simplified: % Complete / % Budget Spent
  const avgCompletion = projects.length > 0
    ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length
    : 0;
  const budgetSpentPercent = initiative.budget > 0
    ? (initiative.spentBudget / initiative.budget) * 100
    : 0;

  // Use override if provided, otherwise calculate
  const cpi = initiative.cpiOverride ?? (budgetSpentPercent > 0 ? avgCompletion / budgetSpentPercent : 1);
  const cpiRisk = performanceToRisk(cpi);

  if (cpiRisk > 0) {
    factors.push({
      category: 'cost',
      name: 'Cost Performance Index',
      description: cpi < thresholds.cpi.warning
        ? `Over budget: Getting ${(cpi * 100).toFixed(0)}% value per dollar spent`
        : `Slightly over budget: CPI = ${cpi.toFixed(2)}`,
      score: cpiRisk,
      weight: 0.5,
      severity: getSeverity(cpiRisk),
      rawValue: cpi,
      threshold: 'CPI < 1.0 indicates over budget',
    });
    totalScore += cpiRisk * 0.5;
  }

  // 2. Budget variance percentage
  const budgetVariance = initiative.budget > 0
    ? ((initiative.spentBudget - initiative.budget) / initiative.budget) * 100
    : 0;

  if (budgetVariance > thresholds.budgetVariance.good) {
    const varianceRisk = budgetVariance > thresholds.budgetVariance.critical ? 100
      : budgetVariance > thresholds.budgetVariance.warning ? 60
      : 30;

    factors.push({
      category: 'cost',
      name: 'Budget Overrun',
      description: `${budgetVariance.toFixed(1)}% over allocated budget`,
      score: varianceRisk,
      weight: 0.35,
      severity: getSeverity(varianceRisk),
      rawValue: budgetVariance,
      threshold: `>${thresholds.budgetVariance.good}% triggers warning`,
    });
    totalScore += varianceRisk * 0.35;
  }

  // 3. Project-level budget issues
  const overBudgetProjects = projects.filter(p => p.spentBudget > p.budget);
  if (overBudgetProjects.length > 0) {
    const overBudgetRatio = overBudgetProjects.length / projects.length;
    const projectBudgetRisk = overBudgetRatio > 0.5 ? 70 : overBudgetRatio > 0.25 ? 40 : 20;

    factors.push({
      category: 'cost',
      name: 'Projects Over Budget',
      description: `${overBudgetProjects.length} of ${projects.length} projects have exceeded their budget`,
      score: projectBudgetRisk,
      weight: 0.15,
      severity: getSeverity(projectBudgetRisk),
      rawValue: overBudgetProjects.length,
    });
    totalScore += projectBudgetRisk * 0.15;
  }

  return { score: Math.min(100, totalScore), cpi, factors };
}

// =============================================================================
// SCOPE RISK CALCULATION
// =============================================================================

interface ScopeRiskResult {
  score: number;
  scopePerformance: number;
  factors: RiskFactor[];
}

function calculateScopeRisk(
  initiative: Initiative,
  projects: Project[],
  tasks: Task[]
): ScopeRiskResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Scope Performance: % Complete vs % Time Elapsed
  const timeElapsed = getTimeElapsedPercentage(initiative.startDate, initiative.endDate);
  const avgCompletion = projects.length > 0
    ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length
    : 0;

  const scopePerformance = timeElapsed > 0 ? avgCompletion / timeElapsed : 1;

  if (scopePerformance < 0.9 && timeElapsed > 20) { // Only flag after 20% timeline
    const scopeRisk = scopePerformance < 0.6 ? 80
      : scopePerformance < 0.75 ? 55
      : 30;

    factors.push({
      category: 'scope',
      name: 'Delivery Progress',
      description: `${avgCompletion.toFixed(0)}% complete with ${timeElapsed.toFixed(0)}% of timeline elapsed`,
      score: scopeRisk,
      weight: 0.5,
      severity: getSeverity(scopeRisk),
      rawValue: scopePerformance,
    });
    totalScore += scopeRisk * 0.5;
  }

  // 2. Scope changes (if tracked)
  const totalScopeChanges = projects.reduce((sum, p) => sum + (p.scopeChangeCount || 0), 0);
  if (totalScopeChanges > 0) {
    const avgChangesPerProject = totalScopeChanges / projects.length;
    const scopeChangeRisk = avgChangesPerProject > 5 ? 70
      : avgChangesPerProject > 3 ? 45
      : avgChangesPerProject > 1 ? 20
      : 0;

    if (scopeChangeRisk > 0) {
      factors.push({
        category: 'scope',
        name: 'Scope Changes',
        description: `${totalScopeChanges} scope change request(s) across projects`,
        score: scopeChangeRisk,
        weight: 0.3,
        severity: getSeverity(scopeChangeRisk),
        rawValue: totalScopeChanges,
      });
      totalScore += scopeChangeRisk * 0.3;
    }
  }

  // 3. Task completion rate
  const completedTasks = tasks.filter(t => t.kanbanStatus === 'done').length;
  const taskCompletionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;

  // Compare to expected based on timeline
  const expectedCompletion = timeElapsed / 100;
  if (taskCompletionRate < expectedCompletion - 0.15 && tasks.length >= 5) {
    const taskRisk = taskCompletionRate < expectedCompletion - 0.3 ? 60 : 30;

    factors.push({
      category: 'scope',
      name: 'Task Completion Rate',
      description: `${(taskCompletionRate * 100).toFixed(0)}% of tasks complete vs ${(expectedCompletion * 100).toFixed(0)}% expected`,
      score: taskRisk,
      weight: 0.2,
      severity: getSeverity(taskRisk),
      rawValue: taskCompletionRate,
    });
    totalScore += taskRisk * 0.2;
  }

  return { score: Math.min(100, totalScore), scopePerformance, factors };
}

// =============================================================================
// RESOURCE RISK CALCULATION
// =============================================================================

interface ResourceRiskResult {
  score: number;
  resourceIndex: number;
  factors: RiskFactor[];
}

function calculateResourceRisk(
  tasks: Task[],
  resources: Resource[],
  thresholds: RiskScoreConfig['thresholds'] = DEFAULT_THRESHOLDS
): ResourceRiskResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // Build resource allocation map
  const resourceAllocation = new Map<string, {
    resource: Resource;
    totalHours: number;
    taskCount: number;
    projectIds: Set<string>;
  }>();

  tasks.forEach(task => {
    if (task.kanbanStatus === 'done') return; // Skip completed tasks

    const existing = resourceAllocation.get(task.assigneeId);
    const resource = resources.find(r => r.id === task.assigneeId);

    if (resource) {
      if (existing) {
        existing.totalHours += task.estimatedHours || 0;
        existing.taskCount++;
        existing.projectIds.add(task.projectId);
      } else {
        resourceAllocation.set(task.assigneeId, {
          resource,
          totalHours: task.estimatedHours || 0,
          taskCount: 1,
          projectIds: new Set([task.projectId]),
        });
      }
    }
  });

  // 1. Check for over-allocated resources
  const overAllocated: string[] = [];
  let maxUtilization = 0;

  resourceAllocation.forEach(({ resource, totalHours }) => {
    // Assume 4-week lookahead, so capacity = weeklyCapacity * 4
    const periodCapacity = resource.weeklyCapacity * 4;
    const utilization = periodCapacity > 0 ? (totalHours / periodCapacity) * 100 : 0;
    maxUtilization = Math.max(maxUtilization, utilization);

    if (utilization > thresholds.resourceUtilization.warning) {
      overAllocated.push(resource.name);
    }
  });

  if (overAllocated.length > 0) {
    const overAllocRisk = maxUtilization > thresholds.resourceUtilization.critical ? 80
      : maxUtilization > thresholds.resourceUtilization.warning ? 50
      : 25;

    factors.push({
      category: 'resource',
      name: 'Over-allocated Resources',
      description: `${overAllocated.length} resource(s) over capacity: ${overAllocated.slice(0, 3).join(', ')}${overAllocated.length > 3 ? '...' : ''}`,
      score: overAllocRisk,
      weight: 0.5,
      severity: getSeverity(overAllocRisk),
      rawValue: overAllocated.length,
      threshold: `>${thresholds.resourceUtilization.warning}% utilization`,
    });
    totalScore += overAllocRisk * 0.5;
  }

  // 2. Key person dependency (single points of failure)
  const multiProjectResources: string[] = [];
  resourceAllocation.forEach(({ resource, projectIds }) => {
    if (projectIds.size >= 3 || (resource.isKeyResource && projectIds.size >= 2)) {
      multiProjectResources.push(resource.name);
    }
  });

  if (multiProjectResources.length > 0) {
    const keyPersonRisk = multiProjectResources.length >= 3 ? 60 : 35;

    factors.push({
      category: 'resource',
      name: 'Key Person Dependency',
      description: `${multiProjectResources.length} resource(s) spread across multiple projects: ${multiProjectResources.slice(0, 2).join(', ')}`,
      score: keyPersonRisk,
      weight: 0.3,
      severity: getSeverity(keyPersonRisk),
      rawValue: multiProjectResources.length,
    });
    totalScore += keyPersonRisk * 0.3;
  }

  // 3. Unassigned tasks
  const unassignedTasks = tasks.filter(t =>
    t.kanbanStatus !== 'done' &&
    (!t.assigneeId || !resources.find(r => r.id === t.assigneeId))
  );

  if (unassignedTasks.length > 0) {
    const unassignedRatio = unassignedTasks.length / tasks.filter(t => t.kanbanStatus !== 'done').length;
    const unassignedRisk = unassignedRatio > 0.3 ? 50 : unassignedRatio > 0.15 ? 30 : 15;

    factors.push({
      category: 'resource',
      name: 'Unassigned Work',
      description: `${unassignedTasks.length} task(s) without assigned resources`,
      score: unassignedRisk,
      weight: 0.2,
      severity: getSeverity(unassignedRisk),
      rawValue: unassignedTasks.length,
    });
    totalScore += unassignedRisk * 0.2;
  }

  // Calculate resource index (inverse of risk)
  const resourceIndex = Math.max(0, 1 - (totalScore / 100));

  return { score: Math.min(100, totalScore), resourceIndex, factors };
}

// =============================================================================
// QUALITY RISK CALCULATION
// =============================================================================

interface QualityRiskResult {
  score: number;
  factors: RiskFactor[];
}

function calculateQualityRisk(
  initiative: Initiative,
  projects: Project[],
  tasks: Task[],
  thresholds: RiskScoreConfig['thresholds'] = DEFAULT_THRESHOLDS
): QualityRiskResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Blocked tasks ratio
  const incompleteTasks = tasks.filter(t => t.kanbanStatus !== 'done');
  const blockedTasks = tasks.filter(t => t.kanbanStatus === 'blocked');
  const blockedRatio = incompleteTasks.length > 0
    ? blockedTasks.length / incompleteTasks.length
    : 0;

  if (blockedRatio > thresholds.blockedRatio.good) {
    const blockedRisk = blockedRatio > thresholds.blockedRatio.critical ? 80
      : blockedRatio > thresholds.blockedRatio.warning ? 50
      : 25;

    factors.push({
      category: 'quality',
      name: 'Blocked Tasks',
      description: `${blockedTasks.length} task(s) blocked (${(blockedRatio * 100).toFixed(0)}% of active work)`,
      score: blockedRisk,
      weight: 0.4,
      severity: getSeverity(blockedRisk),
      rawValue: blockedTasks.length,
      threshold: `>${(thresholds.blockedRatio.good * 100).toFixed(0)}% blocked triggers warning`,
    });
    totalScore += blockedRisk * 0.4;
  }

  // 2. RAG Status (manual assessment)
  if (initiative.ragStatus === 'red') {
    factors.push({
      category: 'status',
      name: 'Initiative Status',
      description: 'Initiative marked as Red (critical) status',
      score: 60,
      weight: 0.35,
      severity: 'high',
      rawValue: 'red',
    });
    totalScore += 60 * 0.35;
  } else if (initiative.ragStatus === 'amber') {
    factors.push({
      category: 'status',
      name: 'Initiative Status',
      description: 'Initiative marked as Amber (at risk) status',
      score: 30,
      weight: 0.35,
      severity: 'medium',
      rawValue: 'amber',
    });
    totalScore += 30 * 0.35;
  }

  // 3. Red/Amber projects
  const redProjects = projects.filter(p => p.ragStatus === 'red').length;
  const amberProjects = projects.filter(p => p.ragStatus === 'amber').length;

  if (redProjects > 0 || amberProjects > 0) {
    const projectStatusRisk = redProjects > 0
      ? Math.min(80, 30 + redProjects * 20)
      : Math.min(50, amberProjects * 15);

    factors.push({
      category: 'status',
      name: 'Project Health',
      description: redProjects > 0
        ? `${redProjects} project(s) in Red status`
        : `${amberProjects} project(s) in Amber status`,
      score: projectStatusRisk,
      weight: 0.25,
      severity: getSeverity(projectStatusRisk),
      rawValue: redProjects > 0 ? redProjects : amberProjects,
    });
    totalScore += projectStatusRisk * 0.25;
  }

  return { score: Math.min(100, totalScore), factors };
}

// =============================================================================
// MAIN CALCULATION FUNCTION
// =============================================================================

/**
 * Calculate comprehensive risk score for an initiative
 * @param initiative - The initiative to calculate risk for
 * @param projects - Projects under this initiative
 * @param tasks - Tasks for all projects
 * @param resources - Available resources
 * @param config - Optional risk score configuration (uses defaults if not provided)
 */
export function calculateRiskScore(
  initiative: Initiative,
  projects: Project[],
  tasks: Task[],
  resources: Resource[],
  config?: RiskScoreConfig
): RiskScoreBreakdown {
  // Use config or defaults
  const weights = config?.weights ?? DEFAULT_WEIGHTS;
  const thresholds = config?.thresholds ?? DEFAULT_THRESHOLDS;
  const riskLevels = config?.riskLevels ?? DEFAULT_RISK_LEVELS;

  // Calculate each dimension
  const scheduleResult = calculateScheduleRisk(initiative, projects, tasks, thresholds);
  const costResult = calculateCostRisk(initiative, projects, thresholds);
  const scopeResult = calculateScopeRisk(initiative, projects, tasks);
  const resourceResult = calculateResourceRisk(tasks, resources, thresholds);
  const qualityResult = calculateQualityRisk(initiative, projects, tasks, thresholds);

  // Combine all factors
  const allFactors: RiskFactor[] = [
    ...scheduleResult.factors,
    ...costResult.factors,
    ...scopeResult.factors,
    ...resourceResult.factors,
    ...qualityResult.factors,
  ];

  // Calculate weighted total using config weights
  const totalScore = Math.round(
    scheduleResult.score * weights.schedule +
    costResult.score * weights.cost +
    scopeResult.score * weights.scope +
    resourceResult.score * weights.resource +
    qualityResult.score * weights.quality
  );

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    riskLevel: getRiskLevel(totalScore, riskLevels),
    factors: allFactors.sort((a, b) => b.score - a.score), // Sort by severity
    indices: {
      spi: scheduleResult.spi,
      cpi: costResult.cpi,
      scopePerformance: scopeResult.scopePerformance,
      resourceIndex: resourceResult.resourceIndex,
    },
    summary: {
      scheduleScore: Math.round(scheduleResult.score),
      costScore: Math.round(costResult.score),
      scopeScore: Math.round(scopeResult.score),
      resourceScore: Math.round(resourceResult.score),
      qualityScore: Math.round(qualityResult.score),
    },
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Get a simple risk score (0-100) for quick display
 */
export function getSimpleRiskScore(
  initiative: Initiative,
  projects: Project[],
  tasks: Task[],
  resources: Resource[],
  config?: RiskScoreConfig
): { score: number; level: 'low' | 'medium' | 'high' | 'critical'; topFactors: string[] } {
  const breakdown = calculateRiskScore(initiative, projects, tasks, resources, config);

  return {
    score: breakdown.totalScore,
    level: breakdown.riskLevel,
    topFactors: breakdown.factors.slice(0, 3).map(f => f.description),
  };
}

/**
 * Format SPI/CPI for display
 */
export function formatPerformanceIndex(index: number): string {
  if (index >= 1.0) return `${(index * 100).toFixed(0)}% ✓`;
  if (index >= 0.9) return `${(index * 100).toFixed(0)}%`;
  return `${(index * 100).toFixed(0)}% ⚠`;
}

/**
 * Get color class for risk level
 */
export function getRiskColorClass(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low': return 'text-rag-green';
    case 'medium': return 'text-rag-amber';
    case 'high': return 'text-rag-red';
    case 'critical': return 'text-rag-red';
  }
}

/**
 * Get background color class for risk level
 */
export function getRiskBgClass(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low': return 'bg-rag-green/10';
    case 'medium': return 'bg-rag-amber/10';
    case 'high': return 'bg-rag-red/10';
    case 'critical': return 'bg-rag-red/20';
  }
}
