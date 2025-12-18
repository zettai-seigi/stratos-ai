import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Initiative, StrategyPillar, RAGStatus } from '../../types';
import { Modal } from '../shared';
import { InitiativeForm } from '../forms/InitiativeForm';

interface InitiativeHeatmapProps {
  initiatives: Initiative[];
  pillars: StrategyPillar[];
}

interface HeatmapDataPoint {
  id: string;
  name: string;
  strategicImportance: number;
  executionHealth: number;
  budget: number;
  ragStatus: RAGStatus;
  pillarId: string;
  pillarName: string;
}

const ragColors: Record<RAGStatus, string> = {
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#22c55e',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HeatmapDataPoint;
    return (
      <div className="bg-bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-text-primary mb-1">{data.name}</p>
        <p className="text-sm text-text-secondary">Pillar: {data.pillarName}</p>
        <p className="text-sm text-text-secondary">
          Budget: ${(data.budget / 1000000).toFixed(1)}M
        </p>
        <p className="text-sm text-text-secondary capitalize">
          Status: {data.ragStatus}
        </p>
        <p className="text-xs text-accent-blue mt-2">Click to view/edit</p>
      </div>
    );
  }
  return null;
};

export const InitiativeHeatmap: React.FC<InitiativeHeatmapProps> = ({
  initiatives,
  pillars,
}) => {
  const navigate = useNavigate();
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transform initiatives to heatmap data
  const data: HeatmapDataPoint[] = initiatives.map((init) => {
    const pillar = pillars.find((p) => p.id === init.pillarId);

    // Calculate strategic importance (1-10 based on pillar priority and budget)
    const pillarPriority = pillar?.displayOrder || 1;
    const budgetFactor = Math.min(init.budget / 1000000, 5); // Cap at 5M for scoring
    const strategicImportance = Math.min(10, (5 - pillarPriority) * 2 + budgetFactor);

    // Calculate execution health (1-10 based on RAG and budget variance)
    const budgetVariance = (init.spentBudget / init.budget) * 100;
    let executionHealth = 8;
    if (init.ragStatus === 'red') executionHealth = 3;
    else if (init.ragStatus === 'amber') executionHealth = 6;
    if (budgetVariance > 100) executionHealth -= 2;

    return {
      id: init.id,
      name: init.name,
      strategicImportance: Math.max(1, Math.min(10, strategicImportance + Math.random() * 2)),
      executionHealth: Math.max(1, Math.min(10, executionHealth + Math.random() * 2)),
      budget: init.budget,
      ragStatus: init.ragStatus,
      pillarId: init.pillarId,
      pillarName: pillar?.name || 'Unknown',
    };
  });

  const handleDotClick = (dataPoint: HeatmapDataPoint) => {
    const initiative = initiatives.find((i) => i.id === dataPoint.id);
    if (initiative) {
      setSelectedInitiative(initiative);
      setIsModalOpen(true);
    }
  };

  const handleNavigateToPortfolio = () => {
    if (selectedInitiative) {
      navigate(`/portfolio?pillar=${selectedInitiative.pillarId}`);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Strategic Initiative Heatmap
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          >
            <XAxis
              type="number"
              dataKey="executionHealth"
              name="Execution Health"
              domain={[0, 10]}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#2d3748' }}
              axisLine={{ stroke: '#2d3748' }}
              label={{
                value: 'Execution Health',
                position: 'bottom',
                offset: 20,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="strategicImportance"
              name="Strategic Importance"
              domain={[0, 10]}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#2d3748' }}
              axisLine={{ stroke: '#2d3748' }}
              label={{
                value: 'Strategic Importance',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <ZAxis
              type="number"
              dataKey="budget"
              range={[100, 800]}
              name="Budget"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={data}
              onClick={(_, index) => {
                if (index !== undefined && data[index]) {
                  handleDotClick(data[index]);
                }
              }}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ragColors[entry.ragStatus]}
                  fillOpacity={0.7}
                  stroke={ragColors[entry.ragStatus]}
                  strokeWidth={2}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rag-green" />
          <span className="text-sm text-text-secondary">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rag-amber" />
          <span className="text-sm text-text-secondary">At Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rag-red" />
          <span className="text-sm text-text-secondary">Critical</span>
        </div>
      </div>

      {/* Initiative Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedInitiative ? `Edit Initiative: ${selectedInitiative.name}` : 'Initiative'}
        size="lg"
      >
        {selectedInitiative && (
          <InitiativeForm
            initiative={selectedInitiative}
            onClose={() => setIsModalOpen(false)}
            onNavigate={handleNavigateToPortfolio}
          />
        )}
      </Modal>
    </div>
  );
};
