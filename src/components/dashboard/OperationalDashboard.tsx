import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { KanbanBoard } from '../execution/KanbanBoard';
import { RAGStatusLabel, Button, Modal } from '../shared';
import { TaskForm } from '../forms/TaskForm';
import { Task } from '../../types';
import {
  FolderKanban,
  AlertTriangle,
  BarChart3,
  Users,
  Target,
  ArrowLeft,
} from 'lucide-react';

type TabType = 'overview' | 'execution' | 'team' | 'kpis';

export const OperationalDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, getProject, getInitiative, getTasksByProject, getPillar } = useApp();
  const { resources } = state;

  const [activeTab, setActiveTab] = useState<TabType>('execution');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const project = projectId ? getProject(projectId) : null;
  const initiative = project ? getInitiative(project.initiativeId) : null;
  const pillar = initiative ? getPillar(initiative.pillarId) : null;
  const tasks = project ? getTasksByProject(project.id) : [];

  if (!project) {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Project Execution</h1>
            <p className="text-text-secondary mt-1">Manage tasks and track project progress.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
            <FolderKanban className="w-5 h-5 text-accent-cyan" />
            <span className="text-sm text-text-secondary">Execution Board</span>
          </div>
        </div>

        {/* Empty State */}
        <div className="w-full bg-bg-card rounded-xl border border-border p-5">
          <div className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="w-16 h-16 text-text-muted mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">No Project Selected</h2>
            <p className="text-text-secondary mb-4">
              Select a project from the Portfolio Hub to view its execution dashboard.
            </p>
            <Button onClick={() => navigate('/portfolio')}>Go to Portfolio Hub</Button>
          </div>
        </div>
      </div>
    );
  }

  // AI Fix-it suggestion based on project status
  const getAISuggestion = () => {
    const blockedTasks = tasks.filter((t) => t.kanbanStatus === 'blocked').length;
    const inProgressTasks = tasks.filter((t) => t.kanbanStatus === 'in_progress').length;

    if (blockedTasks > 0) {
      return `Velocity has dropped 20% in the last two sprints. AI recommends re-assigning ${blockedTasks} low-priority tasks from the 'Backend Team' to alleviate QA bottlenecks before the upcoming milestone.`;
    }
    if (inProgressTasks > 5) {
      return `High WIP detected (${inProgressTasks} tasks in progress). Consider limiting work-in-progress to improve flow efficiency.`;
    }
    return 'Project is progressing well. No immediate actions required.';
  };

  const handleAddTask = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'execution' as TabType, label: 'Execution Board', icon: FolderKanban },
    { id: 'team' as TabType, label: 'Team & Resourcing', icon: Users },
    { id: 'kpis' as TabType, label: 'KPIs & Metrics', icon: Target },
  ];

  const completedTasks = tasks.filter((t) => t.kanbanStatus === 'done').length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/portfolio')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Portfolio</span>
      </button>

      {/* Project Header */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
              <RAGStatusLabel status={project.ragStatus} />
            </div>
            <p className="text-sm text-text-secondary">
              Initiative: {initiative?.name} | Pillar: {pillar?.name}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-hover rounded-lg">
            <FolderKanban className="w-5 h-5 text-accent-cyan" />
            <span className="text-sm text-text-secondary">Manager Persona</span>
          </div>
        </div>

        {/* AI Suggestion */}
        {(project.ragStatus === 'amber' || project.ragStatus === 'red') && (
          <div className="flex items-start gap-3 p-3 bg-rag-amber/10 rounded-lg border border-rag-amber/30">
            <AlertTriangle className="w-5 h-5 text-rag-amber flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-semibold text-rag-amber">AI Fix-it Suggestion: </span>
              <span className="text-sm text-text-primary">{getAISuggestion()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-text-secondary mb-1">Completion</p>
            <p className="text-3xl font-bold text-text-primary">{completionPercentage}%</p>
            <div className="mt-2 h-2 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-text-secondary mb-1">Total Tasks</p>
            <p className="text-3xl font-bold text-text-primary">{tasks.length}</p>
            <p className="text-sm text-text-muted mt-1">{completedTasks} completed</p>
          </div>
          <div className="bg-bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-text-secondary mb-1">Budget Spent</p>
            <p className="text-3xl font-bold text-text-primary">
              ${(project.spentBudget / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-text-muted mt-1">
              of ${(project.budget / 1000).toFixed(0)}K allocated
            </p>
          </div>
        </div>
      )}

      {activeTab === 'execution' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Execution Board</h2>
            <Button onClick={handleAddTask} icon={<FolderKanban className="w-4 h-4" />}>
              Add Task
            </Button>
          </div>
          <KanbanBoard
            tasks={tasks}
            resources={resources}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
          />
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Team Members</h2>
          <div className="space-y-3">
            {resources
              .filter((r) => tasks.some((t) => t.assigneeId === r.id))
              .map((resource) => {
                const assignedTasks = tasks.filter((t) => t.assigneeId === resource.id);
                const totalHours = assignedTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
                const utilization = Math.round((totalHours / (resource.weeklyCapacity * 4)) * 100);

                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-bg-hover rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                        style={{ backgroundColor: resource.avatarColor }}
                      >
                        {resource.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{resource.name}</p>
                        <p className="text-xs text-text-muted">{resource.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">{assignedTasks.length} tasks</p>
                      <p
                        className={`text-xs ${
                          utilization > 100
                            ? 'text-rag-red'
                            : utilization > 80
                            ? 'text-rag-amber'
                            : 'text-text-muted'
                        }`}
                      >
                        {utilization}% utilization
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === 'kpis' && (
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Project KPIs</h2>
          <p className="text-text-secondary">
            KPI tracking will be linked to the strategic metrics this project impacts.
          </p>
        </div>
      )}

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        size="lg"
      >
        <TaskForm
          projectId={project.id}
          task={editingTask}
          onClose={() => setIsTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
