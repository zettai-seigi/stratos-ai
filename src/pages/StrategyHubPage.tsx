import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RAGBadge, InfoTooltip } from '../components/shared';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Plus,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Users,
  Settings,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { StrategyPillar, StrategicKPI } from '../types';

const pillarIcons: Record<string, React.ReactNode> = {
  'pillar-1': <DollarSign className="w-5 h-5" />,
  'pillar-2': <Users className="w-5 h-5" />,
  'pillar-3': <Settings className="w-5 h-5" />,
  'pillar-4': <GraduationCap className="w-5 h-5" />,
};

const pillarColors: Record<string, string> = {
  'pillar-1': 'bg-emerald-500',
  'pillar-2': 'bg-blue-500',
  'pillar-3': 'bg-orange-500',
  'pillar-4': 'bg-purple-500',
};

interface EditKPIModalProps {
  kpi: StrategicKPI;
  onSave: (kpi: StrategicKPI) => void;
  onClose: () => void;
}

const EditKPIModal: React.FC<EditKPIModalProps> = ({ kpi, onSave, onClose }) => {
  const [formData, setFormData] = useState(kpi);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-card border border-border rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Edit KPI</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">KPI Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Current Value</label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Target Value</label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as '%' | '$' | 'score' | 'number' })}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary"
            >
              <option value="%">Percentage (%)</option>
              <option value="$">Currency ($)</option>
              <option value="score">Score</option>
              <option value="number">Number</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PillarSectionProps {
  pillar: StrategyPillar;
  kpis: StrategicKPI[];
  initiativeCount: number;
  onEditKPI: (kpi: StrategicKPI) => void;
  onViewInitiatives?: () => void;
}

const PillarSection: React.FC<PillarSectionProps> = ({ pillar, kpis, initiativeCount, onEditKPI, onViewInitiatives }) => {
  const [expanded, setExpanded] = useState(true);

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const formatValue = (kpi: StrategicKPI) => {
    switch (kpi.unit) {
      case '%': return `${kpi.currentValue}%`;
      case '$': return `$${kpi.currentValue.toLocaleString()}`;
      default: return kpi.currentValue.toString();
    }
  };

  const getProgress = (kpi: StrategicKPI) => {
    return Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100));
  };

  return (
    <div className="w-full bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Pillar Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${pillarColors[pillar.id]} text-white`}>
            {pillarIcons[pillar.id] || <Target className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{pillar.name}</h3>
            <p className="text-sm text-text-secondary">{pillar.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RAGBadge status={pillar.ragStatus} showLabel />
          <span
            onClick={(e) => {
              e.stopPropagation();
              onViewInitiatives?.();
            }}
            className="text-sm text-accent-blue hover:text-accent-blue/80 cursor-pointer hover:underline"
          >
            {initiativeCount} initiatives
          </span>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
        </div>
      </div>

      {/* KPIs */}
      {expanded && (
        <div className="border-t border-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                Key Performance Indicators
              </h4>
              <button className="flex items-center gap-1 text-sm text-accent-blue hover:text-accent-blue/80">
                <Plus className="w-4 h-4" />
                Add KPI
              </button>
            </div>
            <div className="space-y-3">
              {kpis.map((kpi) => {
                const trend = getTrend(kpi.currentValue, kpi.previousValue);
                const progress = getProgress(kpi);

                return (
                  <div
                    key={kpi.id}
                    className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">{kpi.name}</span>
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-rag-green" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-rag-red" />}
                        {trend === 'neutral' && <Minus className="w-4 h-4 text-text-muted" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progress >= 100 ? 'bg-rag-green' :
                              progress >= 70 ? 'bg-rag-amber' : 'bg-rag-red'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-10">{progress}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-text-primary">{formatValue(kpi)}</p>
                      <p className="text-xs text-text-muted">
                        Target: {kpi.unit === '%' ? `${kpi.targetValue}%` : kpi.unit === '$' ? `$${kpi.targetValue.toLocaleString()}` : kpi.targetValue}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditKPI(kpi);
                      }}
                      className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {kpis.length === 0 && (
                <p className="text-center text-text-muted py-4">No KPIs defined for this pillar</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StrategyHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, getKPIsByPillar, getInitiativesByPillar, dispatch } = useApp();
  const { pillars } = state;
  const [editingKPI, setEditingKPI] = useState<StrategicKPI | null>(null);
  const pillarRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSaveKPI = (kpi: StrategicKPI) => {
    dispatch({ type: 'UPDATE_KPI', payload: kpi });
    setEditingKPI(null);
  };

  // Calculate overall BSC health
  const bscHealth = {
    green: pillars.filter(p => p.ragStatus === 'green').length,
    amber: pillars.filter(p => p.ragStatus === 'amber').length,
    red: pillars.filter(p => p.ragStatus === 'red').length,
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Strategy Hub</h1>
          <p className="text-text-secondary mt-1">Manage your Balanced Scorecard and Strategic KPIs</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Target className="w-5 h-5 text-accent-blue" />
          <span className="text-sm text-text-secondary">BSC Framework</span>
        </div>
      </div>

      {/* BSC Health Summary */}
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/portfolio')}
          className="bg-bg-card rounded-xl border border-border p-5 cursor-pointer hover:bg-bg-hover transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Pillars</p>
              <p className="text-3xl font-bold text-text-primary">{pillars.length}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div
          onClick={() => {
            const greenPillar = pillars.find(p => p.ragStatus === 'green');
            if (greenPillar && pillarRefs.current[greenPillar.id]) {
              pillarRefs.current[greenPillar.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className={`bg-bg-card rounded-xl border border-border p-5 ${bscHealth.green > 0 ? 'cursor-pointer hover:bg-bg-hover' : ''} transition-colors group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rag-green"></div>
                <p className="text-sm text-text-secondary">On Track</p>
              </div>
              <p className="text-3xl font-bold text-rag-green mt-1">{bscHealth.green}</p>
            </div>
            {bscHealth.green > 0 && (
              <ArrowRight className="w-5 h-5 text-rag-green opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        <div
          onClick={() => {
            const amberPillar = pillars.find(p => p.ragStatus === 'amber');
            if (amberPillar && pillarRefs.current[amberPillar.id]) {
              pillarRefs.current[amberPillar.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className={`bg-bg-card rounded-xl border border-border p-5 ${bscHealth.amber > 0 ? 'cursor-pointer hover:bg-bg-hover' : ''} transition-colors group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rag-amber"></div>
                <p className="text-sm text-text-secondary">At Risk</p>
              </div>
              <p className="text-3xl font-bold text-rag-amber mt-1">{bscHealth.amber}</p>
            </div>
            {bscHealth.amber > 0 && (
              <ArrowRight className="w-5 h-5 text-rag-amber opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        <div
          onClick={() => {
            const redPillar = pillars.find(p => p.ragStatus === 'red');
            if (redPillar && pillarRefs.current[redPillar.id]) {
              pillarRefs.current[redPillar.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          className={`bg-bg-card rounded-xl border border-border p-5 ${bscHealth.red > 0 ? 'cursor-pointer hover:bg-bg-hover' : ''} transition-colors group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rag-red"></div>
                <p className="text-sm text-text-secondary">Critical</p>
              </div>
              <p className="text-3xl font-bold text-rag-red mt-1">{bscHealth.red}</p>
            </div>
            {bscHealth.red > 0 && (
              <ArrowRight className="w-5 h-5 text-rag-red opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>

      {/* Strategy Pillars */}
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Strategy Pillars</h2>
          <InfoTooltip
            content="Each pillar contains Key Performance Indicators (KPIs) that measure progress toward strategic goals. Click on a pillar to expand and view/edit its KPIs. KPIs are color-coded: Green (meeting target), Amber (within 10%), Red (below 10%)."
            position="right"
            size="lg"
          />
        </div>
        {pillars
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((pillar) => (
            <div key={pillar.id} ref={(el) => { pillarRefs.current[pillar.id] = el; }}>
              <PillarSection
                pillar={pillar}
                kpis={getKPIsByPillar(pillar.id)}
                initiativeCount={getInitiativesByPillar(pillar.id).length}
                onEditKPI={setEditingKPI}
                onViewInitiatives={() => navigate(`/portfolio?pillar=${pillar.id}`)}
              />
            </div>
          ))}
      </div>

      {/* Edit KPI Modal */}
      {editingKPI && (
        <EditKPIModal
          kpi={editingKPI}
          onSave={handleSaveKPI}
          onClose={() => setEditingKPI(null)}
        />
      )}
    </div>
  );
};
