import React from 'react';
import { useApp } from '../../context/AppContext';
import { PillarCard } from '../strategy/PillarCard';
import { InitiativeHeatmap } from '../strategy/InitiativeHeatmap';
import { calculateStrategicHealth } from '../../utils/calculations';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';

// AI-generated insights based on data (simulated)
const generateAIInsights = (pillarId: string): string => {
  const insights: Record<string, string> = {
    'pillar-1': 'Trend indicates hitting 18% by year-end.',
    'pillar-2': 'Correlation detected between recent support ticket volume spikes and NPS drop.',
    'pillar-3': 'Supply chain automation project ahead of schedule.',
    'pillar-4': 'High risk of attrition in Data Science teams due to project overload (See: Project Beta).',
  };
  return insights[pillarId] || 'No insights available.';
};

export const StrategicCommandCenter: React.FC = () => {
  const { state, getKPIsByPillar, getInitiativesByPillar } = useApp();
  const { pillars, initiatives } = state;

  const overallHealth = calculateStrategicHealth(state);
  const atRiskInitiatives = initiatives.filter((i) => i.ragStatus === 'red' || i.ragStatus === 'amber');

  // Generate executive summary
  const generateExecutiveSummary = () => {
    const greenPillars = pillars.filter((p) => p.ragStatus === 'green').length;
    const redPillars = pillars.filter((p) => p.ragStatus === 'red');
    const amberPillars = pillars.filter((p) => p.ragStatus === 'amber');

    let summary = `Overall strategy health is marked ${overallHealth.toUpperCase()}. `;

    if (greenPillars > 0) {
      const greenPillar = pillars.find((p) => p.ragStatus === 'green');
      const greenKPIs = greenPillar ? getKPIsByPillar(greenPillar.id) : [];
      if (greenKPIs.length > 0) {
        const kpi = greenKPIs[0];
        const percentage = Math.round((kpi.currentValue / kpi.targetValue) * 100);
        summary += `${greenPillar?.name} goals are exceeding targets (${percentage}%). `;
      }
    }

    if (amberPillars.length > 0 || redPillars.length > 0) {
      const problematic = [...redPillars, ...amberPillars][0];
      const problematicInitiatives = getInitiativesByPillar(problematic.id);
      if (problematicInitiatives.length > 0) {
        const atRisk = problematicInitiatives.find((i) => i.ragStatus !== 'green');
        if (atRisk) {
          summary += `The '${atRisk.name}' initiative is flagged high-risk. `;
        }
      }
    }

    return summary;
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Strategic Command Center</h1>
          <p className="text-text-secondary mt-1">Board of Directors View</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Target className="w-5 h-5 text-accent-blue" />
          <span className="text-sm text-text-secondary">Board of Directors</span>
        </div>
      </div>

      {/* AI Executive Summary */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent-purple/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-accent-purple mb-1">AI Executive Summary</h3>
            <p className="text-text-primary">{generateExecutiveSummary()}</p>
          </div>
        </div>
      </div>

      {/* Balanced Scorecard Pillars */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Balanced Scorecard Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((pillar) => (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                kpis={getKPIsByPillar(pillar.id)}
                aiInsight={generateAIInsights(pillar.id)}
              />
            ))}
        </div>
      </div>

      {/* Initiative Heatmap */}
      <InitiativeHeatmap initiatives={initiatives} pillars={pillars} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/20 rounded-lg">
              <Target className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{initiatives.length}</p>
              <p className="text-sm text-text-secondary">Active Initiatives</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rag-amber/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rag-amber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{atRiskInitiatives.length}</p>
              <p className="text-sm text-text-secondary">At Risk Initiatives</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rag-green/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-rag-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {pillars.filter((p) => p.ragStatus === 'green').length}/{pillars.length}
              </p>
              <p className="text-sm text-text-secondary">Pillars On Track</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
