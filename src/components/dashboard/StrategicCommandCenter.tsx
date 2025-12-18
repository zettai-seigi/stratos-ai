import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAI } from '../../context/AIContext';
import { PillarCard } from '../strategy/PillarCard';
import { InitiativeHeatmap } from '../strategy/InitiativeHeatmap';
import { AlertTriangle, TrendingUp, Target, ArrowRight, Sparkles, Loader2, RefreshCw, Settings } from 'lucide-react';

export const StrategicCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { state, getKPIsByPillar } = useApp();
  const { pillars, initiatives } = state;
  const { isConfigured, isLoading, getExecutiveSummary, getPillarInsight, refreshAnalysis } = useAI();

  const atRiskInitiatives = initiatives.filter((i) => i.ragStatus === 'red' || i.ragStatus === 'amber');
  const greenPillarsCount = pillars.filter((p) => p.ragStatus === 'green').length;

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
      <div
        onClick={() => navigate('/insights')}
        className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent-purple/20 rounded-lg">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-accent-purple animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-accent-purple" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-accent-purple">AI Executive Summary</h3>
              {!isConfigured && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/settings');
                  }}
                  className="text-xs text-accent-purple/70 hover:text-accent-purple flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Configure API
                </button>
              )}
              {isConfigured && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshAnalysis(true);
                  }}
                  className="text-xs text-accent-purple/70 hover:text-accent-purple flex items-center gap-1"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              )}
            </div>
            <p className="text-text-primary">
              {isLoading ? 'Analyzing organizational data...' : getExecutiveSummary()}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-accent-purple opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
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
                aiInsight={getPillarInsight(pillar.id)}
              />
            ))}
        </div>
      </div>

      {/* Initiative Heatmap */}
      <InitiativeHeatmap initiatives={initiatives} pillars={pillars} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/portfolio')}
          className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-blue/20 rounded-lg">
                <Target className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{initiatives.length}</p>
                <p className="text-sm text-text-secondary">Active Initiatives</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div
          onClick={() => navigate('/portfolio?filter=at-risk')}
          className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rag-amber/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rag-amber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{atRiskInitiatives.length}</p>
                <p className="text-sm text-text-secondary">At Risk Initiatives</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div
          onClick={() => navigate('/strategy')}
          className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rag-green/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-rag-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {greenPillarsCount}/{pillars.length}
                </p>
                <p className="text-sm text-text-secondary">Pillars On Track</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};
