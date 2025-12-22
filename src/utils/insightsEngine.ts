/**
 * Rule-Based Insights Engine
 *
 * Generates deterministic insights based on configurable thresholds and rules.
 * No AI required - pure business logic for common PPM patterns.
 *
 * Use AI only for:
 * - Complex root cause analysis
 * - Natural language explanations
 * - Predictive/trend forecasting
 * - Answering user questions
 */

import {
  AppState,
  Initiative,
  Project,
  Task,
  Resource,
  StrategyPillar,
  RuleBasedInsight,
  InsightCategory,
  InsightSeverity,
  InsightsConfig,
} from '../types';
import { calculateRiskScore } from './riskScore';
import { DEFAULT_INSIGHTS_CONFIG } from './configDefaults';

// Re-export types for consumers
export type { RuleBasedInsight, InsightCategory, InsightSeverity } from '../types';

// =============================================================================
// DEFAULT THRESHOLD CONFIGURATION
// =============================================================================

/** Default thresholds - used when no config is provided */
export const INSIGHT_THRESHOLDS = DEFAULT_INSIGHTS_CONFIG.thresholds;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

function getTimeElapsedPercentage(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const totalDuration = daysBetween(start, end);
  if (totalDuration <= 0) return 100;
  const elapsed = daysBetween(start, now);
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}

// =============================================================================
// SCHEDULE RULES
// =============================================================================

function evaluateScheduleRules(
  initiatives: Initiative[],
  projects: Project[],
  tasks: Task[],
  thresholds = INSIGHT_THRESHOLDS.schedule
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const now = new Date();

  // Rule: Initiatives with low SPI
  initiatives.forEach(initiative => {
    const initiativeProjects = projects.filter(p => p.initiativeId === initiative.id);
    const avgCompletion = initiativeProjects.length > 0
      ? initiativeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / initiativeProjects.length
      : 0;
    const timeElapsed = getTimeElapsedPercentage(initiative.startDate, initiative.endDate);
    const spi = timeElapsed > 0 ? avgCompletion / timeElapsed : 1;

    if (spi < thresholds.spiCritical) {
      insights.push({
        id: generateId(),
        category: 'schedule',
        severity: 'critical',
        title: `${initiative.name} critically behind schedule`,
        description: `Schedule Performance Index is ${(spi * 100).toFixed(0)}% - only ${avgCompletion.toFixed(0)}% complete with ${timeElapsed.toFixed(0)}% of timeline elapsed.`,
        ruleName: 'SPI_CRITICAL',
        affectedEntities: [{ type: 'initiative', id: initiative.id, name: initiative.name }],
        suggestedAction: 'Immediately review scope, add resources, or adjust timeline. Consider executive escalation.',
        link: '/portfolio',
        metrics: { spi, avgCompletion, timeElapsed },
        generatedAt: now.toISOString(),
      });
    } else if (spi < thresholds.spiWarning) {
      insights.push({
        id: generateId(),
        category: 'schedule',
        severity: 'warning',
        title: `${initiative.name} falling behind schedule`,
        description: `Schedule Performance Index is ${(spi * 100).toFixed(0)}% - tracking slightly behind plan.`,
        ruleName: 'SPI_WARNING',
        affectedEntities: [{ type: 'initiative', id: initiative.id, name: initiative.name }],
        suggestedAction: 'Review blockers and consider resource reallocation.',
        link: '/portfolio',
        metrics: { spi },
        generatedAt: now.toISOString(),
      });
    }
  });

  // Rule: Overdue tasks
  const incompleteTasks = tasks.filter(t => t.kanbanStatus !== 'done');
  const overdueTasks = incompleteTasks.filter(t => new Date(t.dueDate) < now);
  const overdueRatio = incompleteTasks.length > 0 ? overdueTasks.length / incompleteTasks.length : 0;

  if (overdueRatio > thresholds.overdueTasksCritical) {
    insights.push({
      id: generateId(),
      category: 'schedule',
      severity: 'critical',
      title: `${overdueTasks.length} tasks overdue (${(overdueRatio * 100).toFixed(0)}%)`,
      description: `Critical: ${(overdueRatio * 100).toFixed(0)}% of active tasks are past their due date. This indicates systemic schedule issues.`,
      ruleName: 'OVERDUE_TASKS_CRITICAL',
      affectedEntities: overdueTasks.slice(0, 5).map(t => ({ type: 'task' as const, id: t.id, name: t.title })),
      suggestedAction: 'Conduct task triage session. Reprioritize or reassign overdue work. Update unrealistic due dates.',
      link: '/execution',
      metrics: { overdueTasks: overdueTasks.length, overdueRatio },
      generatedAt: now.toISOString(),
    });
  } else if (overdueRatio > thresholds.overdueTasksWarning) {
    insights.push({
      id: generateId(),
      category: 'schedule',
      severity: 'warning',
      title: `${overdueTasks.length} tasks overdue`,
      description: `${(overdueRatio * 100).toFixed(0)}% of active tasks are past their due date.`,
      ruleName: 'OVERDUE_TASKS_WARNING',
      affectedEntities: overdueTasks.slice(0, 3).map(t => ({ type: 'task' as const, id: t.id, name: t.title })),
      suggestedAction: 'Review overdue tasks and update timelines or reassign.',
      link: '/execution',
      metrics: { overdueTasks: overdueTasks.length, overdueRatio },
      generatedAt: now.toISOString(),
    });
  }

  // Rule: Projects approaching deadline
  projects.forEach(project => {
    if (project.status === 'completed' || project.status === 'cancelled') return;
    const daysRemaining = daysBetween(now, new Date(project.endDate));

    if (daysRemaining > 0 && daysRemaining <= thresholds.daysToDeadlineCritical && project.completionPercentage < 80) {
      insights.push({
        id: generateId(),
        category: 'schedule',
        severity: 'critical',
        title: `${project.name} deadline in ${daysRemaining} days`,
        description: `Only ${project.completionPercentage}% complete with ${daysRemaining} days remaining. High risk of missing deadline.`,
        ruleName: 'DEADLINE_CRITICAL',
        affectedEntities: [{ type: 'project', id: project.id, name: project.name }],
        suggestedAction: 'Evaluate scope cut options or timeline extension. Mobilize additional resources.',
        link: '/execution',
        metrics: { daysRemaining, completionPercentage: project.completionPercentage },
        generatedAt: now.toISOString(),
      });
    } else if (daysRemaining > 0 && daysRemaining <= thresholds.daysToDeadlineWarning && project.completionPercentage < 70) {
      insights.push({
        id: generateId(),
        category: 'schedule',
        severity: 'warning',
        title: `${project.name} deadline approaching`,
        description: `${daysRemaining} days remaining with ${project.completionPercentage}% completion.`,
        ruleName: 'DEADLINE_WARNING',
        affectedEntities: [{ type: 'project', id: project.id, name: project.name }],
        suggestedAction: 'Accelerate delivery or prepare stakeholders for potential delay.',
        link: '/execution',
        metrics: { daysRemaining, completionPercentage: project.completionPercentage },
        generatedAt: now.toISOString(),
      });
    }
  });

  return insights;
}

// =============================================================================
// COST RULES
// =============================================================================

function evaluateCostRules(
  initiatives: Initiative[],
  projects: Project[],
  thresholds = INSIGHT_THRESHOLDS.cost
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const now = new Date();

  // Rule: Budget overruns at initiative level
  initiatives.forEach(initiative => {
    const variance = initiative.budget > 0
      ? ((initiative.spentBudget - initiative.budget) / initiative.budget) * 100
      : 0;

    if (variance > thresholds.budgetVarianceCritical) {
      insights.push({
        id: generateId(),
        category: 'cost',
        severity: 'critical',
        title: `${initiative.name} ${variance.toFixed(0)}% over budget`,
        description: `Budget overrun of $${(initiative.spentBudget - initiative.budget).toLocaleString()}. Immediate financial review required.`,
        ruleName: 'BUDGET_CRITICAL',
        affectedEntities: [{ type: 'initiative', id: initiative.id, name: initiative.name }],
        suggestedAction: 'Freeze non-essential spending. Request budget increase or reduce scope.',
        link: '/portfolio',
        metrics: { variance, spent: initiative.spentBudget, budget: initiative.budget },
        generatedAt: now.toISOString(),
      });
    } else if (variance > thresholds.budgetVarianceWarning) {
      insights.push({
        id: generateId(),
        category: 'cost',
        severity: 'warning',
        title: `${initiative.name} trending over budget`,
        description: `${variance.toFixed(0)}% over allocated budget. Monitor spending closely.`,
        ruleName: 'BUDGET_WARNING',
        affectedEntities: [{ type: 'initiative', id: initiative.id, name: initiative.name }],
        suggestedAction: 'Review remaining commitments and identify cost savings.',
        link: '/portfolio',
        metrics: { variance },
        generatedAt: now.toISOString(),
      });
    }
  });

  // Rule: CPI analysis
  initiatives.forEach(initiative => {
    const initiativeProjects = projects.filter(p => p.initiativeId === initiative.id);
    const avgCompletion = initiativeProjects.length > 0
      ? initiativeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / initiativeProjects.length
      : 0;
    const budgetSpentPercent = initiative.budget > 0
      ? (initiative.spentBudget / initiative.budget) * 100
      : 0;
    const cpi = budgetSpentPercent > 0 ? avgCompletion / budgetSpentPercent : 1;

    if (cpi < thresholds.cpiCritical && budgetSpentPercent > 20) {
      insights.push({
        id: generateId(),
        category: 'cost',
        severity: 'critical',
        title: `${initiative.name} poor cost efficiency`,
        description: `Cost Performance Index is ${(cpi * 100).toFixed(0)}% - getting ${avgCompletion.toFixed(0)}% value for ${budgetSpentPercent.toFixed(0)}% of budget spent.`,
        ruleName: 'CPI_CRITICAL',
        affectedEntities: [{ type: 'initiative', id: initiative.id, name: initiative.name }],
        suggestedAction: 'Analyze cost drivers. Consider value engineering or vendor renegotiation.',
        link: '/portfolio',
        metrics: { cpi, avgCompletion, budgetSpentPercent },
        generatedAt: now.toISOString(),
      });
    }
  });

  // Rule: Projects over budget
  const overBudgetProjects = projects.filter(p => p.spentBudget > p.budget);
  if (overBudgetProjects.length > 0) {
    const totalOverrun = overBudgetProjects.reduce((sum, p) => sum + (p.spentBudget - p.budget), 0);
    insights.push({
      id: generateId(),
      category: 'cost',
      severity: overBudgetProjects.length > 2 ? 'critical' : 'warning',
      title: `${overBudgetProjects.length} project(s) over budget`,
      description: `Total overrun of $${totalOverrun.toLocaleString()} across ${overBudgetProjects.length} projects.`,
      ruleName: 'PROJECTS_OVER_BUDGET',
      affectedEntities: overBudgetProjects.slice(0, 3).map(p => ({ type: 'project' as const, id: p.id, name: p.name })),
      suggestedAction: 'Review project budgets and identify root causes of overruns.',
      link: '/portfolio',
      metrics: { count: overBudgetProjects.length, totalOverrun },
      generatedAt: now.toISOString(),
    });
  }

  return insights;
}

// =============================================================================
// SCOPE RULES
// =============================================================================

function evaluateScopeRules(
  initiatives: Initiative[],
  projects: Project[],
  tasks: Task[],
  thresholds = INSIGHT_THRESHOLDS.scope
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const now = new Date();

  // Rule: Blocked tasks ratio
  const incompleteTasks = tasks.filter(t => t.kanbanStatus !== 'done');
  const blockedTasks = tasks.filter(t => t.kanbanStatus === 'blocked');
  const blockedRatio = incompleteTasks.length > 0 ? blockedTasks.length / incompleteTasks.length : 0;

  if (blockedRatio > thresholds.blockedRatioCritical) {
    insights.push({
      id: generateId(),
      category: 'scope',
      severity: 'critical',
      title: `${blockedTasks.length} tasks blocked (${(blockedRatio * 100).toFixed(0)}%)`,
      description: `High number of blocked tasks indicates systemic impediments affecting delivery.`,
      ruleName: 'BLOCKED_CRITICAL',
      affectedEntities: blockedTasks.slice(0, 5).map(t => ({ type: 'task' as const, id: t.id, name: t.title })),
      suggestedAction: 'Conduct blocker resolution session. Escalate persistent impediments to leadership.',
      link: '/execution',
      metrics: { blockedTasks: blockedTasks.length, blockedRatio },
      generatedAt: now.toISOString(),
    });
  } else if (blockedRatio > thresholds.blockedRatioWarning) {
    insights.push({
      id: generateId(),
      category: 'scope',
      severity: 'warning',
      title: `${blockedTasks.length} tasks blocked`,
      description: `${(blockedRatio * 100).toFixed(0)}% of active work is blocked.`,
      ruleName: 'BLOCKED_WARNING',
      affectedEntities: blockedTasks.slice(0, 3).map(t => ({ type: 'task' as const, id: t.id, name: t.title })),
      suggestedAction: 'Review and resolve blockers in daily standup.',
      link: '/execution',
      metrics: { blockedTasks: blockedTasks.length },
      generatedAt: now.toISOString(),
    });
  }

  // Rule: Low completion projects
  projects.forEach(project => {
    if (project.status === 'completed' || project.status === 'cancelled' || project.status === 'not_started') return;

    const timeElapsed = getTimeElapsedPercentage(project.startDate, project.endDate);
    const completionGap = timeElapsed - project.completionPercentage;

    if (completionGap > thresholds.completionGapCritical && timeElapsed > 30) {
      insights.push({
        id: generateId(),
        category: 'scope',
        severity: 'critical',
        title: `${project.name} significantly behind on delivery`,
        description: `${project.completionPercentage}% complete with ${timeElapsed.toFixed(0)}% of timeline used. Gap of ${completionGap.toFixed(0)}%.`,
        ruleName: 'COMPLETION_GAP_CRITICAL',
        affectedEntities: [{ type: 'project', id: project.id, name: project.name }],
        suggestedAction: 'Re-baseline project plan or reduce scope to meet timeline.',
        link: '/execution',
        metrics: { completionPercentage: project.completionPercentage, timeElapsed, gap: completionGap },
        generatedAt: now.toISOString(),
      });
    }
  });

  return insights;
}

// =============================================================================
// RESOURCE RULES
// =============================================================================

function evaluateResourceRules(
  tasks: Task[],
  resources: Resource[],
  thresholds = INSIGHT_THRESHOLDS.resource
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const now = new Date();

  // Build resource allocation map
  const resourceAllocation = new Map<string, {
    resource: Resource;
    totalHours: number;
    taskCount: number;
    projectIds: Set<string>;
  }>();

  tasks.forEach(task => {
    if (task.kanbanStatus === 'done') return;
    const resource = resources.find(r => r.id === task.assigneeId);
    if (!resource) return;

    const existing = resourceAllocation.get(task.assigneeId);
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
  });

  // Rule: Over-allocated resources
  const overAllocated: { resource: Resource; utilization: number }[] = [];
  resourceAllocation.forEach(({ resource, totalHours }) => {
    const periodCapacity = resource.weeklyCapacity * 4; // 4-week lookahead
    const utilization = periodCapacity > 0 ? (totalHours / periodCapacity) * 100 : 0;

    if (utilization > thresholds.utilizationCritical) {
      overAllocated.push({ resource, utilization });
    }
  });

  if (overAllocated.length > 0) {
    const severity = overAllocated.length > 2 ? 'critical' : 'warning';
    insights.push({
      id: generateId(),
      category: 'resource',
      severity,
      title: `${overAllocated.length} team member(s) over-allocated`,
      description: `${overAllocated.map(o => `${o.resource.name} (${o.utilization.toFixed(0)}%)`).join(', ')} exceeding capacity.`,
      ruleName: 'RESOURCE_OVERALLOCATED',
      affectedEntities: overAllocated.map(o => ({ type: 'resource' as const, id: o.resource.id, name: o.resource.name })),
      suggestedAction: 'Redistribute work or delay lower priority tasks. Consider temporary resources.',
      link: '/resources',
      metrics: { overAllocatedCount: overAllocated.length },
      generatedAt: now.toISOString(),
    });
  }

  // Rule: Key person risk (spread across multiple projects)
  const keyPersonRisks: { resource: Resource; projectCount: number }[] = [];
  resourceAllocation.forEach(({ resource, projectIds }) => {
    if (projectIds.size >= 4 || (resource.isKeyResource && projectIds.size >= 3)) {
      keyPersonRisks.push({ resource, projectCount: projectIds.size });
    }
  });

  if (keyPersonRisks.length > 0) {
    insights.push({
      id: generateId(),
      category: 'resource',
      severity: 'warning',
      title: 'Key person dependency risk',
      description: `${keyPersonRisks.map(k => `${k.resource.name} (${k.projectCount} projects)`).join(', ')} represent single points of failure.`,
      ruleName: 'KEY_PERSON_RISK',
      affectedEntities: keyPersonRisks.map(k => ({ type: 'resource' as const, id: k.resource.id, name: k.resource.name })),
      suggestedAction: 'Cross-train team members. Document critical knowledge. Consider backup resources.',
      link: '/resources',
      metrics: { keyPersonCount: keyPersonRisks.length },
      generatedAt: now.toISOString(),
    });
  }

  // Rule: Unassigned tasks
  const unassignedTasks = tasks.filter(t =>
    t.kanbanStatus !== 'done' &&
    (!t.assigneeId || !resources.find(r => r.id === t.assigneeId))
  );
  const unassignedRatio = tasks.filter(t => t.kanbanStatus !== 'done').length > 0
    ? unassignedTasks.length / tasks.filter(t => t.kanbanStatus !== 'done').length
    : 0;

  if (unassignedRatio > thresholds.unassignedTasksWarning && unassignedTasks.length > 2) {
    insights.push({
      id: generateId(),
      category: 'resource',
      severity: 'warning',
      title: `${unassignedTasks.length} tasks without owners`,
      description: `${(unassignedRatio * 100).toFixed(0)}% of active tasks are unassigned.`,
      ruleName: 'UNASSIGNED_TASKS',
      affectedEntities: unassignedTasks.slice(0, 5).map(t => ({ type: 'task' as const, id: t.id, name: t.title })),
      suggestedAction: 'Assign owners to all tasks during sprint planning.',
      link: '/execution',
      metrics: { unassignedCount: unassignedTasks.length, unassignedRatio },
      generatedAt: now.toISOString(),
    });
  }

  return insights;
}

// =============================================================================
// STRATEGIC RULES
// =============================================================================

function evaluateStrategicRules(
  pillars: StrategyPillar[],
  initiatives: Initiative[],
  thresholds = INSIGHT_THRESHOLDS.strategic
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const now = new Date();

  // Rule: Pillars with critical status
  const criticalPillars = pillars.filter(p => p.ragStatus === 'red');
  criticalPillars.forEach(pillar => {
    insights.push({
      id: generateId(),
      category: 'strategic',
      severity: 'critical',
      title: `${pillar.name} pillar in critical status`,
      description: `Strategic pillar marked as Red. Review linked KPIs and initiatives for root cause.`,
      ruleName: 'PILLAR_CRITICAL',
      affectedEntities: [{ type: 'pillar', id: pillar.id, name: pillar.name }],
      suggestedAction: 'Convene strategic review. Assess if initiatives are addressing root causes.',
      link: '/strategy',
      generatedAt: now.toISOString(),
    });
  });

  // Rule: At-risk initiatives ratio
  const atRiskInitiatives = initiatives.filter(i => i.ragStatus === 'red' || i.ragStatus === 'amber');
  const atRiskRatio = initiatives.length > 0 ? atRiskInitiatives.length / initiatives.length : 0;

  if (atRiskRatio > thresholds.atRiskInitiativesCritical) {
    insights.push({
      id: generateId(),
      category: 'strategic',
      severity: 'critical',
      title: `${(atRiskRatio * 100).toFixed(0)}% of initiatives at risk`,
      description: `${atRiskInitiatives.length} of ${initiatives.length} initiatives are in Red or Amber status. Portfolio health is compromised.`,
      ruleName: 'PORTFOLIO_AT_RISK_CRITICAL',
      affectedEntities: atRiskInitiatives.slice(0, 5).map(i => ({ type: 'initiative' as const, id: i.id, name: i.name })),
      suggestedAction: 'Executive portfolio review required. Consider initiative consolidation or termination.',
      link: '/portfolio',
      metrics: { atRiskCount: atRiskInitiatives.length, atRiskRatio },
      generatedAt: now.toISOString(),
    });
  } else if (atRiskRatio > thresholds.atRiskInitiativesWarning) {
    insights.push({
      id: generateId(),
      category: 'strategic',
      severity: 'warning',
      title: `${atRiskInitiatives.length} initiatives at risk`,
      description: `${(atRiskRatio * 100).toFixed(0)}% of portfolio showing risk indicators.`,
      ruleName: 'PORTFOLIO_AT_RISK_WARNING',
      affectedEntities: atRiskInitiatives.slice(0, 3).map(i => ({ type: 'initiative' as const, id: i.id, name: i.name })),
      suggestedAction: 'Review at-risk initiatives in PMO meeting.',
      link: '/portfolio',
      metrics: { atRiskCount: atRiskInitiatives.length },
      generatedAt: now.toISOString(),
    });
  }

  // Rule: Budget concentration (one pillar has too much)
  const pillarBudgets = pillars.map(pillar => {
    const pillarInitiatives = initiatives.filter(i => i.pillarId === pillar.id);
    const totalBudget = pillarInitiatives.reduce((sum, i) => sum + i.budget, 0);
    return { pillar, totalBudget };
  });
  const totalPortfolioBudget = pillarBudgets.reduce((sum, pb) => sum + pb.totalBudget, 0);

  pillarBudgets.forEach(({ pillar, totalBudget }) => {
    const budgetShare = totalPortfolioBudget > 0 ? totalBudget / totalPortfolioBudget : 0;
    if (budgetShare > thresholds.pillarImbalanceThreshold && pillars.length > 2) {
      insights.push({
        id: generateId(),
        category: 'strategic',
        severity: 'info',
        title: `Budget concentration in ${pillar.name}`,
        description: `${(budgetShare * 100).toFixed(0)}% of portfolio budget allocated to one strategic pillar.`,
        ruleName: 'BUDGET_CONCENTRATION',
        affectedEntities: [{ type: 'pillar', id: pillar.id, name: pillar.name }],
        suggestedAction: 'Review if budget distribution aligns with strategic priorities.',
        link: '/strategy',
        metrics: { budgetShare, totalBudget },
        generatedAt: now.toISOString(),
      });
    }
  });

  return insights;
}

// =============================================================================
// POSITIVE INSIGHTS (Success stories)
// =============================================================================

function evaluateSuccessRules(
  initiatives: Initiative[],
  projects: Project[],
  tasks: Task[]
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const now = new Date();

  // Rule: High-performing initiatives
  initiatives.forEach(initiative => {
    const initiativeProjects = projects.filter(p => p.initiativeId === initiative.id);
    if (initiativeProjects.length === 0) return;

    const avgCompletion = initiativeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / initiativeProjects.length;
    const timeElapsed = getTimeElapsedPercentage(initiative.startDate, initiative.endDate);
    const spi = timeElapsed > 0 ? avgCompletion / timeElapsed : 1;
    const budgetVariance = initiative.budget > 0
      ? ((initiative.spentBudget - initiative.budget) / initiative.budget) * 100
      : 0;

    if (spi >= 1.1 && budgetVariance <= 0 && initiative.ragStatus === 'green') {
      insights.push({
        id: generateId(),
        category: 'strategic',
        severity: 'success',
        title: `${initiative.name} exceeding expectations`,
        description: `Ahead of schedule (SPI ${(spi * 100).toFixed(0)}%) and under budget. Consider as model for other initiatives.`,
        ruleName: 'HIGH_PERFORMER',
        affectedEntities: [{ type: 'initiative', id: initiative.id, name: initiative.name }],
        suggestedAction: 'Document success factors. Share best practices with other teams.',
        link: '/portfolio',
        metrics: { spi, budgetVariance },
        generatedAt: now.toISOString(),
      });
    }
  });

  // Rule: Projects nearing completion
  const nearCompletionProjects = projects.filter(p =>
    p.completionPercentage >= 85 &&
    p.status === 'in_progress' &&
    p.ragStatus !== 'red'
  );

  if (nearCompletionProjects.length > 0) {
    insights.push({
      id: generateId(),
      category: 'scope',
      severity: 'success',
      title: `${nearCompletionProjects.length} project(s) nearing completion`,
      description: `${nearCompletionProjects.map(p => p.name).join(', ')} are 85%+ complete.`,
      ruleName: 'NEAR_COMPLETION',
      affectedEntities: nearCompletionProjects.slice(0, 3).map(p => ({ type: 'project' as const, id: p.id, name: p.name })),
      suggestedAction: 'Prepare for project closure. Plan benefits realization tracking.',
      link: '/execution',
      generatedAt: now.toISOString(),
    });
  }

  // Rule: High task completion velocity
  const completedTasks = tasks.filter(t => t.kanbanStatus === 'done').length;
  const completionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;

  if (completionRate > 0.6 && tasks.length >= 10) {
    insights.push({
      id: generateId(),
      category: 'scope',
      severity: 'success',
      title: 'Strong task completion rate',
      description: `${(completionRate * 100).toFixed(0)}% of tasks completed. Team is maintaining good velocity.`,
      ruleName: 'HIGH_COMPLETION_RATE',
      affectedEntities: [],
      link: '/execution',
      metrics: { completedTasks, completionRate },
      generatedAt: now.toISOString(),
    });
  }

  return insights;
}

// =============================================================================
// MAIN ENGINE FUNCTION
// =============================================================================

/**
 * Generate all rule-based insights from current state
 * @param state - Current application state
 * @param config - Optional insights configuration (uses defaults if not provided)
 */
export function generateInsights(state: AppState, config?: InsightsConfig): RuleBasedInsight[] {
  const { pillars, initiatives, projects, tasks, resources } = state;

  // Use config or defaults
  const insightsConfig = config ?? DEFAULT_INSIGHTS_CONFIG;
  const thresholds = insightsConfig.thresholds;
  const categories = insightsConfig.categories;

  // If insights are disabled, return empty
  if (!insightsConfig.enabled) {
    return [];
  }

  const allInsights: RuleBasedInsight[] = [];

  // Only evaluate categories that are enabled
  if (categories.schedule) {
    allInsights.push(...evaluateScheduleRules(initiatives, projects, tasks, thresholds.schedule));
  }
  if (categories.cost) {
    allInsights.push(...evaluateCostRules(initiatives, projects, thresholds.cost));
  }
  if (categories.scope) {
    allInsights.push(...evaluateScopeRules(initiatives, projects, tasks, thresholds.scope));
  }
  if (categories.resource) {
    allInsights.push(...evaluateResourceRules(tasks, resources, thresholds.resource));
  }
  if (categories.strategic) {
    allInsights.push(...evaluateStrategicRules(pillars, initiatives, thresholds.strategic));
  }
  if (categories.success) {
    allInsights.push(...evaluateSuccessRules(initiatives, projects, tasks));
  }

  // Sort by severity (critical first) then by category
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  };

  return allInsights.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.category.localeCompare(b.category);
  });
}

/**
 * Get insights by category
 */
export function getInsightsByCategory(
  insights: RuleBasedInsight[],
  category: InsightCategory
): RuleBasedInsight[] {
  return insights.filter(i => i.category === category);
}

/**
 * Get insights by severity
 */
export function getInsightsBySeverity(
  insights: RuleBasedInsight[],
  severity: InsightSeverity
): RuleBasedInsight[] {
  return insights.filter(i => i.severity === severity);
}

/**
 * Get insight counts by severity
 */
export function getInsightCounts(insights: RuleBasedInsight[]): Record<InsightSeverity, number> {
  return {
    critical: insights.filter(i => i.severity === 'critical').length,
    warning: insights.filter(i => i.severity === 'warning').length,
    info: insights.filter(i => i.severity === 'info').length,
    success: insights.filter(i => i.severity === 'success').length,
  };
}

/**
 * Generate executive summary from insights (rule-based, no AI)
 */
export function generateExecutiveSummary(insights: RuleBasedInsight[]): {
  summary: string;
  keyRisks: string[];
  opportunities: string[];
  recommendations: string[];
} {
  const counts = getInsightCounts(insights);
  const criticals = insights.filter(i => i.severity === 'critical');
  const warnings = insights.filter(i => i.severity === 'warning');
  const successes = insights.filter(i => i.severity === 'success');

  // If no insights at all, return empty - likely no data exists
  if (insights.length === 0) {
    return {
      summary: '',
      keyRisks: [],
      opportunities: [],
      recommendations: [],
    };
  }

  // Build summary
  let summary = '';
  if (counts.critical > 0) {
    summary = `Portfolio requires immediate attention with ${counts.critical} critical issue(s). `;
  } else if (counts.warning > 3) {
    summary = `Portfolio showing multiple warning signs (${counts.warning} items). `;
  } else if (counts.success > counts.warning) {
    summary = `Portfolio is performing well with ${counts.success} positive indicator(s). `;
  } else {
    summary = `Portfolio is stable with minor items requiring attention. `;
  }

  summary += `Total: ${counts.critical} critical, ${counts.warning} warnings, ${counts.success} positive trends.`;

  // Extract key risks
  const keyRisks = criticals.concat(warnings)
    .slice(0, 5)
    .map(i => i.title);

  // Extract opportunities from successes
  const opportunities = successes
    .slice(0, 3)
    .map(i => i.title);

  // Build recommendations from suggested actions
  const recommendations = criticals.concat(warnings)
    .filter(i => i.suggestedAction)
    .slice(0, 5)
    .map(i => i.suggestedAction!);

  return { summary, keyRisks, opportunities, recommendations };
}
