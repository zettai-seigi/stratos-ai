import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Milestone, MilestoneStatus } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';
import { Flag, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface MilestoneFormProps {
  projectId: string;
  milestone?: Milestone;
  onClose: () => void;
}

export const MilestoneForm: React.FC<MilestoneFormProps> = ({ projectId, milestone, onClose }) => {
  const { state, dispatch, getTasksByProject } = useApp();
  const tasks = getTasksByProject(projectId);

  const [formData, setFormData] = useState({
    name: milestone?.name || '',
    description: milestone?.description || '',
    targetDate: milestone?.targetDate || new Date().toISOString().split('T')[0],
    completedDate: milestone?.completedDate || '',
    status: milestone?.status || 'pending' as MilestoneStatus,
    linkedTaskIds: milestone?.linkedTaskIds || [] as string[],
  });

  // Get current max display order for new milestones
  const maxDisplayOrder = useMemo(() => {
    const projectMilestones = (state.milestones || []).filter(m => m.projectId === projectId);
    return Math.max(0, ...projectMilestones.map(m => m.displayOrder));
  }, [state.milestones, projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const milestoneData: Milestone = {
      id: milestone?.id || uuidv4(),
      projectId,
      name: formData.name,
      description: formData.description || undefined,
      targetDate: formData.targetDate,
      completedDate: formData.completedDate || undefined,
      status: formData.status,
      linkedTaskIds: formData.linkedTaskIds,
      displayOrder: milestone?.displayOrder ?? maxDisplayOrder + 1,
    };

    if (milestone) {
      dispatch({ type: 'UPDATE_MILESTONE', payload: milestoneData });
    } else {
      dispatch({ type: 'ADD_MILESTONE', payload: milestoneData });
    }

    onClose();
  };

  const handleDelete = () => {
    if (milestone && confirm('Are you sure you want to delete this milestone?')) {
      dispatch({ type: 'DELETE_MILESTONE', payload: milestone.id });
      onClose();
    }
  };

  const toggleTaskLink = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedTaskIds: prev.linkedTaskIds.includes(taskId)
        ? prev.linkedTaskIds.filter(id => id !== taskId)
        : [...prev.linkedTaskIds, taskId],
    }));
  };

  // Auto-update status based on linked tasks
  const linkedTasksCompleted = useMemo(() => {
    if (formData.linkedTaskIds.length === 0) return false;
    return formData.linkedTaskIds.every(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return task?.kanbanStatus === 'done';
    });
  }, [formData.linkedTaskIds, tasks]);

  const statusIcons: Record<MilestoneStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    completed: <CheckCircle className="w-4 h-4 text-green-400" />,
    missed: <AlertCircle className="w-4 h-4 text-red-400" />,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Milestone Name *
        </label>
        <div className="relative">
          <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Phase 1 Complete, MVP Launch"
            className="w-full pl-10 pr-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="What does this milestone represent?"
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue resize-none"
        />
      </div>

      {/* Dates and Status Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Target Date *
          </label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Completed Date
          </label>
          <input
            type="date"
            value={formData.completedDate}
            onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <div className="relative">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MilestoneStatus })}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue appearance-none"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {statusIcons[formData.status]}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-complete suggestion */}
      {linkedTasksCompleted && formData.status === 'pending' && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">All linked tasks are complete!</span>
          <button
            type="button"
            onClick={() => setFormData({
              ...formData,
              status: 'completed',
              completedDate: new Date().toISOString().split('T')[0]
            })}
            className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30"
          >
            Mark Complete
          </button>
        </div>
      )}

      {/* Linked Tasks */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Linked Tasks (tasks that must complete for this milestone)
        </label>
        {tasks.length > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-bg-tertiary rounded-lg border border-border">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-bg-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.linkedTaskIds.includes(task.id)}
                  onChange={() => toggleTaskLink(task.id)}
                  className="w-4 h-4 rounded border-border bg-bg-primary text-accent-blue focus:ring-accent-blue"
                />
                <span className={`flex-1 text-sm ${task.kanbanStatus === 'done' ? 'text-green-400 line-through' : 'text-text-primary'}`}>
                  {task.wbsCode ? `${task.wbsCode} - ` : ''}{task.title}
                </span>
                {task.kanbanStatus === 'done' && (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                )}
                {task.isMilestone && (
                  <Flag className="w-3 h-3 text-amber-400" />
                )}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic p-4 bg-bg-tertiary rounded-lg border border-border">
            No tasks in this project yet. Create tasks first, then link them to milestones.
          </p>
        )}
        {formData.linkedTaskIds.length > 0 && (
          <p className="mt-1 text-xs text-text-secondary">
            {formData.linkedTaskIds.length} task(s) linked •
            {formData.linkedTaskIds.filter(id => tasks.find(t => t.id === id)?.kanbanStatus === 'done').length} completed
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-border">
        <div>
          {milestone && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete Milestone
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{milestone ? 'Update Milestone' : 'Create Milestone'}</Button>
        </div>
      </div>
    </form>
  );
};

export default MilestoneForm;
