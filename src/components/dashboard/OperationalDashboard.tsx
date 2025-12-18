import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAI } from '../../context/AIContext';
import { KanbanBoard } from '../execution/KanbanBoard';
import { RAGStatusLabel, RAGBadge, Button, Modal } from '../shared';
import { TaskForm } from '../forms/TaskForm';
import { ProjectForm } from '../forms/ProjectForm';
import { Task, Resource, Project, RAGStatus } from '../../types';
import {
  FolderKanban,
  AlertTriangle,
  BarChart3,
  Users,
  Target,
  ArrowLeft,
  ArrowRight,
  Edit2,
  ChevronRight,
  ListTodo,
  Filter,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Loader2,
} from 'lucide-react';

type TabType = 'overview' | 'execution' | 'team' | 'kpis';

// Project List Component for when no project is selected
const ProjectListView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, getInitiative, getPillar, getTasksByProject } = useApp();
  const { projects, initiatives, pillars, tasks } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RAGStatus | 'all'>('all');
  const [pillarFilter, setPillarFilter] = useState<string>(searchParams.get('pillar') || 'all');
  const [initiativeFilter, setInitiativeFilter] = useState<string>(searchParams.get('initiative') || 'all');

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.ragStatus === statusFilter;

      const initiative = getInitiative(project.initiativeId);
      const matchesPillar = pillarFilter === 'all' || initiative?.pillarId === pillarFilter;
      const matchesInitiative = initiativeFilter === 'all' || project.initiativeId === initiativeFilter;

      return matchesSearch && matchesStatus && matchesPillar && matchesInitiative;
    });
  }, [projects, searchTerm, statusFilter, pillarFilter, initiativeFilter, getInitiative]);

  // Group projects by initiative for display
  const groupedProjects = useMemo(() => {
    const grouped: Record<string, { initiative: typeof initiatives[0]; projects: typeof projects }> = {};

    filteredProjects.forEach((project) => {
      const initiative = getInitiative(project.initiativeId);
      if (initiative) {
        if (!grouped[initiative.id]) {
          grouped[initiative.id] = { initiative, projects: [] };
        }
        grouped[initiative.id].projects.push(project);
      }
    });

    return Object.values(grouped).sort((a, b) => a.initiative.name.localeCompare(b.initiative.name));
  }, [filteredProjects, getInitiative]);

  // Summary stats
  const stats = useMemo(() => ({
    total: projects.length,
    green: projects.filter(p => p.ragStatus === 'green').length,
    amber: projects.filter(p => p.ragStatus === 'amber').length,
    red: projects.filter(p => p.ragStatus === 'red').length,
  }), [projects]);

  // Get filtered initiatives based on pillar selection
  const filteredInitiatives = pillarFilter === 'all'
    ? initiatives
    : initiatives.filter(i => i.pillarId === pillarFilter);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Project Execution</h1>
          <p className="text-text-secondary mt-1">Select a project to manage tasks and track progress</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <FolderKanban className="w-5 h-5 text-accent-cyan" />
          <span className="text-sm text-text-secondary">Execution Board</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-bg-card rounded-xl border p-4 cursor-pointer transition-colors ${statusFilter === 'all' ? 'border-accent-blue bg-accent-blue/5' : 'border-border hover:bg-bg-hover'}`}
        >
          <div className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-accent-blue" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-sm text-text-secondary">Total Projects</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('green')}
          className={`bg-bg-card rounded-xl border p-4 cursor-pointer transition-colors ${statusFilter === 'green' ? 'border-rag-green bg-rag-green/5' : 'border-border hover:bg-bg-hover'}`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-rag-green" />
            <div>
              <p className="text-2xl font-bold text-rag-green">{stats.green}</p>
              <p className="text-sm text-text-secondary">On Track</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('amber')}
          className={`bg-bg-card rounded-xl border p-4 cursor-pointer transition-colors ${statusFilter === 'amber' ? 'border-rag-amber bg-rag-amber/5' : 'border-border hover:bg-bg-hover'}`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rag-amber" />
            <div>
              <p className="text-2xl font-bold text-rag-amber">{stats.amber}</p>
              <p className="text-sm text-text-secondary">At Risk</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter('red')}
          className={`bg-bg-card rounded-xl border p-4 cursor-pointer transition-colors ${statusFilter === 'red' ? 'border-rag-red bg-rag-red/5' : 'border-border hover:bg-bg-hover'}`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rag-red" />
            <div>
              <p className="text-2xl font-bold text-rag-red">{stats.red}</p>
              <p className="text-sm text-text-secondary">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          {/* Pillar Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={pillarFilter}
              onChange={(e) => {
                setPillarFilter(e.target.value);
                setInitiativeFilter('all'); // Reset initiative filter when pillar changes
              }}
              className="px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            >
              <option value="all">All Pillars</option>
              {pillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
              ))}
            </select>
          </div>

          {/* Initiative Filter */}
          <select
            value={initiativeFilter}
            onChange={(e) => setInitiativeFilter(e.target.value)}
            className="px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="all">All Initiatives</option>
            {filteredInitiatives.map((initiative) => (
              <option key={initiative.id} value={initiative.id}>{initiative.name}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || pillarFilter !== 'all' || initiativeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPillarFilter('all');
                setInitiativeFilter('all');
              }}
              className="text-sm text-accent-blue hover:text-accent-blue/80"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-4">
        {groupedProjects.length === 0 ? (
          <div className="bg-bg-card rounded-xl border border-border p-8 text-center">
            <FolderKanban className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No projects found matching your filters</p>
          </div>
        ) : (
          groupedProjects.map(({ initiative, projects: initiativeProjects }) => {
            const pillar = getPillar(initiative.pillarId);
            return (
              <div key={initiative.id} className="bg-bg-card rounded-xl border border-border overflow-hidden">
                {/* Initiative Header */}
                <div className="px-4 py-3 bg-bg-hover border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RAGBadge status={initiative.ragStatus} size="sm" />
                      <div>
                        <h3 className="font-medium text-text-primary">{initiative.name}</h3>
                        <p className="text-xs text-text-muted">{pillar?.name}</p>
                      </div>
                    </div>
                    <span className="text-sm text-text-secondary">{initiativeProjects.length} project(s)</span>
                  </div>
                </div>

                {/* Projects */}
                <div className="divide-y divide-border">
                  {initiativeProjects.map((project) => {
                    const projectTasks = getTasksByProject(project.id);
                    const completedTasks = projectTasks.filter(t => t.kanbanStatus === 'done').length;
                    const completionPct = projectTasks.length > 0
                      ? Math.round((completedTasks / projectTasks.length) * 100)
                      : 0;

                    return (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/execution/${project.id}`)}
                        className="px-4 py-3 hover:bg-bg-hover cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <RAGStatusLabel status={project.ragStatus} />
                            <div className="flex-1">
                              <h4 className="font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                                {project.name}
                              </h4>
                              <p className="text-sm text-text-muted line-clamp-1">{project.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {/* Completion */}
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-bg-hover rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-accent-blue rounded-full"
                                    style={{ width: `${completionPct}%` }}
                                  />
                                </div>
                                <span className="text-sm text-text-secondary w-10">{completionPct}%</span>
                              </div>
                              <p className="text-xs text-text-muted">{completedTasks}/{projectTasks.length} tasks</p>
                            </div>
                            {/* Budget */}
                            <div className="text-right w-24">
                              <p className="text-sm font-medium text-text-primary">
                                ${(project.spentBudget / 1000).toFixed(0)}K
                              </p>
                              <p className="text-xs text-text-muted">
                                of ${(project.budget / 1000).toFixed(0)}K
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent-blue transition-colors" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const OperationalDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, getProject, getInitiative, getTasksByProject, getPillar } = useApp();
  const { resources } = state;

  const [activeTab, setActiveTab] = useState<TabType>('execution');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<Resource | null>(null);
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);

  const project = projectId ? getProject(projectId) : null;
  const initiative = project ? getInitiative(project.initiativeId) : null;
  const pillar = initiative ? getPillar(initiative.pillarId) : null;
  const tasks = project ? getTasksByProject(project.id) : [];

  // If no project selected, show the project list view
  if (!project) {
    return <ProjectListView />;
  }

  // AI Fix-it suggestion based on project status
  // Use AI context for suggestions
  const { isLoading: aiLoading, getProjectAISuggestion } = useAI();

  const getAISuggestion = () => {
    if (project) {
      return getProjectAISuggestion(project.id);
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

  const handleTeamMemberClick = (resource: Resource) => {
    setSelectedTeamMember(resource);
    setIsTeamMemberModalOpen(true);
  };

  const handleEditProject = () => {
    setIsProjectModalOpen(true);
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
          <div
            onClick={() => navigate('/insights')}
            className="flex items-start gap-3 p-3 bg-rag-amber/10 rounded-lg border border-rag-amber/30 cursor-pointer hover:bg-rag-amber/20 transition-colors group"
          >
            {aiLoading ? (
              <Loader2 className="w-5 h-5 text-rag-amber flex-shrink-0 mt-0.5 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rag-amber flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="text-sm font-semibold text-rag-amber">AI Fix-it Suggestion: </span>
              <span className="text-sm text-text-primary">
                {aiLoading ? 'Analyzing project data...' : getAISuggestion()}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-rag-amber opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
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
          <div
            onClick={() => setActiveTab('execution')}
            className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-text-secondary">Completion</p>
              <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-text-primary">{completionPercentage}%</p>
            <div className="mt-2 h-2 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div
            onClick={() => setActiveTab('execution')}
            className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-text-secondary">Total Tasks</p>
              <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-text-primary">{tasks.length}</p>
            <p className="text-sm text-text-muted mt-1">{completedTasks} completed</p>
          </div>
          <div
            onClick={handleEditProject}
            className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-text-secondary">Budget Spent</p>
              <Edit2 className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Team Members</h2>
            <button
              onClick={() => navigate('/resources')}
              className="text-sm text-accent-blue hover:text-accent-blue/80"
            >
              Manage All Resources
            </button>
          </div>
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
                    onClick={() => handleTeamMemberClick(resource)}
                    className="flex items-center justify-between p-3 bg-bg-hover rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors group"
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
                    <div className="flex items-center gap-3">
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
                      <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            {resources.filter((r) => tasks.some((t) => t.assigneeId === r.id)).length === 0 && (
              <p className="text-center text-text-muted py-4">No team members assigned to this project</p>
            )}
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

      {/* Project Edit Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Edit Project"
        size="lg"
      >
        <ProjectForm
          project={project}
          onClose={() => setIsProjectModalOpen(false)}
        />
      </Modal>

      {/* Team Member Modal */}
      <Modal
        isOpen={isTeamMemberModalOpen}
        onClose={() => setIsTeamMemberModalOpen(false)}
        title="Team Member Details"
      >
        {selectedTeamMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium text-white"
                style={{ backgroundColor: selectedTeamMember.avatarColor }}
              >
                {selectedTeamMember.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{selectedTeamMember.name}</h3>
                <p className="text-text-secondary">{selectedTeamMember.role}</p>
                <p className="text-sm text-text-muted">{selectedTeamMember.team}</p>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Email</span>
                <span className="text-text-primary">{selectedTeamMember.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Weekly Capacity</span>
                <span className="text-text-primary">{selectedTeamMember.weeklyCapacity} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tasks on this project</span>
                <span className="text-text-primary">
                  {tasks.filter((t) => t.assigneeId === selectedTeamMember.id).length}
                </span>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-text-secondary mb-2">Assigned Tasks</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks
                  .filter((t) => t.assigneeId === selectedTeamMember.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setIsTeamMemberModalOpen(false);
                        handleEditTask(task);
                      }}
                      className="p-2 bg-bg-secondary rounded-lg cursor-pointer hover:bg-bg-hover transition-colors"
                    >
                      <p className="text-sm text-text-primary">{task.title}</p>
                      <p className="text-xs text-text-muted capitalize">{task.kanbanStatus.replace('_', ' ')}</p>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => navigate('/resources')} variant="secondary">
                View All Resources
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
