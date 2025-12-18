import { AppState, StrategyPillar, StrategicKPI, Initiative, Project, Task, Resource } from '../types';

// Types for AI responses
export interface AIExecutiveSummary {
  summary: string;
  keyRisks: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface AIPillarInsight {
  pillarId: string;
  insight: string;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AIProjectSuggestion {
  projectId: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
}

export interface AIResourceAlert {
  resourceId: string;
  alert: string;
  utilizationRisk: 'underutilized' | 'optimal' | 'overloaded' | 'critical';
}

export interface AIInsight {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  affectedEntities: { type: string; id: string; name: string }[];
  suggestedAction?: string;
  link?: string;
}

export interface AIAnalysisResult {
  executiveSummary: AIExecutiveSummary;
  pillarInsights: AIPillarInsight[];
  projectSuggestions: AIProjectSuggestion[];
  resourceAlerts: AIResourceAlert[];
  insights: AIInsight[];
  generatedAt: string;
}

// Cache for AI responses
const AI_CACHE_KEY = 'stratos-ai-analysis-cache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  result: AIAnalysisResult;
  timestamp: number;
  dataHash: string;
}

// Generate a simple hash of the data to detect changes
function generateDataHash(state: AppState): string {
  const key = JSON.stringify({
    pillars: state.pillars.map(p => ({ id: p.id, ragStatus: p.ragStatus })),
    initiatives: state.initiatives.map(i => ({ id: i.id, ragStatus: i.ragStatus, spentBudget: i.spentBudget })),
    projects: state.projects.map(p => ({ id: p.id, ragStatus: p.ragStatus, completionPercentage: p.completionPercentage })),
    tasks: state.tasks.map(t => ({ id: t.id, kanbanStatus: t.kanbanStatus })),
  });
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Get cached result if valid
function getCachedResult(dataHash: string): AIAnalysisResult | null {
  try {
    const cached = localStorage.getItem(AI_CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();
      if (entry.dataHash === dataHash && (now - entry.timestamp) < CACHE_DURATION_MS) {
        return entry.result;
      }
    }
  } catch (e) {
    console.error('Error reading AI cache:', e);
  }
  return null;
}

// Save result to cache
function setCachedResult(result: AIAnalysisResult, dataHash: string): void {
  try {
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      dataHash,
    };
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.error('Error saving AI cache:', e);
  }
}

// Format data for Claude
function formatDataForAI(state: AppState): string {
  const { pillars, kpis, initiatives, projects, tasks, resources } = state;

  // Calculate derived metrics
  const today = new Date();

  // Format pillars with their KPIs
  const pillarsData = pillars.map(pillar => {
    const pillarKpis = kpis.filter(k => k.pillarId === pillar.id);
    const pillarInitiatives = initiatives.filter(i => i.pillarId === pillar.id);
    const pillarProjects = projects.filter(p =>
      pillarInitiatives.some(i => i.id === p.initiativeId)
    );

    return {
      name: pillar.name,
      description: pillar.description,
      ragStatus: pillar.ragStatus,
      kpis: pillarKpis.map(k => ({
        name: k.name,
        current: k.currentValue,
        target: k.targetValue,
        previous: k.previousValue,
        unit: k.unit,
        achievement: Math.round((k.currentValue / k.targetValue) * 100),
        trend: k.currentValue > k.previousValue ? 'up' : k.currentValue < k.previousValue ? 'down' : 'stable'
      })),
      initiativeCount: pillarInitiatives.length,
      atRiskInitiatives: pillarInitiatives.filter(i => i.ragStatus !== 'green').length,
      totalBudget: pillarInitiatives.reduce((sum, i) => sum + i.budget, 0),
      spentBudget: pillarInitiatives.reduce((sum, i) => sum + i.spentBudget, 0),
    };
  });

  // Format initiatives with projects
  const initiativesData = initiatives.map(init => {
    const initProjects = projects.filter(p => p.initiativeId === init.id);
    const initTasks = tasks.filter(t =>
      initProjects.some(p => p.id === t.projectId)
    );
    const pillar = pillars.find(p => p.id === init.pillarId);
    const owner = resources.find(r => r.id === init.ownerId);

    const daysRemaining = Math.ceil((new Date(init.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const budgetUtilization = Math.round((init.spentBudget / init.budget) * 100);

    return {
      name: init.name,
      pillar: pillar?.name,
      ragStatus: init.ragStatus,
      owner: owner?.name,
      startDate: init.startDate,
      endDate: init.endDate,
      daysRemaining,
      budget: init.budget,
      spentBudget: init.spentBudget,
      budgetUtilization,
      isOverBudget: init.spentBudget > init.budget,
      projectCount: initProjects.length,
      redProjects: initProjects.filter(p => p.ragStatus === 'red').length,
      amberProjects: initProjects.filter(p => p.ragStatus === 'amber').length,
      totalTasks: initTasks.length,
      completedTasks: initTasks.filter(t => t.kanbanStatus === 'done').length,
      blockedTasks: initTasks.filter(t => t.kanbanStatus === 'blocked').length,
    };
  });

  // Format projects with task details
  const projectsData = projects.map(proj => {
    const projTasks = tasks.filter(t => t.projectId === proj.id);
    const initiative = initiatives.find(i => i.id === proj.initiativeId);
    const manager = resources.find(r => r.id === proj.managerId);

    const daysRemaining = Math.ceil((new Date(proj.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const budgetUtilization = Math.round((proj.spentBudget / proj.budget) * 100);
    const overdueTasks = projTasks.filter(t =>
      t.kanbanStatus !== 'done' && new Date(t.dueDate) < today
    ).length;

    return {
      name: proj.name,
      initiative: initiative?.name,
      ragStatus: proj.ragStatus,
      status: proj.status,
      manager: manager?.name,
      completionPercentage: proj.completionPercentage,
      daysRemaining,
      budget: proj.budget,
      spentBudget: proj.spentBudget,
      budgetUtilization,
      isOverBudget: proj.spentBudget > proj.budget,
      totalTasks: projTasks.length,
      todoTasks: projTasks.filter(t => t.kanbanStatus === 'todo').length,
      inProgressTasks: projTasks.filter(t => t.kanbanStatus === 'in_progress').length,
      blockedTasks: projTasks.filter(t => t.kanbanStatus === 'blocked').length,
      doneTasks: projTasks.filter(t => t.kanbanStatus === 'done').length,
      overdueTasks,
    };
  });

  // Format resource utilization
  const resourcesData = resources.map(res => {
    const assignedTasks = tasks.filter(t =>
      t.assigneeId === res.id && t.kanbanStatus !== 'done'
    );
    const totalEstimatedHours = assignedTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const monthlyCapacity = res.weeklyCapacity * 4;
    const utilization = Math.round((totalEstimatedHours / monthlyCapacity) * 100);

    return {
      name: res.name,
      role: res.role,
      team: res.team,
      weeklyCapacity: res.weeklyCapacity,
      activeTasks: assignedTasks.length,
      totalEstimatedHours,
      utilization,
      isOverloaded: utilization > 100,
      blockedTasks: assignedTasks.filter(t => t.kanbanStatus === 'blocked').length,
    };
  });

  // Overall metrics
  const overallMetrics = {
    totalPillars: pillars.length,
    greenPillars: pillars.filter(p => p.ragStatus === 'green').length,
    amberPillars: pillars.filter(p => p.ragStatus === 'amber').length,
    redPillars: pillars.filter(p => p.ragStatus === 'red').length,
    totalInitiatives: initiatives.length,
    atRiskInitiatives: initiatives.filter(i => i.ragStatus !== 'green').length,
    totalProjects: projects.length,
    redProjects: projects.filter(p => p.ragStatus === 'red').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.kanbanStatus === 'done').length,
    blockedTasks: tasks.filter(t => t.kanbanStatus === 'blocked').length,
    overdueTasks: tasks.filter(t => t.kanbanStatus !== 'done' && new Date(t.dueDate) < today).length,
    totalBudget: initiatives.reduce((sum, i) => sum + i.budget, 0),
    totalSpent: initiatives.reduce((sum, i) => sum + i.spentBudget, 0),
    overloadedResources: resourcesData.filter(r => r.isOverloaded).length,
  };

  return JSON.stringify({
    overview: overallMetrics,
    pillars: pillarsData,
    initiatives: initiativesData,
    projects: projectsData,
    resources: resourcesData,
    analysisDate: today.toISOString().split('T')[0],
  }, null, 2);
}

// Call Claude API
async function callClaudeAPI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Main analysis function
export async function analyzeWithAI(
  state: AppState,
  apiKey: string,
  forceRefresh: boolean = false
): Promise<AIAnalysisResult> {
  const dataHash = generateDataHash(state);

  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedResult(dataHash);
    if (cached) {
      return cached;
    }
  }

  const formattedData = formatDataForAI(state);

  const systemPrompt = `You are an expert strategic advisor AI integrated into StratOS AI, an Integrated Strategy & Delivery Platform. Your role is to analyze organizational performance data following the Balanced Scorecard (BSC) framework and provide actionable insights.

The platform follows a "Golden Thread" hierarchy:
1. Strategy Pillars (BSC perspectives: Financial, Customer, Internal Processes, Learning & Growth)
2. Strategic KPIs (metrics tied to each pillar)
3. Initiatives (programs/portfolios linked to pillars)
4. Projects (execution vehicles linked to initiatives)
5. Tasks (granular work items linked to projects)
6. Resources (people with capacity tracking)

RAG Status meanings:
- Green: On track, meeting targets
- Amber: At risk, needs attention
- Red: Critical, immediate action required

Your analysis should:
- Identify patterns and correlations across the hierarchy
- Highlight risks that could cascade up to strategic goals
- Provide specific, actionable recommendations
- Consider resource constraints and budget utilization
- Focus on the "so what" - what should leadership do about it

Always respond with valid JSON matching the requested schema.`;

  const userPrompt = `Analyze this organizational performance data and provide comprehensive insights:

${formattedData}

Respond with a JSON object matching this exact schema:
{
  "executiveSummary": {
    "summary": "2-3 sentence high-level summary for board/C-suite",
    "keyRisks": ["risk1", "risk2", "risk3"],
    "opportunities": ["opportunity1", "opportunity2"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
  },
  "pillarInsights": [
    {
      "pillarId": "pillar-1",
      "insight": "Specific insight about this pillar's performance",
      "trend": "improving|declining|stable",
      "riskLevel": "low|medium|high"
    }
  ],
  "projectSuggestions": [
    {
      "projectId": "proj-X",
      "suggestion": "Specific suggestion for this project",
      "priority": "low|medium|high|critical",
      "actionItems": ["action1", "action2"]
    }
  ],
  "resourceAlerts": [
    {
      "resourceId": "res-X",
      "alert": "Alert message about this resource",
      "utilizationRisk": "underutilized|optimal|overloaded|critical"
    }
  ],
  "insights": [
    {
      "id": "insight-1",
      "type": "critical|warning|success|info",
      "title": "Short title",
      "description": "Detailed description",
      "affectedEntities": [{"type": "initiative|project|pillar", "id": "id", "name": "name"}],
      "suggestedAction": "What to do about it",
      "link": "/portfolio or /strategy or /execution"
    }
  ]
}

Focus on:
1. Cross-pillar correlations (e.g., Learning & Growth issues impacting other pillars)
2. Budget risks and burn rates
3. Resource bottlenecks
4. Blocked tasks and their upstream impact
5. Projects at risk of missing deadlines
6. KPIs trending away from targets

Provide at least 5-8 insights covering different severity levels.`;

  try {
    const response = await callClaudeAPI(apiKey, systemPrompt, userPrompt);

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result: AIAnalysisResult = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    setCachedResult(result, dataHash);

    return result;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

// Get a quick insight for a specific project (lighter API call)
export async function getProjectInsight(
  state: AppState,
  projectId: string,
  apiKey: string
): Promise<AIProjectSuggestion> {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const initiative = state.initiatives.find(i => i.id === project.initiativeId);
  const tasks = state.tasks.filter(t => t.projectId === projectId);
  const resources = state.resources;
  const today = new Date();

  const projectData = {
    project: {
      name: project.name,
      description: project.description,
      ragStatus: project.ragStatus,
      status: project.status,
      completionPercentage: project.completionPercentage,
      budget: project.budget,
      spentBudget: project.spentBudget,
      daysRemaining: Math.ceil((new Date(project.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    },
    initiative: initiative ? {
      name: initiative.name,
      ragStatus: initiative.ragStatus,
    } : null,
    tasks: {
      total: tasks.length,
      todo: tasks.filter(t => t.kanbanStatus === 'todo').length,
      inProgress: tasks.filter(t => t.kanbanStatus === 'in_progress').length,
      blocked: tasks.filter(t => t.kanbanStatus === 'blocked').length,
      done: tasks.filter(t => t.kanbanStatus === 'done').length,
      overdue: tasks.filter(t => t.kanbanStatus !== 'done' && new Date(t.dueDate) < today).length,
    },
    teamUtilization: tasks
      .filter(t => t.kanbanStatus !== 'done')
      .reduce((acc, t) => {
        const resource = resources.find(r => r.id === t.assigneeId);
        if (resource && !acc.find(r => r.name === resource.name)) {
          const resourceTasks = tasks.filter(task => task.assigneeId === resource.id && task.kanbanStatus !== 'done');
          const totalHours = resourceTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
          acc.push({
            name: resource.name,
            role: resource.role,
            utilization: Math.round((totalHours / (resource.weeklyCapacity * 4)) * 100),
          });
        }
        return acc;
      }, [] as { name: string; role: string; utilization: number }[]),
  };

  const systemPrompt = `You are an AI project advisor. Analyze project data and provide a concise, actionable suggestion. Focus on the most impactful issue and how to resolve it.`;

  const userPrompt = `Analyze this project and provide a suggestion:

${JSON.stringify(projectData, null, 2)}

Respond with JSON:
{
  "projectId": "${projectId}",
  "suggestion": "Concise suggestion (1-2 sentences)",
  "priority": "low|medium|high|critical",
  "actionItems": ["specific action 1", "specific action 2"]
}`;

  const response = await callClaudeAPI(apiKey, systemPrompt, userPrompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response');
  }

  return JSON.parse(jsonMatch[0]);
}

// Clear the AI cache
export function clearAICache(): void {
  localStorage.removeItem(AI_CACHE_KEY);
}

// Check if API key is configured
export function isAIConfigured(): boolean {
  const apiKey = localStorage.getItem('stratos-ai-api-key');
  return !!apiKey && apiKey.length > 0;
}

// Get API key from storage
export function getAPIKey(): string | null {
  return localStorage.getItem('stratos-ai-api-key');
}

// Set API key in storage
export function setAPIKey(apiKey: string): void {
  localStorage.setItem('stratos-ai-api-key', apiKey);
}

// Remove API key from storage
export function removeAPIKey(): void {
  localStorage.removeItem('stratos-ai-api-key');
  clearAICache();
}
