import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../../context/AppContext';
import { Task, KanbanStatus, TaskPriority } from '../../types';
import {
  buildTaskTree,
  flattenTaskTree,
  FlattenedTask,
  calculateTotalEstimatedHours,
  calculateTotalActualHours,
  areDependenciesComplete,
  wouldCreateCycle,
  generateAllWbsCodes,
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
  GripVertical,
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
  const { state, dispatch, getResource } = useApp();
  const { tasks } = state;

  // Track expanded nodes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag - use Mouse and Touch sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Build tree structure
  const tree = useMemo(() => buildTaskTree(tasks, projectId), [tasks, projectId]);

  // Flatten for rendering
  const flattenedTasks = useMemo(() => {
    if (allExpanded) {
      const allIds = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id));
      return flattenTaskTree(tree, allIds);
    }
    return flattenTaskTree(tree, expandedIds);
  }, [tree, expandedIds, allExpanded, tasks, projectId]);

  const activeTask = activeId ? flattenedTasks.find(t => t.id === activeId) : null;

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

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
  };

  // Handle drag end - perform the move
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const draggedTaskId = active.id as string;
    const targetTaskId = over.id as string;

    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    const targetTask = tasks.find(t => t.id === targetTaskId);

    if (!draggedTask || !targetTask) return;

    // Use target's parent as the new parent (make them siblings)
    const newParentId = targetTask.parentTaskId;

    // Check for cycle
    if (newParentId && wouldCreateCycle(tasks, draggedTaskId, newParentId)) {
      console.warn('Cannot move task: would create cycle');
      return;
    }

    // Don't move if parent wouldn't change
    if (draggedTask.parentTaskId === newParentId) return;

    // Update the task with new parent
    const updatedTask: Task = {
      ...draggedTask,
      parentTaskId: newParentId,
    };

    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });

    // Regenerate WBS codes for all tasks in project
    setTimeout(() => {
      const updatedTasks = [...tasks.filter(t => t.id !== draggedTaskId), updatedTask];
      const newWbsCodes = generateAllWbsCodes(updatedTasks, projectId);

      // Update all tasks with new WBS codes
      updatedTasks
        .filter(t => t.projectId === projectId)
        .forEach(task => {
          const newCode = newWbsCodes.get(task.id);
          if (newCode && newCode !== task.wbsCode) {
            dispatch({
              type: 'UPDATE_TASK',
              payload: { ...task, wbsCode: newCode },
            });
          }
        });
    }, 0);

    // Auto-expand the new parent
    if (newParentId) {
      setExpandedIds(prev => new Set([...prev, newParentId]));
    }
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

  const taskIds = useMemo(() => flattenedTasks.map(t => t.id), [flattenedTasks]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
            <span className="text-xs text-text-muted">Drag tasks to reorder</span>
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
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border/50">
            {flattenedTasks.map((task) => (
              <SortableTreeItem
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
        </SortableContext>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="bg-bg-card border border-accent-blue rounded-lg shadow-xl px-4 py-2 opacity-90">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-accent-blue" />
              {statusIcons[activeTask.kanbanStatus]}
              {activeTask.wbsCode && (
                <span className="text-xs font-mono text-text-secondary">
                  {activeTask.wbsCode}
                </span>
              )}
              <span className="text-text-primary font-medium">{activeTask.title}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

// Sortable tree item using useSortable
interface SortableTreeItemProps {
  task: FlattenedTask;
  allTasks: Task[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  onAddSubtask?: () => void;
  getResource: (id: string) => { name: string; avatarColor: string } | undefined;
}

const SortableTreeItem: React.FC<SortableTreeItemProps> = ({
  task,
  allTasks,
  isSelected,
  isExpanded,
  onToggleExpand,
  onClick,
  onAddSubtask,
  getResource,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const assignee = task.assigneeId ? getResource(task.assigneeId) : null;
  const totalEstimated = calculateTotalEstimatedHours(allTasks, task.id);
  const totalActual = calculateTotalActualHours(allTasks, task.id);
  const dependenciesComplete = areDependenciesComplete(allTasks, task.id);
  const hasDependencies = task.dependsOn && task.dependsOn.length > 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-4 py-2
        ${isDragging ? 'bg-accent-blue/10' : 'hover:bg-bg-tertiary'}
        ${isSelected ? 'bg-accent-blue/10 border-l-2 border-accent-blue' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-text-muted hover:text-text-secondary transition-colors touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Indent spacer */}
      <div style={{ width: `${task.level * 24}px` }} className="flex-shrink-0" />

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

      {/* Task Title - Clickable */}
      <span
        onClick={onClick}
        className={`flex-grow truncate cursor-pointer hover:text-accent-blue ${
          task.kanbanStatus === 'done' ? 'text-text-secondary line-through' : 'text-text-primary'
        }`}
      >
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

      {/* Add Subtask Button */}
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
