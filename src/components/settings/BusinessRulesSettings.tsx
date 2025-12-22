/**
 * Business Rules Settings Component
 *
 * Provides UI for configuring all business rules including:
 * - Import enforcement settings
 * - Risk score configuration
 * - Insights thresholds
 * - Approval framework settings
 * - Feature toggles
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  CheckSquare,
  ToggleLeft,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Download,
  Upload,
  Info,
} from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { Button } from '../shared';
import { PRESET_INFO } from '../../utils/configDefaults';
import type { ConfigPreset, FeatureToggles } from '../../types';

// =============================================================================
// COLLAPSIBLE SECTION COMPONENT
// =============================================================================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-bg-hover hover:bg-bg-primary transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-text-primary">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        )}
      </button>
      {isOpen && <div className="p-4 border-t border-border space-y-4">{children}</div>}
    </div>
  );
};

// =============================================================================
// TOGGLE INPUT COMPONENT
// =============================================================================

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-bg-primary ${
        checked ? 'bg-accent-purple' : 'bg-gray-600'
      }`}
    >
      <span
        className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ top: '3px', left: checked ? '19px' : '3px' }}
      />
    </button>
    <div className="flex-1 min-w-0">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
    </div>
  </label>
);

// =============================================================================
// NUMBER INPUT COMPONENT
// =============================================================================

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-text-secondary">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-20 px-2 py-1 text-sm bg-bg-primary border border-border rounded text-text-primary text-right"
      />
      {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const BusinessRulesSettings: React.FC = () => {
  const {
    config,
    currentPreset,
    importEnforcement,
    riskScoreConfig,
    insightsConfig,
    approvalConfig,
    features,
    updateImportEnforcement,
    updateRiskScoreConfig,
    updateInsightsConfig,
    updateApprovalConfig,
    updateFeatures,
    applyPreset,
    resetToDefaults,
    exportConfig,
    importConfigJson,
  } = useConfig();

  const [importError, setImportError] = useState<string | null>(null);

  // Handle preset selection
  const handlePresetChange = (preset: ConfigPreset) => {
    if (preset !== 'custom') {
      applyPreset(preset);
    }
  };

  // Handle config export
  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratos-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle config import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importConfigJson(content);
      if (success) {
        setImportError(null);
      } else {
        setImportError('Invalid configuration file');
      }
    };
    reader.onerror = () => setImportError('Failed to read file');
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="w-full bg-bg-card rounded-xl border border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-accent-cyan" />
          <h2 className="text-lg font-semibold text-text-primary">Business Rules & Enforcement</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Preset:</span>
          <select
            value={currentPreset}
            onChange={(e) => handlePresetChange(e.target.value as ConfigPreset)}
            className="text-sm bg-bg-primary border border-border rounded px-2 py-1 text-text-primary"
          >
            {Object.entries(PRESET_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Description */}
      <div className="mb-6 p-3 bg-accent-cyan/10 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-accent-cyan mt-0.5" />
          <div className="text-xs text-text-secondary">
            <strong className="text-text-primary">{PRESET_INFO[currentPreset].label}:</strong>{' '}
            {PRESET_INFO[currentPreset].description}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Feature Toggles */}
        <CollapsibleSection
          title="Feature Toggles"
          icon={<ToggleLeft className="w-4 h-4 text-accent-purple" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle
              label="AI Insights"
              description="Enable Claude-powered AI analysis"
              checked={features.aiInsights}
              onChange={(v) => updateFeatures({ aiInsights: v })}
            />
            <Toggle
              label="Rule-Based Insights"
              description="Enable automated rule-based insights"
              checked={features.ruleBasedInsights}
              onChange={(v) => updateFeatures({ ruleBasedInsights: v })}
            />
            <Toggle
              label="Risk Scoring"
              description="Calculate risk scores for initiatives"
              checked={features.riskScoring}
              onChange={(v) => updateFeatures({ riskScoring: v })}
            />
            <Toggle
              label="Approval Framework"
              description="Enable stage-gate approval process"
              checked={features.approvalFramework}
              onChange={(v) => updateFeatures({ approvalFramework: v })}
            />
            <Toggle
              label="Charter Tracking"
              description="Track project charter completeness"
              checked={features.charterTracking}
              onChange={(v) => updateFeatures({ charterTracking: v })}
            />
            <Toggle
              label="Smart Import"
              description="Enable intelligent Excel import wizard"
              checked={features.smartImport}
              onChange={(v) => updateFeatures({ smartImport: v })}
            />
            <Toggle
              label="Fuzzy Matching"
              description="Allow approximate reference matching"
              checked={features.fuzzyMatching}
              onChange={(v) => updateFeatures({ fuzzyMatching: v })}
            />
            <Toggle
              label="Executive Summary"
              description="Show executive summary dashboards"
              checked={features.executiveSummary}
              onChange={(v) => updateFeatures({ executiveSummary: v })}
            />
          </div>
        </CollapsibleSection>

        {/* Import Enforcement */}
        <CollapsibleSection
          title="Import Enforcement"
          icon={<Shield className="w-4 h-4 text-accent-blue" />}
        >
          <div className="space-y-6">
            {/* Charter Requirements */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Charter Requirements</h4>
              <div className="space-y-3">
                <Toggle
                  label="Require Charter for Import"
                  description="Projects must have charter data to be imported"
                  checked={importEnforcement.charter.enforceOnImport}
                  onChange={(v) =>
                    updateImportEnforcement({
                      charter: { ...importEnforcement.charter, enforceOnImport: v },
                    })
                  }
                />
                <NumberInput
                  label="Minimum Charter Completeness"
                  value={importEnforcement.charter.minimumCompletenessScore}
                  onChange={(v) =>
                    updateImportEnforcement({
                      charter: { ...importEnforcement.charter, minimumCompletenessScore: v },
                    })
                  }
                  suffix="%"
                />
              </div>
            </div>

            {/* Field Validation */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Field Validation</h4>
              <Toggle
                label="Treat Warnings as Errors"
                description="Block import if any warnings are raised"
                checked={importEnforcement.fields.treatWarningsAsErrors}
                onChange={(v) =>
                  updateImportEnforcement({
                    fields: { ...importEnforcement.fields, treatWarningsAsErrors: v },
                  })
                }
              />
            </div>

            {/* Reference Matching */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Reference Matching</h4>
              <div className="space-y-3">
                <Toggle
                  label="Allow Fuzzy Matching"
                  description="Match similar names when exact match not found"
                  checked={importEnforcement.references.allowFuzzyMatching}
                  onChange={(v) =>
                    updateImportEnforcement({
                      references: { ...importEnforcement.references, allowFuzzyMatching: v },
                    })
                  }
                />
                <NumberInput
                  label="Fuzzy Match Threshold"
                  value={importEnforcement.references.fuzzyMatchThreshold}
                  onChange={(v) =>
                    updateImportEnforcement({
                      references: { ...importEnforcement.references, fuzzyMatchThreshold: v },
                    })
                  }
                  min={50}
                  max={100}
                  suffix="%"
                />
                <Toggle
                  label="Auto-Create Missing References"
                  description="Create placeholder entities for unmatched references"
                  checked={importEnforcement.references.createMissingReferences}
                  onChange={(v) =>
                    updateImportEnforcement({
                      references: { ...importEnforcement.references, createMissingReferences: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Business Rules */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Business Rules</h4>
              <div className="space-y-3">
                <Toggle
                  label="Enforce Date Range"
                  description="Start date must be before end date"
                  checked={importEnforcement.businessRules.enforceProjectDateRange}
                  onChange={(v) =>
                    updateImportEnforcement({
                      businessRules: { ...importEnforcement.businessRules, enforceProjectDateRange: v },
                    })
                  }
                />
                <Toggle
                  label="Enforce Positive Budget"
                  description="Budget must be >= 0"
                  checked={importEnforcement.businessRules.enforceBudgetPositive}
                  onChange={(v) =>
                    updateImportEnforcement({
                      businessRules: { ...importEnforcement.businessRules, enforceBudgetPositive: v },
                    })
                  }
                />
                <Toggle
                  label="Reject Overdue Tasks"
                  description="Block import of tasks with past due dates"
                  checked={importEnforcement.businessRules.rejectOverdueTasks}
                  onChange={(v) =>
                    updateImportEnforcement({
                      businessRules: { ...importEnforcement.businessRules, rejectOverdueTasks: v },
                    })
                  }
                />
                <Toggle
                  label="Reject Over-Budget Initiatives"
                  description="Block import where spent > budget"
                  checked={importEnforcement.businessRules.rejectOverBudgetInitiatives}
                  onChange={(v) =>
                    updateImportEnforcement({
                      businessRules: { ...importEnforcement.businessRules, rejectOverBudgetInitiatives: v },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Risk Score Configuration */}
        <CollapsibleSection
          title="Risk Score Settings"
          icon={<AlertTriangle className="w-4 h-4 text-rag-amber" />}
        >
          <div className="space-y-6">
            <Toggle
              label="Enable Risk Scoring"
              description="Calculate and display risk scores"
              checked={riskScoreConfig.enabled}
              onChange={(v) => updateRiskScoreConfig({ enabled: v })}
            />

            {/* Dimension Weights */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">
                Dimension Weights (must sum to 100%)
              </h4>
              <div className="space-y-2">
                <NumberInput
                  label="Schedule"
                  value={Math.round(riskScoreConfig.weights.schedule * 100)}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      weights: { ...riskScoreConfig.weights, schedule: v / 100 },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Cost"
                  value={Math.round(riskScoreConfig.weights.cost * 100)}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      weights: { ...riskScoreConfig.weights, cost: v / 100 },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Scope"
                  value={Math.round(riskScoreConfig.weights.scope * 100)}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      weights: { ...riskScoreConfig.weights, scope: v / 100 },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Resource"
                  value={Math.round(riskScoreConfig.weights.resource * 100)}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      weights: { ...riskScoreConfig.weights, resource: v / 100 },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Quality"
                  value={Math.round(riskScoreConfig.weights.quality * 100)}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      weights: { ...riskScoreConfig.weights, quality: v / 100 },
                    })
                  }
                  suffix="%"
                />
              </div>
            </div>

            {/* Risk Level Boundaries */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Risk Level Boundaries</h4>
              <div className="space-y-2">
                <NumberInput
                  label="Low Risk (up to)"
                  value={riskScoreConfig.riskLevels.low}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      riskLevels: { ...riskScoreConfig.riskLevels, low: v },
                    })
                  }
                />
                <NumberInput
                  label="Medium Risk (up to)"
                  value={riskScoreConfig.riskLevels.medium}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      riskLevels: { ...riskScoreConfig.riskLevels, medium: v },
                    })
                  }
                />
                <NumberInput
                  label="High Risk (up to)"
                  value={riskScoreConfig.riskLevels.high}
                  onChange={(v) =>
                    updateRiskScoreConfig({
                      riskLevels: { ...riskScoreConfig.riskLevels, high: v },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Insights Configuration */}
        <CollapsibleSection
          title="Insights Engine"
          icon={<Lightbulb className="w-4 h-4 text-rag-green" />}
        >
          <div className="space-y-6">
            <Toggle
              label="Enable Rule-Based Insights"
              description="Generate automated insights from data"
              checked={insightsConfig.enabled}
              onChange={(v) => updateInsightsConfig({ enabled: v })}
            />

            {/* Insight Categories */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Enabled Categories</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Toggle
                  label="Schedule"
                  checked={insightsConfig.categories.schedule}
                  onChange={(v) =>
                    updateInsightsConfig({
                      categories: { ...insightsConfig.categories, schedule: v },
                    })
                  }
                />
                <Toggle
                  label="Cost"
                  checked={insightsConfig.categories.cost}
                  onChange={(v) =>
                    updateInsightsConfig({
                      categories: { ...insightsConfig.categories, cost: v },
                    })
                  }
                />
                <Toggle
                  label="Scope"
                  checked={insightsConfig.categories.scope}
                  onChange={(v) =>
                    updateInsightsConfig({
                      categories: { ...insightsConfig.categories, scope: v },
                    })
                  }
                />
                <Toggle
                  label="Resource"
                  checked={insightsConfig.categories.resource}
                  onChange={(v) =>
                    updateInsightsConfig({
                      categories: { ...insightsConfig.categories, resource: v },
                    })
                  }
                />
                <Toggle
                  label="Strategic"
                  checked={insightsConfig.categories.strategic}
                  onChange={(v) =>
                    updateInsightsConfig({
                      categories: { ...insightsConfig.categories, strategic: v },
                    })
                  }
                />
                <Toggle
                  label="Success"
                  checked={insightsConfig.categories.success}
                  onChange={(v) =>
                    updateInsightsConfig({
                      categories: { ...insightsConfig.categories, success: v },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Approval Framework */}
        <CollapsibleSection
          title="Approval Framework"
          icon={<CheckSquare className="w-4 h-4 text-accent-purple" />}
        >
          <div className="space-y-6">
            <Toggle
              label="Enable Approval Framework"
              description="Require stage-gate approvals for projects"
              checked={approvalConfig.enabled}
              onChange={(v) => updateApprovalConfig({ enabled: v })}
            />

            {/* Gate Minimum Scores */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Gate Minimum Scores</h4>
              <div className="space-y-2">
                <NumberInput
                  label="Gate 1: Idea"
                  value={approvalConfig.gateMinimums.idea}
                  onChange={(v) =>
                    updateApprovalConfig({
                      gateMinimums: { ...approvalConfig.gateMinimums, idea: v },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Gate 2: Business Case"
                  value={approvalConfig.gateMinimums.business_case}
                  onChange={(v) =>
                    updateApprovalConfig({
                      gateMinimums: { ...approvalConfig.gateMinimums, business_case: v },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Gate 3: Planning"
                  value={approvalConfig.gateMinimums.planning}
                  onChange={(v) =>
                    updateApprovalConfig({
                      gateMinimums: { ...approvalConfig.gateMinimums, planning: v },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Gate 4: Execution"
                  value={approvalConfig.gateMinimums.execution}
                  onChange={(v) =>
                    updateApprovalConfig({
                      gateMinimums: { ...approvalConfig.gateMinimums, execution: v },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Gate 5: Closure"
                  value={approvalConfig.gateMinimums.closure}
                  onChange={(v) =>
                    updateApprovalConfig({
                      gateMinimums: { ...approvalConfig.gateMinimums, closure: v },
                    })
                  }
                  suffix="%"
                />
              </div>
            </div>

            {/* Recommendation Settings */}
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3">Recommendation Logic</h4>
              <div className="space-y-2">
                <NumberInput
                  label="Conditional Threshold Offset"
                  value={approvalConfig.recommendations.conditionalThresholdOffset}
                  onChange={(v) =>
                    updateApprovalConfig({
                      recommendations: { ...approvalConfig.recommendations, conditionalThresholdOffset: v },
                    })
                  }
                  suffix="%"
                />
                <NumberInput
                  label="Defer Minimum Score"
                  value={approvalConfig.recommendations.deferMinimumScore}
                  onChange={(v) =>
                    updateApprovalConfig({
                      recommendations: { ...approvalConfig.recommendations, deferMinimumScore: v },
                    })
                  }
                />
                <NumberInput
                  label="Max Blockers for Defer"
                  value={approvalConfig.recommendations.deferMaxBlockers}
                  onChange={(v) =>
                    updateApprovalConfig({
                      recommendations: { ...approvalConfig.recommendations, deferMaxBlockers: v },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={resetToDefaults} variant="secondary" size="sm" icon={<RotateCcw className="w-4 h-4" />}>
            Reset to Defaults
          </Button>
          <Button onClick={handleExport} variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
            Export Config
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-bg-hover text-text-primary rounded-lg cursor-pointer hover:bg-bg-hover/80">
              <Upload className="w-4 h-4" />
              Import Config
            </span>
          </label>
        </div>
        {importError && (
          <div className="mt-3 p-2 bg-rag-red/10 text-rag-red text-sm rounded">
            {importError}
          </div>
        )}
        <p className="mt-3 text-xs text-text-muted">
          Last updated: {new Date(config.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
