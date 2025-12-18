import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Initiative, Project, StrategyPillar, Resource } from '../../types';
import { RAGStatusLabel, Modal } from '../shared';
import { InitiativeForm } from '../forms/InitiativeForm';
import { formatCurrency } from '../../utils/calculations';
import { ChevronDown, ChevronRight, Edit2, AlertTriangle, Info } from 'lucide-react';

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

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getPillarName = (pillarId: string) =>
    pillars.find((p) => p.id === pillarId)?.name || 'Unknown';

  const getProjectCount = (initiativeId: string) =>
    projects.filter((p) => p.initiativeId === initiativeId).length;

  const calculateAIRiskScore = (initiative: Initiative, initiativeProjects: Project[]) => {
    // Simulated AI risk score calculation
    let score = 50;
    const factors: string[] = [];

    if (initiative.ragStatus === 'red') {
      score += 30;
      factors.push('Initiative marked as critical (Red status)');
    } else if (initiative.ragStatus === 'amber') {
      score += 15;
      factors.push('Initiative at risk (Amber status)');
    }

    const budgetVariance = ((initiative.spentBudget - initiative.budget) / initiative.budget) * 100;
    if (budgetVariance > 10) {
      score += 20;
      factors.push(`Budget overrun: ${budgetVariance.toFixed(0)}% over budget`);
    } else if (budgetVariance > 0) {
      score += 10;
      factors.push(`Budget variance: ${budgetVariance.toFixed(0)}% over budget`);
    }

    const redProjects = initiativeProjects.filter((p) => p.ragStatus === 'red').length;
    if (redProjects > 0) {
      score += redProjects * 10;
      factors.push(`${redProjects} project(s) in critical status`);
    }

    const amberProjects = initiativeProjects.filter((p) => p.ragStatus === 'amber').length;
    if (amberProjects > 0) {
      factors.push(`${amberProjects} project(s) at risk`);
    }

    if (factors.length === 0) {
      factors.push('No significant risk factors detected');
    }

    return { score: Math.min(100, Math.max(0, score)), factors };
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary">Initiative & Project Data Grid</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-hover">
              <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Initiative Name
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
                AI Risk Score (0-100)
              </th>
            </tr>
          </thead>
          <tbody>
            {initiatives.map((initiative) => {
              const initiativeProjects = projects.filter(
                (p) => p.initiativeId === initiative.id
              );
              const isExpanded = expandedRows.has(initiative.id);
              const budgetVariance = initiative.spentBudget - initiative.budget;
              const { score: aiRiskScore, factors: riskFactors } = calculateAIRiskScore(initiative, initiativeProjects);

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
                          aiRiskScore > 70
                            ? 'text-rag-red'
                            : aiRiskScore > 50
                            ? 'text-rag-amber'
                            : 'text-rag-green'
                        }`}
                      >
                        {aiRiskScore}
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      {/* Risk Tooltip */}
                      {showRiskTooltip === initiative.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-64 p-3 bg-bg-card border border-border rounded-lg shadow-lg text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-4 h-4 ${aiRiskScore > 70 ? 'text-rag-red' : aiRiskScore > 50 ? 'text-rag-amber' : 'text-rag-green'}`} />
                            <span className="text-sm font-semibold text-text-primary">Risk Score: {aiRiskScore}</span>
                          </div>
                          <div className="space-y-1">
                            {riskFactors.map((factor, idx) => (
                              <p key={idx} className="text-xs text-text-secondary">• {factor}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Project Rows */}
                  {isExpanded &&
                    initiativeProjects.map((project) => {
                      const projectBudgetVariance = project.spentBudget - project.budget;
                      return (
                        <tr
                          key={project.id}
                          className="border-b border-border bg-bg-primary hover:bg-bg-hover cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/execution/${project.id}`);
                          }}
                        >
                          <td className="px-4 py-3 pl-12">
                            <span className="text-sm text-text-secondary">{project.name}</span>
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
    </div>
  );
};
