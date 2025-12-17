import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, Resource, KanbanStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { useApp } from '../../context/AppContext';
import { Plus, MoreVertical } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  resources: Resource[];
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
}

interface KanbanColumnProps {
  title: string;
  status: KanbanStatus;
  tasks: Task[];
  resources: Resource[];
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
}

const columnConfig: { status: KanbanStatus; title: string; color: string }[] = [
  { status: 'todo', title: 'To Do', color: 'bg-text-muted' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-accent-blue' },
  { status: 'blocked', title: 'Blocked', color: 'bg-rag-red' },
  { status: 'done', title: 'Done', color: 'bg-rag-green' },
];

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  resources,
  onAddTask,
  onEditTask,
}) => {
  const columnTasks = tasks.filter((t) => t.kanbanStatus === status);
  const config = columnConfig.find((c) => c.status === status)!;

  const getResource = (resourceId: string) =>
    resources.find((r) => r.id === resourceId);

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <span className="text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Column Content */}
      <div className="bg-bg-secondary rounded-lg p-2 min-h-[400px]">
        <SortableContext
          items={columnTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                resource={getResource(task.assigneeId)}
                onClick={() => onEditTask?.(task)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Task Button */}
        {status === 'todo' && onAddTask && (
          <button
            onClick={onAddTask}
            className="w-full mt-2 p-2 flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors border border-dashed border-border"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  resources,
  onAddTask,
  onEditTask,
}) => {
  const { dispatch } = useApp();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Determine the new status based on where the task was dropped
    // In a more complex implementation, we'd track which column was dropped into
    // For now, we'll check if the over element is another task and get its status
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTask.id !== overTask.id) {
      const newStatus = overTask.kanbanStatus;
      if (activeTask.kanbanStatus !== newStatus) {
        dispatch({
          type: 'UPDATE_TASK',
          payload: { ...activeTask, kanbanStatus: newStatus },
        });
      }
    }
  };

  const getResource = (resourceId: string) =>
    resources.find((r) => r.id === resourceId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnConfig.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={tasks}
            resources={resources}
            onAddTask={column.status === 'todo' ? onAddTask : undefined}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            resource={getResource(activeTask.assigneeId)}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
