/**
 * Configuration Context
 *
 * Provides centralized access to business rules configuration.
 * Configuration is persisted to localStorage and automatically loaded on startup.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type {
  BusinessRulesConfig,
  ImportEnforcementConfig,
  RiskScoreConfig,
  InsightsConfig,
  ApprovalConfig,
  RAGConfig,
  FeatureToggles,
  ConfigPreset,
} from '../types/config';
import {
  DEFAULT_CONFIG,
  getPresetConfig,
  detectPreset,
  validateRiskWeights,
  normalizeRiskWeights,
} from '../utils/configDefaults';

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'stratos-ai-config';
const CONFIG_VERSION = '1.0.0';

/** Load configuration from localStorage */
function loadConfig(): BusinessRulesConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BusinessRulesConfig;
      // Version check for future migrations
      if (parsed.version === CONFIG_VERSION) {
        return parsed;
      }
      // TODO: Add migration logic for version upgrades
      console.warn('Config version mismatch, using defaults');
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return { ...DEFAULT_CONFIG, lastUpdated: new Date().toISOString() };
}

/** Save configuration to localStorage */
function saveConfig(config: BusinessRulesConfig): void {
  try {
    const updated = { ...config, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface ConfigContextType {
  // Full configuration
  config: BusinessRulesConfig;

  // Current preset
  currentPreset: ConfigPreset;

  // Section getters (for convenience)
  importEnforcement: ImportEnforcementConfig;
  riskScoreConfig: RiskScoreConfig;
  insightsConfig: InsightsConfig;
  approvalConfig: ApprovalConfig;
  ragConfig: RAGConfig;
  features: FeatureToggles;

  // Actions
  updateConfig: (updates: Partial<BusinessRulesConfig>) => void;
  updateImportEnforcement: (updates: Partial<ImportEnforcementConfig>) => void;
  updateRiskScoreConfig: (updates: Partial<RiskScoreConfig>) => void;
  updateInsightsConfig: (updates: Partial<InsightsConfig>) => void;
  updateApprovalConfig: (updates: Partial<ApprovalConfig>) => void;
  updateRAGConfig: (updates: Partial<RAGConfig>) => void;
  updateFeatures: (updates: Partial<FeatureToggles>) => void;

  // Preset management
  applyPreset: (preset: ConfigPreset) => void;
  resetToDefaults: () => void;

  // Import/Export
  exportConfig: () => string;
  importConfigJson: (json: string) => boolean;

  // Feature checks
  isFeatureEnabled: (feature: keyof FeatureToggles) => boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<BusinessRulesConfig>(loadConfig);
  const [currentPreset, setCurrentPreset] = useState<ConfigPreset>(() => detectPreset(loadConfig()));

  // Persist on change
  useEffect(() => {
    saveConfig(config);
    setCurrentPreset(detectPreset(config));
  }, [config]);

  // Update full config
  const updateConfig = useCallback((updates: Partial<BusinessRulesConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Update import enforcement config
  const updateImportEnforcement = useCallback((updates: Partial<ImportEnforcementConfig>) => {
    setConfig(prev => ({
      ...prev,
      import: { ...prev.import, ...updates },
    }));
  }, []);

  // Update risk score config
  const updateRiskScoreConfig = useCallback((updates: Partial<RiskScoreConfig>) => {
    setConfig(prev => {
      const newRiskConfig = { ...prev.riskScore, ...updates };
      // Auto-normalize weights if they don't sum to 1
      if (updates.weights && !validateRiskWeights(newRiskConfig.weights)) {
        newRiskConfig.weights = normalizeRiskWeights(newRiskConfig.weights);
      }
      return { ...prev, riskScore: newRiskConfig };
    });
  }, []);

  // Update insights config
  const updateInsightsConfig = useCallback((updates: Partial<InsightsConfig>) => {
    setConfig(prev => ({
      ...prev,
      insights: { ...prev.insights, ...updates },
    }));
  }, []);

  // Update approval config
  const updateApprovalConfig = useCallback((updates: Partial<ApprovalConfig>) => {
    setConfig(prev => ({
      ...prev,
      approval: { ...prev.approval, ...updates },
    }));
  }, []);

  // Update RAG config
  const updateRAGConfig = useCallback((updates: Partial<RAGConfig>) => {
    setConfig(prev => ({
      ...prev,
      rag: { ...prev.rag, ...updates },
    }));
  }, []);

  // Update feature toggles
  const updateFeatures = useCallback((updates: Partial<FeatureToggles>) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, ...updates },
    }));
  }, []);

  // Apply a preset
  const applyPreset = useCallback((preset: ConfigPreset) => {
    const presetConfig = getPresetConfig(preset);
    setConfig(presetConfig);
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG, lastUpdated: new Date().toISOString() });
  }, []);

  // Export config as JSON string
  const exportConfig = useCallback((): string => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  // Import config from JSON string
  const importConfigFromJson = useCallback((json: string): boolean => {
    try {
      const imported = JSON.parse(json) as BusinessRulesConfig;
      // Basic validation
      if (!imported.version || !imported.import || !imported.riskScore) {
        console.error('Invalid config format');
        return false;
      }
      setConfig({ ...imported, lastUpdated: new Date().toISOString() });
      return true;
    } catch (e) {
      console.error('Failed to import config:', e);
      return false;
    }
  }, []);

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback((feature: keyof FeatureToggles): boolean => {
    return config.features[feature];
  }, [config.features]);

  const value: ConfigContextType = {
    config,
    currentPreset,
    importEnforcement: config.import,
    riskScoreConfig: config.riskScore,
    insightsConfig: config.insights,
    approvalConfig: config.approval,
    ragConfig: config.rag,
    features: config.features,
    updateConfig,
    updateImportEnforcement,
    updateRiskScoreConfig,
    updateInsightsConfig,
    updateApprovalConfig,
    updateRAGConfig,
    updateFeatures,
    applyPreset,
    resetToDefaults,
    exportConfig,
    importConfigJson: importConfigFromJson,
    isFeatureEnabled,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

// =============================================================================
// HOOK
// =============================================================================

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/** Hook to check if a feature is enabled */
export const useFeature = (feature: keyof FeatureToggles): boolean => {
  const { features } = useConfig();
  return features[feature];
};

/** Hook to get import enforcement config */
export const useImportEnforcement = (): ImportEnforcementConfig => {
  const { importEnforcement } = useConfig();
  return importEnforcement;
};

/** Hook to get risk score config */
export const useRiskScoreConfig = (): RiskScoreConfig => {
  const { riskScoreConfig } = useConfig();
  return riskScoreConfig;
};

/** Hook to get insights config */
export const useInsightsConfig = (): InsightsConfig => {
  const { insightsConfig } = useConfig();
  return insightsConfig;
};

/** Hook to get approval config */
export const useApprovalConfig = (): ApprovalConfig => {
  const { approvalConfig } = useConfig();
  return approvalConfig;
};
