// =============================================================================
// ENUMS & LITERAL TYPES
// =============================================================================

/** RAG Status - Red/Amber/Green health indicator */
export type RAGStatus = 'red' | 'amber' | 'green';

/** Kanban status for tasks */
export type KanbanStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

/** Project lifecycle status */
export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

/** Milestone status for WBS tracking */
export type MilestoneStatus = 'pending' | 'completed' | 'missed';

/** Task priority levels */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Priority band for initiatives (P1 = highest) */
export type PriorityBand = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

/** Risk category types aligned with PPM best practices */
export type RiskCategory = 'technical' | 'delivery' | 'business' | 'organizational' | 'external';

/** Department/Function codes for Work ID generation */
export type DepartmentCode =
  | 'FIN'   // Finance
  | 'MKT'   // Marketing
  | 'OPS'   // Operations
  | 'IT'    // Information Technology
  | 'HR'    // Human Resources
  | 'SAL'   // Sales
  | 'PRD'   // Product
  | 'ENG'   // Engineering
  | 'LEG'   // Legal
  | 'ADM';  // Administration

/** Project category for strategic classification */
export type ProjectCategory =
  | 'RUN'   // Run the Business (Operations)
  | 'GROW'  // Grow the Business (Expansion)
  | 'TRNS'; // Transform the Business (Innovation)

/** Unit types for KPI measurements */
export type KPIUnit = '%' | '$' | 'score' | 'number';

// =============================================================================
// DEPARTMENT METADATA
// =============================================================================

/** Department metadata with display names and colors */
export interface DepartmentInfo {
  code: DepartmentCode;
  name: string;
  color: string;
}

/** All available departments with metadata */
export const DEPARTMENTS: Record<DepartmentCode, DepartmentInfo> = {
  FIN: { code: 'FIN', name: 'Finance', color: '#10b981' },
  MKT: { code: 'MKT', name: 'Marketing', color: '#f59e0b' },
  OPS: { code: 'OPS', name: 'Operations', color: '#3b82f6' },
  IT: { code: 'IT', name: 'Information Technology', color: '#8b5cf6' },
  HR: { code: 'HR', name: 'Human Resources', color: '#ec4899' },
  SAL: { code: 'SAL', name: 'Sales', color: '#06b6d4' },
  PRD: { code: 'PRD', name: 'Product', color: '#f97316' },
  ENG: { code: 'ENG', name: 'Engineering', color: '#6366f1' },
  LEG: { code: 'LEG', name: 'Legal', color: '#64748b' },
  ADM: { code: 'ADM', name: 'Administration', color: '#78716c' },
};

/** Project category metadata */
export interface CategoryInfo {
  code: ProjectCategory;
  name: string;
  description: string;
  color: string;
}

/** All available project categories with metadata */
export const PROJECT_CATEGORIES: Record<ProjectCategory, CategoryInfo> = {
  RUN: {
    code: 'RUN',
    name: 'Run',
    description: 'Run the Business - Operational excellence',
    color: '#3b82f6'
  },
  GROW: {
    code: 'GROW',
    name: 'Grow',
    description: 'Grow the Business - Expansion & scaling',
    color: '#10b981'
  },
  TRNS: {
    code: 'TRNS',
    name: 'Transform',
    description: 'Transform the Business - Innovation & change',
    color: '#8b5cf6'
  },
};

// =============================================================================
// CORE ENTITY INTERFACES
// =============================================================================

/** Strategy Pillar - Top level BSC perspective */
export interface StrategyPillar {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  ragStatus: RAGStatus;
}

/** Strategic KPI - Metrics for each pillar */
export interface StrategicKPI {
  id: string;
  pillarId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  previousValue: number;
  unit: KPIUnit;
  lastUpdated: string; // ISO date string
}

/** Risk scores by category (0-100 scale) */
export interface RiskScores {
  technical: number;    // Technology complexity, integration risk
  delivery: number;     // Schedule, resource, scope risks
  business: number;     // Market, financial, strategic risks
  organizational: number; // Change management, stakeholder risks
  external: number;     // Regulatory, vendor, market risks
}

/** Initiative - Programs/portfolios linked to a pillar */
export interface Initiative {
  id: string;
  pillarId: string;
  name: string;
  description: string;
  ownerId: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  budget: number;
  spentBudget: number;
  ragStatus: RAGStatus;
  /** Optional: Link to specific KPIs this initiative impacts */
  linkedKpiIds?: string[];

  // ========== PPM METRICS (Optional for backward compatibility) ==========
  /** Priority band (P1 = highest priority) */
  priorityBand?: PriorityBand;
  /** Priority score (0-100, calculated from weighted criteria) */
  priorityScore?: number;
  /** Strategic alignment score (0-5 scale) */
  strategicAlignmentScore?: number;
  /** Risk scores by category */
  riskScores?: RiskScores;
  /** Schedule Performance Index (EV/PV) - 1.0 = on schedule */
  spiOverride?: number;
  /** Cost Performance Index (EV/AC) - 1.0 = on budget */
  cpiOverride?: number;
}

/** Project - Execution vehicles linked to an initiative */
export interface Project {
  id: string;
  initiativeId: string;
  name: string;
  description: string;
  managerId: string;
  status: ProjectStatus;
  ragStatus: RAGStatus;
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string
  completionPercentage: number;
  budget: number;
  spentBudget: number;
  /** Work ID components for standardized coding */
  departmentCode: DepartmentCode;
  category: ProjectCategory;
  sequenceNumber: number;
  fiscalYear: number;
  /** Generated Work ID (e.g., "OPS-25-GROW-012") */
  workId: string;

  // ========== EVM METRICS (Optional for backward compatibility) ==========
  /** Planned Value (BCWS) - Budgeted cost of work scheduled */
  plannedValue?: number;
  /** Earned Value (BCWP) - Budgeted cost of work performed */
  earnedValue?: number;
  /** Actual Cost (ACWP) - Actual cost of work performed */
  actualCost?: number;
  /** Number of scope change requests */
  scopeChangeCount?: number;
  /** Risk exposure score (0-100) */
  riskExposure?: number;
  /** Original baseline end date (for variance tracking) */
  baselineEndDate?: string;

  // ========== PROJECT CHARTER DOCUMENTATION ==========
  /** Project charter with comprehensive documentation */
  charter?: ProjectCharterDoc;
}

// =============================================================================
// PROJECT CHARTER DOCUMENTATION TYPES
// =============================================================================

/** Process diagram documentation */
export interface ProcessDiagram {
  /** Description of current state process */
  asIsDescription?: string;
  /** Link/reference to as-is diagram */
  asIsDiagramUrl?: string;
  /** Description of future state process */
  toBeDescription?: string;
  /** Link/reference to to-be diagram */
  toBeDiagramUrl?: string;
  /** Key process changes/improvements */
  keyChanges?: string[];
}

/** Cost benefit item */
export interface CostBenefit {
  id: string;
  description: string;
  /** Tangible (measurable/direct) or Intangible (non-measurable/indirect) */
  type: 'tangible' | 'intangible';
  /** Quantified value if tangible */
  estimatedValue?: number;
  /** Unit of measurement (e.g., "$", "hours", "FTE") */
  unit?: string;
  /** Timeframe to realize benefit (e.g., "Year 1", "Ongoing") */
  realizationTimeframe?: string;
  /** How this benefit will be measured */
  measurementMethod?: string;
}

/** Control definition */
export interface ProjectControl {
  id: string;
  name: string;
  description: string;
  /** Type of control */
  type: 'preventive' | 'detective' | 'corrective';
  /** Who is responsible for this control */
  owner?: string;
  /** Frequency of control execution */
  frequency?: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'as_needed';
}

/** Project goal */
export interface ProjectGoal {
  id: string;
  statement: string;
  /** SMART criteria compliance */
  isSpecific: boolean;
  isMeasurable: boolean;
  isAchievable: boolean;
  isRelevant: boolean;
  isTimeBound: boolean;
  /** Target date for goal achievement */
  targetDate?: string;
  /** Success criteria */
  successCriteria?: string[];
}

/** Project metric */
export interface ProjectMetric {
  id: string;
  name: string;
  description: string;
  /** Current baseline value */
  baselineValue?: number;
  /** Target value */
  targetValue: number;
  /** Unit of measurement */
  unit: string;
  /** How often this is measured */
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'milestone';
  /** Data source for this metric */
  dataSource?: string;
}

/** Policy reference */
export interface PolicyReference {
  id: string;
  name: string;
  description: string;
  /** Policy document reference/link */
  documentRef?: string;
  /** How this policy applies to the project */
  applicability?: string;
  /** Compliance requirements */
  complianceRequirements?: string[];
}

/** Team member role definition */
export interface TeamRole {
  id: string;
  roleName: string;
  responsibilities: string[];
  /** Resource assigned to this role (if assigned) */
  assignedResourceId?: string;
  /** Required skills for this role */
  requiredSkills?: string[];
  /** Time commitment (e.g., "Full-time", "50%", "As needed") */
  commitment?: string;
  /** Is this role for project phase or operations handover */
  phase: 'project' | 'operations' | 'both';
}

/** Scope item */
export interface ScopeItem {
  id: string;
  description: string;
  /** In scope or out of scope */
  inclusion: 'in_scope' | 'out_of_scope';
  /** Category for grouping */
  category?: string;
  /** Rationale for inclusion/exclusion */
  rationale?: string;
}

/** Data specification */
export interface DataSpecification {
  id: string;
  name: string;
  description: string;
  /** Data type (e.g., "Customer data", "Transaction data") */
  dataType: string;
  /** Source system */
  source?: string;
  /** Target system */
  target?: string;
  /** Data format */
  format?: string;
  /** Volume estimate */
  volumeEstimate?: string;
  /** Data quality requirements */
  qualityRequirements?: string[];
  /** Privacy/security classification */
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  /** Retention requirements */
  retentionPeriod?: string;
}

/** Complete project charter documentation */
export interface ProjectCharterDoc {
  /** Version tracking */
  version: string;
  lastUpdated: string;
  approvedBy?: string;
  approvedDate?: string;

  /** Process diagrams (as-is and to-be) */
  processDiagrams?: ProcessDiagram;

  /** Cost benefits analysis */
  costBenefits?: {
    tangible: CostBenefit[];
    intangible: CostBenefit[];
    totalTangibleValue?: number;
    paybackPeriod?: string;
    roi?: number;
  };

  /** Controls */
  controls?: ProjectControl[];

  /** Goals (SMART objectives) */
  goals?: ProjectGoal[];

  /** Metrics/KPIs for project success */
  metrics?: ProjectMetric[];

  /** Applicable policies */
  policies?: PolicyReference[];

  /** Project team roles */
  projectTeam?: TeamRole[];

  /** Operations handover team */
  operationsTeam?: TeamRole[];

  /** Scope definition */
  scope?: {
    inScope: ScopeItem[];
    outOfScope: ScopeItem[];
    assumptions?: string[];
    constraints?: string[];
    dependencies?: string[];
  };

  /** Data specifications */
  dataSpecifications?: DataSpecification[];

  /** Charter completeness score (auto-calculated) */
  completenessScore?: number;
}

/** Task - Granular work items linked to a project */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  kanbanStatus: KanbanStatus;
  dueDate: string; // ISO date string
  estimatedHours: number;
  actualHours: number;
  /** Department responsible for this task */
  departmentCode?: DepartmentCode;

  // ========== WBS HIERARCHY FIELDS ==========
  /** Parent task ID for hierarchical decomposition (null = root task) */
  parentTaskId?: string;
  /** IDs of tasks this task depends on (must complete before this starts) */
  dependsOn?: string[];
  /** WBS code for hierarchical reference (e.g., "1.2.3") */
  wbsCode?: string;
  /** Whether this task represents a milestone */
  isMilestone?: boolean;
  /** Planned hours for earned value tracking */
  plannedHours?: number;
  /** Deliverable/output produced by this task */
  deliverable?: string;
  /** Task priority level */
  priority?: TaskPriority;
  /** Start date for scheduling (ISO date string) */
  startDate?: string;
  /** Sort order within parent level for drag-and-drop reordering */
  sortOrder?: number;
}

/** Milestone - Significant progress markers within a project */
export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  /** Target completion date */
  targetDate: string; // ISO date string
  /** Actual completion date */
  completedDate?: string;
  status: MilestoneStatus;
  /** Tasks that must be completed for this milestone */
  linkedTaskIds: string[];
  /** Order for display */
  displayOrder: number;
}

/** Resource - People with department/function tracking */
export interface Resource {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  weeklyCapacity: number; // hours per week
  avatarColor: string;
  /** Primary department/function */
  departmentCode: DepartmentCode;
  /** Hourly cost rate for budget calculations */
  hourlyRate?: number;

  // ========== UTILIZATION TRACKING (Optional) ==========
  /** Skills/competencies */
  skills?: string[];
  /** Target utilization percentage (e.g., 80%) */
  targetUtilization?: number;
  /** Is this a key/critical resource? */
  isKeyResource?: boolean;
  /** Resource availability status */
  availabilityStatus?: 'available' | 'partial' | 'unavailable';
}

// =============================================================================
// CROSS-FUNCTIONAL CONTRIBUTION TRACKING
// =============================================================================

/** Function contribution to a project - tracks effort by department */
export interface FunctionContribution {
  projectId: string;
  departmentCode: DepartmentCode;
  /** Planned hours from this department */
  plannedHours: number;
  /** Actual hours spent */
  actualHours: number;
  /** Percentage of department's deliverables completed */
  completionPercentage: number;
  /** Resources from this department assigned to the project */
  assignedResourceIds: string[];
}

/** Aggregated department metrics for a project */
export interface DepartmentProjectMetrics {
  departmentCode: DepartmentCode;
  departmentName: string;
  totalPlannedHours: number;
  totalActualHours: number;
  resourceCount: number;
  taskCount: number;
  completedTaskCount: number;
  completionPercentage: number;
  variance: number; // actualHours - plannedHours
}

// =============================================================================
// APP STATE & ACTIONS
// =============================================================================

/** App State - All data stored in localStorage */
export interface AppState {
  pillars: StrategyPillar[];
  kpis: StrategicKPI[];
  initiatives: Initiative[];
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
  /** Cross-functional contribution tracking */
  functionContributions?: FunctionContribution[];
  /** Project milestones for WBS tracking */
  milestones?: Milestone[];
}

/** Action types for reducer - strongly typed payloads */
export type AppAction =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'ADD_PILLAR'; payload: StrategyPillar }
  | { type: 'UPDATE_PILLAR'; payload: StrategyPillar }
  | { type: 'DELETE_PILLAR'; payload: string }
  | { type: 'ADD_KPI'; payload: StrategicKPI }
  | { type: 'UPDATE_KPI'; payload: StrategicKPI }
  | { type: 'DELETE_KPI'; payload: string }
  | { type: 'ADD_INITIATIVE'; payload: Initiative }
  | { type: 'UPDATE_INITIATIVE'; payload: Initiative }
  | { type: 'DELETE_INITIATIVE'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'UPDATE_RESOURCE'; payload: Resource }
  | { type: 'DELETE_RESOURCE'; payload: string }
  | { type: 'IMPORT_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_FUNCTION_CONTRIBUTION'; payload: FunctionContribution }
  | { type: 'UPDATE_FUNCTION_CONTRIBUTION'; payload: FunctionContribution }
  | { type: 'DELETE_FUNCTION_CONTRIBUTION'; payload: { projectId: string; departmentCode: DepartmentCode } }
  | { type: 'ADD_MILESTONE'; payload: Milestone }
  | { type: 'UPDATE_MILESTONE'; payload: Milestone }
  | { type: 'DELETE_MILESTONE'; payload: string };

// =============================================================================
// NAVIGATION & VIEW TYPES
// =============================================================================

/** Navigation routes */
export type ViewType = 'strategic' | 'portfolio' | 'execution';

// =============================================================================
// DERIVED METRICS INTERFACES
// =============================================================================

// =============================================================================
// STAGE-GATE APPROVAL FRAMEWORK TYPES
// =============================================================================

/** Project lifecycle stages (Stage-Gate model) */
export type ProjectStage =
  | 'idea'           // Initial concept
  | 'business_case'  // Business justification
  | 'planning'       // Detailed planning
  | 'execution'      // Active development
  | 'closure';       // Wrap-up and benefits realization

/** Approval requirement status */
export type RequirementStatus = 'not_started' | 'in_progress' | 'complete' | 'waived' | 'not_applicable';

/** Requirement category for stage-gate approval */
export type RequirementCategory =
  | 'strategic'      // Strategic alignment, business case
  | 'financial'      // Budget, ROI, funding
  | 'technical'      // Technical feasibility, architecture
  | 'resource'       // Team, skills, capacity
  | 'risk'           // Risk assessment, mitigation
  | 'governance'     // Approvals, compliance, stakeholders
  | 'delivery';      // Schedule, milestones, quality

/** Individual approval requirement */
export interface ApprovalRequirement {
  id: string;
  category: RequirementCategory;
  name: string;
  description: string;
  /** Is this requirement mandatory for gate approval? */
  isMandatory: boolean;
  /** Weight for scoring (0-100), only for non-mandatory items */
  weight: number;
  /** Current status */
  status: RequirementStatus;
  /** Evidence/notes for completion */
  evidence?: string;
  /** Who approved/waived this requirement */
  approvedBy?: string;
  approvedDate?: string;
}

/** Stage gate definition */
export interface StageGate {
  stage: ProjectStage;
  name: string;
  description: string;
  /** Minimum score required to pass (percentage of weighted items) */
  minimumScore: number;
  /** Requirements for this gate */
  requirements: ApprovalRequirement[];
}

/** Project approval status */
export interface ProjectApprovalStatus {
  projectId: string;
  currentStage: ProjectStage;
  /** Gate readiness scores by stage */
  gateScores: Record<ProjectStage, {
    mandatoryComplete: boolean;
    weightedScore: number;
    totalRequirements: number;
    completedRequirements: number;
    blockers: string[];
  }>;
  /** Overall approval recommendation */
  recommendation: 'approve' | 'conditional' | 'defer' | 'reject';
  /** Conditions for conditional approval */
  conditions?: string[];
}

// =============================================================================
// RULE-BASED INSIGHTS ENGINE TYPES
// =============================================================================

/** Insight severity levels */
export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';

/** Insight category for grouping */
export type InsightCategory =
  | 'schedule'       // Time-related insights
  | 'cost'           // Budget-related insights
  | 'scope'          // Delivery/completion insights
  | 'resource'       // Team/capacity insights
  | 'quality'        // Health/status insights
  | 'strategic'      // Alignment insights
  | 'trend';         // Pattern-based insights

/** Rule-based insight */
export interface RuleBasedInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  /** The rule that triggered this insight */
  ruleName: string;
  /** Affected entities */
  affectedEntities: {
    type: 'pillar' | 'initiative' | 'project' | 'task' | 'resource';
    id: string;
    name: string;
  }[];
  /** Suggested action */
  suggestedAction?: string;
  /** Link to relevant page */
  link?: string;
  /** Metric values that triggered the insight */
  metrics?: Record<string, number | string>;
  /** When the insight was generated */
  generatedAt: string;
}

/** Rule definition for insights engine */
export interface InsightRule {
  id: string;
  name: string;
  description: string;
  category: InsightCategory;
  severity: InsightSeverity;
  /** Is this rule enabled? */
  enabled: boolean;
  /** Threshold or condition (serialized for storage) */
  condition: string;
  /** Template for generating insight title */
  titleTemplate: string;
  /** Template for generating insight description */
  descriptionTemplate: string;
  /** Template for suggested action */
  actionTemplate?: string;
}

// =============================================================================
// RISK SCORE CALCULATION TYPES
// =============================================================================

/** Individual risk factor with score contribution */
export interface RiskFactor {
  category: 'schedule' | 'cost' | 'scope' | 'resource' | 'quality' | 'status';
  name: string;
  description: string;
  score: number;        // Contribution to total (0-100 scale contribution)
  weight: number;       // Weight factor (0-1)
  severity: 'low' | 'medium' | 'high' | 'critical';
  rawValue?: number | string;  // The actual measured value
  threshold?: string;   // What triggered this factor
}

/** Comprehensive risk score breakdown */
export interface RiskScoreBreakdown {
  /** Overall risk score (0-100) */
  totalScore: number;
  /** Risk level classification */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Individual risk factors that contribute to the score */
  factors: RiskFactor[];
  /** Performance indices */
  indices: {
    /** Schedule Performance Index (1.0 = on schedule, <1 = behind) */
    spi: number;
    /** Cost Performance Index (1.0 = on budget, <1 = over) */
    cpi: number;
    /** Scope Performance (% complete vs % time elapsed) */
    scopePerformance: number;
    /** Resource utilization index */
    resourceIndex: number;
  };
  /** Summary statistics */
  summary: {
    scheduleScore: number;
    costScore: number;
    scopeScore: number;
    resourceScore: number;
    qualityScore: number;
  };
  /** Timestamp of calculation */
  calculatedAt: string;
}

/** Pillar-level aggregated metrics */
export interface PillarMetrics {
  pillarId: string;
  initiativeCount: number;
  projectCount: number;
  atRiskCount: number;
  totalBudget: number;
  spentBudget: number;
  avgCompletion: number;
}

/** Initiative-level aggregated metrics */
export interface InitiativeMetrics {
  initiativeId: string;
  projectCount: number;
  taskCount: number;
  completedTasks: number;
  budgetVariance: number;
  predictedEndDate: string | null;
}

/** Project Charter - comprehensive project view */
export interface ProjectCharter {
  project: Project;
  initiative: Initiative;
  pillar: StrategyPillar;
  linkedKpis: StrategicKPI[];
  manager: Resource | null;
  departmentContributions: DepartmentProjectMetrics[];
  tasks: Task[];
  totalPlannedHours: number;
  totalActualHours: number;
  resourceCount: number;
  budgetUtilization: number;
  scheduleVariance: number; // days ahead (+) or behind (-)
}

// =============================================================================
// UTILITY TYPE GUARDS
// =============================================================================

/** Type guard to check if a string is a valid DepartmentCode */
export function isDepartmentCode(value: string): value is DepartmentCode {
  return Object.keys(DEPARTMENTS).includes(value);
}

/** Type guard to check if a string is a valid ProjectCategory */
export function isProjectCategory(value: string): value is ProjectCategory {
  return Object.keys(PROJECT_CATEGORIES).includes(value);
}

/** Type guard to check if a string is a valid RAGStatus */
export function isRAGStatus(value: string): value is RAGStatus {
  return ['red', 'amber', 'green'].includes(value);
}

/** Type guard to check if a string is a valid KanbanStatus */
export function isKanbanStatus(value: string): value is KanbanStatus {
  return ['todo', 'in_progress', 'blocked', 'done'].includes(value);
}

/** Type guard to check if a string is a valid ProjectStatus */
export function isProjectStatus(value: string): value is ProjectStatus {
  return ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'].includes(value);
}

/** Type guard to check if a string is a valid MilestoneStatus */
export function isMilestoneStatus(value: string): value is MilestoneStatus {
  return ['pending', 'completed', 'missed'].includes(value);
}

/** Type guard to check if a string is a valid TaskPriority */
export function isTaskPriority(value: string): value is TaskPriority {
  return ['low', 'medium', 'high', 'critical'].includes(value);
}

// =============================================================================
// RE-EXPORT CONFIGURATION TYPES
// =============================================================================

export type {
  BusinessRulesConfig,
  ImportEnforcementConfig,
  RiskScoreConfig,
  InsightsConfig,
  ApprovalConfig,
  RAGConfig,
  FeatureToggles,
  ConfigPreset,
  PresetInfo,
  CharterSectionRequirements,
  CharterEnforcementConfig,
  FieldEnforcementConfig,
  ReferenceConfig,
  BusinessRuleEnforcementConfig,
  RiskWeights,
  ThresholdLevels,
  RiskThresholds,
  RiskLevelBoundaries,
  InsightCategoryToggles,
  InsightThresholds,
  GateMinimums,
  ApprovalCategoryWeights,
  CharterElementWeights,
  RecommendationConfig,
} from './config';
