import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Initiative, RAGStatus } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';
import { ExternalLink } from 'lucide-react';

interface InitiativeFormProps {
  pillarId?: string;
  initiative?: Initiative;
  onClose: () => void;
  onNavigate?: () => void;
}

export const InitiativeForm: React.FC<InitiativeFormProps> = ({
  pillarId,
  initiative,
  onClose,
  onNavigate,
}) => {
  const { state, dispatch } = useApp();
  const { pillars, resources } = state;

  const [formData, setFormData] = useState({
    pillarId: initiative?.pillarId || pillarId || '',
    name: initiative?.name || '',
    description: initiative?.description || '',
    ownerId: initiative?.ownerId || '',
    startDate: initiative?.startDate || new Date().toISOString().split('T')[0],
    endDate: initiative?.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: initiative?.budget || 100000,
    spentBudget: initiative?.spentBudget || 0,
    ragStatus: initiative?.ragStatus || 'green' as RAGStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const initiativeData: Initiative = {
      id: initiative?.id || uuidv4(),
      pillarId: formData.pillarId,
      name: formData.name,
      description: formData.description,
      ownerId: formData.ownerId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: formData.budget,
      spentBudget: formData.spentBudget,
      ragStatus: formData.ragStatus,
    };

    if (initiative) {
      dispatch({ type: 'UPDATE_INITIATIVE', payload: initiativeData });
    } else {
      dispatch({ type: 'ADD_INITIATIVE', payload: initiativeData });
    }

    onClose();
  };

  const handleDelete = () => {
    if (initiative && confirm('Are you sure you want to delete this initiative? This will also delete all associated projects and tasks.')) {
      dispatch({ type: 'DELETE_INITIATIVE', payload: initiative.id });
      onClose();
    }
  };

  const budgetVariance = formData.spentBudget - formData.budget;
  const budgetPercentage = formData.budget > 0 ? Math.round((formData.spentBudget / formData.budget) * 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Initiative Name *
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
            Strategy Pillar *
          </label>
          <select
            value={formData.pillarId}
            onChange={(e) => setFormData({ ...formData, pillarId: e.target.value })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            required
          >
            <option value="">Select Pillar</option>
            {pillars.map((pillar) => (
              <option key={pillar.id} value={pillar.id}>
                {pillar.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Owner
          </label>
          <select
            value={formData.ownerId}
            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
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
      </div>

      {/* Budget Summary */}
      <div className="p-3 bg-bg-hover rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Budget Usage:</span>
          <span className={budgetVariance > 0 ? 'text-rag-red' : 'text-rag-green'}>
            {budgetPercentage}% ({budgetVariance > 0 ? '+' : ''}${budgetVariance.toLocaleString()})
          </span>
        </div>
        <div className="mt-2 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              budgetPercentage > 100 ? 'bg-rag-red' : budgetPercentage > 80 ? 'bg-rag-amber' : 'bg-rag-green'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          {initiative && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          {initiative && onNavigate && (
            <Button type="button" variant="secondary" onClick={onNavigate}>
              <ExternalLink className="w-4 h-4 mr-1" />
              View in Portfolio
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initiative ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </form>
  );
};
