import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StrategyPillar, RAGStatus } from '../../types';
import { Button } from '../shared';
import { v4 as uuidv4 } from 'uuid';

interface PillarFormProps {
  pillar?: StrategyPillar;
  onClose: () => void;
}

export const PillarForm: React.FC<PillarFormProps> = ({ pillar, onClose }) => {
  const { state, dispatch } = useApp();
  const isEditing = !!pillar;

  const [formData, setFormData] = useState({
    name: pillar?.name || '',
    description: pillar?.description || '',
    ragStatus: pillar?.ragStatus || 'green' as RAGStatus,
    displayOrder: pillar?.displayOrder ?? state.pillars.length,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pillarData: StrategyPillar = {
      id: pillar?.id || uuidv4(),
      name: formData.name,
      description: formData.description,
      displayOrder: formData.displayOrder,
      ragStatus: formData.ragStatus,
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_PILLAR', payload: pillarData });
    } else {
      dispatch({ type: 'ADD_PILLAR', payload: pillarData });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Pillar Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Financial Performance"
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
          placeholder="Describe this strategic pillar..."
          rows={3}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            value={formData.ragStatus}
            onChange={(e) => setFormData({ ...formData, ragStatus: e.target.value as RAGStatus })}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="green">On Track (Green)</option>
            <option value="amber">At Risk (Amber)</option>
            <option value="red">Critical (Red)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update Pillar' : 'Create Pillar'}
        </Button>
      </div>
    </form>
  );
};
