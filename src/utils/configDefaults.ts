/**
 * Configuration Defaults
 *
 * Default values for all business rules configuration.
 * These represent the "Standard" preset - balanced for most use cases.
 */

import type {
  BusinessRulesConfig,
  ImportEnforcementConfig,
  RiskScoreConfig,
  InsightsConfig,
  ApprovalConfig,
  RAGConfig,
  FeatureToggles,
  ConfigPreset,
  PresetInfo,
} from '../types/config';

// =============================================================================
// IMPORT ENFORCEMENT DEFAULTS
// =============================================================================

export const DEFAULT_IMPORT_CONFIG: ImportEnforcementConfig = {
  charter: {
    enforceOnImport: false,
    minimumCompletenessScore: 0,
    requiredSections: {
      processDiagrams: false,
      costBenefits: false,
      goals: false,
      metrics: false,
      scope: false,
      projectTeam: false,
      operationsTeam: false,
      controls: false,
      policies: false,
      dataSpecifications: false,
    },
  },
  fields: {
    treatWarningsAsErrors: false,
    additionalRequired: {
      project: [],
      task: [],
      initiative: [],
      resource: [],
      kpi: [],
      milestone: [],
    },
  },
  references: {
    allowFuzzyMatching: true,
    fuzzyMatchThreshold: 70,
    createMissingReferences: false,
  },
  businessRules: {
    enforceProjectDateRange: true,
    enforceBudgetPositive: true,
    enforceCompletionRange: true,
    rejectOverdueTasks: false,
    rejectOverBudgetInitiatives: false,
  },
};

// =============================================================================
// RISK SCORE DEFAULTS
// =============================================================================

export const DEFAULT_RISK_SCORE_CONFIG: RiskScoreConfig = {
  enabled: true,
  weights: {
    schedule: 0.25,
    cost: 0.25,
    scope: 0.20,
    resource: 0.15,
    quality: 0.15,
  },
  thresholds: {
    spi: { good: 0.95, warning: 0.85, critical: 0.7 },
    cpi: { good: 0.95, warning: 0.85, critical: 0.7 },
    budgetVariance: { good: 5, warning: 15, critical: 25 },
    overdueRatio: { good: 0.05, warning: 0.15, critical: 0.3 },
    blockedRatio: { good: 0.05, warning: 0.1, critical: 0.2 },
    resourceUtilization: { good: 90, warning: 110, critical: 130 },
  },
  riskLevels: {
    low: 25,
    medium: 50,
    high: 75,
  },
};

// =============================================================================
// INSIGHTS ENGINE DEFAULTS
// =============================================================================

export const DEFAULT_INSIGHTS_CONFIG: InsightsConfig = {
  enabled: true,
  categories: {
    schedule: true,
    cost: true,
    scope: true,
    resource: true,
    strategic: true,
    success: true,
  },
  thresholds: {
    schedule: {
      spiWarning: 0.9,
      spiCritical: 0.8,
      overdueTasksWarning: 0.1,
      overdueTasksCritical: 0.25,
      daysToDeadlineWarning: 14,
      daysToDeadlineCritical: 7,
    },
    cost: {
      cpiWarning: 0.9,
      cpiCritical: 0.8,
      budgetVarianceWarning: 10,
      budgetVarianceCritical: 25,
      burnRateWarning: 1.1,
      burnRateCritical: 1.3,
    },
    scope: {
      completionGapWarning: 15,
      completionGapCritical: 30,
      blockedRatioWarning: 0.1,
      blockedRatioCritical: 0.2,
    },
    resource: {
      utilizationWarning: 100,
      utilizationCritical: 120,
      unassignedTasksWarning: 0.1,
    },
    strategic: {
      atRiskInitiativesWarning: 0.25,
      atRiskInitiativesCritical: 0.5,
      pillarImbalanceThreshold: 0.4,
    },
  },
};

// =============================================================================
// APPROVAL FRAMEWORK DEFAULTS
// =============================================================================

export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  enabled: true,
  gateMinimums: {
    idea: 60,
    business_case: 70,
    planning: 75,
    execution: 80,
    closure: 70,
  },
  categoryWeights: {
    strategic: 20,
    financial: 20,
    technical: 15,
    resource: 15,
    risk: 15,
    governance: 10,
    delivery: 5,
  },
  charterWeights: {
    processDiagrams: { asIs: 5, toBe: 10 },
    costBenefits: { tangible: 12, intangible: 8 },
    controls: 8,
    goals: 12,
    metrics: 10,
    policies: 5,
    projectTeam: 10,
    operationsTeam: 5,
    scope: { inScope: 6, outOfScope: 4 },
    dataSpecifications: 5,
  },
  recommendations: {
    conditionalThresholdOffset: 10,
    deferMinimumScore: 40,
    deferMaxBlockers: 2,
  },
};

// =============================================================================
// RAG STATUS DEFAULTS
// =============================================================================

export const DEFAULT_RAG_CONFIG: RAGConfig = {
  percentage: {
    greenThreshold: 95,
    amberThreshold: 80,
  },
  budget: {
    amberThreshold: 5,
    redThreshold: 15,
  },
  progress: {
    greenVariance: -5,
    amberVariance: -15,
  },
};

// =============================================================================
// FEATURE TOGGLE DEFAULTS
// =============================================================================

export const DEFAULT_FEATURES: FeatureToggles = {
  aiInsights: true,
  ruleBasedInsights: true,
  riskScoring: true,
  approvalFramework: true,
  charterTracking: true,
  smartImport: true,
  fuzzyMatching: true,
  autoEntityDetection: true,
  executiveSummary: true,
  trendAnalysis: true,
  recommendations: true,
};

// =============================================================================
// COMPLETE DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_CONFIG: BusinessRulesConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  import: DEFAULT_IMPORT_CONFIG,
  riskScore: DEFAULT_RISK_SCORE_CONFIG,
  insights: DEFAULT_INSIGHTS_CONFIG,
  approval: DEFAULT_APPROVAL_CONFIG,
  rag: DEFAULT_RAG_CONFIG,
  features: DEFAULT_FEATURES,
};

// =============================================================================
// CONFIGURATION PRESETS
// =============================================================================

/** Preset metadata */
export const PRESET_INFO: Record<ConfigPreset, PresetInfo> = {
  strict: {
    name: 'strict',
    label: 'Strict (Enterprise)',
    description: 'Full enforcement with charter requirements and strict validation',
  },
  standard: {
    name: 'standard',
    label: 'Standard',
    description: 'Balanced settings for most organizations',
  },
  lenient: {
    name: 'lenient',
    label: 'Lenient (Startup)',
    description: 'Minimal enforcement for agile teams',
  },
  custom: {
    name: 'custom',
    label: 'Custom',
    description: 'User-defined configuration',
  },
};

/** Strict preset - Enterprise-grade enforcement */
export const STRICT_CONFIG: BusinessRulesConfig = {
  ...DEFAULT_CONFIG,
  import: {
    charter: {
      enforceOnImport: true,
      minimumCompletenessScore: 70,
      requiredSections: {
        processDiagrams: false,
        costBenefits: true,
        goals: true,
        metrics: true,
        scope: true,
        projectTeam: true,
        operationsTeam: false,
        controls: false,
        policies: false,
        dataSpecifications: false,
      },
    },
    fields: {
      treatWarningsAsErrors: true,
      additionalRequired: {
        project: ['baselineEndDate', 'riskExposure'],
        task: ['estimatedHours'],
        initiative: [],
        resource: ['hourlyRate'],
        kpi: [],
        milestone: [],
      },
    },
    references: {
      allowFuzzyMatching: false,
      fuzzyMatchThreshold: 90,
      createMissingReferences: false,
    },
    businessRules: {
      enforceProjectDateRange: true,
      enforceBudgetPositive: true,
      enforceCompletionRange: true,
      rejectOverdueTasks: true,
      rejectOverBudgetInitiatives: true,
    },
  },
  approval: {
    ...DEFAULT_APPROVAL_CONFIG,
    gateMinimums: {
      idea: 70,
      business_case: 80,
      planning: 85,
      execution: 90,
      closure: 80,
    },
  },
};

/** Lenient preset - Minimal enforcement for agile teams */
export const LENIENT_CONFIG: BusinessRulesConfig = {
  ...DEFAULT_CONFIG,
  import: {
    charter: {
      enforceOnImport: false,
      minimumCompletenessScore: 0,
      requiredSections: {
        processDiagrams: false,
        costBenefits: false,
        goals: false,
        metrics: false,
        scope: false,
        projectTeam: false,
        operationsTeam: false,
        controls: false,
        policies: false,
        dataSpecifications: false,
      },
    },
    fields: {
      treatWarningsAsErrors: false,
      additionalRequired: {
        project: [],
        task: [],
        initiative: [],
        resource: [],
        kpi: [],
        milestone: [],
      },
    },
    references: {
      allowFuzzyMatching: true,
      fuzzyMatchThreshold: 50,
      createMissingReferences: true,
    },
    businessRules: {
      enforceProjectDateRange: false,
      enforceBudgetPositive: false,
      enforceCompletionRange: false,
      rejectOverdueTasks: false,
      rejectOverBudgetInitiatives: false,
    },
  },
  approval: {
    ...DEFAULT_APPROVAL_CONFIG,
    gateMinimums: {
      idea: 50,
      business_case: 60,
      planning: 65,
      execution: 70,
      closure: 60,
    },
  },
};

/** Get preset configuration by name */
export function getPresetConfig(preset: ConfigPreset): BusinessRulesConfig {
  switch (preset) {
    case 'strict':
      return { ...STRICT_CONFIG, lastUpdated: new Date().toISOString() };
    case 'lenient':
      return { ...LENIENT_CONFIG, lastUpdated: new Date().toISOString() };
    case 'standard':
    case 'custom':
    default:
      return { ...DEFAULT_CONFIG, lastUpdated: new Date().toISOString() };
  }
}

/** Detect which preset matches the current config (if any) */
export function detectPreset(config: BusinessRulesConfig): ConfigPreset {
  // Check strict
  if (
    config.import.charter.enforceOnImport &&
    config.import.charter.minimumCompletenessScore >= 70 &&
    config.import.fields.treatWarningsAsErrors &&
    !config.import.references.allowFuzzyMatching
  ) {
    return 'strict';
  }

  // Check lenient
  if (
    !config.import.charter.enforceOnImport &&
    config.import.references.fuzzyMatchThreshold <= 50 &&
    config.import.references.createMissingReferences &&
    !config.import.businessRules.enforceProjectDateRange
  ) {
    return 'lenient';
  }

  // Check standard (approximate match)
  if (
    !config.import.charter.enforceOnImport &&
    config.import.references.allowFuzzyMatching &&
    config.import.references.fuzzyMatchThreshold === 70 &&
    config.import.businessRules.enforceProjectDateRange
  ) {
    return 'standard';
  }

  return 'custom';
}

/** Validate risk weights sum to 1.0 */
export function validateRiskWeights(weights: BusinessRulesConfig['riskScore']['weights']): boolean {
  const sum = weights.schedule + weights.cost + weights.scope + weights.resource + weights.quality;
  return Math.abs(sum - 1.0) < 0.001; // Allow small floating point variance
}

/** Normalize risk weights to sum to 1.0 */
export function normalizeRiskWeights(weights: BusinessRulesConfig['riskScore']['weights']): BusinessRulesConfig['riskScore']['weights'] {
  const sum = weights.schedule + weights.cost + weights.scope + weights.resource + weights.quality;
  if (sum === 0) return DEFAULT_RISK_SCORE_CONFIG.weights;

  return {
    schedule: weights.schedule / sum,
    cost: weights.cost / sum,
    scope: weights.scope / sum,
    resource: weights.resource / sum,
    quality: weights.quality / sum,
  };
}
