import { Task } from '../types';

/**
 * WBS Utility Functions
 * Handles hierarchical task decomposition, WBS code generation,
 * and tree structure operations for Work Breakdown Structures.
 */

// =============================================================================
// TYPES
// =============================================================================

/** Task with computed hierarchy information */
export interface TaskWithHierarchy extends Task {
  level: number;
  children: TaskWithHierarchy[];
  hasChildren: boolean;
  path: string[]; // Array of parent IDs from root to this task
}

/** Flat task with indent level for rendering */
export interface FlattenedTask extends Task {
  level: number;
  hasChildren: boolean;
  isExpanded?: boolean;
  childCount: number;
}

// =============================================================================
// WBS CODE GENERATION
// =============================================================================

/**
 * Generate WBS code for a task based on its position in hierarchy
 * Format: "1.2.3" where each number represents position at that level
 */
export function generateWbsCode(
  tasks: Task[],
  taskId: string,
  parentTaskId?: string
): string {
  // Get siblings (tasks with same parent)
  const siblings = tasks.filter(t => t.parentTaskId === parentTaskId);
  const sortedSiblings = siblings.sort((a, b) => {
    // Sort by existing wbsCode or creation order
    if (a.wbsCode && b.wbsCode) return a.wbsCode.localeCompare(b.wbsCode);
    return 0;
  });

  const position = sortedSiblings.findIndex(t => t.id === taskId) + 1;

  if (!parentTaskId) {
    // Root level task
    return String(position);
  }

  // Get parent's WBS code
  const parent = tasks.find(t => t.id === parentTaskId);
  const parentCode = parent?.wbsCode || generateWbsCode(tasks, parentTaskId, parent?.parentTaskId);

  return `${parentCode}.${position}`;
}

/**
 * Auto-generate WBS codes for all tasks in a project
 */
export function generateAllWbsCodes(tasks: Task[], projectId: string): Map<string, string> {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const wbsCodes = new Map<string, string>();

  function assignCodes(parentId: string | undefined, prefix: string) {
    const children = projectTasks
      .filter(t => t.parentTaskId === parentId)
      .sort((a, b) => (a.wbsCode || '').localeCompare(b.wbsCode || ''));

    children.forEach((task, index) => {
      const code = prefix ? `${prefix}.${index + 1}` : String(index + 1);
      wbsCodes.set(task.id, code);
      assignCodes(task.id, code);
    });
  }

  assignCodes(undefined, '');
  return wbsCodes;
}

// =============================================================================
// TREE STRUCTURE OPERATIONS
// =============================================================================

/**
 * Build a tree structure from flat task array
 */
export function buildTaskTree(tasks: Task[], projectId: string): TaskWithHierarchy[] {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const taskMap = new Map<string, TaskWithHierarchy>();

  // Initialize all tasks with hierarchy info
  projectTasks.forEach(task => {
    taskMap.set(task.id, {
      ...task,
      level: 0,
      children: [],
      hasChildren: false,
      path: [],
    });
  });

  // Build parent-child relationships
  const rootTasks: TaskWithHierarchy[] = [];

  taskMap.forEach(task => {
    if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
      const parent = taskMap.get(task.parentTaskId)!;
      parent.children.push(task);
      parent.hasChildren = true;
    } else {
      rootTasks.push(task);
    }
  });

  // Calculate levels and paths
  function setLevelsAndPaths(tasks: TaskWithHierarchy[], level: number, path: string[]) {
    tasks.forEach(task => {
      task.level = level;
      task.path = path;
      setLevelsAndPaths(task.children, level + 1, [...path, task.id]);
    });
  }

  setLevelsAndPaths(rootTasks, 0, []);

  // Sort children by WBS code
  function sortChildren(tasks: TaskWithHierarchy[]) {
    tasks.sort((a, b) => (a.wbsCode || '').localeCompare(b.wbsCode || ''));
    tasks.forEach(task => sortChildren(task.children));
  }

  sortChildren(rootTasks);

  return rootTasks;
}

/**
 * Flatten tree structure for list rendering with expand/collapse support
 */
export function flattenTaskTree(
  tree: TaskWithHierarchy[],
  expandedIds: Set<string> = new Set()
): FlattenedTask[] {
  const result: FlattenedTask[] = [];

  function traverse(tasks: TaskWithHierarchy[]) {
    tasks.forEach(task => {
      const childCount = countAllDescendants(task);
      result.push({
        ...task,
        hasChildren: task.children.length > 0,
        isExpanded: expandedIds.has(task.id),
        childCount,
      });

      // Only traverse children if expanded
      if (expandedIds.has(task.id) || expandedIds.size === 0) {
        traverse(task.children);
      }
    });
  }

  traverse(tree);
  return result;
}

/**
 * Count all descendants of a task
 */
export function countAllDescendants(task: TaskWithHierarchy): number {
  let count = task.children.length;
  task.children.forEach(child => {
    count += countAllDescendants(child);
  });
  return count;
}

// =============================================================================
// HIERARCHY VALIDATION
// =============================================================================

/**
 * Check if setting parentTaskId would create a circular reference
 */
export function wouldCreateCycle(
  tasks: Task[],
  taskId: string,
  newParentId: string
): boolean {
  if (taskId === newParentId) return true;

  // Walk up from newParentId to check if we hit taskId
  let currentId: string | undefined = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) return true; // Already a cycle
    if (currentId === taskId) return true;
    visited.add(currentId);

    const current = tasks.find(t => t.id === currentId);
    currentId = current?.parentTaskId;
  }

  return false;
}

/**
 * Get all ancestor task IDs for a given task
 */
export function getAncestorIds(tasks: Task[], taskId: string): string[] {
  const ancestors: string[] = [];
  let currentId: string | undefined = taskId;

  while (currentId) {
    const task = tasks.find(t => t.id === currentId);
    if (task?.parentTaskId) {
      ancestors.push(task.parentTaskId);
      currentId = task.parentTaskId;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Get all descendant task IDs for a given task
 */
export function getDescendantIds(tasks: Task[], taskId: string): string[] {
  const descendants: string[] = [];
  const children = tasks.filter(t => t.parentTaskId === taskId);

  children.forEach(child => {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(tasks, child.id));
  });

  return descendants;
}

/**
 * Get valid parent options for a task (excludes self and descendants)
 */
export function getValidParentOptions(
  tasks: Task[],
  projectId: string,
  taskId?: string
): Task[] {
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  if (!taskId) {
    // New task - all project tasks are valid parents
    return projectTasks;
  }

  // Exclude self and all descendants
  const excludeIds = new Set([taskId, ...getDescendantIds(tasks, taskId)]);
  return projectTasks.filter(t => !excludeIds.has(t.id));
}

// =============================================================================
// DEPENDENCY OPERATIONS
// =============================================================================

/**
 * Check if adding a dependency would create a circular dependency
 */
export function wouldCreateDependencyCycle(
  tasks: Task[],
  taskId: string,
  dependsOnId: string
): boolean {
  // A task cannot depend on itself
  if (taskId === dependsOnId) return true;

  // Check if dependsOnId already depends on taskId (directly or indirectly)
  const visited = new Set<string>();
  const queue = [dependsOnId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = tasks.find(t => t.id === currentId);
    if (current?.dependsOn) {
      if (current.dependsOn.includes(taskId)) return true;
      queue.push(...current.dependsOn);
    }
  }

  return false;
}

/**
 * Get valid dependency options for a task
 * Excludes: self, tasks that already depend on this task (would create cycle)
 */
export function getValidDependencyOptions(
  tasks: Task[],
  projectId: string,
  taskId?: string
): Task[] {
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  if (!taskId) {
    return projectTasks;
  }

  return projectTasks.filter(t => {
    if (t.id === taskId) return false;
    return !wouldCreateDependencyCycle(tasks, taskId, t.id);
  });
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

/**
 * Calculate completion percentage for a parent task based on children
 */
export function calculateParentProgress(tasks: Task[], parentTaskId: string): number {
  const children = tasks.filter(t => t.parentTaskId === parentTaskId);
  if (children.length === 0) return 0;

  const completedCount = children.filter(t => t.kanbanStatus === 'done').length;
  return Math.round((completedCount / children.length) * 100);
}

/**
 * Calculate total estimated hours for a task and all its descendants
 */
export function calculateTotalEstimatedHours(tasks: Task[], taskId: string): number {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return 0;

  const children = tasks.filter(t => t.parentTaskId === taskId);
  if (children.length === 0) {
    return task.estimatedHours || 0;
  }

  return children.reduce((sum, child) => {
    return sum + calculateTotalEstimatedHours(tasks, child.id);
  }, 0);
}

/**
 * Calculate total actual hours for a task and all its descendants
 */
export function calculateTotalActualHours(tasks: Task[], taskId: string): number {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return 0;

  const children = tasks.filter(t => t.parentTaskId === taskId);
  if (children.length === 0) {
    return task.actualHours || 0;
  }

  return children.reduce((sum, child) => {
    return sum + calculateTotalActualHours(tasks, child.id);
  }, 0);
}

// =============================================================================
// MILESTONE HELPERS
// =============================================================================

/**
 * Get tasks that are milestones within a project
 */
export function getMilestoneTasks(tasks: Task[], projectId: string): Task[] {
  return tasks.filter(t => t.projectId === projectId && t.isMilestone);
}

/**
 * Check if all dependencies of a task are complete
 */
export function areDependenciesComplete(tasks: Task[], taskId: string): boolean {
  const task = tasks.find(t => t.id === taskId);
  if (!task?.dependsOn || task.dependsOn.length === 0) return true;

  return task.dependsOn.every(depId => {
    const dep = tasks.find(t => t.id === depId);
    return dep?.kanbanStatus === 'done';
  });
}
