import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Initiative, StrategyPillar } from '../../types';
import { RAGBadge, Modal } from '../shared';
import { Diamond } from 'lucide-react';
import { InitiativeForm } from '../forms/InitiativeForm';

interface InitiativeRoadmapProps {
  initiatives: Initiative[];
  pillars: StrategyPillar[];
}

export const InitiativeRoadmap: React.FC<InitiativeRoadmapProps> = ({
  initiatives,
  pillars,
}) => {
  const navigate = useNavigate();
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInitiativeClick = (initiative: Initiative) => {
    setSelectedInitiative(initiative);
    setIsModalOpen(true);
  };

  const handleNavigateToPortfolio = () => {
    if (selectedInitiative) {
      navigate(`/portfolio?pillar=${selectedInitiative.pillarId}`);
      setIsModalOpen(false);
    }
  };
  // Calculate timeline range
  const allDates = initiatives.flatMap((i) => [new Date(i.startDate), new Date(i.endDate)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Generate months for header - limit to reasonable range (18 months max centered on today)
  const months: { label: string; date: Date; year: number }[] = [];
  const today = new Date();

  // Use a fixed 18-month window: 6 months back, 12 months forward from today
  const timelineStart = new Date(today);
  timelineStart.setMonth(timelineStart.getMonth() - 6);
  timelineStart.setDate(1);

  const timelineEnd = new Date(today);
  timelineEnd.setMonth(timelineEnd.getMonth() + 12);
  timelineEnd.setDate(1);

  const current = new Date(timelineStart);
  while (current <= timelineEnd) {
    const isJanuary = current.getMonth() === 0;
    months.push({
      label: current.toLocaleDateString('en-US', { month: 'short' }),
      date: new Date(current),
      year: current.getFullYear(),
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Recalculate timeline bounds based on fixed window
  const fixedMinDate = timelineStart;
  const fixedMaxDate = timelineEnd;

  const totalDays = fixedMaxDate.getTime() - fixedMinDate.getTime();

  const getPosition = (date: Date) => {
    const elapsed = new Date(date).getTime() - fixedMinDate.getTime();
    const position = (elapsed / totalDays) * 100;
    // Clamp to 0-100 range for initiatives outside the visible window
    return Math.max(0, Math.min(100, position));
  };

  const getWidth = (start: Date, end: Date) => {
    const startPos = getPosition(start);
    const endPos = getPosition(end);
    return endPos - startPos;
  };

  // Calculate progress percentage based on current date
  const getProgress = (initiative: Initiative) => {
    const now = new Date();
    const start = new Date(initiative.startDate);
    const end = new Date(initiative.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  // Group initiatives by pillar
  const groupedByPillar = pillars.map((pillar) => ({
    pillar,
    initiatives: initiatives.filter((i) => i.pillarId === pillar.id),
  }));

  const ragBgColors = {
    red: 'bg-rag-red',
    amber: 'bg-rag-amber',
    green: 'bg-rag-green',
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Initiative Roadmap</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-accent-blue rounded" />
            <span className="text-text-secondary">Planned vs. actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-rag-red/50 rounded border border-dashed border-rag-red" />
            <span className="text-text-secondary">AI-predicted slippage</span>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex border-b border-border mb-4">
        <div className="w-48 flex-shrink-0 py-2 px-3 text-sm font-medium text-text-secondary">
          Strategy pillar
        </div>
        <div className="flex-1 flex">
          {months.map((month, idx) => {
            const showYear = idx === 0 || month.date.getMonth() === 0;
            return (
              <div
                key={idx}
                className="flex-1 min-w-[50px] py-2 text-center text-xs text-text-secondary border-l border-border"
              >
                <div>{month.label}</div>
                {showYear && (
                  <div className="text-[10px] text-text-muted">{month.year}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Rows with Today marker */}
      <div className="space-y-1 relative">
        {/* Today marker line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent-blue z-10 pointer-events-none"
          style={{ left: `calc(192px + ${getPosition(today)}% * (100% - 192px) / 100)` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-accent-blue text-white text-[10px] font-medium rounded whitespace-nowrap">
            Today
          </div>
        </div>
        {groupedByPillar.map(({ pillar, initiatives: pillarInitiatives }) => (
          <React.Fragment key={pillar.id}>
            {/* Pillar Header Row */}
            <div className="flex items-center py-2 bg-bg-hover rounded">
              <div className="w-48 flex-shrink-0 px-3">
                <div className="flex items-center gap-2">
                  <RAGBadge status={pillar.ragStatus} size="sm" />
                  <span className="text-sm font-medium text-text-primary">{pillar.name}</span>
                </div>
              </div>
              <div className="flex-1" />
            </div>

            {/* Initiative Rows */}
            {pillarInitiatives.map((initiative) => {
              const startPos = getPosition(new Date(initiative.startDate));
              const width = getWidth(new Date(initiative.startDate), new Date(initiative.endDate));
              const progress = getProgress(initiative);

              return (
                <div
                  key={initiative.id}
                  onClick={() => handleInitiativeClick(initiative)}
                  className="flex items-center py-2 hover:bg-bg-hover/50 cursor-pointer group"
                >
                  <div className="w-48 flex-shrink-0 px-3 pl-8">
                    <span className="text-sm text-text-secondary truncate block group-hover:text-accent-blue transition-colors">
                      {initiative.name}
                    </span>
                  </div>
                  <div className="flex-1 relative h-6">
                    {/* Progress bar */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 bg-accent-blue/30 rounded-full group-hover:bg-accent-blue/40 transition-colors"
                      style={{ left: `${startPos}%`, width: `${width}%` }}
                    >
                      {/* Actual progress */}
                      <div
                        className={`h-full ${ragBgColors[initiative.ragStatus]} rounded-full`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Predicted slippage (show for amber/red) */}
                    {(initiative.ragStatus === 'amber' || initiative.ragStatus === 'red') && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-4 bg-rag-red/20 rounded-r-full border border-dashed border-rag-red"
                        style={{
                          left: `${startPos + width}%`,
                          width: `${Math.min(width * 0.2, 10)}%`,
                        }}
                      />
                    )}

                    {/* Milestone diamond at end */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: `${startPos + width}%` }}
                    >
                      <Diamond
                        className={`w-4 h-4 -ml-2 ${
                          initiative.ragStatus === 'red'
                            ? 'text-rag-red fill-rag-red'
                            : 'text-rag-amber fill-rag-amber'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
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
