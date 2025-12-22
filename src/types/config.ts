/**
 * Business Rules Configuration Types
 *
 * Defines all configurable aspects of the StratOS AI platform:
 * - Import enforcement rules
 * - Risk score calculation parameters
 * - Insights engine thresholds
 * - Approval framework settings
 * - RAG status thresholds
 * - Feature toggles
 */

import type { ProjectStage, RequirementCategory } from './index';

// =============================================================================
// IMPORT ENFORCEMENT CONFIGURATION
// =============================================================================

/** Charter section requirements */
export interface CharterSectionRequirements {
  processDiagrams: boolean;
  costBenefits: boolean;
  goals: boolean;
  metrics: boolean;
  scope: boolean;
  projectTeam: boolean;
  operationsTeam: boolean;
  controls: boolean;
  policies: boolean;
  dataSpecifications: boolean;
}

/** Charter enforcement settings */
export interface CharterEnforcementConfig {
  /** Require charter data for imported projects */
  enforceOnImport: boolean;
  /** Minimum charter completeness score (0-100) to allow import */
  minimumCompletenessScore: number;
  /** Which sections are required */
  requiredSections: CharterSectionRequirements;
}

/** Field validation enforcement */
export interface FieldEnforcementConfig {
  /** Treat validation warnings as blocking errors */
  treatWarningsAsErrors: boolean;
  /** Additional required fields beyond schema defaults */
  additionalRequired: {
    project: string[];
    task: string[];
    initiative: string[];
    resource: string[];
    kpi: string[];
    milestone: string[];
  };
}

/** Reference resolution settings */
export interface ReferenceConfig {
  /** Allow fuzzy matching for references */
  allowFuzzyMatching: boolean;
  /** Fuzzy match confidence threshold (0-100) */
  fuzzyMatchThreshold: number;
  /** Auto-create missing parent references during import */
  createMissingReferences: boolean;
}

/** Business rule enforcement during import */
export interface BusinessRuleEnforcementConfig {
  /** Enforce start date < end date for projects */
  enforceProjectDateRange: boolean;
  /** Enforce budget >= 0 */
  enforceBudgetPositive: boolean;
  /** Enforce completion percentage 0-100 */
  enforceCompletionRange: boolean;
  /** Reject tasks with past due dates */
  rejectOverdueTasks: boolean;
  /** Reject initiatives where spent > budget */
  rejectOverBudgetInitiatives: boolean;
}

/** Complete import enforcement configuration */
export interface ImportEnforcementConfig {
  charter: CharterEnforcementConfig;
  fields: FieldEnforcementConfig;
  references: ReferenceConfig;
  businessRules: BusinessRuleEnforcementConfig;
}

// =============================================================================
// RISK SCORE CONFIGURATION
// =============================================================================

/** Risk dimension weights (must sum to 1.0) */
export interface RiskWeights {
  schedule: number;
  cost: number;
  scope: number;
  resource: number;
  quality: number;
}

/** Threshold definition with good/warning/critical levels */
export interface ThresholdLevels {
  good: number;
  warning: number;
  critical: number;
}

/** Risk score thresholds */
export interface RiskThresholds {
  /** Schedule Performance Index thresholds */
  spi: ThresholdLevels;
  /** Cost Performance Index thresholds */
  cpi: ThresholdLevels;
  /** Budget variance percentage thresholds */
  budgetVariance: ThresholdLevels;
  /** Overdue task ratio thresholds */
  overdueRatio: ThresholdLevels;
  /** Blocked task ratio thresholds */
  blockedRatio: ThresholdLevels;
  /** Resource utilization percentage thresholds */
  resourceUtilization: ThresholdLevels;
}

/** Risk level boundaries (score ranges) */
export interface RiskLevelBoundaries {
  /** Max score for "Low Risk" (0 to this value) */
  low: number;
  /** Max score for "Medium Risk" */
  medium: number;
  /** Max score for "High Risk" (above this is Critical) */
  high: number;
}

/** Complete risk score configuration */
export interface RiskScoreConfig {
  /** Enable/disable risk scoring */
  enabled: boolean;
  /** Dimension weights */
  weights: RiskWeights;
  /** Calculation thresholds */
  thresholds: RiskThresholds;
  /** Risk level boundaries */
  riskLevels: RiskLevelBoundaries;
}

// =============================================================================
// INSIGHTS ENGINE CONFIGURATION
// =============================================================================

/** Insight category toggles */
export interface InsightCategoryToggles {
  schedule: boolean;
  cost: boolean;
  scope: boolean;
  resource: boolean;
  strategic: boolean;
  success: boolean;
}

/** Schedule insight thresholds */
export interface ScheduleInsightThresholds {
  spiWarning: number;
  spiCritical: number;
  overdueTasksWarning: number;
  overdueTasksCritical: number;
  daysToDeadlineWarning: number;
  daysToDeadlineCritical: number;
}

/** Cost insight thresholds */
export interface CostInsightThresholds {
  cpiWarning: number;
  cpiCritical: number;
  budgetVarianceWarning: number;
  budgetVarianceCritical: number;
  burnRateWarning: number;
  burnRateCritical: number;
}

/** Scope insight thresholds */
export interface ScopeInsightThresholds {
  completionGapWarning: number;
  completionGapCritical: number;
  blockedRatioWarning: number;
  blockedRatioCritical: number;
}

/** Resource insight thresholds */
export interface ResourceInsightThresholds {
  utilizationWarning: number;
  utilizationCritical: number;
  unassignedTasksWarning: number;
}

/** Strategic insight thresholds */
export interface StrategicInsightThresholds {
  atRiskInitiativesWarning: number;
  atRiskInitiativesCritical: number;
  pillarImbalanceThreshold: number;
}

/** All insight thresholds */
export interface InsightThresholds {
  schedule: ScheduleInsightThresholds;
  cost: CostInsightThresholds;
  scope: ScopeInsightThresholds;
  resource: ResourceInsightThresholds;
  strategic: StrategicInsightThresholds;
}

/** Complete insights configuration */
export interface InsightsConfig {
  /** Enable/disable rule-based insights */
  enabled: boolean;
  /** Category toggles */
  categories: InsightCategoryToggles;
  /** Threshold overrides */
  thresholds: InsightThresholds;
}

// =============================================================================
// APPROVAL FRAMEWORK CONFIGURATION
// =============================================================================

/** Gate minimum scores by stage */
export type GateMinimums = Record<ProjectStage, number>;

/** Category weights for approval scoring */
export type ApprovalCategoryWeights = Record<RequirementCategory, number>;

/** Charter element weights */
export interface CharterElementWeights {
  processDiagrams: { asIs: number; toBe: number };
  costBenefits: { tangible: number; intangible: number };
  controls: number;
  goals: number;
  metrics: number;
  policies: number;
  projectTeam: number;
  operationsTeam: number;
  scope: { inScope: number; outOfScope: number };
  dataSpecifications: number;
}

/** Recommendation logic settings */
export interface RecommendationConfig {
  /** Score offset for conditional approval (e.g., 10 = within 10% of minimum) */
  conditionalThresholdOffset: number;
  /** Minimum score to defer (below this = reject) */
  deferMinimumScore: number;
  /** Maximum blockers to allow defer (above this = reject) */
  deferMaxBlockers: number;
}

/** Complete approval framework configuration */
export interface ApprovalConfig {
  /** Enable/disable approval framework */
  enabled: boolean;
  /** Minimum scores per gate */
  gateMinimums: GateMinimums;
  /** Category weights for scoring */
  categoryWeights: ApprovalCategoryWeights;
  /** Charter element weights */
  charterWeights: CharterElementWeights;
  /** Recommendation logic */
  recommendations: RecommendationConfig;
}

// =============================================================================
// RAG STATUS CONFIGURATION
// =============================================================================

/** RAG threshold configuration */
export interface RAGConfig {
  /** Percentage-based RAG (higher is better) */
  percentage: {
    greenThreshold: number;
    amberThreshold: number;
  };
  /** Budget variance RAG */
  budget: {
    amberThreshold: number;
    redThreshold: number;
  };
  /** Project progress variance */
  progress: {
    greenVariance: number;
    amberVariance: number;
  };
}

// =============================================================================
// FEATURE TOGGLES
// =============================================================================

/** Feature toggle flags */
export interface FeatureToggles {
  /** Enable AI-powered insights (requires API key) */
  aiInsights: boolean;
  /** Enable rule-based insights */
  ruleBasedInsights: boolean;
  /** Enable risk score calculations */
  riskScoring: boolean;
  /** Enable stage-gate approval framework */
  approvalFramework: boolean;
  /** Enable charter completeness tracking */
  charterTracking: boolean;
  /** Enable smart import wizard */
  smartImport: boolean;
  /** Enable fuzzy reference matching */
  fuzzyMatching: boolean;
  /** Enable auto entity type detection */
  autoEntityDetection: boolean;
  /** Show executive summaries */
  executiveSummary: boolean;
  /** Show trend analysis */
  trendAnalysis: boolean;
  /** Show recommendations */
  recommendations: boolean;
}

// =============================================================================
// COMPLETE CONFIGURATION
// =============================================================================

/** Complete business rules configuration */
export interface BusinessRulesConfig {
  /** Configuration version for migrations */
  version: string;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Import enforcement settings */
  import: ImportEnforcementConfig;
  /** Risk score settings */
  riskScore: RiskScoreConfig;
  /** Insights engine settings */
  insights: InsightsConfig;
  /** Approval framework settings */
  approval: ApprovalConfig;
  /** RAG status settings */
  rag: RAGConfig;
  /** Feature toggles */
  features: FeatureToggles;
}

// =============================================================================
// CONFIGURATION PRESETS
// =============================================================================

/** Preset names */
export type ConfigPreset = 'strict' | 'standard' | 'lenient' | 'custom';

/** Preset metadata */
export interface PresetInfo {
  name: ConfigPreset;
  label: string;
  description: string;
}
