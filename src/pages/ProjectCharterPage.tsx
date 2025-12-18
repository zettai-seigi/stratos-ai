import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS, PROJECT_CATEGORIES } from '../types';
import { FunctionContributionMatrix } from '../components/portfolio/FunctionContributionMatrix';
import { RAGBadge } from '../components/shared';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Target,
  Layers,
  FolderKanban,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export const ProjectCharterPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const { projects, initiatives, pillars, kpis, resources, tasks } = state;

  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="w-full p-6">
        <div className="text-center py-12">
          <h2 className="text-xl text-text-primary">Project Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-accent-blue hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const initiative = initiatives.find((i) => i.id === project.initiativeId);
  const pillar = initiative ? pillars.find((p) => p.id === initiative.pillarId) : null;
  const manager = resources.find((r) => r.id === project.managerId);
  const linkedKpis = initiative?.linkedKpiIds
    ? kpis.filter((k) => initiative.linkedKpiIds?.includes(k.id))
    : [];

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const completedTasks = projectTasks.filter((t) => t.kanbanStatus === 'done').length;
  const blockedTasks = projectTasks.filter((t) => t.kanbanStatus === 'blocked').length;
  const totalEstimatedHours = projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalActualHours = projectTasks.reduce((sum, t) => sum + t.actualHours, 0);

  const deptInfo = DEPARTMENTS[project.departmentCode];
  const categoryInfo = PROJECT_CATEGORIES[project.category];

  const budgetVariance = project.spentBudget - project.budget;
  const budgetPercentage = project.budget > 0 ? Math.round((project.spentBudget / project.budget) * 100) : 0;

  // Calculate schedule variance
  const today = new Date();
  const endDate = new Date(project.endDate);
  const startDate = new Date(project.startDate);
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = today.getTime() - startDate.getTime();
  const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  const scheduleVariance = project.completionPercentage - expectedProgress;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
              style={{ backgroundColor: `${deptInfo?.color}20`, color: deptInfo?.color }}
            >
              {project.workId}
            </span>
            <RAGBadge status={project.ragStatus} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
          <p className="text-text-secondary mt-1">{project.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Strategic Alignment Breadcrumb */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Strategic Alignment (Golden Thread)
        </h3>
        <div className="flex items-center gap-3 text-sm">
          {pillar && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-lg">
                <Layers className="w-4 h-4 text-accent-purple" />
                <span className="text-text-secondary">Pillar:</span>
                <span className="font-medium text-text-primary">{pillar.name}</span>
                <RAGBadge status={pillar.ragStatus} size="sm" />
              </div>
              <span className="text-text-muted">→</span>
            </>
          )}
          {initiative && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-lg">
                <FolderKanban className="w-4 h-4 text-accent-blue" />
                <span className="text-text-secondary">Initiative:</span>
                <span className="font-medium text-text-primary">{initiative.name}</span>
                <RAGBadge status={initiative.ragStatus} size="sm" />
              </div>
              <span className="text-text-muted">→</span>
            </>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
            <span className="text-text-secondary">Project:</span>
            <span className="font-medium text-accent-blue">{project.name}</span>
          </div>
        </div>
      </div>

      {/* Classification & Manager */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Classification</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Department</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${deptInfo?.color}20`, color: deptInfo?.color }}
              >
                {deptInfo?.code} - {deptInfo?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Category</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${categoryInfo?.color}20`, color: categoryInfo?.color }}
              >
                {categoryInfo?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Fiscal Year</span>
              <span className="text-text-primary font-medium">FY{project.fiscalYear}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Project Manager
          </h3>
          {manager ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{ backgroundColor: manager.avatarColor }}
              >
                {manager.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="font-medium text-text-primary">{manager.name}</div>
                <div className="text-sm text-text-muted">{manager.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-text-muted">No manager assigned</div>
          )}
        </div>

        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Start Date</span>
              <span className="text-text-primary">{project.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">End Date</span>
              <span className="text-text-primary">{project.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <span className="text-text-primary capitalize">{project.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs & Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Budget */}
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Budget Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  ${project.spentBudget.toLocaleString()}
                </div>
                <div className="text-sm text-text-muted">
                  of ${project.budget.toLocaleString()} budget
                </div>
              </div>
              <div className={`text-lg font-semibold ${budgetVariance > 0 ? 'text-rag-red' : 'text-rag-green'}`}>
                {budgetVariance > 0 ? '+' : ''}${budgetVariance.toLocaleString()}
              </div>
            </div>
            <div className="h-3 bg-bg-hover rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPercentage > 100 ? 'bg-rag-red' : budgetPercentage > 80 ? 'bg-rag-amber' : 'bg-rag-green'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
            <div className="text-sm text-text-muted text-right">{budgetPercentage}% consumed</div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress & Schedule
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold text-text-primary">{project.completionPercentage}%</div>
                <div className="text-sm text-text-muted">Complete</div>
              </div>
              <div className={`text-sm ${scheduleVariance >= 0 ? 'text-rag-green' : 'text-rag-red'}`}>
                {scheduleVariance >= 0 ? 'Ahead' : 'Behind'} by {Math.abs(scheduleVariance)}%
              </div>
            </div>
            <div className="h-3 bg-bg-hover rounded-full overflow-hidden relative">
              <div
                className="h-full bg-accent-blue rounded-full transition-all"
                style={{ width: `${project.completionPercentage}%` }}
              />
              {/* Expected progress marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-text-muted"
                style={{ left: `${expectedProgress}%` }}
                title={`Expected: ${expectedProgress}%`}
              />
            </div>
            <div className="flex justify-between text-sm text-text-muted">
              <span>Actual: {project.completionPercentage}%</span>
              <span>Expected: {expectedProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked KPIs */}
      {linkedKpis.length > 0 && (
        <div className="bg-bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Linked Strategic KPIs</h3>
          <div className="grid grid-cols-3 gap-3">
            {linkedKpis.map((kpi) => {
              const progress = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
              return (
                <div key={kpi.id} className="bg-bg-hover rounded-lg p-3">
                  <div className="text-sm font-medium text-text-primary mb-1">{kpi.name}</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-lg font-bold text-accent-blue">
                        {kpi.currentValue}{kpi.unit === '%' ? '%' : ''}
                      </span>
                      <span className="text-text-muted text-sm">
                        {' '}/ {kpi.targetValue}{kpi.unit === '%' ? '%' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Summary */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Task Summary
        </h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{projectTasks.length}</div>
            <div className="text-sm text-text-muted">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rag-green">{completedTasks}</div>
            <div className="text-sm text-text-muted">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rag-amber">
              {projectTasks.filter((t) => t.kanbanStatus === 'in_progress').length}
            </div>
            <div className="text-sm text-text-muted">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rag-red">{blockedTasks}</div>
            <div className="text-sm text-text-muted">Blocked</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${totalActualHours > totalEstimatedHours ? 'text-rag-red' : 'text-rag-green'}`}>
              {totalActualHours}h
            </div>
            <div className="text-sm text-text-muted">of {totalEstimatedHours}h est.</div>
          </div>
        </div>
        {blockedTasks > 0 && (
          <div className="mt-3 p-2 bg-rag-red/10 border border-rag-red/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rag-red" />
            <span className="text-sm text-rag-red">
              {blockedTasks} task{blockedTasks > 1 ? 's' : ''} blocked - requires attention
            </span>
          </div>
        )}
      </div>

      {/* Cross-Functional Contribution Matrix */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Cross-Functional Resource Allocation
        </h3>
        <FunctionContributionMatrix project={project} />
      </div>
    </div>
  );
};
