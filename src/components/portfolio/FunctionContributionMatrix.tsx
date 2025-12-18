import React from 'react';
import { useApp } from '../../context/AppContext';
import { Project, DEPARTMENTS, DepartmentProjectMetrics, DepartmentCode } from '../../types';

interface FunctionContributionMatrixProps {
  project: Project;
}

export const FunctionContributionMatrix: React.FC<FunctionContributionMatrixProps> = ({ project }) => {
  const { state } = useApp();
  const { tasks, resources, functionContributions } = state;

  // Get tasks for this project
  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  // Get function contributions for this project
  const projectContributions = (functionContributions || []).filter(
    (fc) => fc.projectId === project.id
  );

  // Calculate metrics by department from tasks
  const departmentMetrics: DepartmentProjectMetrics[] = [];

  // Group tasks by department (via assignee's department)
  const tasksByDept = new Map<DepartmentCode, typeof projectTasks>();

  projectTasks.forEach((task) => {
    const assignee = resources.find((r) => r.id === task.assigneeId);
    if (assignee) {
      const deptTasks = tasksByDept.get(assignee.departmentCode) || [];
      deptTasks.push(task);
      tasksByDept.set(assignee.departmentCode, deptTasks);
    }
  });

  // Build metrics for each department that has tasks or contributions
  const allDepts = new Set([
    ...Array.from(tasksByDept.keys()),
    ...projectContributions.map((c) => c.departmentCode),
  ]);

  allDepts.forEach((deptCode) => {
    const deptInfo = DEPARTMENTS[deptCode];
    const deptTasks = tasksByDept.get(deptCode) || [];
    const contribution = projectContributions.find((c) => c.departmentCode === deptCode);

    const totalActualHours = deptTasks.reduce((sum, t) => sum + t.actualHours, 0);
    const totalEstimatedHours = deptTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const completedTasks = deptTasks.filter((t) => t.kanbanStatus === 'done').length;

    // Get unique resources from this department working on project
    const deptResourceIds = new Set(
      deptTasks.map((t) => t.assigneeId).filter((id) => id)
    );

    departmentMetrics.push({
      departmentCode: deptCode,
      departmentName: deptInfo?.name || deptCode,
      totalPlannedHours: contribution?.plannedHours || totalEstimatedHours,
      totalActualHours: contribution?.actualHours || totalActualHours,
      resourceCount: contribution?.assignedResourceIds?.length || deptResourceIds.size,
      taskCount: deptTasks.length,
      completedTaskCount: completedTasks,
      completionPercentage:
        contribution?.completionPercentage ||
        (deptTasks.length > 0 ? Math.round((completedTasks / deptTasks.length) * 100) : 0),
      variance: (contribution?.actualHours || totalActualHours) - (contribution?.plannedHours || totalEstimatedHours),
    });
  });

  // Sort by task count descending
  departmentMetrics.sort((a, b) => b.taskCount - a.taskCount);

  if (departmentMetrics.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No cross-functional contributions tracked yet.
      </div>
    );
  }

  // Calculate totals
  const totalPlanned = departmentMetrics.reduce((sum, m) => sum + m.totalPlannedHours, 0);
  const totalActual = departmentMetrics.reduce((sum, m) => sum + m.totalActualHours, 0);
  const totalResources = departmentMetrics.reduce((sum, m) => sum + m.resourceCount, 0);
  const totalTasks = departmentMetrics.reduce((sum, m) => sum + m.taskCount, 0);
  const totalCompleted = departmentMetrics.reduce((sum, m) => sum + m.completedTaskCount, 0);

  return (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary mb-2">
        Cross-functional effort allocation for <span className="font-medium text-text-primary">{project.name}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg-hover rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-text-primary">{departmentMetrics.length}</div>
          <div className="text-xs text-text-muted">Departments</div>
        </div>
        <div className="bg-bg-hover rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-text-primary">{totalResources}</div>
          <div className="text-xs text-text-muted">Resources</div>
        </div>
        <div className="bg-bg-hover rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-text-primary">{totalPlanned}h</div>
          <div className="text-xs text-text-muted">Planned Hours</div>
        </div>
        <div className="bg-bg-hover rounded-lg p-3 text-center">
          <div className={`text-lg font-semibold ${totalActual > totalPlanned ? 'text-rag-red' : 'text-rag-green'}`}>
            {totalActual}h
          </div>
          <div className="text-xs text-text-muted">Actual Hours</div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-text-secondary font-medium">Department</th>
              <th className="text-center py-2 px-3 text-text-secondary font-medium">Resources</th>
              <th className="text-center py-2 px-3 text-text-secondary font-medium">Tasks</th>
              <th className="text-center py-2 px-3 text-text-secondary font-medium">Progress</th>
              <th className="text-right py-2 px-3 text-text-secondary font-medium">Planned</th>
              <th className="text-right py-2 px-3 text-text-secondary font-medium">Actual</th>
              <th className="text-right py-2 px-3 text-text-secondary font-medium">Variance</th>
            </tr>
          </thead>
          <tbody>
            {departmentMetrics.map((metric) => {
              const deptInfo = DEPARTMENTS[metric.departmentCode];
              return (
                <tr key={metric.departmentCode} className="border-b border-border/50 hover:bg-bg-hover">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: deptInfo?.color || '#888' }}
                      />
                      <span className="font-medium text-text-primary">{metric.departmentCode}</span>
                      <span className="text-text-muted">- {metric.departmentName}</span>
                    </div>
                  </td>
                  <td className="text-center py-2 px-3 text-text-secondary">{metric.resourceCount}</td>
                  <td className="text-center py-2 px-3 text-text-secondary">
                    {metric.completedTaskCount}/{metric.taskCount}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-blue rounded-full"
                          style={{ width: `${metric.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted w-10 text-right">
                        {metric.completionPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3 text-text-secondary">{metric.totalPlannedHours}h</td>
                  <td className="text-right py-2 px-3 text-text-secondary">{metric.totalActualHours}h</td>
                  <td className={`text-right py-2 px-3 font-medium ${
                    metric.variance > 0 ? 'text-rag-red' : metric.variance < 0 ? 'text-rag-green' : 'text-text-muted'
                  }`}>
                    {metric.variance > 0 ? '+' : ''}{metric.variance}h
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-bg-hover font-medium">
              <td className="py-2 px-3 text-text-primary">Total</td>
              <td className="text-center py-2 px-3 text-text-primary">{totalResources}</td>
              <td className="text-center py-2 px-3 text-text-primary">{totalCompleted}/{totalTasks}</td>
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue rounded-full"
                      style={{ width: `${totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-10 text-right">
                    {totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%
                  </span>
                </div>
              </td>
              <td className="text-right py-2 px-3 text-text-primary">{totalPlanned}h</td>
              <td className="text-right py-2 px-3 text-text-primary">{totalActual}h</td>
              <td className={`text-right py-2 px-3 ${
                (totalActual - totalPlanned) > 0 ? 'text-rag-red' : 'text-rag-green'
              }`}>
                {(totalActual - totalPlanned) > 0 ? '+' : ''}{totalActual - totalPlanned}h
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Effort Distribution Chart */}
      <div className="mt-4">
        <div className="text-xs text-text-muted mb-2">Effort Distribution by Department</div>
        <div className="h-6 bg-bg-primary rounded-full overflow-hidden flex">
          {departmentMetrics.map((metric) => {
            const percentage = totalPlanned > 0 ? (metric.totalPlannedHours / totalPlanned) * 100 : 0;
            if (percentage < 1) return null;
            const deptInfo = DEPARTMENTS[metric.departmentCode];
            return (
              <div
                key={metric.departmentCode}
                className="h-full flex items-center justify-center text-xs text-white font-medium"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: deptInfo?.color || '#888',
                }}
                title={`${metric.departmentCode}: ${Math.round(percentage)}%`}
              >
                {percentage > 10 && metric.departmentCode}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
