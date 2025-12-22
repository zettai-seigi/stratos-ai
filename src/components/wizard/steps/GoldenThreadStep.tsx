import React from 'react';
import { Target, TrendingUp, Users, Cog, Check, AlertCircle, Plus } from 'lucide-react';
import { StrategyPillar, CorporateEntity, OrgUnit } from '../../../types';

interface GoldenThreadStepProps {
  pillars: StrategyPillar[];
  corporateEntities: CorporateEntity[];
  orgUnits: OrgUnit[];
  onAdd: (pillar: StrategyPillar) => void;
  onUpdate: (id: string, updates: Partial<StrategyPillar>) => void;
  onDelete: (id: string) => void;
}

// Default BSC pillar templates
const DEFAULT_PILLAR_TEMPLATES = [
  {
    name: 'Financial',
    description: 'Financial performance and growth objectives',
    icon: TrendingUp,
    color: '#22c55e',
  },
  {
    name: 'Customer',
    description: 'Customer satisfaction and market position',
    icon: Users,
    color: '#3b82f6',
  },
  {
    name: 'Internal Processes',
    description: 'Operational excellence and efficiency',
    icon: Cog,
    color: '#f59e0b',
  },
  {
    name: 'Learning & Growth',
    description: 'People development and organizational capability',
    icon: Target,
    color: '#8b5cf6',
  },
];

export const GoldenThreadStep: React.FC<GoldenThreadStepProps> = ({
  pillars,
  corporateEntities,
  orgUnits,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const companies = corporateEntities.filter((e) => e.entityType === 'company');

  // Check which default pillars exist by name
  const existingNames = new Set(pillars.map((p) => p.name.toLowerCase()));

  const handleCreateDefaultPillars = () => {
    DEFAULT_PILLAR_TEMPLATES.forEach((template, index) => {
      if (!existingNames.has(template.name.toLowerCase())) {
        onAdd({
          id: `pillar-${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: template.name,
          description: template.description,
          displayOrder: pillars.length + index,
          ragStatus: 'green',
        });
      }
    });
  };

  // Summary stats
  const totalEntitiesWithBSC = corporateEntities.filter((e) => e.hasBSC).length;
  const totalOrgUnitsWithBSC = orgUnits.filter((u) => u.hasBSC).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--cds-text-primary)] mb-2">
          Golden Thread Setup
        </h2>
        <p className="text-sm text-[var(--cds-text-secondary)]">
          The "Golden Thread" connects your strategy to execution. Configure your Balanced Scorecard
          (BSC) pillars that will cascade through your organization.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--cds-layer-02)] rounded-lg border border-[var(--cds-border-subtle-00)]">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-[var(--cds-support-info)]" />
            <span className="text-sm font-medium text-[var(--cds-text-primary)]">
              BSC Pillars
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--cds-text-primary)]">{pillars.length}</p>
          <p className="text-xs text-[var(--cds-text-secondary)]">Strategy perspectives defined</p>
        </div>

        <div className="p-4 bg-[var(--cds-layer-02)] rounded-lg border border-[var(--cds-border-subtle-00)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[var(--cds-support-success)]" />
            <span className="text-sm font-medium text-[var(--cds-text-primary)]">
              Corporate BSC
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--cds-text-primary)]">
            {totalEntitiesWithBSC}
          </p>
          <p className="text-xs text-[var(--cds-text-secondary)]">Entities with BSC enabled</p>
        </div>

        <div className="p-4 bg-[var(--cds-layer-02)] rounded-lg border border-[var(--cds-border-subtle-00)]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--cds-support-warning)]" />
            <span className="text-sm font-medium text-[var(--cds-text-primary)]">
              Organization BSC
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--cds-text-primary)]">
            {totalOrgUnitsWithBSC}
          </p>
          <p className="text-xs text-[var(--cds-text-secondary)]">Org units with BSC enabled</p>
        </div>
      </div>

      {/* BSC Pillars section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--cds-text-primary)]">
            Balanced Scorecard Pillars
          </h3>
          {pillars.length < 4 && (
            <button
              onClick={handleCreateDefaultPillars}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--cds-interactive)] text-white rounded hover:bg-[var(--cds-interactive)]/90"
            >
              <Target className="w-4 h-4" />
              <span>Create Default Pillars</span>
            </button>
          )}
        </div>

        {pillars.length === 0 ? (
          <div className="p-6 text-center bg-[var(--cds-notification-info-background)] rounded-lg border border-[var(--cds-support-info)]">
            <Target className="w-12 h-12 mx-auto mb-3 text-[var(--cds-support-info)] opacity-50" />
            <p className="text-sm text-[var(--cds-text-primary)] mb-4">
              No BSC pillars defined yet. Create the standard Balanced Scorecard pillars or
              customize your own.
            </p>
            <button
              onClick={handleCreateDefaultPillars}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cds-interactive)] text-white rounded hover:bg-[var(--cds-interactive)]/90"
            >
              <Target className="w-4 h-4" />
              <span>Create Default Pillars</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_PILLAR_TEMPLATES.map((template) => {
              const existingPillar = pillars.find(
                (p) => p.name.toLowerCase() === template.name.toLowerCase()
              );
              const Icon = template.icon;

              return (
                <div
                  key={template.name}
                  className={`p-4 rounded-lg border ${
                    existingPillar
                      ? 'bg-[var(--cds-layer-02)] border-[var(--cds-border-subtle-00)]'
                      : 'bg-[var(--cds-layer-01)] border-dashed border-[var(--cds-border-subtle-01)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[var(--cds-text-primary)]">
                          {existingPillar?.name || template.name}
                        </h4>
                        {existingPillar && (
                          <Check className="w-4 h-4 text-[var(--cds-support-success)]" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--cds-text-secondary)] mt-1">
                        {existingPillar?.description || template.description}
                      </p>
                      {!existingPillar && (
                        <span className="text-xs text-[var(--cds-text-placeholder)] italic">
                          Not yet created
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ready to complete section */}
      <div className="p-4 bg-[var(--cds-notification-success-background)] rounded-lg border border-[var(--cds-support-success)]">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-[var(--cds-support-success)] mt-0.5" />
          <div>
            <h4 className="font-medium text-[var(--cds-text-primary)]">
              Ready to Complete Setup
            </h4>
            <p className="text-sm text-[var(--cds-text-secondary)] mt-1">
              You can always return to Settings to modify your corporate structure, organization
              units, and BSC pillars. Click "Complete Setup" to save your configuration and start
              using StratOS AI.
            </p>
          </div>
        </div>
      </div>

      {/* Validation warnings */}
      {(companies.length === 0 || pillars.length === 0) && (
        <div className="p-4 bg-[var(--cds-notification-warning-background)] rounded-lg border border-[var(--cds-support-warning)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--cds-support-warning)] mt-0.5" />
            <div>
              <h4 className="font-medium text-[var(--cds-text-primary)]">Setup Incomplete</h4>
              <ul className="text-sm text-[var(--cds-text-secondary)] mt-1 list-disc list-inside">
                {companies.length === 0 && (
                  <li>At least one Operating Company is required</li>
                )}
                {pillars.length === 0 && (
                  <li>At least one BSC pillar should be defined</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
