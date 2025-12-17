import { RAGStatus, Initiative, Project, Task, AppState } from '../types';

// Calculate RAG status based on percentage
export const calculateRAGFromPercentage = (current: number, target: number, higherIsBetter = true): RAGStatus => {
  const ratio = current / target;
  if (higherIsBetter) {
    if (ratio >= 0.95) return 'green';
    if (ratio >= 0.8) return 'amber';
    return 'red';
  } else {
    // Lower is better (e.g., churn rate)
    if (ratio <= 1.05) return 'green';
    if (ratio <= 1.2) return 'amber';
    return 'red';
  }
};

// Calculate budget variance percentage
export const calculateBudgetVariance = (spent: number, budget: number): number => {
  if (budget === 0) return 0;
  return ((spent - budget) / budget) * 100;
};

// Get worst RAG status from a list
export const getWorstRAG = (statuses: RAGStatus[]): RAGStatus => {
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('amber')) return 'amber';
  return 'green';
};

// Calculate initiative health based on budget and timeline
export const calculateInitiativeRAG = (initiative: Initiative, projects: Project[]): RAGStatus => {
  const budgetVariance = calculateBudgetVariance(initiative.spentBudget, initiative.budget);
  const projectStatuses = projects.map((p) => p.ragStatus);

  // If any project is red, initiative is at risk
  if (projectStatuses.includes('red')) return 'red';

  // If significantly over budget
  if (budgetVariance > 15) return 'red';
  if (budgetVariance > 5) return 'amber';

  // If any project is amber
  if (projectStatuses.includes('amber')) return 'amber';

  return 'green';
};

// Calculate project completion from tasks
export const calculateProjectCompletion = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter((t) => t.kanbanStatus === 'done').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// Calculate project RAG based on completion and timeline
export const calculateProjectRAG = (project: Project, tasks: Task[]): RAGStatus => {
  const completion = calculateProjectCompletion(tasks);
  const today = new Date();
  const endDate = new Date(project.endDate);
  const startDate = new Date(project.startDate);

  // Calculate expected completion based on time elapsed
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = today.getTime() - startDate.getTime();
  const expectedCompletion = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  // If blocked tasks exist
  const blockedTasks = tasks.filter((t) => t.kanbanStatus === 'blocked').length;
  if (blockedTasks > 0) return 'red';

  // Compare actual vs expected
  const variance = completion - expectedCompletion;
  if (variance >= -5) return 'green';
  if (variance >= -15) return 'amber';
  return 'red';
};

// Calculate overall strategic health
export const calculateStrategicHealth = (state: AppState): RAGStatus => {
  const pillarStatuses = state.pillars.map((p) => p.ragStatus);
  return getWorstRAG(pillarStatuses);
};

// Format currency
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Calculate resource utilization
export const calculateResourceUtilization = (
  resourceId: string,
  tasks: Task[],
  weeklyCapacity: number
): number => {
  const activeTasks = tasks.filter(
    (t) => t.assigneeId === resourceId && t.kanbanStatus !== 'done'
  );
  const totalHours = activeTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  // Assume 4 weeks average remaining
  const weeklyHours = totalHours / 4;
  return Math.round((weeklyHours / weeklyCapacity) * 100);
};

// Get color class for RAG status
export const getRAGColorClass = (status: RAGStatus): string => {
  switch (status) {
    case 'green':
      return 'text-rag-green';
    case 'amber':
      return 'text-rag-amber';
    case 'red':
      return 'text-rag-red';
  }
};

// Get background color class for RAG status
export const getRAGBgClass = (status: RAGStatus): string => {
  switch (status) {
    case 'green':
      return 'bg-rag-green';
    case 'amber':
      return 'bg-rag-amber';
    case 'red':
      return 'bg-rag-red';
  }
};

// Get border color for RAG status
export const getRAGBorderClass = (status: RAGStatus): string => {
  switch (status) {
    case 'green':
      return 'border-rag-green';
    case 'amber':
      return 'border-rag-amber';
    case 'red':
      return 'border-rag-red';
  }
};
