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
