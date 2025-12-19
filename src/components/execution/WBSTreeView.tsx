import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, KanbanStatus, TaskPriority } from '../../types';
import {
  buildTaskTree,
  flattenTaskTree,
  FlattenedTask,
  calculateTotalEstimatedHours,
  calculateTotalActualHours,
  areDependenciesComplete,
} from '../../utils/wbsUtils';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Flag,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Ban,
  Link2,
  User,
} from 'lucide-react';

interface WBSTreeViewProps {
  projectId: string;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (parentTaskId?: string) => void;
  selectedTaskId?: string;
}

// Status icon mapping
const statusIcons: Record<KanbanStatus, React.ReactNode> = {
  todo: <Circle className="w-4 h-4 text-gray-400" />,
  in_progress: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
  blocked: <Ban className="w-4 h-4 text-red-400" />,
  done: <CheckCircle2 className="w-4 h-4 text-green-400" />,
};

// Priority colors
const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-amber-500/20 text-amber-400',
  critical: 'bg-red-500/20 text-red-400',
};

export const WBSTreeView: React.FC<WBSTreeViewProps> = ({
  projectId,
  onTaskClick,
  onAddTask,
  selectedTaskId,
}) => {
  const { state, getResource } = useApp();
  const { tasks } = state;

  // Track expanded nodes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Start with all expanded
  const [allExpanded, setAllExpanded] = useState(true);

  // Build tree structure
  const tree = useMemo(() => buildTaskTree(tasks, projectId), [tasks, projectId]);

  // Flatten for rendering
  const flattenedTasks = useMemo(() => {
    if (allExpanded) {
      // Return all tasks when fully expanded
      const allIds = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id));
      return flattenTaskTree(tree, allIds);
    }
    return flattenTaskTree(tree, expandedIds);
  }, [tree, expandedIds, allExpanded, tasks, projectId]);

  const toggleExpand = (taskId: string) => {
    setAllExpanded(false);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setAllExpanded(true);
    const allIds = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setAllExpanded(false);
    setExpandedIds(new Set());
  };

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.kanbanStatus === 'done').length;
  const milestoneTasks = projectTasks.filter(t => t.isMilestone).length;

  if (totalTasks === 0) {
    return (
      <div className="bg-bg-secondary rounded-lg border border-border p-8 text-center">
        <div className="text-text-secondary mb-4">No tasks in this project yet</div>
        {onAddTask && (
          <button
            onClick={() => onAddTask()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Task
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-text-primary">Work Breakdown Structure</h3>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span>{totalTasks} tasks</span>
            <span className="text-green-400">{completedTasks} done</span>
            {milestoneTasks > 0 && (
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3 text-amber-400" />
                {milestoneTasks} milestones
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Collapse All
          </button>
          {onAddTask && (
            <button
              onClick={() => onAddTask()}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Tree List */}
      <div className="divide-y divide-border/50">
        {flattenedTasks.map((task) => (
          <WBSTreeItem
            key={task.id}
            task={task}
            allTasks={tasks}
            isSelected={task.id === selectedTaskId}
            isExpanded={allExpanded || expandedIds.has(task.id)}
            onToggleExpand={() => toggleExpand(task.id)}
            onClick={() => onTaskClick?.(task)}
            onAddSubtask={onAddTask ? () => onAddTask(task.id) : undefined}
            getResource={getResource}
          />
        ))}
      </div>
    </div>
  );
};

// Individual tree item component
interface WBSTreeItemProps {
  task: FlattenedTask;
  allTasks: Task[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  onAddSubtask?: () => void;
  getResource: (id: string) => { name: string; avatarColor: string } | undefined;
}

const WBSTreeItem: React.FC<WBSTreeItemProps> = ({
  task,
  allTasks,
  isSelected,
  isExpanded,
  onToggleExpand,
  onClick,
  onAddSubtask,
  getResource,
}) => {
  const assignee = task.assigneeId ? getResource(task.assigneeId) : null;
  const totalEstimated = calculateTotalEstimatedHours(allTasks, task.id);
  const totalActual = calculateTotalActualHours(allTasks, task.id);
  const dependenciesComplete = areDependenciesComplete(allTasks, task.id);
  const hasDependencies = task.dependsOn && task.dependsOn.length > 0;

  return (
    <div
      className={`
        group flex items-center gap-2 px-4 py-2 hover:bg-bg-tertiary cursor-pointer transition-colors
        ${isSelected ? 'bg-accent-blue/10 border-l-2 border-accent-blue' : ''}
      `}
      style={{ paddingLeft: `${task.level * 24 + 16}px` }}
      onClick={onClick}
    >
      {/* Expand/Collapse Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        className={`
          w-5 h-5 flex items-center justify-center rounded hover:bg-bg-primary transition-colors
          ${task.hasChildren ? 'text-text-secondary' : 'text-transparent'}
        `}
        disabled={!task.hasChildren}
      >
        {task.hasChildren && (
          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Status Icon */}
      <span className="flex-shrink-0">{statusIcons[task.kanbanStatus]}</span>

      {/* WBS Code */}
      {task.wbsCode && (
        <span className="text-xs font-mono text-text-secondary bg-bg-primary px-1.5 py-0.5 rounded">
          {task.wbsCode}
        </span>
      )}

      {/* Milestone Flag */}
      {task.isMilestone && (
        <Flag className="w-4 h-4 text-amber-400 flex-shrink-0" />
      )}

      {/* Task Title */}
      <span className={`flex-grow truncate ${task.kanbanStatus === 'done' ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
        {task.title}
      </span>

      {/* Priority Badge */}
      {task.priority && task.priority !== 'medium' && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      )}

      {/* Dependency Warning */}
      {hasDependencies && !dependenciesComplete && (
        <span className="flex items-center gap-1 text-xs text-amber-400" title="Has incomplete dependencies">
          <Link2 className="w-3 h-3" />
          <AlertCircle className="w-3 h-3" />
        </span>
      )}

      {/* Child Count */}
      {task.hasChildren && task.childCount > 0 && (
        <span className="text-xs text-text-secondary bg-bg-primary px-1.5 py-0.5 rounded">
          {task.childCount} subtask{task.childCount !== 1 ? 's' : ''}
        </span>
      )}

      {/* Hours */}
      <span className="flex items-center gap-1 text-xs text-text-secondary" title={`${totalActual}h actual / ${totalEstimated}h estimated`}>
        <Clock className="w-3 h-3" />
        {totalActual}/{totalEstimated}h
      </span>

      {/* Assignee */}
      {assignee && (
        <span
          className="flex items-center gap-1 text-xs"
          style={{ color: assignee.avatarColor }}
          title={assignee.name}
        >
          <User className="w-3 h-3" />
          <span className="max-w-[60px] truncate">{assignee.name.split(' ')[0]}</span>
        </span>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.kanbanStatus !== 'done' ? 'text-red-400' : 'text-text-secondary'}`}>
          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Add Subtask Button (visible on hover) */}
      {onAddSubtask && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSubtask();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-accent-blue transition-all"
          title="Add subtask"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default WBSTreeView;
