import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, KanbanStatus, TaskPriority, DEPARTMENTS } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';
import { getValidParentOptions, getValidDependencyOptions, generateWbsCode } from '../../utils/wbsUtils';
import { Flag, Link2, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskFormProps {
  projectId: string;
  task?: Task;
  parentTaskId?: string; // Pre-selected parent when adding subtask
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ projectId, task, parentTaskId, onClose }) => {
  const { state, dispatch } = useApp();
  const { resources, tasks } = state;

  // Show/hide advanced WBS options
  const [showAdvanced, setShowAdvanced] = useState(
    !!(task?.parentTaskId || task?.dependsOn?.length || task?.isMilestone || task?.priority)
  );

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigneeId: task?.assigneeId || '',
    kanbanStatus: task?.kanbanStatus || 'todo' as KanbanStatus,
    dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
    estimatedHours: task?.estimatedHours || 8,
    actualHours: task?.actualHours || 0,
    // WBS fields
    parentTaskId: task?.parentTaskId || parentTaskId || '',
    dependsOn: task?.dependsOn || [] as string[],
    isMilestone: task?.isMilestone || false,
    priority: task?.priority || 'medium' as TaskPriority,
    deliverable: task?.deliverable || '',
    startDate: task?.startDate || '',
  });

  // Get valid parent options (excludes self and descendants)
  const validParentOptions = useMemo(
    () => getValidParentOptions(tasks, projectId, task?.id),
    [tasks, projectId, task?.id]
  );

  // Get valid dependency options
  const validDependencyOptions = useMemo(
    () => getValidDependencyOptions(tasks, projectId, task?.id),
    [tasks, projectId, task?.id]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskId = task?.id || uuidv4();

    // Generate WBS code if parent is set
    const wbsCode = formData.parentTaskId
      ? generateWbsCode(tasks, taskId, formData.parentTaskId)
      : generateWbsCode(tasks, taskId, undefined);

    const taskData: Task = {
      id: taskId,
      projectId,
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      kanbanStatus: formData.kanbanStatus,
      dueDate: formData.dueDate,
      estimatedHours: formData.estimatedHours,
      actualHours: formData.actualHours,
      // WBS fields
      parentTaskId: formData.parentTaskId || undefined,
      dependsOn: formData.dependsOn.length > 0 ? formData.dependsOn : undefined,
      wbsCode,
      isMilestone: formData.isMilestone || undefined,
      priority: formData.priority !== 'medium' ? formData.priority : undefined,
      deliverable: formData.deliverable || undefined,
      startDate: formData.startDate || undefined,
    };

    if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: taskData });
    } else {
      dispatch({ type: 'ADD_TASK', payload: taskData });
    }

    onClose();
  };

  // Toggle dependency selection
  const toggleDependency = (depId: string) => {
    setFormData(prev => ({
      ...prev,
      dependsOn: prev.dependsOn.includes(depId)
        ? prev.dependsOn.filter(id => id !== depId)
        : [...prev.dependsOn, depId],
    }));
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

      {/* WBS Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>WBS & Advanced Options</span>
        {(formData.parentTaskId || formData.dependsOn.length > 0 || formData.isMilestone) && (
          <span className="text-xs bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded">
            configured
          </span>
        )}
      </button>

      {/* WBS Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-bg-tertiary rounded-lg border border-border">
          {/* Parent Task & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Parent Task (WBS Hierarchy)
              </label>
              <select
                value={formData.parentTaskId}
                onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
              >
                <option value="">No parent (root level)</option>
                {validParentOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.wbsCode ? `${t.wbsCode} - ` : ''}{t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Start Date & Milestone Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMilestone}
                  onChange={(e) => setFormData({ ...formData, isMilestone: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-bg-primary text-accent-blue focus:ring-accent-blue"
                />
                <Flag className={`w-4 h-4 ${formData.isMilestone ? 'text-amber-400' : 'text-text-secondary'}`} />
                <span className="text-sm text-text-primary">Mark as Milestone</span>
              </label>
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
              <Link2 className="w-4 h-4" />
              Dependencies (tasks that must complete first)
            </label>
            {validDependencyOptions.length > 0 ? (
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-bg-primary rounded-lg border border-border">
                {validDependencyOptions.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-bg-tertiary cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dependsOn.includes(t.id)}
                      onChange={() => toggleDependency(t.id)}
                      className="w-4 h-4 rounded border-border bg-bg-primary text-accent-blue focus:ring-accent-blue"
                    />
                    <span className={`text-sm ${t.kanbanStatus === 'done' ? 'text-green-400' : 'text-text-primary'}`}>
                      {t.wbsCode ? `${t.wbsCode} - ` : ''}{t.title}
                    </span>
                    {t.kanbanStatus === 'done' && (
                      <span className="text-xs text-green-400">(done)</span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary italic">No other tasks available for dependencies</p>
            )}
            {formData.dependsOn.length > 0 && (
              <p className="mt-1 text-xs text-text-secondary">
                {formData.dependsOn.length} dependency(ies) selected
              </p>
            )}
          </div>

          {/* Deliverable */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Deliverable / Output
            </label>
            <input
              type="text"
              value={formData.deliverable}
              onChange={(e) => setFormData({ ...formData, deliverable: e.target.value })}
              placeholder="What is the output of this task?"
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>
        </div>
      )}

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
