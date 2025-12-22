/**
 * Stage-Gate Approval Framework
 *
 * Implements a structured approach to project approval using industry-standard
 * stage-gate methodology. Each gate has mandatory and weighted requirements
 * that must be satisfied before advancement.
 *
 * Stages:
 * 1. Idea → Gate 1 (Concept Screening)
 * 2. Business Case → Gate 2 (Business Case Approval)
 * 3. Planning → Gate 3 (Development Readiness)
 * 4. Execution → Gate 4 (Launch Readiness)
 * 5. Closure → Gate 5 (Post-Implementation Review)
 */

import type {
  Project,
  Initiative,
  Resource,
  Task,
  ProjectStage,
  RequirementCategory,
  RequirementStatus,
  ApprovalRequirement,
  StageGate,
  ProjectApprovalStatus,
  ProjectCharterDoc,
  ApprovalConfig,
} from '../types';
import { DEFAULT_APPROVAL_CONFIG } from './configDefaults';

// =============================================================================
// STAGE-GATE DEFINITIONS
// =============================================================================

/**
 * Standard stage-gate requirements template
 * These represent best-practice requirements for each gate
 */
export const STAGE_GATE_DEFINITIONS: StageGate[] = [
  // Gate 1: Concept Screening (Idea → Business Case)
  {
    stage: 'idea',
    name: 'Gate 1: Concept Screening',
    description: 'Initial screening to determine if the idea warrants further investigation',
    minimumScore: 60,
    requirements: [
      {
        id: 'g1-strategic-alignment',
        category: 'strategic',
        name: 'Strategic Alignment',
        description: 'Project aligns with organizational strategy and pillar objectives',
        isMandatory: true,
        weight: 25,
        status: 'not_started',
      },
      {
        id: 'g1-problem-statement',
        category: 'strategic',
        name: 'Problem Statement',
        description: 'Clear definition of the problem or opportunity being addressed',
        isMandatory: true,
        weight: 20,
        status: 'not_started',
      },
      {
        id: 'g1-sponsor-identified',
        category: 'governance',
        name: 'Executive Sponsor',
        description: 'Executive sponsor identified and committed',
        isMandatory: true,
        weight: 15,
        status: 'not_started',
      },
      {
        id: 'g1-preliminary-scope',
        category: 'delivery',
        name: 'Preliminary Scope',
        description: 'High-level scope and objectives defined',
        isMandatory: false,
        weight: 20,
        status: 'not_started',
      },
      {
        id: 'g1-initial-benefits',
        category: 'financial',
        name: 'Initial Benefits Estimate',
        description: 'Preliminary estimate of expected benefits/ROI',
        isMandatory: false,
        weight: 20,
        status: 'not_started',
      },
    ],
  },

  // Gate 2: Business Case Approval (Business Case → Planning)
  {
    stage: 'business_case',
    name: 'Gate 2: Business Case Approval',
    description: 'Formal approval of business case and commitment of resources for planning',
    minimumScore: 70,
    requirements: [
      {
        id: 'g2-business-case',
        category: 'financial',
        name: 'Business Case Document',
        description: 'Comprehensive business case with ROI analysis and benefits realization plan',
        isMandatory: true,
        weight: 15,
        status: 'not_started',
      },
      {
        id: 'g2-budget-approval',
        category: 'financial',
        name: 'Budget Approval',
        description: 'Budget allocated and approved by finance',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
      {
        id: 'g2-risk-assessment',
        category: 'risk',
        name: 'Risk Assessment',
        description: 'Initial risk identification and assessment completed',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
      // ===== CHARTER: Cost Benefits =====
      {
        id: 'g2-tangible-benefits',
        category: 'financial',
        name: 'Tangible Benefits',
        description: 'Measurable/direct cost benefits with quantified values (e.g., cost savings, revenue increase)',
        isMandatory: true,
        weight: 12,
        status: 'not_started',
      },
      {
        id: 'g2-intangible-benefits',
        category: 'financial',
        name: 'Intangible Benefits',
        description: 'Non-measurable/indirect benefits documented (e.g., customer satisfaction, brand value)',
        isMandatory: false,
        weight: 8,
        status: 'not_started',
      },
      // ===== CHARTER: Goals =====
      {
        id: 'g2-smart-goals',
        category: 'strategic',
        name: 'SMART Goals',
        description: 'Project goals that are Specific, Measurable, Achievable, Relevant, and Time-bound',
        isMandatory: true,
        weight: 12,
        status: 'not_started',
      },
      // ===== CHARTER: Process Diagrams =====
      {
        id: 'g2-process-vision',
        category: 'technical',
        name: 'Process Vision (To-Be)',
        description: 'Future state process diagram or description showing target process improvements',
        isMandatory: false,
        weight: 8,
        status: 'not_started',
      },
      {
        id: 'g2-as-is-process',
        category: 'technical',
        name: 'Current State (As-Is)',
        description: 'Documentation of current process state for baseline comparison',
        isMandatory: false,
        weight: 5,
        status: 'not_started',
      },
      {
        id: 'g2-stakeholder-analysis',
        category: 'governance',
        name: 'Stakeholder Analysis',
        description: 'Key stakeholders identified with engagement strategy',
        isMandatory: false,
        weight: 10,
        status: 'not_started',
      },
      {
        id: 'g2-resource-availability',
        category: 'resource',
        name: 'Resource Assessment',
        description: 'Key resources identified and availability confirmed',
        isMandatory: false,
        weight: 10,
        status: 'not_started',
      },
    ],
  },

  // Gate 3: Development Readiness (Planning → Execution)
  {
    stage: 'planning',
    name: 'Gate 3: Development Readiness',
    description: 'Approval to proceed with execution based on detailed planning',
    minimumScore: 75,
    requirements: [
      {
        id: 'g3-project-plan',
        category: 'delivery',
        name: 'Project Plan',
        description: 'Detailed project plan with WBS, schedule, and milestones',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
      {
        id: 'g3-budget-baseline',
        category: 'financial',
        name: 'Budget Baseline',
        description: 'Detailed budget established with cost breakdown',
        isMandatory: true,
        weight: 8,
        status: 'not_started',
      },
      {
        id: 'g3-risk-mitigation',
        category: 'risk',
        name: 'Risk Mitigation Plan',
        description: 'Risk register with mitigation strategies defined',
        isMandatory: true,
        weight: 8,
        status: 'not_started',
      },
      // ===== CHARTER: Scope Definition =====
      {
        id: 'g3-in-scope',
        category: 'delivery',
        name: 'In-Scope Items',
        description: 'Clear definition of what is included in project scope with rationale',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
      {
        id: 'g3-out-scope',
        category: 'delivery',
        name: 'Out-of-Scope Items',
        description: 'Explicit documentation of what is excluded from scope with rationale',
        isMandatory: true,
        weight: 8,
        status: 'not_started',
      },
      // ===== CHARTER: Project Team Roles =====
      {
        id: 'g3-project-team-roles',
        category: 'resource',
        name: 'Project Team Roles',
        description: 'Team members assigned with clear roles, responsibilities, and commitment levels',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
      // ===== CHARTER: Metrics =====
      {
        id: 'g3-success-metrics',
        category: 'strategic',
        name: 'Success Metrics',
        description: 'Defined metrics/KPIs to measure project success with baseline and target values',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
      // ===== CHARTER: Controls =====
      {
        id: 'g3-project-controls',
        category: 'governance',
        name: 'Project Controls',
        description: 'Preventive, detective, and corrective controls defined with owners and frequency',
        isMandatory: false,
        weight: 7,
        status: 'not_started',
      },
      // ===== CHARTER: Policies =====
      {
        id: 'g3-policy-compliance',
        category: 'governance',
        name: 'Policy Compliance',
        description: 'Applicable policies identified with compliance requirements documented',
        isMandatory: false,
        weight: 6,
        status: 'not_started',
      },
      // ===== CHARTER: Data Specifications =====
      {
        id: 'g3-data-specifications',
        category: 'technical',
        name: 'Data Specifications',
        description: 'Data requirements including sources, formats, quality requirements, and classifications',
        isMandatory: false,
        weight: 8,
        status: 'not_started',
      },
      {
        id: 'g3-technical-design',
        category: 'technical',
        name: 'Technical Design',
        description: 'Technical architecture and design approved',
        isMandatory: false,
        weight: 8,
        status: 'not_started',
      },
      {
        id: 'g3-communication-plan',
        category: 'governance',
        name: 'Communication Plan',
        description: 'Stakeholder communication plan established',
        isMandatory: false,
        weight: 7,
        status: 'not_started',
      },
    ],
  },

  // Gate 4: Launch Readiness (Execution → Closure)
  {
    stage: 'execution',
    name: 'Gate 4: Launch Readiness',
    description: 'Approval to close project and transition to operations',
    minimumScore: 80,
    requirements: [
      {
        id: 'g4-deliverables-complete',
        category: 'delivery',
        name: 'Deliverables Complete',
        description: 'All project deliverables completed and accepted',
        isMandatory: true,
        weight: 25,
        status: 'not_started',
      },
      {
        id: 'g4-testing-complete',
        category: 'delivery',
        name: 'Testing Complete',
        description: 'All testing completed with acceptable results',
        isMandatory: true,
        weight: 20,
        status: 'not_started',
      },
      {
        id: 'g4-training-complete',
        category: 'resource',
        name: 'Training Complete',
        description: 'End-user training completed',
        isMandatory: false,
        weight: 15,
        status: 'not_started',
      },
      {
        id: 'g4-documentation',
        category: 'technical',
        name: 'Documentation',
        description: 'Technical and user documentation complete',
        isMandatory: false,
        weight: 15,
        status: 'not_started',
      },
      // ===== CHARTER: Operations Handover Team =====
      {
        id: 'g4-operations-team',
        category: 'resource',
        name: 'Operations Team Defined',
        description: 'Operations/BAU team identified with roles and responsibilities for post-project support',
        isMandatory: true,
        weight: 15,
        status: 'not_started',
      },
      {
        id: 'g4-support-handover',
        category: 'governance',
        name: 'Support Handover',
        description: 'Support team briefed and ready for transition',
        isMandatory: false,
        weight: 15,
        status: 'not_started',
      },
      {
        id: 'g4-stakeholder-signoff',
        category: 'governance',
        name: 'Stakeholder Sign-off',
        description: 'Key stakeholders have approved deliverables',
        isMandatory: true,
        weight: 10,
        status: 'not_started',
      },
    ],
  },

  // Gate 5: Post-Implementation Review (Closure → Complete)
  {
    stage: 'closure',
    name: 'Gate 5: Project Closure',
    description: 'Final review and formal project closure',
    minimumScore: 70,
    requirements: [
      {
        id: 'g5-lessons-learned',
        category: 'governance',
        name: 'Lessons Learned',
        description: 'Lessons learned documented and shared',
        isMandatory: true,
        weight: 25,
        status: 'not_started',
      },
      {
        id: 'g5-benefits-review',
        category: 'financial',
        name: 'Benefits Review',
        description: 'Initial benefits realization assessed',
        isMandatory: true,
        weight: 25,
        status: 'not_started',
      },
      {
        id: 'g5-financial-closeout',
        category: 'financial',
        name: 'Financial Close-out',
        description: 'All project financials reconciled and closed',
        isMandatory: true,
        weight: 20,
        status: 'not_started',
      },
      {
        id: 'g5-resource-release',
        category: 'resource',
        name: 'Resource Release',
        description: 'Team members released and transitioned',
        isMandatory: false,
        weight: 15,
        status: 'not_started',
      },
      {
        id: 'g5-archive',
        category: 'governance',
        name: 'Archive Documentation',
        description: 'Project artifacts archived appropriately',
        isMandatory: false,
        weight: 15,
        status: 'not_started',
      },
    ],
  },
];

// =============================================================================
// AUTO-ASSESSMENT FUNCTIONS
// =============================================================================

/**
 * Default category weights for auto-assessment scoring
 */
const DEFAULT_CATEGORY_WEIGHTS: Record<RequirementCategory, number> = DEFAULT_APPROVAL_CONFIG.categoryWeights;

/**
 * Auto-assess project readiness based on available data
 * This provides an automated score based on what can be determined from project data
 */
export function autoAssessProjectReadiness(
  project: Project,
  initiative: Initiative | undefined,
  tasks: Task[],
  resources: Resource[]
): Partial<Record<string, RequirementStatus>> {
  const assessments: Partial<Record<string, RequirementStatus>> = {};

  // Calculate metrics
  const hasManager = project.managerId && resources.some(r => r.id === project.managerId);
  const hasBudget = project.budget > 0;
  const hasStartDate = !!project.startDate;
  const hasEndDate = !!project.endDate;
  const hasDescription = project.description && project.description.length > 20;
  const hasTasks = tasks.length > 0;
  const completedTasks = tasks.filter(t => t.kanbanStatus === 'done').length;
  const completionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const hasInitiative = !!initiative;
  const hasRiskAssessment = project.riskExposure !== undefined && project.riskExposure > 0;

  // Budget utilization
  const budgetSpent = project.actualCost || 0;
  const budgetUtilization = project.budget > 0 ? budgetSpent / project.budget : 0;

  // Gate 1 Assessments
  assessments['g1-strategic-alignment'] = hasInitiative ? 'complete' : 'not_started';
  assessments['g1-problem-statement'] = hasDescription ? 'complete' : 'not_started';
  assessments['g1-sponsor-identified'] = hasManager ? 'complete' : 'not_started';
  assessments['g1-preliminary-scope'] = hasTasks ? 'complete' : 'not_started';
  assessments['g1-initial-benefits'] = hasBudget ? 'in_progress' : 'not_started';

  // Charter data
  const charter = project.charter;
  const hasCharter = !!charter;

  // Gate 2 Assessments
  assessments['g2-business-case'] = hasBudget && hasDescription ? 'in_progress' : 'not_started';
  assessments['g2-budget-approval'] = hasBudget ? 'complete' : 'not_started';
  assessments['g2-risk-assessment'] = hasRiskAssessment ? 'complete' : 'not_started';
  assessments['g2-stakeholder-analysis'] = hasManager ? 'in_progress' : 'not_started';
  assessments['g2-resource-availability'] = hasManager ? 'complete' : 'not_started';

  // Gate 2 Charter Assessments
  assessments['g2-tangible-benefits'] = hasCharter && charter.costBenefits?.tangible && charter.costBenefits.tangible.length > 0
    ? 'complete' : 'not_started';
  assessments['g2-intangible-benefits'] = hasCharter && charter.costBenefits?.intangible && charter.costBenefits.intangible.length > 0
    ? 'complete' : 'not_started';
  assessments['g2-smart-goals'] = hasCharter && charter.goals && charter.goals.length > 0
    ? (charter.goals.every(g => g.isSpecific && g.isMeasurable && g.isAchievable && g.isRelevant && g.isTimeBound) ? 'complete' : 'in_progress')
    : 'not_started';
  assessments['g2-process-vision'] = hasCharter && charter.processDiagrams?.toBeDescription
    ? 'complete' : 'not_started';
  assessments['g2-as-is-process'] = hasCharter && charter.processDiagrams?.asIsDescription
    ? 'complete' : 'not_started';

  // Gate 3 Assessments
  assessments['g3-project-plan'] = hasStartDate && hasEndDate && hasTasks ? 'complete' :
    hasTasks ? 'in_progress' : 'not_started';
  assessments['g3-budget-baseline'] = hasBudget ? 'complete' : 'not_started';
  assessments['g3-risk-mitigation'] = hasRiskAssessment ? 'in_progress' : 'not_started';
  assessments['g3-communication-plan'] = 'not_started'; // Can't auto-assess
  assessments['g3-technical-design'] = hasTasks && tasks.length >= 5 ? 'in_progress' : 'not_started';

  // Gate 3 Charter Assessments
  assessments['g3-in-scope'] = hasCharter && charter.scope?.inScope && charter.scope.inScope.length > 0
    ? 'complete' : 'not_started';
  assessments['g3-out-scope'] = hasCharter && charter.scope?.outOfScope && charter.scope.outOfScope.length > 0
    ? 'complete' : 'not_started';
  assessments['g3-project-team-roles'] = hasCharter && charter.projectTeam && charter.projectTeam.length > 0
    ? (charter.projectTeam.some(r => r.assignedResourceId) ? 'complete' : 'in_progress')
    : (hasManager ? 'in_progress' : 'not_started');
  assessments['g3-success-metrics'] = hasCharter && charter.metrics && charter.metrics.length > 0
    ? 'complete' : 'not_started';
  assessments['g3-project-controls'] = hasCharter && charter.controls && charter.controls.length > 0
    ? 'complete' : 'not_started';
  assessments['g3-policy-compliance'] = hasCharter && charter.policies && charter.policies.length > 0
    ? 'complete' : 'not_started';
  assessments['g3-data-specifications'] = hasCharter && charter.dataSpecifications && charter.dataSpecifications.length > 0
    ? 'complete' : 'not_applicable'; // N/A if project doesn't involve data

  // Gate 4 Assessments
  assessments['g4-deliverables-complete'] = completionRate >= 1.0 ? 'complete' :
    completionRate >= 0.8 ? 'in_progress' : 'not_started';
  assessments['g4-testing-complete'] = completionRate >= 0.9 ? 'in_progress' : 'not_started';
  assessments['g4-training-complete'] = 'not_started'; // Can't auto-assess
  assessments['g4-documentation'] = 'not_started'; // Can't auto-assess
  assessments['g4-support-handover'] = 'not_started'; // Can't auto-assess
  assessments['g4-stakeholder-signoff'] = project.status === 'completed' ? 'complete' : 'not_started';

  // Gate 4 Charter Assessment: Operations Team
  assessments['g4-operations-team'] = hasCharter && charter.operationsTeam && charter.operationsTeam.length > 0
    ? (charter.operationsTeam.some(r => r.assignedResourceId) ? 'complete' : 'in_progress')
    : 'not_started';

  // Gate 5 Assessments
  assessments['g5-lessons-learned'] = 'not_started'; // Can't auto-assess
  assessments['g5-benefits-review'] = project.status === 'completed' ? 'in_progress' : 'not_started';
  assessments['g5-financial-closeout'] = project.status === 'completed' && budgetUtilization <= 1.1 ?
    'in_progress' : 'not_started';
  assessments['g5-resource-release'] = project.status === 'completed' ? 'in_progress' : 'not_started';
  assessments['g5-archive'] = 'not_started'; // Can't auto-assess

  return assessments;
}

// =============================================================================
// GATE SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate score for a single gate
 */
export function calculateGateScore(
  gate: StageGate,
  requirementStatuses: Partial<Record<string, RequirementStatus>>
): {
  mandatoryComplete: boolean;
  weightedScore: number;
  totalRequirements: number;
  completedRequirements: number;
  blockers: string[];
} {
  const blockers: string[] = [];
  let mandatoryComplete = true;
  let weightedSum = 0;
  let totalWeight = 0;
  let completedCount = 0;

  for (const req of gate.requirements) {
    const status = requirementStatuses[req.id] || req.status;
    const isComplete = status === 'complete';
    const isWaived = status === 'waived';
    const isNotApplicable = status === 'not_applicable';
    const effectiveComplete = isComplete || isWaived || isNotApplicable;

    // Check mandatory requirements
    if (req.isMandatory && !effectiveComplete) {
      mandatoryComplete = false;
      blockers.push(`${req.name} (Mandatory)`);
    }

    // Calculate weighted score (only for items that can contribute)
    if (!isNotApplicable) {
      totalWeight += req.weight;
      if (effectiveComplete) {
        weightedSum += req.weight;
        completedCount++;
      } else if (status === 'in_progress') {
        // Partial credit for in-progress items
        weightedSum += req.weight * 0.5;
      }
    } else {
      completedCount++; // N/A counts as "handled"
    }
  }

  const weightedScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  return {
    mandatoryComplete,
    weightedScore: Math.round(weightedScore),
    totalRequirements: gate.requirements.length,
    completedRequirements: completedCount,
    blockers,
  };
}

/**
 * Determine approval recommendation based on gate scores
 * @param gateScore - Calculated gate score
 * @param minimumScore - Minimum score required for approval
 * @param config - Optional recommendation configuration
 */
export function determineRecommendation(
  gateScore: ReturnType<typeof calculateGateScore>,
  minimumScore: number,
  config?: ApprovalConfig['recommendations']
): 'approve' | 'conditional' | 'defer' | 'reject' {
  const { mandatoryComplete, weightedScore, blockers } = gateScore;

  // Use config values or defaults
  const conditionalOffset = config?.conditionalThresholdOffset ?? DEFAULT_APPROVAL_CONFIG.recommendations.conditionalThresholdOffset;
  const deferMinScore = config?.deferMinimumScore ?? DEFAULT_APPROVAL_CONFIG.recommendations.deferMinimumScore;
  const deferMaxBlockers = config?.deferMaxBlockers ?? DEFAULT_APPROVAL_CONFIG.recommendations.deferMaxBlockers;

  // All mandatory complete and meets minimum score
  if (mandatoryComplete && weightedScore >= minimumScore) {
    return 'approve';
  }

  // All mandatory complete but score is close (within configured offset)
  if (mandatoryComplete && weightedScore >= minimumScore - conditionalOffset) {
    return 'conditional';
  }

  // Score is reasonable but missing mandatory items
  if (!mandatoryComplete && weightedScore >= minimumScore) {
    return 'conditional';
  }

  // Low score but some progress made
  if (weightedScore >= deferMinScore || blockers.length <= deferMaxBlockers) {
    return 'defer';
  }

  // Very low readiness
  return 'reject';
}

// =============================================================================
// MAIN ASSESSMENT FUNCTION
// =============================================================================

/**
 * Assess project readiness across all gates
 * @param project - The project to assess
 * @param initiative - Parent initiative (if any)
 * @param tasks - Project tasks
 * @param resources - Available resources
 * @param manualOverrides - Optional manual status overrides
 * @param config - Optional approval configuration (uses defaults if not provided)
 */
export function assessProjectApproval(
  project: Project,
  initiative: Initiative | undefined,
  tasks: Task[],
  resources: Resource[],
  manualOverrides?: Partial<Record<string, RequirementStatus>>,
  config?: ApprovalConfig
): ProjectApprovalStatus {
  // Use config or defaults
  const approvalConfig = config ?? DEFAULT_APPROVAL_CONFIG;
  const gateMinimums = approvalConfig.gateMinimums;
  const recommendationConfig = approvalConfig.recommendations;

  // Get auto-assessed statuses
  const autoAssessments = autoAssessProjectReadiness(project, initiative, tasks, resources);

  // Merge with manual overrides (manual takes precedence)
  const mergedStatuses = { ...autoAssessments, ...manualOverrides };

  // Determine current stage based on project status
  let currentStage: ProjectStage = 'idea';
  if (project.status === 'completed') {
    currentStage = 'closure';
  } else if (project.status === 'in_progress') {
    currentStage = 'execution';
  } else if (project.status === 'not_started' && tasks.length > 0) {
    currentStage = 'planning';
  } else if (project.budget > 0) {
    currentStage = 'business_case';
  }

  // Calculate scores for all gates using config minimum scores
  const gateScores: ProjectApprovalStatus['gateScores'] = {} as ProjectApprovalStatus['gateScores'];

  for (const gate of STAGE_GATE_DEFINITIONS) {
    // Override gate minimum with config value
    const gateWithConfigMin = {
      ...gate,
      minimumScore: gateMinimums[gate.stage] ?? gate.minimumScore,
    };
    gateScores[gate.stage] = calculateGateScore(gateWithConfigMin, mergedStatuses);
  }

  // Get current gate for recommendation
  const currentGate = STAGE_GATE_DEFINITIONS.find(g => g.stage === currentStage);
  const currentScore = gateScores[currentStage];
  const minimumScore = gateMinimums[currentStage] ?? currentGate?.minimumScore ?? 60;

  // Determine overall recommendation
  const recommendation = currentGate
    ? determineRecommendation(currentScore, minimumScore, recommendationConfig)
    : 'defer';

  // Generate conditions for conditional approval
  const conditions: string[] = [];
  if (recommendation === 'conditional') {
    if (!currentScore.mandatoryComplete) {
      conditions.push('Complete all mandatory requirements before proceeding');
    }
    if (currentScore.weightedScore < minimumScore) {
      conditions.push(`Achieve minimum score of ${minimumScore}% (current: ${currentScore.weightedScore}%)`);
    }
    // Add specific conditions based on blockers
    currentScore.blockers.slice(0, 3).forEach(blocker => {
      conditions.push(`Address: ${blocker}`);
    });
  }

  return {
    projectId: project.id,
    currentStage,
    gateScores,
    recommendation,
    conditions: conditions.length > 0 ? conditions : undefined,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get color class for recommendation
 */
export function getRecommendationColor(recommendation: ProjectApprovalStatus['recommendation']): string {
  switch (recommendation) {
    case 'approve': return 'text-green-400';
    case 'conditional': return 'text-amber-400';
    case 'defer': return 'text-orange-400';
    case 'reject': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

/**
 * Get background color class for recommendation
 */
export function getRecommendationBgColor(recommendation: ProjectApprovalStatus['recommendation']): string {
  switch (recommendation) {
    case 'approve': return 'bg-green-500/20';
    case 'conditional': return 'bg-amber-500/20';
    case 'defer': return 'bg-orange-500/20';
    case 'reject': return 'bg-red-500/20';
    default: return 'bg-slate-500/20';
  }
}

/**
 * Get human-readable recommendation text
 */
export function getRecommendationText(recommendation: ProjectApprovalStatus['recommendation']): string {
  switch (recommendation) {
    case 'approve': return 'Ready to Proceed';
    case 'conditional': return 'Conditional Approval';
    case 'defer': return 'Defer Decision';
    case 'reject': return 'Not Ready';
    default: return 'Unknown';
  }
}

/**
 * Get stage display name
 */
export function getStageName(stage: ProjectStage): string {
  const stageNames: Record<ProjectStage, string> = {
    idea: 'Idea',
    business_case: 'Business Case',
    planning: 'Planning',
    execution: 'Execution',
    closure: 'Closure',
  };
  return stageNames[stage];
}

/**
 * Get next stage in the lifecycle
 */
export function getNextStage(currentStage: ProjectStage): ProjectStage | null {
  const stages: ProjectStage[] = ['idea', 'business_case', 'planning', 'execution', 'closure'];
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
}

/**
 * Get category display name
 */
export function getCategoryName(category: RequirementCategory): string {
  const names: Record<RequirementCategory, string> = {
    strategic: 'Strategic',
    financial: 'Financial',
    technical: 'Technical',
    resource: 'Resource',
    risk: 'Risk',
    governance: 'Governance',
    delivery: 'Delivery',
  };
  return names[category];
}

/**
 * Get category color for visual grouping
 */
export function getCategoryColor(category: RequirementCategory): string {
  const colors: Record<RequirementCategory, string> = {
    strategic: '#8b5cf6',   // Purple
    financial: '#10b981',   // Green
    technical: '#3b82f6',   // Blue
    resource: '#f59e0b',    // Amber
    risk: '#ef4444',        // Red
    governance: '#6366f1',  // Indigo
    delivery: '#06b6d4',    // Cyan
  };
  return colors[category];
}

/**
 * Generate approval summary for a project
 */
export function generateApprovalSummary(status: ProjectApprovalStatus): {
  summary: string;
  readinessPercent: number;
  nextSteps: string[];
} {
  const currentScore = status.gateScores[status.currentStage];
  const nextStage = getNextStage(status.currentStage);

  let summary = '';
  const nextSteps: string[] = [];

  // Generate summary based on recommendation
  switch (status.recommendation) {
    case 'approve':
      summary = `Project is ready to advance from ${getStageName(status.currentStage)} to ${nextStage ? getStageName(nextStage) : 'completion'}. All requirements have been satisfied.`;
      if (nextStage) {
        nextSteps.push(`Schedule gate review for ${getStageName(nextStage)} phase`);
      }
      break;

    case 'conditional':
      summary = `Project can proceed with conditions. ${currentScore.blockers.length} item(s) require attention before full approval.`;
      status.conditions?.forEach(c => nextSteps.push(c));
      break;

    case 'defer':
      summary = `Project requires additional work before gate review. ${currentScore.blockers.length} blockers identified.`;
      currentScore.blockers.forEach(b => nextSteps.push(`Address: ${b}`));
      if (currentScore.weightedScore < 50) {
        nextSteps.push('Schedule checkpoint review in 2 weeks');
      }
      break;

    case 'reject':
      summary = `Project does not meet minimum requirements for ${getStageName(status.currentStage)} stage. Significant gaps identified.`;
      nextSteps.push('Review project viability with sponsor');
      nextSteps.push('Reassess scope and resource commitment');
      currentScore.blockers.slice(0, 3).forEach(b => nextSteps.push(`Critical: ${b}`));
      break;
  }

  return {
    summary,
    readinessPercent: currentScore.weightedScore,
    nextSteps: nextSteps.slice(0, 5), // Limit to 5 items
  };
}

// =============================================================================
// CHARTER COMPLETENESS SCORING
// =============================================================================

/**
 * Charter element weights for completeness scoring
 * Based on typical PMO requirements and best practices
 */
export const CHARTER_ELEMENT_WEIGHTS = {
  // Process Documentation (15%)
  processDiagrams: {
    asIs: 5,
    toBe: 10,
  },
  // Cost Benefits (20%)
  costBenefits: {
    tangible: 12,
    intangible: 8,
  },
  // Controls (8%)
  controls: 8,
  // Goals (12%)
  goals: 12,
  // Metrics (10%)
  metrics: 10,
  // Policies (5%)
  policies: 5,
  // Team Roles (15%)
  projectTeam: 10,
  operationsTeam: 5,
  // Scope (10%)
  scope: {
    inScope: 6,
    outOfScope: 4,
  },
  // Data Specifications (5%)
  dataSpecifications: 5,
} as const;

/**
 * Charter completeness breakdown by section
 */
export interface CharterCompletenessBreakdown {
  /** Overall completeness score (0-100) */
  overallScore: number;
  /** Section scores (0-100) */
  sections: {
    processDiagrams: number;
    costBenefits: number;
    controls: number;
    goals: number;
    metrics: number;
    policies: number;
    projectTeam: number;
    operationsTeam: number;
    scope: number;
    dataSpecifications: number;
  };
  /** Missing elements */
  missingElements: string[];
  /** Partially complete elements */
  partialElements: string[];
  /** Complete elements */
  completeElements: string[];
}

/**
 * Calculate charter completeness score for a project
 */
export function calculateCharterCompleteness(charter: ProjectCharterDoc | undefined): CharterCompletenessBreakdown {
  const missingElements: string[] = [];
  const partialElements: string[] = [];
  const completeElements: string[] = [];

  let totalScore = 0;

  // Process Diagrams (15%)
  let processDiagramScore = 0;
  if (charter?.processDiagrams) {
    if (charter.processDiagrams.asIsDescription || charter.processDiagrams.asIsDiagramUrl) {
      processDiagramScore += CHARTER_ELEMENT_WEIGHTS.processDiagrams.asIs;
      completeElements.push('As-Is Process');
    } else {
      missingElements.push('As-Is Process Diagram');
    }
    if (charter.processDiagrams.toBeDescription || charter.processDiagrams.toBeDiagramUrl) {
      processDiagramScore += CHARTER_ELEMENT_WEIGHTS.processDiagrams.toBe;
      completeElements.push('To-Be Process');
    } else {
      missingElements.push('To-Be Process Diagram');
    }
  } else {
    missingElements.push('Process Diagrams');
  }
  totalScore += processDiagramScore;

  // Cost Benefits (20%)
  let costBenefitsScore = 0;
  if (charter?.costBenefits) {
    if (charter.costBenefits.tangible && charter.costBenefits.tangible.length > 0) {
      // Check if values are quantified
      const hasQuantifiedValues = charter.costBenefits.tangible.every(b => b.estimatedValue !== undefined);
      if (hasQuantifiedValues) {
        costBenefitsScore += CHARTER_ELEMENT_WEIGHTS.costBenefits.tangible;
        completeElements.push('Tangible Benefits (quantified)');
      } else {
        costBenefitsScore += CHARTER_ELEMENT_WEIGHTS.costBenefits.tangible * 0.5;
        partialElements.push('Tangible Benefits (values not quantified)');
      }
    } else {
      missingElements.push('Tangible Benefits');
    }
    if (charter.costBenefits.intangible && charter.costBenefits.intangible.length > 0) {
      costBenefitsScore += CHARTER_ELEMENT_WEIGHTS.costBenefits.intangible;
      completeElements.push('Intangible Benefits');
    } else {
      missingElements.push('Intangible Benefits');
    }
  } else {
    missingElements.push('Cost Benefits Analysis');
  }
  totalScore += costBenefitsScore;

  // Controls (8%)
  let controlsScore = 0;
  if (charter?.controls && charter.controls.length > 0) {
    // Check for variety of control types
    const hasPreventive = charter.controls.some(c => c.type === 'preventive');
    const hasDetective = charter.controls.some(c => c.type === 'detective');
    const hasCorrective = charter.controls.some(c => c.type === 'corrective');
    const typeCount = [hasPreventive, hasDetective, hasCorrective].filter(Boolean).length;
    controlsScore = (typeCount / 3) * CHARTER_ELEMENT_WEIGHTS.controls;
    if (typeCount === 3) {
      completeElements.push('Controls (all types)');
    } else {
      partialElements.push(`Controls (${typeCount}/3 types)`);
    }
  } else {
    missingElements.push('Project Controls');
  }
  totalScore += controlsScore;

  // Goals (12%)
  let goalsScore = 0;
  if (charter?.goals && charter.goals.length > 0) {
    // Check SMART compliance
    const smartGoals = charter.goals.filter(g =>
      g.isSpecific && g.isMeasurable && g.isAchievable && g.isRelevant && g.isTimeBound
    );
    if (smartGoals.length === charter.goals.length) {
      goalsScore = CHARTER_ELEMENT_WEIGHTS.goals;
      completeElements.push('Goals (SMART)');
    } else {
      goalsScore = (smartGoals.length / charter.goals.length) * CHARTER_ELEMENT_WEIGHTS.goals;
      partialElements.push(`Goals (${smartGoals.length}/${charter.goals.length} SMART)`);
    }
  } else {
    missingElements.push('Project Goals');
  }
  totalScore += goalsScore;

  // Metrics (10%)
  let metricsScore = 0;
  if (charter?.metrics && charter.metrics.length > 0) {
    // Check if metrics have baselines and targets
    const completeMetrics = charter.metrics.filter(m =>
      m.targetValue !== undefined && m.baselineValue !== undefined
    );
    if (completeMetrics.length === charter.metrics.length) {
      metricsScore = CHARTER_ELEMENT_WEIGHTS.metrics;
      completeElements.push('Success Metrics');
    } else {
      metricsScore = (completeMetrics.length / charter.metrics.length) * CHARTER_ELEMENT_WEIGHTS.metrics;
      partialElements.push(`Metrics (${completeMetrics.length}/${charter.metrics.length} with baselines)`);
    }
  } else {
    missingElements.push('Success Metrics');
  }
  totalScore += metricsScore;

  // Policies (5%)
  let policiesScore = 0;
  if (charter?.policies && charter.policies.length > 0) {
    policiesScore = CHARTER_ELEMENT_WEIGHTS.policies;
    completeElements.push('Policy Compliance');
  } else {
    missingElements.push('Policy References');
  }
  totalScore += policiesScore;

  // Project Team (10%)
  let projectTeamScore = 0;
  if (charter?.projectTeam && charter.projectTeam.length > 0) {
    const assignedRoles = charter.projectTeam.filter(r => r.assignedResourceId);
    if (assignedRoles.length === charter.projectTeam.length) {
      projectTeamScore = CHARTER_ELEMENT_WEIGHTS.projectTeam;
      completeElements.push('Project Team Roles');
    } else {
      projectTeamScore = (assignedRoles.length / charter.projectTeam.length) * CHARTER_ELEMENT_WEIGHTS.projectTeam;
      partialElements.push(`Project Team (${assignedRoles.length}/${charter.projectTeam.length} assigned)`);
    }
  } else {
    missingElements.push('Project Team Roles');
  }
  totalScore += projectTeamScore;

  // Operations Team (5%)
  let operationsTeamScore = 0;
  if (charter?.operationsTeam && charter.operationsTeam.length > 0) {
    operationsTeamScore = CHARTER_ELEMENT_WEIGHTS.operationsTeam;
    completeElements.push('Operations Handover Team');
  } else {
    missingElements.push('Operations Handover Team');
  }
  totalScore += operationsTeamScore;

  // Scope (10%)
  let scopeScore = 0;
  if (charter?.scope) {
    if (charter.scope.inScope && charter.scope.inScope.length > 0) {
      scopeScore += CHARTER_ELEMENT_WEIGHTS.scope.inScope;
      completeElements.push('In-Scope Items');
    } else {
      missingElements.push('In-Scope Definition');
    }
    if (charter.scope.outOfScope && charter.scope.outOfScope.length > 0) {
      scopeScore += CHARTER_ELEMENT_WEIGHTS.scope.outOfScope;
      completeElements.push('Out-of-Scope Items');
    } else {
      missingElements.push('Out-of-Scope Definition');
    }
  } else {
    missingElements.push('Scope Definition');
  }
  totalScore += scopeScore;

  // Data Specifications (5%)
  let dataSpecificationsScore = 0;
  if (charter?.dataSpecifications && charter.dataSpecifications.length > 0) {
    dataSpecificationsScore = CHARTER_ELEMENT_WEIGHTS.dataSpecifications;
    completeElements.push('Data Specifications');
  } else {
    // Data specs might not be applicable for all projects
    partialElements.push('Data Specifications (optional)');
    dataSpecificationsScore = CHARTER_ELEMENT_WEIGHTS.dataSpecifications * 0.5; // Give partial credit
  }
  totalScore += dataSpecificationsScore;

  // Calculate section scores as percentages
  const maxProcessDiagram = CHARTER_ELEMENT_WEIGHTS.processDiagrams.asIs + CHARTER_ELEMENT_WEIGHTS.processDiagrams.toBe;
  const maxCostBenefits = CHARTER_ELEMENT_WEIGHTS.costBenefits.tangible + CHARTER_ELEMENT_WEIGHTS.costBenefits.intangible;
  const maxScope = CHARTER_ELEMENT_WEIGHTS.scope.inScope + CHARTER_ELEMENT_WEIGHTS.scope.outOfScope;

  return {
    overallScore: Math.round(totalScore),
    sections: {
      processDiagrams: Math.round((processDiagramScore / maxProcessDiagram) * 100),
      costBenefits: Math.round((costBenefitsScore / maxCostBenefits) * 100),
      controls: Math.round((controlsScore / CHARTER_ELEMENT_WEIGHTS.controls) * 100),
      goals: Math.round((goalsScore / CHARTER_ELEMENT_WEIGHTS.goals) * 100),
      metrics: Math.round((metricsScore / CHARTER_ELEMENT_WEIGHTS.metrics) * 100),
      policies: Math.round((policiesScore / CHARTER_ELEMENT_WEIGHTS.policies) * 100),
      projectTeam: Math.round((projectTeamScore / CHARTER_ELEMENT_WEIGHTS.projectTeam) * 100),
      operationsTeam: Math.round((operationsTeamScore / CHARTER_ELEMENT_WEIGHTS.operationsTeam) * 100),
      scope: Math.round((scopeScore / maxScope) * 100),
      dataSpecifications: Math.round((dataSpecificationsScore / CHARTER_ELEMENT_WEIGHTS.dataSpecifications) * 100),
    },
    missingElements,
    partialElements,
    completeElements,
  };
}

/**
 * Get charter completeness category based on score
 */
export function getCharterCompletenessCategory(score: number): {
  category: 'incomplete' | 'partial' | 'adequate' | 'complete';
  label: string;
  color: string;
} {
  if (score >= 90) {
    return { category: 'complete', label: 'Complete', color: 'text-green-400' };
  } else if (score >= 70) {
    return { category: 'adequate', label: 'Adequate', color: 'text-blue-400' };
  } else if (score >= 40) {
    return { category: 'partial', label: 'Partial', color: 'text-amber-400' };
  } else {
    return { category: 'incomplete', label: 'Incomplete', color: 'text-red-400' };
  }
}

/**
 * Generate charter completion recommendations
 */
export function generateCharterRecommendations(breakdown: CharterCompletenessBreakdown): string[] {
  const recommendations: string[] = [];

  // Prioritize missing mandatory elements
  const mandatoryMissing = breakdown.missingElements.filter(e =>
    ['Tangible Benefits', 'Project Goals', 'In-Scope Definition', 'Project Team Roles'].includes(e)
  );

  mandatoryMissing.forEach(item => {
    recommendations.push(`Complete: ${item} (required for approval)`);
  });

  // Add recommendations for partial items
  breakdown.partialElements.slice(0, 3).forEach(item => {
    recommendations.push(`Improve: ${item}`);
  });

  // Add optional missing items
  const optionalMissing = breakdown.missingElements.filter(e =>
    !mandatoryMissing.includes(e)
  );

  if (recommendations.length < 5) {
    optionalMissing.slice(0, 5 - recommendations.length).forEach(item => {
      recommendations.push(`Consider adding: ${item}`);
    });
  }

  return recommendations.slice(0, 5);
}
