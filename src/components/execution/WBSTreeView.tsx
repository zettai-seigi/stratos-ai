import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from '@dnd-kit/core';
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
  CornerDownRight,
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

// Drop position types
type DropPosition = 'before' | 'after' | 'child';

interface DropTargetInfo {
  taskId: string;
  position: DropPosition;
}

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
  const [dropTarget, setDropTarget] = useState<DropTargetInfo | null>(null);

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

  // Handle drag over - track hover position and type
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setDropTarget(null);
      return;
    }

    const overId = over.id as string;

    // Parse drop zone ID format: "taskId:position" (e.g., "task123:child")
    if (overId.includes(':')) {
      const [taskId, position] = overId.split(':');
      setDropTarget({ taskId, position: position as DropPosition });
    } else {
      // Direct drop on task = make it a child
      setDropTarget({ taskId: overId, position: 'child' });
    }
  };

  // Handle drag end - perform the move
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const currentDropTarget = dropTarget;
    setActiveId(null);
    setDropTarget(null);

    if (!over || !currentDropTarget) return;

    const draggedTaskId = active.id as string;
    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    const targetTask = tasks.find(t => t.id === currentDropTarget.taskId);

    if (!draggedTask || !targetTask) return;
    if (draggedTaskId === currentDropTarget.taskId) return;

    const { position } = currentDropTarget;

    // Determine new parent based on drop position
    let newParentId: string | undefined;

    if (position === 'child') {
      // Drop as child of target
      newParentId = targetTask.id;
    } else {
      // Drop as sibling (before/after) - use target's parent
      newParentId = targetTask.parentTaskId;
    }

    // Check for cycle
    if (newParentId && wouldCreateCycle(tasks, draggedTaskId, newParentId)) {
      console.warn('Cannot move task: would create cycle');
      return;
    }

    // Get siblings at the new level
    const siblings = tasks
      .filter(t => t.projectId === projectId && t.parentTaskId === newParentId)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    // Remove dragged task if already in this group
    const siblingsWithoutDragged = siblings.filter(t => t.id !== draggedTaskId);

    // Determine insert position
    let insertIndex: number;

    if (position === 'child') {
      // Add as last child
      insertIndex = siblingsWithoutDragged.length;
    } else if (position === 'before') {
      // Insert before target
      const targetIndex = siblingsWithoutDragged.findIndex(t => t.id === targetTask.id);
      insertIndex = targetIndex >= 0 ? targetIndex : 0;
    } else {
      // Insert after target
      const targetIndex = siblingsWithoutDragged.findIndex(t => t.id === targetTask.id);
      insertIndex = targetIndex >= 0 ? targetIndex + 1 : siblingsWithoutDragged.length;
    }

    // Create new siblings array with dragged task inserted
    const newSiblings = [...siblingsWithoutDragged];
    newSiblings.splice(insertIndex, 0, draggedTask);

    // Update sortOrder for all siblings
    const updates: Task[] = [];

    newSiblings.forEach((task, index) => {
      const needsUpdate = task.sortOrder !== index ||
        (task.id === draggedTaskId && task.parentTaskId !== newParentId);

      if (needsUpdate) {
        updates.push({
          ...task,
          sortOrder: index,
          parentTaskId: task.id === draggedTaskId ? newParentId : task.parentTaskId,
        });
      }
    });

    // If moving to a different parent, also update sortOrder of old siblings
    if (draggedTask.parentTaskId !== newParentId) {
      const oldSiblings = tasks
        .filter(t => t.projectId === projectId && t.parentTaskId === draggedTask.parentTaskId && t.id !== draggedTaskId)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

      oldSiblings.forEach((task, index) => {
        if (task.sortOrder !== index) {
          updates.push({ ...task, sortOrder: index });
        }
      });
    }

    // Dispatch all updates
    updates.forEach(task => {
      dispatch({ type: 'UPDATE_TASK', payload: task });
    });

    // Regenerate WBS codes
    setTimeout(() => {
      const currentTasks = tasks.map(t => {
        const update = updates.find(u => u.id === t.id);
        return update || t;
      });

      const newWbsCodes = generateAllWbsCodes(currentTasks, projectId);

      currentTasks
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
    }, 50);

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
        <div className="divide-y divide-border/50">
          {flattenedTasks.map((task) => (
            <DraggableTreeItem
              key={task.id}
              task={task}
              allTasks={tasks}
              isSelected={task.id === selectedTaskId}
              isExpanded={allExpanded || expandedIds.has(task.id)}
              dropTarget={dropTarget}
              activeId={activeId}
              onToggleExpand={() => toggleExpand(task.id)}
              onClick={() => onTaskClick?.(task)}
              onAddSubtask={onAddTask ? () => onAddTask(task.id) : undefined}
              getResource={getResource}
            />
          ))}
        </div>
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

// Drop zone component for visual feedback
const DropZone: React.FC<{
  id: string;
  isActive: boolean;
  position: DropPosition;
  level: number;
}> = ({ id, isActive, position, level }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const showIndicator = isOver || isActive;

  if (position === 'child') {
    return (
      <div
        ref={setNodeRef}
        className={`
          mx-4 my-1 rounded-lg border-2 border-dashed transition-all
          ${showIndicator ? 'h-10 border-accent-blue bg-accent-blue/10' : 'h-0 border-transparent'}
        `}
        style={{ marginLeft: `${(level + 1) * 24 + 16}px` }}
      >
        {showIndicator && (
          <div className="flex items-center gap-2 h-full px-3 text-xs text-accent-blue">
            <CornerDownRight className="w-3 h-3" />
            <span>Drop as child</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        relative transition-all
        ${showIndicator ? 'h-1' : 'h-0'}
      `}
    >
      {showIndicator && (
        <div
          className="absolute left-0 right-0 h-1 bg-accent-blue"
          style={{ marginLeft: `${level * 24 + 16}px` }}
        >
          <div className="absolute -left-1 -top-1 w-3 h-3 bg-accent-blue rounded-full" />
        </div>
      )}
    </div>
  );
};

// Draggable tree item with drop zones
interface DraggableTreeItemProps {
  task: FlattenedTask;
  allTasks: Task[];
  isSelected: boolean;
  isExpanded: boolean;
  dropTarget: DropTargetInfo | null;
  activeId: string | null;
  onToggleExpand: () => void;
  onClick: () => void;
  onAddSubtask?: () => void;
  getResource: (id: string) => { name: string; avatarColor: string } | undefined;
}

const DraggableTreeItem: React.FC<DraggableTreeItemProps> = ({
  task,
  allTasks,
  isSelected,
  isExpanded,
  dropTarget,
  activeId,
  onToggleExpand,
  onClick,
  onAddSubtask,
  getResource,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const assignee = task.assigneeId ? getResource(task.assigneeId) : null;
  const totalEstimated = calculateTotalEstimatedHours(allTasks, task.id);
  const totalActual = calculateTotalActualHours(allTasks, task.id);
  const dependenciesComplete = areDependenciesComplete(allTasks, task.id);
  const hasDependencies = task.dependsOn && task.dependsOn.length > 0;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  const isBeingDragged = activeId === task.id;
  const showDropZones = activeId !== null && activeId !== task.id && !wouldCreateCycle(allTasks, activeId, task.id);

  return (
    <div className="relative">
      {/* Drop zone: Before (sibling) */}
      {showDropZones && (
        <DropZone
          id={`${task.id}:before`}
          isActive={dropTarget?.taskId === task.id && dropTarget?.position === 'before'}
          position="before"
          level={task.level}
        />
      )}

      {/* Main item */}
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group flex items-center gap-2 px-4 py-2 transition-colors
          ${isBeingDragged ? 'opacity-50 bg-accent-blue/20' : 'hover:bg-bg-tertiary'}
          ${isSelected ? 'bg-accent-blue/10 border-l-2 border-accent-blue' : ''}
        `}
      >
        {/* Drag Handle */}
        <div
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

      {/* Drop zone: As child */}
      {showDropZones && (
        <DropZone
          id={`${task.id}:child`}
          isActive={dropTarget?.taskId === task.id && dropTarget?.position === 'child'}
          position="child"
          level={task.level}
        />
      )}

      {/* Drop zone: After (sibling) */}
      {showDropZones && (
        <DropZone
          id={`${task.id}:after`}
          isActive={dropTarget?.taskId === task.id && dropTarget?.position === 'after'}
          position="after"
          level={task.level}
        />
      )}
    </div>
  );
};

export default WBSTreeView;
