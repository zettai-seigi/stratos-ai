import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Milestone, MilestoneStatus } from '../../types';
import {
  Flag,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  ChevronRight,
  Calendar,
} from 'lucide-react';

interface MilestoneTimelineProps {
  projectId: string;
  onMilestoneClick?: (milestone: Milestone) => void;
  onAddMilestone?: () => void;
}

const statusConfig: Record<MilestoneStatus, { icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  missed: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
};

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  projectId,
  onMilestoneClick,
  onAddMilestone,
}) => {
  const { state, getTasksByProject } = useApp();
  const tasks = getTasksByProject(projectId);

  // Get milestones for this project, sorted by target date
  const milestones = useMemo(() => {
    return (state.milestones || [])
      .filter(m => m.projectId === projectId)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [state.milestones, projectId]);

  // Calculate progress for each milestone
  const milestonesWithProgress = useMemo(() => {
    return milestones.map(milestone => {
      const linkedTasks = tasks.filter(t => milestone.linkedTaskIds.includes(t.id));
      const completedTasks = linkedTasks.filter(t => t.kanbanStatus === 'done');
      const progress = linkedTasks.length > 0
        ? Math.round((completedTasks.length / linkedTasks.length) * 100)
        : 0;

      const isOverdue = milestone.status === 'pending' && new Date(milestone.targetDate) < new Date();

      return {
        ...milestone,
        linkedTaskCount: linkedTasks.length,
        completedTaskCount: completedTasks.length,
        progress,
        isOverdue,
      };
    });
  }, [milestones, tasks]);

  // Summary stats
  const stats = useMemo(() => ({
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    pending: milestones.filter(m => m.status === 'pending').length,
    missed: milestones.filter(m => m.status === 'missed').length,
    overdue: milestonesWithProgress.filter(m => m.isOverdue).length,
  }), [milestones, milestonesWithProgress]);

  if (milestones.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-lg border border-border p-8 text-center">
        <Flag className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No Milestones Yet</h3>
        <p className="text-text-secondary mb-4">
          Milestones mark key deliverables and progress points in your project.
        </p>
        {onAddMilestone && (
          <button
            onClick={onAddMilestone}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Milestone
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-text-primary flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-400" />
            Project Milestones
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-secondary">{stats.total} total</span>
            {stats.completed > 0 && (
              <span className="text-green-400">{stats.completed} done</span>
            )}
            {stats.overdue > 0 && (
              <span className="text-red-400">{stats.overdue} overdue</span>
            )}
          </div>
        </div>
        {onAddMilestone && (
          <button
            onClick={onAddMilestone}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Milestone
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

          {/* Milestone items */}
          <div className="space-y-4">
            {milestonesWithProgress.map((milestone, index) => {
              const config = statusConfig[milestone.status];
              const isLast = index === milestonesWithProgress.length - 1;

              return (
                <div
                  key={milestone.id}
                  onClick={() => onMilestoneClick?.(milestone)}
                  className="relative flex items-start gap-4 cursor-pointer group"
                >
                  {/* Timeline dot */}
                  <div
                    className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                      ${config.bgColor} ${config.color}
                      ${milestone.isOverdue && milestone.status === 'pending' ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-bg-secondary' : ''}
                      group-hover:scale-110 transition-transform
                    `}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-bg-card rounded-lg border border-border p-3 group-hover:border-accent-blue/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                            {milestone.name}
                          </h4>
                          {milestone.description && (
                            <p className="text-sm text-text-secondary mt-0.5">{milestone.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        {/* Target date */}
                        <span className={`flex items-center gap-1 ${milestone.isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(milestone.targetDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {milestone.isOverdue && ' (Overdue)'}
                        </span>

                        {/* Completed date */}
                        {milestone.completedDate && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Completed {new Date(milestone.completedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}

                        {/* Linked tasks */}
                        {milestone.linkedTaskCount > 0 && (
                          <span className="text-text-secondary">
                            {milestone.completedTaskCount}/{milestone.linkedTaskCount} tasks
                          </span>
                        )}
                      </div>

                      {/* Progress bar for pending milestones with linked tasks */}
                      {milestone.status === 'pending' && milestone.linkedTaskCount > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-text-secondary">Progress</span>
                            <span className={milestone.progress === 100 ? 'text-green-400' : 'text-text-secondary'}>
                              {milestone.progress}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                milestone.progress === 100 ? 'bg-green-400' : 'bg-accent-blue'
                              }`}
                              style={{ width: `${milestone.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneTimeline;
