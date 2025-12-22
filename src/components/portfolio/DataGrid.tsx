import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Initiative, Project, StrategyPillar, Resource, Task, DEPARTMENTS, PROJECT_CATEGORIES } from '../../types';
import { RAGStatusLabel, Modal, InfoTooltip } from '../shared';
import { InitiativeForm } from '../forms/InitiativeForm';
import { formatCurrency } from '../../utils/calculations';
import { calculateRiskScore as calculateComprehensiveRisk, getRiskColorClass, formatPerformanceIndex } from '../../utils/riskScore';
import { ChevronDown, ChevronRight, Edit2, AlertTriangle, Info, FileText, TrendingUp, TrendingDown, Clock, DollarSign, Users, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DataGridProps {
  initiatives: Initiative[];
  projects: Project[];
  pillars: StrategyPillar[];
  resources: Resource[];
}

export const DataGrid: React.FC<DataGridProps> = ({
  initiatives,
  projects,
  pillars,
  resources,
}) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [showRiskTooltip, setShowRiskTooltip] = useState<string | null>(null);
  const [isAddInitiativeModalOpen, setIsAddInitiativeModalOpen] = useState(false);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Get tasks from context for comprehensive risk calculation
  const { state } = useApp();
  const allTasks = state.tasks;

  const getPillarName = (pillarId: string) =>
    pillars.find((p) => p.id === pillarId)?.name || 'Unknown';

  const getProjectCount = (initiativeId: string) =>
    projects.filter((p) => p.initiativeId === initiativeId).length;

  // Get tasks for an initiative (via its projects)
  const getInitiativeTasks = (initiativeId: string): Task[] => {
    const projectIds = projects
      .filter(p => p.initiativeId === initiativeId)
      .map(p => p.id);
    return allTasks.filter(t => projectIds.includes(t.projectId));
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Initiative & Project Data Grid</h3>
        {pillars.length > 0 && (
          <button
            onClick={() => setIsAddInitiativeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Initiative
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-hover">
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Initiative / Project
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Work ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Linked Strategy Pillar
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-secondary">
                # of Projects
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-secondary">
                Overall Status (RAG)
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                Budget Variance
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-text-secondary">
                <div className="flex items-center justify-center gap-1">
                  Risk Score
                  <InfoTooltip
                    title="Risk Score Calculation"
                    content={
                      <div className="space-y-1">
                        <p>Base: 50 points</p>
                        <p>Red status: +30</p>
                        <p>Amber status: +15</p>
                        <p>Budget &gt;10% over: +20</p>
                        <p>Each red project: +10</p>
                        <p className="pt-1 border-t border-border mt-1">0-50: Low | 51-70: Medium | 71-100: High</p>
                      </div>
                    }
                    position="bottom"
                    size="md"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {initiatives.map((initiative) => {
              const initiativeProjects = projects.filter(
                (p) => p.initiativeId === initiative.id
              );
              const initiativeTasks = getInitiativeTasks(initiative.id);
              const isExpanded = expandedRows.has(initiative.id);
              const budgetVariance = initiative.spentBudget - initiative.budget;
              const riskBreakdown = calculateComprehensiveRisk(initiative, initiativeProjects, initiativeTasks, resources);
              const riskScore = riskBreakdown.totalScore;

              return (
                <React.Fragment key={initiative.id}>
                  {/* Initiative Row */}
                  <tr
                    className="border-b border-border hover:bg-bg-hover cursor-pointer group"
                    onClick={() => toggleRow(initiative.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-muted" />
                        )}
                        <span className="text-sm font-medium text-text-primary">
                          {initiative.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInitiative(initiative);
                          }}
                          className="p-1 text-text-muted hover:text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Initiative"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">-</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {getPillarName(initiative.pillarId)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-text-primary">
                      {getProjectCount(initiative.id)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RAGStatusLabel
                        status={initiative.ragStatus}
                        onClick={() => {
                          setEditingInitiative(initiative);
                        }}
                      />
                    </td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingInitiative(initiative);
                      }}
                      className={`px-4 py-3 text-right text-sm font-medium cursor-pointer hover:underline ${
                        budgetVariance > 0 ? 'text-rag-red' : 'text-rag-green'
                      }`}
                    >
                      {budgetVariance > 0 ? '+' : ''}
                      {formatCurrency(budgetVariance)}
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRiskTooltip(showRiskTooltip === initiative.id ? null : initiative.id);
                        }}
                        className={`inline-flex items-center gap-1 text-sm font-medium cursor-pointer hover:underline ${
                          riskScore > 60
                            ? 'text-rag-red'
                            : riskScore > 30
                            ? 'text-rag-amber'
                            : 'text-rag-green'
                        }`}
                      >
                        {riskScore}
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      {/* Risk Tooltip - Enhanced with PPM metrics */}
                      {showRiskTooltip === initiative.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-80 p-4 bg-bg-card border border-border rounded-lg shadow-lg text-left">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${getRiskColorClass(riskBreakdown.riskLevel)}`} />
                              <span className="text-sm font-semibold text-text-primary">Risk Score: {riskScore}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                              riskBreakdown.riskLevel === 'low' ? 'bg-rag-green/20 text-rag-green' :
                              riskBreakdown.riskLevel === 'medium' ? 'bg-rag-amber/20 text-rag-amber' :
                              'bg-rag-red/20 text-rag-red'
                            }`}>
                              {riskBreakdown.riskLevel}
                            </span>
                          </div>

                          {/* Performance Indices */}
                          <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-border">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-text-muted" />
                              <span className="text-xs text-text-secondary">SPI:</span>
                              <span className={`text-xs font-medium ${riskBreakdown.indices.spi >= 0.9 ? 'text-rag-green' : riskBreakdown.indices.spi >= 0.8 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {formatPerformanceIndex(riskBreakdown.indices.spi)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                              <span className="text-xs text-text-secondary">CPI:</span>
                              <span className={`text-xs font-medium ${riskBreakdown.indices.cpi >= 0.9 ? 'text-rag-green' : riskBreakdown.indices.cpi >= 0.8 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {formatPerformanceIndex(riskBreakdown.indices.cpi)}
                              </span>
                            </div>
                          </div>

                          {/* Dimension Summary */}
                          <div className="grid grid-cols-5 gap-1 mb-3 text-center">
                            <div title="Schedule">
                              <div className="text-[10px] text-text-muted">Time</div>
                              <div className={`text-xs font-medium ${riskBreakdown.summary.scheduleScore <= 30 ? 'text-rag-green' : riskBreakdown.summary.scheduleScore <= 60 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {riskBreakdown.summary.scheduleScore}
                              </div>
                            </div>
                            <div title="Cost">
                              <div className="text-[10px] text-text-muted">Cost</div>
                              <div className={`text-xs font-medium ${riskBreakdown.summary.costScore <= 30 ? 'text-rag-green' : riskBreakdown.summary.costScore <= 60 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {riskBreakdown.summary.costScore}
                              </div>
                            </div>
                            <div title="Scope">
                              <div className="text-[10px] text-text-muted">Scope</div>
                              <div className={`text-xs font-medium ${riskBreakdown.summary.scopeScore <= 30 ? 'text-rag-green' : riskBreakdown.summary.scopeScore <= 60 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {riskBreakdown.summary.scopeScore}
                              </div>
                            </div>
                            <div title="Resource">
                              <div className="text-[10px] text-text-muted">Team</div>
                              <div className={`text-xs font-medium ${riskBreakdown.summary.resourceScore <= 30 ? 'text-rag-green' : riskBreakdown.summary.resourceScore <= 60 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {riskBreakdown.summary.resourceScore}
                              </div>
                            </div>
                            <div title="Quality">
                              <div className="text-[10px] text-text-muted">Quality</div>
                              <div className={`text-xs font-medium ${riskBreakdown.summary.qualityScore <= 30 ? 'text-rag-green' : riskBreakdown.summary.qualityScore <= 60 ? 'text-rag-amber' : 'text-rag-red'}`}>
                                {riskBreakdown.summary.qualityScore}
                              </div>
                            </div>
                          </div>

                          {/* Top Risk Factors */}
                          {riskBreakdown.factors.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Risk Factors</div>
                              {riskBreakdown.factors.slice(0, 4).map((factor, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                    factor.severity === 'critical' || factor.severity === 'high' ? 'bg-rag-red' :
                                    factor.severity === 'medium' ? 'bg-rag-amber' : 'bg-rag-green'
                                  }`} />
                                  <p className="text-xs text-text-secondary">{factor.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {riskBreakdown.factors.length === 0 && (
                            <p className="text-xs text-rag-green">No significant risk factors detected</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Project Rows */}
                  {isExpanded &&
                    initiativeProjects.map((project) => {
                      const projectBudgetVariance = project.spentBudget - project.budget;
                      const deptInfo = DEPARTMENTS[project.departmentCode];
                      return (
                        <tr
                          key={project.id}
                          className="border-b border-border bg-bg-primary hover:bg-bg-hover cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/execution/${project.id}`);
                          }}
                        >
                          <td className="px-4 py-3 pl-12">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-text-secondary">{project.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/project/${project.id}`);
                                }}
                                className="p-1 text-text-muted hover:text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity"
                                title="View Project Charter"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-mono font-medium"
                              style={{ backgroundColor: `${deptInfo?.color}20`, color: deptInfo?.color }}
                            >
                              {project.workId}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-muted">
                            {getPillarName(initiative.pillarId)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-text-muted">-</td>
                          <td className="px-4 py-3 text-center">
                            <RAGStatusLabel status={project.ragStatus} />
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-sm ${
                              projectBudgetVariance > 0 ? 'text-rag-red' : 'text-rag-green'
                            }`}
                          >
                            {projectBudgetVariance > 0 ? '+' : ''}
                            {formatCurrency(projectBudgetVariance)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-text-muted">-</td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
            {initiatives.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="text-text-muted mb-2">No initiatives found</div>
                  {pillars.length > 0 ? (
                    <button
                      onClick={() => setIsAddInitiativeModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add your first initiative
                    </button>
                  ) : (
                    <div className="text-sm text-text-secondary">
                      Create strategy pillars first in the Strategy Hub
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Initiative Edit Modal */}
      <Modal
        isOpen={!!editingInitiative}
        onClose={() => setEditingInitiative(null)}
        title="Edit Initiative"
        size="lg"
      >
        {editingInitiative && (
          <InitiativeForm
            initiative={editingInitiative}
            onClose={() => setEditingInitiative(null)}
            onNavigate={() => {
              setEditingInitiative(null);
              navigate(`/portfolio?pillar=${editingInitiative.pillarId}`);
            }}
          />
        )}
      </Modal>

      {/* Add Initiative Modal */}
      <Modal
        isOpen={isAddInitiativeModalOpen}
        onClose={() => setIsAddInitiativeModalOpen(false)}
        title="Add New Initiative"
        size="lg"
      >
        <InitiativeForm
          onClose={() => setIsAddInitiativeModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
