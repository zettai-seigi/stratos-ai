import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Resource } from '../../types';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  resource?: Resource;
  onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, resource, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.kanbanStatus !== 'done';
  const isAtRisk = task.kanbanStatus === 'blocked' || isOverdue;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing
        hover:border-border-light transition-colors
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${isAtRisk ? 'border-l-2 border-l-rag-red' : ''}
      `}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-text-primary line-clamp-2">{task.title}</h4>
        {isAtRisk && (
          <div className="relative group">
            <AlertCircle className="w-4 h-4 text-rag-red flex-shrink-0" />
            <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-rag-red">AI Risk:</span> AI predicts this task
                will miss deadline based on assignee's current workload.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Role Badge */}
      <div className="mb-3">
        <span className="inline-block px-2 py-0.5 bg-bg-hover text-xs text-text-secondary rounded">
          {resource?.role || 'Unassigned'}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className={isOverdue ? 'text-rag-red' : ''}>{formatDate(task.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{task.estimatedHours}h</span>
          </div>
        </div>

        {/* Assignee Avatar */}
        {resource && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: resource.avatarColor }}
            title={resource.name}
          >
            {resource.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
        )}
      </div>
    </div>
  );
};
