import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StrategyPillar, StrategicKPI } from '../../types';
import { RAGBadge, Modal } from '../shared';
import { TrendingUp, TrendingDown, Minus, Edit2 } from 'lucide-react';
import { KPIForm } from '../forms/KPIForm';

interface PillarCardProps {
  pillar: StrategyPillar;
  kpis: StrategicKPI[];
  aiInsight?: string;
}

export const PillarCard: React.FC<PillarCardProps> = ({ pillar, kpis, aiInsight }) => {
  const navigate = useNavigate();
  const [selectedKPI, setSelectedKPI] = useState<StrategicKPI | null>(null);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);

  const primaryKPI = kpis[0];
  const secondaryKPI = kpis[1];

  const handleKPIClick = (kpi: StrategicKPI, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKPI(kpi);
    setIsKPIModalOpen(true);
  };

  const borderColorMap = {
    red: 'border-l-rag-red',
    amber: 'border-l-rag-amber',
    green: 'border-l-rag-green',
  };

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const formatValue = (kpi: StrategicKPI) => {
    switch (kpi.unit) {
      case '%':
        return `${kpi.currentValue}%`;
      case '$':
        return `$${kpi.currentValue.toLocaleString()}`;
      case 'score':
        return kpi.currentValue.toString();
      default:
        return kpi.currentValue.toString();
    }
  };

  const TrendIcon = ({ current, previous }: { current: number; previous: number }) => {
    const trend = getTrend(current, previous);
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-rag-green" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-rag-red" />;
    return <Minus className="w-4 h-4 text-text-muted" />;
  };

  return (
    <div
      onClick={() => navigate(`/portfolio?pillar=${pillar.id}`)}
      className={`
        bg-bg-card rounded-xl border border-border border-l-4 ${borderColorMap[pillar.ragStatus]}
        p-5 cursor-pointer hover:bg-bg-hover transition-colors
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{pillar.name}</h3>
        <RAGBadge status={pillar.ragStatus} showLabel size="sm" />
      </div>

      {/* Primary KPI */}
      {primaryKPI && (
        <div
          onClick={(e) => handleKPIClick(primaryKPI, e)}
          className="mb-3 p-2 -mx-2 rounded-lg hover:bg-bg-hover/50 cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">{primaryKPI.name}:</span>
            <span className="text-xl font-bold text-text-primary">
              {formatValue(primaryKPI)}
            </span>
            <TrendIcon current={primaryKPI.currentValue} previous={primaryKPI.previousValue} />
            <Edit2 className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </div>
          <span className="text-xs text-text-muted">
            Target: {primaryKPI.unit === '%' ? `${primaryKPI.targetValue}%` : primaryKPI.targetValue}
          </span>
        </div>
      )}

      {/* Secondary KPI */}
      {secondaryKPI && (
        <div
          onClick={(e) => handleKPIClick(secondaryKPI, e)}
          className="mb-4 text-sm p-2 -mx-2 rounded-lg hover:bg-bg-hover/50 cursor-pointer transition-colors group flex items-center"
        >
          <div className="flex-1">
            <span className="text-text-secondary">{secondaryKPI.name}: </span>
            <span className="text-text-primary font-medium">{formatValue(secondaryKPI)}</span>
            <span className="text-text-muted"> (Target: {secondaryKPI.targetValue})</span>
          </div>
          <Edit2 className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* AI Insight */}
      {aiInsight && (
        <div className="pt-3 border-t border-border">
          <p className="text-sm text-accent-cyan">
            <span className="font-medium">AI Insight:</span> {aiInsight}
          </p>
        </div>
      )}

      {/* KPI Edit Modal */}
      <Modal
        isOpen={isKPIModalOpen}
        onClose={() => setIsKPIModalOpen(false)}
        title={selectedKPI ? `Edit KPI: ${selectedKPI.name}` : 'KPI'}
        size="md"
      >
        {selectedKPI && (
          <KPIForm
            kpi={selectedKPI}
            onClose={() => setIsKPIModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};
