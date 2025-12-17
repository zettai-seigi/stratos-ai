// RAG Status type
export type RAGStatus = 'red' | 'amber' | 'green';

// Kanban status for tasks
export type KanbanStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

// Project status
export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

// Strategy Pillar - Top level BSC perspective
export interface StrategyPillar {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  ragStatus: RAGStatus;
}

// Strategic KPI - Metrics for each pillar
export interface StrategicKPI {
  id: string;
  pillarId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  previousValue: number;
  unit: '%' | '$' | 'score' | 'number';
  lastUpdated: string;
}

// Initiative - Programs/portfolios linked to a pillar
export interface Initiative {
  id: string;
  pillarId: string;
  name: string;
  description: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  budget: number;
  spentBudget: number;
  ragStatus: RAGStatus;
}

// Project - Execution vehicles linked to an initiative
export interface Project {
  id: string;
  initiativeId: string;
  name: string;
  description: string;
  managerId: string;
  status: ProjectStatus;
  ragStatus: RAGStatus;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  budget: number;
  spentBudget: number;
}

// Task - Granular work items linked to a project
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  kanbanStatus: KanbanStatus;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}

// Resource - People
export interface Resource {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  weeklyCapacity: number;
  avatarColor: string;
}

// App State - All data stored in localStorage
export interface AppState {
  pillars: StrategyPillar[];
  kpis: StrategicKPI[];
  initiatives: Initiative[];
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
}

// Action types for reducer
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
  | { type: 'IMPORT_DATA'; payload: Partial<AppState> };

// Navigation routes
export type ViewType = 'strategic' | 'portfolio' | 'execution';

// Derived metrics
export interface PillarMetrics {
  pillarId: string;
  initiativeCount: number;
  projectCount: number;
  atRiskCount: number;
  totalBudget: number;
  spentBudget: number;
  avgCompletion: number;
}

export interface InitiativeMetrics {
  initiativeId: string;
  projectCount: number;
  taskCount: number;
  completedTasks: number;
  budgetVariance: number;
  predictedEndDate: string | null;
}
