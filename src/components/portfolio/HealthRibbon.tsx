import React from 'react';
import { Initiative, Project } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { AlertTriangle, DollarSign, FolderKanban, AlertCircle } from 'lucide-react';

interface HealthRibbonProps {
  initiatives: Initiative[];
  projects: Project[];
}

export const HealthRibbon: React.FC<HealthRibbonProps> = ({ initiatives, projects }) => {
  const totalInitiatives = initiatives.length;
  const atRiskProjects = projects.filter((p) => p.ragStatus === 'red').length;

  const totalBudget = initiatives.reduce((sum, i) => sum + i.budget, 0);
  const totalSpent = initiatives.reduce((sum, i) => sum + i.spentBudget, 0);
  const budgetBurnRate = Math.round((totalSpent / totalBudget) * 100);

  // Find resource bottlenecks (simulated AI alert)
  const aiResourceAlert =
    "Critical bottleneck identified: 'Cloud Architects' are allocated at 140% capacity across 5 priority projects for the next 6 weeks.";

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5 mb-6">
      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-accent-blue" />
          <span className="text-text-secondary">Total Active Initiatives:</span>
          <span className="text-xl font-bold text-accent-blue">{totalInitiatives}</span>
        </div>

        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rag-red" />
          <span className="text-text-secondary">Projects at Risk (Red):</span>
          <span className="text-xl font-bold text-rag-red">{atRiskProjects}</span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-rag-amber" />
          <span className="text-text-secondary">Budget Burn Rate:</span>
          <span
            className={`text-xl font-bold ${
              budgetBurnRate > 100 ? 'text-rag-red' : budgetBurnRate > 90 ? 'text-rag-amber' : 'text-rag-green'
            }`}
          >
            {budgetBurnRate}%
          </span>
        </div>
      </div>

      {/* AI Resource Alert */}
      <div className="flex items-start gap-3 p-3 bg-rag-amber/10 rounded-lg border border-rag-amber/30">
        <AlertTriangle className="w-5 h-5 text-rag-amber flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-semibold text-rag-amber">AI Resource Alert: </span>
          <span className="text-sm text-text-primary">{aiResourceAlert}</span>
        </div>
      </div>
    </div>
  );
};
