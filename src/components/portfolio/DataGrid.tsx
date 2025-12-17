import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Initiative, Project, StrategyPillar, Resource } from '../../types';
import { RAGStatusLabel } from '../shared';
import { formatCurrency } from '../../utils/calculations';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
    if (initiative.ragStatus === 'red') score += 30;
    if (initiative.ragStatus === 'amber') score += 15;

    const budgetVariance = ((initiative.spentBudget - initiative.budget) / initiative.budget) * 100;
    if (budgetVariance > 10) score += 20;
    if (budgetVariance > 0) score += 10;

    const redProjects = initiativeProjects.filter((p) => p.ragStatus === 'red').length;
    score += redProjects * 10;

    return Math.min(100, Math.max(0, score));
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
              const aiRiskScore = calculateAIRiskScore(initiative, initiativeProjects);

              return (
                <React.Fragment key={initiative.id}>
                  {/* Initiative Row */}
                  <tr
                    className="border-b border-border hover:bg-bg-hover cursor-pointer"
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
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {getPillarName(initiative.pillarId)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-text-primary">
                      {getProjectCount(initiative.id)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RAGStatusLabel status={initiative.ragStatus} />
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-medium ${
                        budgetVariance > 0 ? 'text-rag-red' : 'text-rag-green'
                      }`}
                    >
                      {budgetVariance > 0 ? '+' : ''}
                      {formatCurrency(budgetVariance)}
                    </td>
                    <td
                      className={`px-4 py-3 text-center text-sm font-medium ${
                        aiRiskScore > 70
                          ? 'text-rag-red'
                          : aiRiskScore > 50
                          ? 'text-rag-amber'
                          : 'text-rag-green'
                      }`}
                    >
                      {aiRiskScore}
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
    </div>
  );
};
