import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Initiative, Project } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { AlertTriangle, DollarSign, FolderKanban, AlertCircle, ArrowRight } from 'lucide-react';

interface HealthRibbonProps {
  initiatives: Initiative[];
  projects: Project[];
}

export const HealthRibbon: React.FC<HealthRibbonProps> = ({ initiatives, projects }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const totalInitiatives = initiatives.length;
  const atRiskProjects = projects.filter((p) => p.ragStatus === 'red').length;

  const totalBudget = initiatives.reduce((sum, i) => sum + i.budget, 0);
  const totalSpent = initiatives.reduce((sum, i) => sum + i.spentBudget, 0);
  const budgetBurnRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Find resource bottlenecks (simulated AI alert)
  const aiResourceAlert =
    "Critical bottleneck identified: 'Cloud Architects' are allocated at 140% capacity across 5 priority projects for the next 6 weeks.";

  // Get current pillar filter to preserve it when navigating
  const pillarFilter = searchParams.get('pillar');
  const baseUrl = pillarFilter ? `/portfolio?pillar=${pillarFilter}` : '/portfolio';

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5 mb-6">
      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div
          onClick={() => navigate(baseUrl)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <FolderKanban className="w-5 h-5 text-accent-blue" />
          <span className="text-text-secondary">Total Active Initiatives:</span>
          <span className="text-xl font-bold text-accent-blue">{totalInitiatives}</span>
          <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div
          onClick={() => navigate(`${baseUrl}${pillarFilter ? '&' : '?'}filter=projects-at-risk`)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <AlertCircle className="w-5 h-5 text-rag-red" />
          <span className="text-text-secondary">Projects at Risk (Red):</span>
          <span className="text-xl font-bold text-rag-red">{atRiskProjects}</span>
          <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div
          onClick={() => navigate(`${baseUrl}${pillarFilter ? '&' : '?'}view=budget`)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <DollarSign className="w-5 h-5 text-rag-amber" />
          <span className="text-text-secondary">Budget Burn Rate:</span>
          <span
            className={`text-xl font-bold ${
              budgetBurnRate > 100 ? 'text-rag-red' : budgetBurnRate > 90 ? 'text-rag-amber' : 'text-rag-green'
            }`}
          >
            {budgetBurnRate}%
          </span>
          <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* AI Resource Alert */}
      <div
        onClick={() => navigate('/resources')}
        className="flex items-start gap-3 p-3 bg-rag-amber/10 rounded-lg border border-rag-amber/30 cursor-pointer hover:bg-rag-amber/20 transition-colors group"
      >
        <AlertTriangle className="w-5 h-5 text-rag-amber flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-rag-amber">AI Resource Alert: </span>
          <span className="text-sm text-text-primary">{aiResourceAlert}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-rag-amber opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      </div>
    </div>
  );
};
