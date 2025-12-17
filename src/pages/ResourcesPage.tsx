import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Modal } from '../components/shared';
import { Resource } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

const avatarColors = [
  '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ec4899',
  '#06b6d4', '#f43f5e', '#14b8a6', '#a855f7', '#eab308',
];

export const ResourcesPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { resources, tasks } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    team: '',
    weeklyCapacity: 40,
  });

  const handleOpenModal = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        email: resource.email,
        role: resource.role,
        team: resource.team,
        weeklyCapacity: resource.weeklyCapacity,
      });
    } else {
      setEditingResource(null);
      setFormData({ name: '', email: '', role: '', team: '', weeklyCapacity: 40 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resourceData: Resource = {
      id: editingResource?.id || uuidv4(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      team: formData.team,
      weeklyCapacity: formData.weeklyCapacity,
      avatarColor: editingResource?.avatarColor || avatarColors[Math.floor(Math.random() * avatarColors.length)],
    };

    if (editingResource) {
      dispatch({ type: 'UPDATE_RESOURCE', payload: resourceData });
    } else {
      dispatch({ type: 'ADD_RESOURCE', payload: resourceData });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const assignedTasks = tasks.filter((t) => t.assigneeId === id);
    if (assignedTasks.length > 0) {
      alert(`Cannot delete this resource. They have ${assignedTasks.length} tasks assigned.`);
      return;
    }
    if (confirm('Are you sure you want to delete this resource?')) {
      dispatch({ type: 'DELETE_RESOURCE', payload: id });
    }
  };

  const getTaskCount = (resourceId: string) =>
    tasks.filter((t) => t.assigneeId === resourceId && t.kanbanStatus !== 'done').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Resources</h1>
          <p className="text-text-secondary mt-1">Manage team members and their capacity.</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>
          Add Resource
        </Button>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => {
          const activeTasks = getTaskCount(resource.id);
          const totalHours = tasks
            .filter((t) => t.assigneeId === resource.id && t.kanbanStatus !== 'done')
            .reduce((sum, t) => sum + t.estimatedHours, 0);
          const utilization = Math.round((totalHours / (resource.weeklyCapacity * 4)) * 100);

          return (
            <div
              key={resource.id}
              className="bg-bg-card rounded-xl border border-border p-5 hover:border-border-light transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium text-white"
                    style={{ backgroundColor: resource.avatarColor }}
                  >
                    {resource.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{resource.name}</h3>
                    <p className="text-sm text-text-muted">{resource.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(resource)}
                    className="p-2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 text-text-muted hover:text-rag-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Team</span>
                  <span className="text-text-secondary">{resource.team}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Active Tasks</span>
                  <span className="text-text-secondary">{activeTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Utilization</span>
                  <span
                    className={
                      utilization > 100
                        ? 'text-rag-red'
                        : utilization > 80
                        ? 'text-rag-amber'
                        : 'text-rag-green'
                    }
                  >
                    {utilization}%
                  </span>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mt-3">
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      utilization > 100
                        ? 'bg-rag-red'
                        : utilization > 80
                        ? 'bg-rag-amber'
                        : 'bg-rag-green'
                    }`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingResource ? 'Edit Resource' : 'Add Resource'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Full Name *
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Role *
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Team
              </label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Weekly Capacity (Hours)
            </label>
            <input
              type="number"
              value={formData.weeklyCapacity}
              onChange={(e) => setFormData({ ...formData, weeklyCapacity: Number(e.target.value) })}
              min={0}
              max={80}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingResource ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
