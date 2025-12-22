import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useApp } from './AppContext';
import {
  AIAnalysisResult,
  AIProjectSuggestion,
  analyzeWithAI,
  getProjectInsight,
  getAPIKey,
  isAIConfigured,
} from '../services/aiService';
import {
  generateInsights,
  generateExecutiveSummary,
  RuleBasedInsight,
} from '../utils/insightsEngine';

interface AIContextType {
  // State
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  analysis: AIAnalysisResult | null;
  lastUpdated: string | null;

  // Rule-based insights (always available)
  ruleBasedInsights: RuleBasedInsight[];
  ruleBasedSummary: ReturnType<typeof generateExecutiveSummary>;

  // Actions
  refreshAnalysis: (force?: boolean) => Promise<void>;
  getProjectSuggestion: (projectId: string) => Promise<AIProjectSuggestion | null>;
  clearError: () => void;

  // Helpers
  getExecutiveSummary: () => string;
  getPillarInsight: (pillarId: string) => string;
  getProjectAISuggestion: (projectId: string) => string | null;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useApp();

  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [projectSuggestions, setProjectSuggestions] = useState<Record<string, AIProjectSuggestion>>({});

  // Generate rule-based insights (always available, no AI required)
  const ruleBasedInsights = useMemo(() => {
    return generateInsights(state);
  }, [state]);

  const ruleBasedSummary = useMemo(() => {
    return generateExecutiveSummary(ruleBasedInsights);
  }, [ruleBasedInsights]);

  // Check if AI is configured on mount and when returning to the app
  useEffect(() => {
    const checkConfig = () => {
      setIsConfigured(isAIConfigured());
    };
    checkConfig();

    // Re-check when window regains focus (user might have set API key in another tab)
    window.addEventListener('focus', checkConfig);
    return () => window.removeEventListener('focus', checkConfig);
  }, []);

  // Auto-refresh analysis when data changes (with debounce)
  useEffect(() => {
    if (!isConfigured || isLoading) return;

    const timer = setTimeout(() => {
      refreshAnalysis(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, isConfigured]);

  const refreshAnalysis = useCallback(async (force: boolean = false) => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      setIsConfigured(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeWithAI(state, apiKey, force);
      setAnalysis(result);
      setLastUpdated(result.generatedAt);
      setIsConfigured(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      console.error('AI analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  const getProjectSuggestion = useCallback(async (projectId: string): Promise<AIProjectSuggestion | null> => {
    // Check cache first
    if (projectSuggestions[projectId]) {
      return projectSuggestions[projectId];
    }

    const apiKey = getAPIKey();
    if (!apiKey) return null;

    try {
      const suggestion = await getProjectInsight(state, projectId, apiKey);
      setProjectSuggestions(prev => ({ ...prev, [projectId]: suggestion }));
      return suggestion;
    } catch (err) {
      console.error('Project insight error:', err);
      return null;
    }
  }, [state, projectSuggestions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper functions for quick access to common data
  const getExecutiveSummary = useCallback((): string => {
    // First try AI analysis
    if (analysis) {
      return analysis.executiveSummary.summary;
    }
    // Fall back to rule-based summary
    if (ruleBasedSummary.summary) {
      return ruleBasedSummary.summary;
    }
    // Final fallback for when there's no data
    return generateFallbackSummary();
  }, [analysis, ruleBasedSummary]);

  const getPillarInsight = useCallback((pillarId: string): string => {
    if (!analysis) {
      return generateFallbackPillarInsight(pillarId);
    }
    const insight = analysis.pillarInsights.find(p => p.pillarId === pillarId);
    return insight?.insight || generateFallbackPillarInsight(pillarId);
  }, [analysis]);

  const getProjectAISuggestion = useCallback((projectId: string): string | null => {
    // First check the full analysis
    if (analysis) {
      const suggestion = analysis.projectSuggestions.find(p => p.projectId === projectId);
      if (suggestion) return suggestion.suggestion;
    }

    // Then check cached project suggestions
    if (projectSuggestions[projectId]) {
      return projectSuggestions[projectId].suggestion;
    }

    // Fallback - only return actionable warnings, not positive messages
    return generateFallbackProjectSuggestion(projectId);
  }, [analysis, projectSuggestions]);

  // Fallback generators when AI is not configured or hasn't loaded
  function generateFallbackSummary(): string {
    const { pillars, initiatives, projects, tasks } = state;
    const redPillars = pillars.filter(p => p.ragStatus === 'red').length;
    const blockedTasks = tasks.filter(t => t.kanbanStatus === 'blocked').length;
    const atRiskInitiatives = initiatives.filter(i => i.ragStatus !== 'green').length;

    if (redPillars > 0) {
      return `${redPillars} strategic pillar(s) are in critical status requiring immediate attention. ${atRiskInitiatives} initiatives are at risk. Configure Claude API in Settings to enable AI-powered insights.`;
    } else if (atRiskInitiatives > 0) {
      return `${atRiskInitiatives} initiative(s) are showing risk indicators. ${blockedTasks} tasks are currently blocked. Configure Claude API for detailed AI analysis.`;
    }
    return `Overall strategic health is stable with ${pillars.filter(p => p.ragStatus === 'green').length} of ${pillars.length} pillars on track. Configure Claude API in Settings for AI-powered insights.`;
  }

  function generateFallbackPillarInsight(pillarId: string): string {
    const pillar = state.pillars.find(p => p.id === pillarId);
    const kpis = state.kpis.filter(k => k.pillarId === pillarId);
    const initiatives = state.initiatives.filter(i => i.pillarId === pillarId);

    if (!pillar) return 'Pillar data not available.';

    const underperformingKPIs = kpis.filter(k => k.currentValue < k.targetValue).length;
    const atRiskInits = initiatives.filter(i => i.ragStatus !== 'green').length;

    if (pillar.ragStatus === 'red') {
      return `Critical: ${underperformingKPIs} KPI(s) below target. ${atRiskInits} initiative(s) at risk.`;
    } else if (pillar.ragStatus === 'amber') {
      return `Monitor: ${underperformingKPIs} KPI(s) trending below target. Review resource allocation.`;
    }
    return `On track with ${kpis.filter(k => k.currentValue >= k.targetValue).length}/${kpis.length} KPIs meeting targets.`;
  }

  function generateFallbackProjectSuggestion(projectId: string): string | null {
    const project = state.projects.find(p => p.id === projectId);
    const tasks = state.tasks.filter(t => t.projectId === projectId);

    if (!project) return null;

    // Collect all warnings - only return actionable issues
    const warnings: string[] = [];

    const blockedTasks = tasks.filter(t => t.kanbanStatus === 'blocked').length;
    const overdueTasks = tasks.filter(t =>
      t.kanbanStatus !== 'done' && new Date(t.dueDate) < new Date()
    ).length;
    const budgetUtilization = project.budget > 0
      ? Math.round((project.spentBudget / project.budget) * 100)
      : 0;

    // Check for actual issues
    if (blockedTasks > 0) {
      warnings.push(`${blockedTasks} blocked task(s) need resolution`);
    }
    if (overdueTasks > 0) {
      warnings.push(`${overdueTasks} task(s) are overdue`);
    }
    if (budgetUtilization > 90) {
      warnings.push(`Budget ${budgetUtilization}% utilized`);
    }
    if (project.ragStatus === 'red') {
      const endDate = new Date(project.endDate);
      if (endDate < new Date()) {
        warnings.push('Project is past end date');
      }
    }
    if (project.ragStatus === 'amber' || project.ragStatus === 'red') {
      if (project.completionPercentage < 50 && new Date(project.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('Low completion with deadline approaching');
      }
    }

    // Only return if there are actual warnings
    if (warnings.length === 0) {
      return null;
    }

    return warnings.join('. ') + '.';
  }

  const value: AIContextType = {
    isConfigured,
    isLoading,
    error,
    analysis,
    lastUpdated,
    ruleBasedInsights,
    ruleBasedSummary,
    refreshAnalysis,
    getProjectSuggestion,
    clearError,
    getExecutiveSummary,
    getPillarInsight,
    getProjectAISuggestion,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
