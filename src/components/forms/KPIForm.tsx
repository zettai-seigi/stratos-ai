import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StrategicKPI } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';

interface KPIFormProps {
  pillarId?: string;
  kpi?: StrategicKPI;
  onClose: () => void;
}

export const KPIForm: React.FC<KPIFormProps> = ({
  pillarId,
  kpi,
  onClose,
}) => {
  const { state, dispatch } = useApp();
  const { pillars } = state;

  const [formData, setFormData] = useState({
    pillarId: kpi?.pillarId || pillarId || '',
    name: kpi?.name || '',
    targetValue: kpi?.targetValue || 100,
    currentValue: kpi?.currentValue || 0,
    previousValue: kpi?.previousValue || 0,
    unit: kpi?.unit || '%' as '%' | '$' | 'score' | 'number',
    lastUpdated: kpi?.lastUpdated || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const kpiData: StrategicKPI = {
      id: kpi?.id || uuidv4(),
      pillarId: formData.pillarId,
      name: formData.name,
      targetValue: formData.targetValue,
      currentValue: formData.currentValue,
      previousValue: formData.previousValue,
      unit: formData.unit,
      lastUpdated: formData.lastUpdated,
    };

    if (kpi) {
      dispatch({ type: 'UPDATE_KPI', payload: kpiData });
    } else {
      dispatch({ type: 'ADD_KPI', payload: kpiData });
    }

    onClose();
  };

  const handleDelete = () => {
    if (kpi && confirm('Are you sure you want to delete this KPI?')) {
      dispatch({ type: 'DELETE_KPI', payload: kpi.id });
      onClose();
    }
  };

  const progressPercentage = formData.targetValue > 0
    ? Math.round((formData.currentValue / formData.targetValue) * 100)
    : 0;

  const trend = formData.currentValue > formData.previousValue
    ? 'up'
    : formData.currentValue < formData.previousValue
    ? 'down'
    : 'neutral';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          KPI Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          required
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
            Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value as '%' | '$' | 'score' | 'number' })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="%">Percentage (%)</option>
            <option value="$">Currency ($)</option>
            <option value="score">Score</option>
            <option value="number">Number</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Target Value
          </label>
          <input
            type="number"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Current Value
          </label>
          <input
            type="number"
            value={formData.currentValue}
            onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Previous Value
          </label>
          <input
            type="number"
            value={formData.previousValue}
            onChange={(e) => setFormData({ ...formData, previousValue: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Last Updated
        </label>
        <input
          type="date"
          value={formData.lastUpdated}
          onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
        />
      </div>

      {/* Progress Summary */}
      <div className="p-3 bg-bg-hover rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Progress toward target:</span>
          <span className={progressPercentage >= 100 ? 'text-rag-green' : progressPercentage >= 70 ? 'text-rag-amber' : 'text-rag-red'}>
            {progressPercentage}%
          </span>
        </div>
        <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progressPercentage >= 100 ? 'bg-rag-green' : progressPercentage >= 70 ? 'bg-rag-amber' : 'bg-rag-red'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Trend:</span>
          <span className={trend === 'up' ? 'text-rag-green' : trend === 'down' ? 'text-rag-red' : 'text-text-muted'}>
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <div>
          {kpi && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{kpi ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </form>
  );
};
