import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, KanbanStatus } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';

interface TaskFormProps {
  projectId: string;
  task?: Task;
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, onClose }) => {
  const { state, dispatch } = useApp();
  const { resources } = state;

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigneeId: task?.assigneeId || '',
    kanbanStatus: task?.kanbanStatus || 'todo' as KanbanStatus,
    dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
    estimatedHours: task?.estimatedHours || 8,
    actualHours: task?.actualHours || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Task = {
      id: task?.id || uuidv4(),
      projectId,
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      kanbanStatus: formData.kanbanStatus,
      dueDate: formData.dueDate,
      estimatedHours: formData.estimatedHours,
      actualHours: formData.actualHours,
    };

    if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: taskData });
    } else {
      dispatch({ type: 'ADD_TASK', payload: taskData });
    }

    onClose();
  };

  const handleDelete = () => {
    if (task && confirm('Are you sure you want to delete this task?')) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Task Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Assignee
          </label>
          <select
            value={formData.assigneeId}
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="">Unassigned</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            value={formData.kanbanStatus}
            onChange={(e) => setFormData({ ...formData, kanbanStatus: e.target.value as KanbanStatus })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Estimated Hours
          </label>
          <input
            type="number"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
            min={0}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Actual Hours
          </label>
          <input
            type="number"
            value={formData.actualHours}
            onChange={(e) => setFormData({ ...formData, actualHours: Number(e.target.value) })}
            min={0}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <div>
          {task && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete Task
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{task ? 'Update Task' : 'Create Task'}</Button>
        </div>
      </div>
    </form>
  );
};
