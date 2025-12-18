import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, RAGStatus, ProjectStatus } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';
import { ExternalLink } from 'lucide-react';

interface ProjectFormProps {
  initiativeId?: string;
  project?: Project;
  onClose: () => void;
  onNavigate?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initiativeId,
  project,
  onClose,
  onNavigate,
}) => {
  const { state, dispatch } = useApp();
  const { initiatives, resources } = state;

  const [formData, setFormData] = useState({
    initiativeId: project?.initiativeId || initiativeId || '',
    name: project?.name || '',
    description: project?.description || '',
    managerId: project?.managerId || '',
    status: project?.status || 'not_started' as ProjectStatus,
    ragStatus: project?.ragStatus || 'green' as RAGStatus,
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    endDate: project?.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completionPercentage: project?.completionPercentage || 0,
    budget: project?.budget || 50000,
    spentBudget: project?.spentBudget || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectData: Project = {
      id: project?.id || uuidv4(),
      initiativeId: formData.initiativeId,
      name: formData.name,
      description: formData.description,
      managerId: formData.managerId,
      status: formData.status,
      ragStatus: formData.ragStatus,
      startDate: formData.startDate,
      endDate: formData.endDate,
      completionPercentage: formData.completionPercentage,
      budget: formData.budget,
      spentBudget: formData.spentBudget,
    };

    if (project) {
      dispatch({ type: 'UPDATE_PROJECT', payload: projectData });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: projectData });
    }

    onClose();
  };

  const handleDelete = () => {
    if (project && confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      dispatch({ type: 'DELETE_PROJECT', payload: project.id });
      onClose();
    }
  };

  const budgetVariance = formData.spentBudget - formData.budget;
  const budgetPercentage = formData.budget > 0 ? Math.round((formData.spentBudget / formData.budget) * 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Project Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            Initiative *
          </label>
          <select
            value={formData.initiativeId}
            onChange={(e) => setFormData({ ...formData, initiativeId: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            required
          >
            <option value="">Select Initiative</option>
            {initiatives.map((initiative) => (
              <option key={initiative.id} value={initiative.id}>
                {initiative.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Project Manager
          </label>
          <select
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
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
      </div>

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

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            End Date
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            RAG Status
          </label>
          <select
            value={formData.ragStatus}
            onChange={(e) => setFormData({ ...formData, ragStatus: e.target.value as RAGStatus })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="green">Green - On Track</option>
            <option value="amber">Amber - At Risk</option>
            <option value="red">Red - Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Completion %
          </label>
          <input
            type="number"
            value={formData.completionPercentage}
            onChange={(e) => setFormData({ ...formData, completionPercentage: Number(e.target.value) })}
            min={0}
            max={100}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Budget ($)
          </label>
          <input
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
            min={0}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Spent Budget ($)
          </label>
          <input
            type="number"
            value={formData.spentBudget}
            onChange={(e) => setFormData({ ...formData, spentBudget: Number(e.target.value) })}
            min={0}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      {/* Budget & Progress Summary */}
      <div className="p-3 bg-bg-hover rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Budget Usage:</span>
          <span className={budgetVariance > 0 ? 'text-rag-red' : 'text-rag-green'}>
            {budgetPercentage}% ({budgetVariance > 0 ? '+' : ''}${budgetVariance.toLocaleString()})
          </span>
        </div>
        <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              budgetPercentage > 100 ? 'bg-rag-red' : budgetPercentage > 80 ? 'bg-rag-amber' : 'bg-rag-green'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Completion:</span>
          <span className="text-accent-blue">{formData.completionPercentage}%</span>
        </div>
        <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-blue rounded-full transition-all"
            style={{ width: `${formData.completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          {project && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          {project && onNavigate && (
            <Button type="button" variant="secondary" onClick={onNavigate}>
              <ExternalLink className="w-4 h-4 mr-1" />
              View Execution
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{project ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </form>
  );
};
