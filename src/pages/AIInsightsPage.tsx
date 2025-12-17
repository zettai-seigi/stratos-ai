import React from 'react';
import { useApp } from '../context/AppContext';
import { RAGBadge } from '../components/shared';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Clock,
  DollarSign,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InsightCardProps {
  type: 'warning' | 'success' | 'info' | 'critical';
  title: string;
  description: string;
  action?: string;
  link?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ type, title, description, action, link }) => {
  const typeStyles = {
    warning: {
      bg: 'bg-rag-amber/10',
      border: 'border-rag-amber/30',
      icon: <AlertTriangle className="w-5 h-5 text-rag-amber" />,
      badge: 'bg-rag-amber/20 text-rag-amber',
    },
    success: {
      bg: 'bg-rag-green/10',
      border: 'border-rag-green/30',
      icon: <CheckCircle className="w-5 h-5 text-rag-green" />,
      badge: 'bg-rag-green/20 text-rag-green',
    },
    info: {
      bg: 'bg-accent-blue/10',
      border: 'border-accent-blue/30',
      icon: <Lightbulb className="w-5 h-5 text-accent-blue" />,
      badge: 'bg-accent-blue/20 text-accent-blue',
    },
    critical: {
      bg: 'bg-rag-red/10',
      border: 'border-rag-red/30',
      icon: <XCircle className="w-5 h-5 text-rag-red" />,
      badge: 'bg-rag-red/20 text-rag-red',
    },
  };

  const style = typeStyles[type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${style.badge}`}>
          {style.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-text-primary mb-1">{title}</h4>
          <p className="text-sm text-text-secondary">{description}</p>
          {action && link && (
            <Link
              to={link}
              className="inline-flex items-center gap-1 mt-2 text-sm text-accent-blue hover:text-accent-blue/80"
            >
              {action}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export const AIInsightsPage: React.FC = () => {
  const { state } = useApp();
  const { pillars, initiatives, projects, tasks } = state;

  // Generate insights based on current data
  const generateInsights = () => {
    const insights: InsightCardProps[] = [];

    // Check for critical pillars
    const criticalPillars = pillars.filter(p => p.ragStatus === 'red');
    criticalPillars.forEach(pillar => {
      insights.push({
        type: 'critical',
        title: `${pillar.name} requires immediate attention`,
        description: `This strategic pillar is marked as critical. Review linked initiatives and KPIs to identify root causes.`,
        action: 'View Strategy Hub',
        link: '/strategy',
      });
    });

    // Check for at-risk initiatives
    const atRiskInitiatives = initiatives.filter(i => i.ragStatus === 'red' || i.ragStatus === 'amber');
    if (atRiskInitiatives.length > 0) {
      insights.push({
        type: 'warning',
        title: `${atRiskInitiatives.length} initiative(s) at risk`,
        description: `These initiatives may impact strategic goals: ${atRiskInitiatives.slice(0, 2).map(i => i.name).join(', ')}${atRiskInitiatives.length > 2 ? ` and ${atRiskInitiatives.length - 2} more` : ''}.`,
        action: 'View Portfolio',
        link: '/portfolio',
      });
    }

    // Check for budget overruns
    const overBudgetInitiatives = initiatives.filter(i => i.spentBudget > i.budget * 0.9);
    if (overBudgetInitiatives.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget threshold alert',
        description: `${overBudgetInitiatives.length} initiative(s) have consumed over 90% of allocated budget. Consider reallocation or scope adjustment.`,
        action: 'Review Budgets',
        link: '/portfolio',
      });
    }

    // Check for blocked tasks
    const blockedTasks = tasks.filter(t => t.kanbanStatus === 'blocked');
    if (blockedTasks.length > 0) {
      insights.push({
        type: 'warning',
        title: `${blockedTasks.length} blocked task(s) detected`,
        description: 'Blocked tasks can cascade delays across projects. Prioritize unblocking these items.',
        action: 'View Execution Board',
        link: '/execution',
      });
    }

    // Check for overdue tasks
    const today = new Date();
    const overdueTasks = tasks.filter(t =>
      t.kanbanStatus !== 'done' && new Date(t.dueDate) < today
    );
    if (overdueTasks.length > 0) {
      insights.push({
        type: 'critical',
        title: `${overdueTasks.length} overdue task(s)`,
        description: 'These tasks are past their due date and may be impacting project timelines.',
        action: 'View Tasks',
        link: '/execution',
      });
    }

    // Positive insights
    const onTrackPillars = pillars.filter(p => p.ragStatus === 'green');
    if (onTrackPillars.length > 0) {
      insights.push({
        type: 'success',
        title: `${onTrackPillars.length} pillar(s) performing well`,
        description: `${onTrackPillars.map(p => p.name).join(', ')} ${onTrackPillars.length === 1 ? 'is' : 'are'} on track to meet strategic targets.`,
      });
    }

    // Check for high completion projects
    const highCompletionProjects = projects.filter(p => p.completionPercentage >= 80 && p.status === 'in_progress');
    if (highCompletionProjects.length > 0) {
      insights.push({
        type: 'success',
        title: `${highCompletionProjects.length} project(s) nearing completion`,
        description: `Projects at 80%+ completion: ${highCompletionProjects.map(p => p.name).join(', ')}.`,
        action: 'View Projects',
        link: '/execution',
      });
    }

    // Recommendations
    insights.push({
      type: 'info',
      title: 'Recommendation: Resource optimization',
      description: 'Based on current workload distribution, consider reallocating resources from completed projects to at-risk initiatives.',
      action: 'View Resources',
      link: '/resources',
    });

    return insights;
  };

  const insights = generateInsights();
  const criticalCount = insights.filter(i => i.type === 'critical').length;
  const warningCount = insights.filter(i => i.type === 'warning').length;
  const successCount = insights.filter(i => i.type === 'success').length;

  // Generate trend analysis
  const trendData = [
    {
      metric: 'Overall Health',
      trend: pillars.filter(p => p.ragStatus === 'green').length >= pillars.length / 2 ? 'up' : 'down',
      value: `${Math.round((pillars.filter(p => p.ragStatus === 'green').length / pillars.length) * 100)}%`,
      description: 'Pillars on track',
    },
    {
      metric: 'Initiative Progress',
      trend: initiatives.filter(i => i.ragStatus === 'green').length >= initiatives.length / 2 ? 'up' : 'down',
      value: `${initiatives.filter(i => i.ragStatus === 'green').length}/${initiatives.length}`,
      description: 'Initiatives healthy',
    },
    {
      metric: 'Task Completion',
      trend: tasks.filter(t => t.kanbanStatus === 'done').length > tasks.length / 3 ? 'up' : 'neutral',
      value: `${Math.round((tasks.filter(t => t.kanbanStatus === 'done').length / tasks.length) * 100)}%`,
      description: 'Tasks completed',
    },
    {
      metric: 'Budget Utilization',
      trend: 'neutral',
      value: `${Math.round((initiatives.reduce((acc, i) => acc + i.spentBudget, 0) / initiatives.reduce((acc, i) => acc + i.budget, 0)) * 100)}%`,
      description: 'Budget consumed',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Insights Center</h1>
          <p className="text-text-secondary mt-1">AI-powered analysis and recommendations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <span className="text-sm text-text-secondary">AI Powered</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-purple/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{insights.length}</p>
              <p className="text-sm text-text-secondary">Total Insights</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rag-red/20 rounded-lg">
              <XCircle className="w-5 h-5 text-rag-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rag-red">{criticalCount}</p>
              <p className="text-sm text-text-secondary">Critical Issues</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rag-amber/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rag-amber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rag-amber">{warningCount}</p>
              <p className="text-sm text-text-secondary">Warnings</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rag-green/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-rag-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rag-green">{successCount}</p>
              <p className="text-sm text-text-secondary">Positive Trends</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-cyan" />
          Trend Analysis
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendData.map((item, index) => (
            <div key={index} className="bg-bg-secondary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-rag-green" />}
                {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-rag-red" />}
                {item.trend === 'neutral' && <Target className="w-4 h-4 text-text-muted" />}
                <span className="text-sm text-text-secondary">{item.metric}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{item.value}</p>
              <p className="text-xs text-text-muted mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-rag-amber" />
          AI-Generated Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recommended Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/strategy"
            className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-bg-hover transition-colors"
          >
            <Target className="w-8 h-8 text-accent-blue" />
            <div>
              <p className="font-medium text-text-primary">Review Strategy</p>
              <p className="text-sm text-text-secondary">Update KPI targets</p>
            </div>
          </Link>
          <Link
            to="/portfolio"
            className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-bg-hover transition-colors"
          >
            <DollarSign className="w-8 h-8 text-rag-green" />
            <div>
              <p className="font-medium text-text-primary">Check Budgets</p>
              <p className="text-sm text-text-secondary">Review allocations</p>
            </div>
          </Link>
          <Link
            to="/resources"
            className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-bg-hover transition-colors"
          >
            <Users className="w-8 h-8 text-accent-purple" />
            <div>
              <p className="font-medium text-text-primary">Manage Resources</p>
              <p className="text-sm text-text-secondary">Optimize assignments</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
