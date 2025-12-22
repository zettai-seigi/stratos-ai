import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/shared';
import {
  RefreshCw, Database, AlertTriangle, Info, Settings, Sparkles, Eye, EyeOff,
  CheckCircle, XCircle, Loader2, Trash2, Target, Layers, Briefcase, ListTodo,
  Users, Flag, BarChart3, ChevronDown, ChevronRight, Building2, Wand2
} from 'lucide-react';
import { getAPIKey, setAPIKey, removeAPIKey, clearAICache, analyzeWithAI } from '../services/aiService';
import { AppState } from '../types';
import { BusinessRulesSettings } from '../components/settings/BusinessRulesSettings';
import { OrganizationSettings } from '../components/settings/OrganizationSettings';

// Entity configuration for data management
interface EntityConfig {
  key: keyof AppState;
  label: string;
  icon: React.ReactNode;
  color: string;
  children?: (keyof AppState)[];
  parentKey?: keyof AppState;
  parentIdField?: string;
}

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    key: 'pillars',
    label: 'Strategy Pillars',
    icon: <Target className="w-4 h-4" />,
    color: 'text-accent-blue',
    children: ['kpis', 'initiatives'],
  },
  {
    key: 'kpis',
    label: 'KPIs',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-rag-green',
    parentKey: 'pillars',
    parentIdField: 'pillarId',
  },
  {
    key: 'initiatives',
    label: 'Initiatives',
    icon: <Layers className="w-4 h-4" />,
    color: 'text-accent-purple',
    parentKey: 'pillars',
    parentIdField: 'pillarId',
    children: ['projects'],
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: <Briefcase className="w-4 h-4" />,
    color: 'text-accent-cyan',
    parentKey: 'initiatives',
    parentIdField: 'initiativeId',
    children: ['tasks', 'milestones'],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: <ListTodo className="w-4 h-4" />,
    color: 'text-rag-amber',
    parentKey: 'projects',
    parentIdField: 'projectId',
  },
  {
    key: 'resources',
    label: 'Resources',
    icon: <Users className="w-4 h-4" />,
    color: 'text-accent-teal',
  },
  {
    key: 'milestones',
    label: 'Milestones',
    icon: <Flag className="w-4 h-4" />,
    color: 'text-rag-red',
    parentKey: 'projects',
    parentIdField: 'projectId',
  },
];

export const SettingsPage: React.FC = () => {
  const { state, dispatch, resetToSeedData, isSetupWizardCompleted } = useApp();
  const navigate = useNavigate();
  const [expandedDataSection, setExpandedDataSection] = useState(false);

  // AI Configuration state
  const [apiKey, setApiKeyState] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const savedKey = getAPIKey();
    if (savedKey) {
      setApiKeyState(savedKey);
      setIsConfigured(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setAPIKey(apiKey.trim());
      setIsConfigured(true);
      setTestResult(null);
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm('Remove the API key? AI features will be disabled.')) {
      removeAPIKey();
      setApiKeyState('');
      setIsConfigured(false);
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      // Save the key first
      setAPIKey(apiKey.trim());

      // Try to analyze with the API
      await analyzeWithAI(state, apiKey.trim(), true);

      setTestResult('success');
      setTestMessage('Connection successful! AI analysis is working.');
      setIsConfigured(true);
    } catch (error) {
      setTestResult('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearAICache = () => {
    clearAICache();
    alert('AI cache cleared. Next analysis will fetch fresh data.');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data to the demo dataset? This cannot be undone.')) {
      resetToSeedData();
    }
  };

  const handleClearData = () => {
    const totalRecords = state.pillars.length + state.kpis.length + state.initiatives.length +
      state.projects.length + state.tasks.length + state.resources.length + (state.milestones?.length || 0);

    if (confirm(`Are you sure you want to DELETE ALL ${totalRecords} records?\n\nThis will remove everything including sample data.\nYou can restore sample data using "Reset to Demo Data" afterward.\n\nThis cannot be undone.`)) {
      // Set state to empty (not localStorage.removeItem which would reload seed data)
      const emptyState: AppState = {
        pillars: [],
        kpis: [],
        initiatives: [],
        projects: [],
        tasks: [],
        resources: [],
        milestones: [],
      };
      dispatch({ type: 'SET_STATE', payload: emptyState });
    }
  };

  // Get count of items for an entity type
  const getEntityCount = (key: keyof AppState): number => {
    const data = state[key];
    return Array.isArray(data) ? data.length : 0;
  };

  // Calculate orphan count if parent entities are cleared
  const getOrphanCount = (config: EntityConfig): { count: number; types: string[] } => {
    if (!config.children) return { count: 0, types: [] };

    let count = 0;
    const types: string[] = [];

    for (const childKey of config.children) {
      const childCount = getEntityCount(childKey);
      if (childCount > 0) {
        count += childCount;
        const childConfig = ENTITY_CONFIGS.find((c) => c.key === childKey);
        if (childConfig) types.push(childConfig.label);
      }
    }

    return { count, types };
  };

  // Clear a specific entity type
  const handleClearEntityType = (config: EntityConfig) => {
    const count = getEntityCount(config.key);
    if (count === 0) return;

    const orphanInfo = getOrphanCount(config);

    let message = `Are you sure you want to delete all ${count} ${config.label}?`;

    if (orphanInfo.count > 0) {
      message += `\n\nWARNING: This will orphan ${orphanInfo.count} related items:\n• ${orphanInfo.types.join('\n• ')}\n\nOrphaned items will have invalid parent references.`;
    }

    if (confirm(message)) {
      // Create a new state with the entity cleared
      const newState: AppState = {
        ...state,
        [config.key]: [],
      };

      dispatch({ type: 'SET_STATE', payload: newState });
    }
  };

  // Clear orphaned records (items with invalid parent references)
  const getOrphanedRecords = useMemo(() => {
    const orphaned: { key: keyof AppState; label: string; count: number }[] = [];

    // Check KPIs with invalid pillar references
    const validPillarIds = new Set(state.pillars.map((p) => p.id));
    const orphanedKpis = state.kpis.filter((k) => !validPillarIds.has(k.pillarId));
    if (orphanedKpis.length > 0) {
      orphaned.push({ key: 'kpis', label: 'KPIs', count: orphanedKpis.length });
    }

    // Check Initiatives with invalid pillar references
    const orphanedInitiatives = state.initiatives.filter((i) => !validPillarIds.has(i.pillarId));
    if (orphanedInitiatives.length > 0) {
      orphaned.push({ key: 'initiatives', label: 'Initiatives', count: orphanedInitiatives.length });
    }

    // Check Projects with invalid initiative references
    const validInitiativeIds = new Set(state.initiatives.map((i) => i.id));
    const orphanedProjects = state.projects.filter((p) => !validInitiativeIds.has(p.initiativeId));
    if (orphanedProjects.length > 0) {
      orphaned.push({ key: 'projects', label: 'Projects', count: orphanedProjects.length });
    }

    // Check Tasks with invalid project references
    const validProjectIds = new Set(state.projects.map((p) => p.id));
    const orphanedTasks = state.tasks.filter((t) => !validProjectIds.has(t.projectId));
    if (orphanedTasks.length > 0) {
      orphaned.push({ key: 'tasks', label: 'Tasks', count: orphanedTasks.length });
    }

    // Check Milestones with invalid project references
    const orphanedMilestones = (state.milestones || []).filter((m) => !validProjectIds.has(m.projectId));
    if (orphanedMilestones.length > 0) {
      orphaned.push({ key: 'milestones', label: 'Milestones', count: orphanedMilestones.length });
    }

    return orphaned;
  }, [state]);

  const handleCleanupOrphans = () => {
    if (getOrphanedRecords.length === 0) return;

    const totalOrphans = getOrphanedRecords.reduce((sum, o) => sum + o.count, 0);
    if (!confirm(`Delete ${totalOrphans} orphaned records? This cannot be undone.`)) return;

    const validPillarIds = new Set(state.pillars.map((p) => p.id));
    const validInitiativeIds = new Set(state.initiatives.map((i) => i.id));
    const validProjectIds = new Set(state.projects.map((p) => p.id));

    const newState: AppState = {
      ...state,
      kpis: state.kpis.filter((k) => validPillarIds.has(k.pillarId)),
      initiatives: state.initiatives.filter((i) => validPillarIds.has(i.pillarId)),
      projects: state.projects.filter((p) => validInitiativeIds.has(p.initiativeId)),
      tasks: state.tasks.filter((t) => validProjectIds.has(t.projectId)),
      milestones: (state.milestones || []).filter((m) => validProjectIds.has(m.projectId)),
    };

    dispatch({ type: 'SET_STATE', payload: newState });
  };

  // Calculate storage usage
  const storageUsed = new Blob([JSON.stringify(state)]).size;
  const storageUsedKB = (storageUsed / 1024).toFixed(2);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage application data and preferences.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Settings className="w-5 h-5 text-accent-cyan" />
          <span className="text-sm text-text-secondary">Configuration</span>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h2 className="text-lg font-semibold text-text-primary">AI Configuration</h2>
          {isConfigured && (
            <span className="flex items-center gap-1 text-xs text-rag-green bg-rag-green/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Claude API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-3 py-2 pr-10 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                onClick={handleTestConnection}
                variant="secondary"
                disabled={!apiKey.trim() || isTesting}
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
              </Button>
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
              >
                Save
              </Button>
            </div>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult === 'success' ? 'bg-rag-green/10 text-rag-green' : 'bg-rag-red/10 text-rag-red'
            }`}>
              {testResult === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="text-sm">{testMessage}</span>
            </div>
          )}

          <div className="p-3 bg-accent-purple/10 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-purple mt-0.5" />
              <div className="text-xs text-text-secondary space-y-1">
                <p>Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-accent-purple hover:underline">console.anthropic.com</a></p>
                <p>The API key is stored locally in your browser and used to power AI insights, executive summaries, and project suggestions.</p>
              </div>
            </div>
          </div>

          {isConfigured && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                onClick={handleClearAICache}
                variant="secondary"
                size="sm"
              >
                Clear AI Cache
              </Button>
              <Button
                onClick={handleRemoveApiKey}
                variant="danger"
                size="sm"
              >
                Remove API Key
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Setup Wizard */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-accent-cyan" />
          <h2 className="text-lg font-semibold text-text-primary">Corporate Structure</h2>
          {isSetupWizardCompleted() ? (
            <span className="flex items-center gap-1 text-xs text-rag-green bg-rag-green/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Configured
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-rag-amber bg-rag-amber/10 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Not Configured
            </span>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Use the Setup Wizard to configure your corporate hierarchy (Corporation → Holdings → Companies)
            and organizational structure (Directorate → Division → Department → Section).
          </p>

          <div className="flex items-center justify-between p-4 bg-bg-hover rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-text-primary">Setup Wizard</h3>
              <p className="text-xs text-text-muted mt-1">
                Configure corporate entities, organizational units, and BSC structure.
              </p>
            </div>
            <Button
              onClick={() => navigate('/setup-wizard')}
              variant="primary"
              size="sm"
              icon={<Wand2 className="w-4 h-4" />}
            >
              {isSetupWizardCompleted() ? 'Reconfigure' : 'Start Setup'}
            </Button>
          </div>

          {/* Corporate entities count */}
          {state.corporateEntities && state.corporateEntities.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-accent-blue">
                  {state.corporateEntities.filter(e => e.entityType === 'corporation').length}
                </div>
                <div className="text-xs text-text-muted">Corporations</div>
              </div>
              <div className="text-center p-3 bg-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-accent-purple">
                  {state.corporateEntities.filter(e => e.entityType === 'holding').length}
                </div>
                <div className="text-xs text-text-muted">Holdings</div>
              </div>
              <div className="text-center p-3 bg-bg-primary rounded-lg">
                <div className="text-2xl font-bold text-rag-green">
                  {state.corporateEntities.filter(e => e.entityType === 'company').length}
                </div>
                <div className="text-xs text-text-muted">Companies</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Rules & Enforcement */}
      <BusinessRulesSettings />

      {/* Organization Hierarchy */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <OrganizationSettings />
      </div>

      {/* Storage Info */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-text-primary">Data Storage</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Storage Used</span>
            <span className="text-text-primary font-medium">{storageUsedKB} KB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Storage Type</span>
            <span className="text-text-primary">Browser localStorage</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Total Records</span>
            <span className="text-text-primary">
              {state.pillars.length + state.kpis.length + state.initiatives.length +
               state.projects.length + state.tasks.length + state.resources.length + (state.milestones?.length || 0)}
            </span>
          </div>
        </div>

        {/* Expandable Entity Breakdown */}
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => setExpandedDataSection(!expandedDataSection)}
            className="w-full flex items-center justify-between text-sm text-text-secondary hover:text-text-primary"
          >
            <span className="font-medium">Entity Breakdown & Management</span>
            {expandedDataSection ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedDataSection && (
            <div className="mt-4 space-y-2">
              {ENTITY_CONFIGS.map((config) => {
                const count = getEntityCount(config.key);
                const orphanInfo = getOrphanCount(config);

                return (
                  <div
                    key={config.key}
                    className="flex items-center justify-between p-3 bg-bg-hover rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={config.color}>{config.icon}</span>
                      <div>
                        <span className="text-sm font-medium text-text-primary">
                          {config.label}
                        </span>
                        <span className="ml-2 text-sm text-text-muted">({count})</span>
                        {orphanInfo.count > 0 && (
                          <span className="ml-2 text-xs text-rag-amber">
                            ({orphanInfo.count} children)
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleClearEntityType(config)}
                      variant="secondary"
                      size="sm"
                      disabled={count === 0}
                      icon={<Trash2 className="w-3 h-3" />}
                    >
                      Clear
                    </Button>
                  </div>
                );
              })}

              {/* Orphan Cleanup */}
              {getOrphanedRecords.length > 0 && (
                <div className="mt-4 p-4 bg-rag-amber/10 border border-rag-amber/30 rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-rag-amber mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Orphaned Records Detected
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        These items have invalid parent references:
                      </p>
                    </div>
                  </div>
                  <ul className="text-sm text-text-secondary mb-3 ml-6">
                    {getOrphanedRecords.map((o) => (
                      <li key={o.key}>
                        {o.count} {o.label}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleCleanupOrphans}
                    variant="secondary"
                    size="sm"
                    icon={<Trash2 className="w-3 h-3" />}
                  >
                    Clean Up Orphans
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-accent-blue/10 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-accent-blue mt-0.5" />
            <p className="text-xs text-text-secondary">
              Data is stored in your browser's localStorage. Export a backup before clearing
              your browser data to avoid losing your work.
            </p>
          </div>
        </div>
      </div>

      {/* Data Actions */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-accent-purple" />
          <h2 className="text-lg font-semibold text-text-primary">Data Management</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-hover rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-text-primary">Reset to Demo Data</h3>
              <p className="text-xs text-text-muted mt-1">
                Restore the sample Balanced Scorecard data for testing.
              </p>
            </div>
            <Button
              onClick={handleResetData}
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-rag-red/10 rounded-lg border border-rag-red/20">
            <div>
              <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rag-red" />
                Delete All Data
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Permanently delete everything including sample data. Start fresh.
              </p>
              <p className="text-xs text-text-muted">
                Use "Reset to Demo Data" above to restore sample data afterward.
              </p>
            </div>
            <Button
              onClick={handleClearData}
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete All
            </Button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="w-full bg-bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">About StratOS AI</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            <strong className="text-text-primary">Version:</strong> 1.0.0
          </p>
          <p>
            <strong className="text-text-primary">Description:</strong> AI-driven Integrated
            Strategy & Delivery Platform connecting Balanced Scorecard to execution.
          </p>
          <p className="pt-2">
            Built with React, TypeScript, TailwindCSS, and Recharts.
          </p>
        </div>
      </div>
    </div>
  );
};
