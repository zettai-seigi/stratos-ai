import * as XLSX from 'xlsx';
import { AppState, DEPARTMENTS, PROJECT_CATEGORIES, DepartmentCode, ProjectCategory } from '../types';

// Helper to set column widths
const setColumnWidths = (sheet: XLSX.WorkSheet, widths: number[]) => {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
};

// Helper to create a styled header row
const createHeaderStyle = () => ({
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4A5568' } },
  alignment: { horizontal: 'center' },
});

export const generateExcelTemplate = (state: AppState): void => {
  const workbook = XLSX.utils.book_new();

  // ============================================================
  // 1. LOOKUPS SHEET - Hidden sheet with dropdown values
  // ============================================================
  const departmentCodes = Object.keys(DEPARTMENTS) as DepartmentCode[];
  const categoryCodes = Object.keys(PROJECT_CATEGORIES) as ProjectCategory[];
  const statusOptions = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
  const ragOptions = ['GREEN', 'AMBER', 'RED'];
  const kanbanOptions = ['To Do', 'In Progress', 'Blocked', 'Done'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const milestoneStatusOptions = ['Pending', 'Completed', 'Missed'];
  const kpiUnitOptions = ['%', '$', 'score', 'number'];
  const boolOptions = ['Yes', 'No'];

  // Build lookup data with named columns
  const maxLen = Math.max(
    state.pillars.length,
    state.initiatives.length,
    state.resources.length,
    state.projects.length,
    state.tasks.length,
    departmentCodes.length,
    categoryCodes.length,
    statusOptions.length,
    ragOptions.length,
    kanbanOptions.length,
    priorityOptions.length,
    milestoneStatusOptions.length,
    kpiUnitOptions.length
  );

  const lookupsData = [
    ['Pillars', 'Initiatives', 'Resources', 'Projects', 'Tasks', 'Departments', 'Categories', 'ProjectStatus', 'RAGStatus', 'TaskStatus', 'Priority', 'MilestoneStatus', 'KPIUnit', 'YesNo'],
    ...Array.from({ length: maxLen }).map((_, i) => [
      state.pillars[i]?.name || '',
      state.initiatives[i]?.name || '',
      state.resources[i]?.name || '',
      state.projects[i]?.name || '',
      state.tasks[i]?.title || '',
      departmentCodes[i] || '',
      categoryCodes[i] || '',
      statusOptions[i] || '',
      ragOptions[i] || '',
      kanbanOptions[i] || '',
      priorityOptions[i] || '',
      milestoneStatusOptions[i] || '',
      kpiUnitOptions[i] || '',
      boolOptions[i] || '',
    ]),
  ];
  const lookupsSheet = XLSX.utils.aoa_to_sheet(lookupsData);
  setColumnWidths(lookupsSheet, [25, 30, 25, 30, 35, 15, 15, 15, 10, 15, 10, 15, 10, 8]);
  XLSX.utils.book_append_sheet(workbook, lookupsSheet, '_Lookups');

  // ============================================================
  // 2. INSTRUCTIONS SHEET
  // ============================================================
  const instructionsData = [
    ['StratOS AI - Strategic Portfolio Management'],
    ['Comprehensive Data Import/Export Template v3.0'],
    [''],
    ['=== HOW TO USE THIS TEMPLATE ==='],
    [''],
    ['This template allows you to import/export ALL data entities in StratOS AI.'],
    ['Each entity has a Reference sheet (read-only) and an Input sheet (for new data).'],
    [''],
    ['=== SHEET OVERVIEW ==='],
    [''],
    ['REFERENCE SHEETS (Read-only - shows current data):'],
    ['  1. Pillars (Ref)      - BSC Strategy Pillars'],
    ['  2. KPIs (Ref)         - Strategic KPIs for each pillar'],
    ['  3. Initiatives (Ref)  - Programs/portfolios'],
    ['  4. Resources (Ref)    - Team members'],
    ['  5. Projects (Ref)     - Existing projects'],
    ['  6. Tasks (Ref)        - Existing tasks with WBS structure'],
    ['  7. Milestones (Ref)   - Project milestones'],
    [''],
    ['INPUT SHEETS (Fill these to add new data):'],
    ['  A. Pillars (Input)    - Add new strategy pillars'],
    ['  B. KPIs (Input)       - Add new KPIs'],
    ['  C. Initiatives (Input)- Add new initiatives'],
    ['  D. Resources (Input)  - Add new team members'],
    ['  E. Projects (Input)   - Add new projects'],
    ['  F. Tasks (Input)      - Add new tasks (supports WBS hierarchy)'],
    ['  G. Milestones (Input) - Add project milestones'],
    [''],
    ['=== WORK ID FORMAT ==='],
    ['Format: [DEPT]-[YY]-[CATEGORY]-[SEQ]'],
    ['Example: IT-25-GROW-001'],
    [''],
    ['Departments: FIN, MKT, OPS, IT, HR, SAL, PRD, ENG, LEG, ADM'],
    ['Categories: RUN (Operations), GROW (Expansion), TRNS (Transform)'],
    [''],
    ['=== WBS (WORK BREAKDOWN STRUCTURE) ==='],
    ['Tasks can be organized hierarchically using Parent Task field.'],
    ['WBS codes are auto-generated (e.g., 1.2.3) based on hierarchy.'],
    ['Tasks can have dependencies on other tasks.'],
    [''],
    ['=== FIELD MARKERS ==='],
    ['* = Required field'],
    ['(dropdown) = Use dropdown list for valid values'],
    [''],
    ['=== IMPORTANT NOTES ==='],
    ['- Use dropdown lists when available to ensure data integrity'],
    ['- Dates should be in YYYY-MM-DD format (e.g., 2025-06-15)'],
    ['- Delete example rows before importing'],
    ['- Duplicate entries (same name) will be skipped'],
    [''],
    ['Generated: ' + new Date().toLocaleString()],
    ['Version: 3.0 - Full Entity Support with WBS'],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  setColumnWidths(instructionsSheet, [90]);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, '0. Instructions');

  // ============================================================
  // 3. PILLARS REFERENCE SHEET
  // ============================================================
  const pillarsRefData = [
    ['#', 'ID', 'Pillar Name', 'Description', 'RAG Status', 'Display Order'],
    ...state.pillars.map((p, idx) => [
      idx + 1,
      p.id,
      p.name,
      p.description,
      p.ragStatus.toUpperCase(),
      p.displayOrder,
    ]),
  ];
  const pillarsRefSheet = XLSX.utils.aoa_to_sheet(pillarsRefData);
  setColumnWidths(pillarsRefSheet, [5, 40, 30, 50, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, pillarsRefSheet, '1. Pillars (Ref)');

  // ============================================================
  // 4. KPIS REFERENCE SHEET
  // ============================================================
  const kpisRefData = [
    ['#', 'ID', 'KPI Name', 'Linked Pillar', 'Target Value', 'Current Value', 'Previous Value', 'Unit', 'Last Updated'],
    ...state.kpis.map((k, idx) => {
      const pillar = state.pillars.find(p => p.id === k.pillarId);
      return [
        idx + 1,
        k.id,
        k.name,
        pillar?.name || '',
        k.targetValue,
        k.currentValue,
        k.previousValue,
        k.unit,
        k.lastUpdated,
      ];
    }),
  ];
  const kpisRefSheet = XLSX.utils.aoa_to_sheet(kpisRefData);
  setColumnWidths(kpisRefSheet, [5, 40, 30, 25, 12, 12, 12, 10, 12]);
  XLSX.utils.book_append_sheet(workbook, kpisRefSheet, '2. KPIs (Ref)');

  // ============================================================
  // 5. INITIATIVES REFERENCE SHEET
  // ============================================================
  const initiativesRefData = [
    ['#', 'ID', 'Initiative Name', 'Linked Pillar', 'Description', 'Owner', 'Start Date', 'End Date', 'Budget ($)', 'Spent ($)', 'RAG Status', 'Linked KPIs'],
    ...state.initiatives.map((init, idx) => {
      const pillar = state.pillars.find((p) => p.id === init.pillarId);
      const owner = state.resources.find((r) => r.id === init.ownerId);
      const linkedKpis = init.linkedKpiIds?.map(id => state.kpis.find(k => k.id === id)?.name).filter(Boolean).join('; ') || '';
      return [
        idx + 1,
        init.id,
        init.name,
        pillar?.name || '',
        init.description,
        owner?.name || '',
        init.startDate,
        init.endDate,
        init.budget,
        init.spentBudget,
        init.ragStatus.toUpperCase(),
        linkedKpis,
      ];
    }),
  ];
  const initiativesRefSheet = XLSX.utils.aoa_to_sheet(initiativesRefData);
  setColumnWidths(initiativesRefSheet, [5, 40, 35, 25, 40, 20, 12, 12, 12, 12, 12, 30]);
  XLSX.utils.book_append_sheet(workbook, initiativesRefSheet, '3. Initiatives (Ref)');

  // ============================================================
  // 6. RESOURCES REFERENCE SHEET
  // ============================================================
  const resourcesRefData = [
    ['#', 'ID', 'Resource Name', 'Email', 'Role', 'Team', 'Department', 'Weekly Capacity (hrs)', 'Hourly Rate ($)', 'Avatar Color'],
    ...state.resources.map((r, idx) => {
      const deptInfo = DEPARTMENTS[r.departmentCode];
      return [
        idx + 1,
        r.id,
        r.name,
        r.email,
        r.role,
        r.team,
        `${r.departmentCode} - ${deptInfo?.name || ''}`,
        r.weeklyCapacity,
        r.hourlyRate || 75,
        r.avatarColor,
      ];
    }),
  ];
  const resourcesRefSheet = XLSX.utils.aoa_to_sheet(resourcesRefData);
  setColumnWidths(resourcesRefSheet, [5, 40, 25, 30, 25, 20, 25, 18, 15, 12]);
  XLSX.utils.book_append_sheet(workbook, resourcesRefSheet, '4. Resources (Ref)');

  // ============================================================
  // 7. PROJECTS REFERENCE SHEET
  // ============================================================
  const projectsRefData = [
    ['#', 'ID', 'Work ID', 'Project Name', 'Initiative', 'Description', 'Department', 'Category', 'Fiscal Year', 'Seq #', 'Manager', 'Status', 'RAG', 'Start Date', 'End Date', 'Budget ($)', 'Spent ($)', 'Completion %'],
    ...state.projects.map((proj, idx) => {
      const init = state.initiatives.find((i) => i.id === proj.initiativeId);
      const manager = state.resources.find((r) => r.id === proj.managerId);
      const deptInfo = DEPARTMENTS[proj.departmentCode];
      const catInfo = PROJECT_CATEGORIES[proj.category];
      return [
        idx + 1,
        proj.id,
        proj.workId,
        proj.name,
        init?.name || '',
        proj.description,
        `${proj.departmentCode} - ${deptInfo?.name || ''}`,
        `${proj.category} - ${catInfo?.name || ''}`,
        proj.fiscalYear,
        proj.sequenceNumber,
        manager?.name || '',
        proj.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        proj.ragStatus.toUpperCase(),
        proj.startDate,
        proj.endDate,
        proj.budget,
        proj.spentBudget,
        proj.completionPercentage,
      ];
    }),
  ];
  const projectsRefSheet = XLSX.utils.aoa_to_sheet(projectsRefData);
  setColumnWidths(projectsRefSheet, [5, 40, 18, 30, 25, 40, 22, 20, 10, 8, 20, 15, 8, 12, 12, 12, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, projectsRefSheet, '5. Projects (Ref)');

  // ============================================================
  // 8. TASKS REFERENCE SHEET (with WBS fields)
  // ============================================================
  const tasksRefData = [
    ['#', 'ID', 'WBS Code', 'Task Title', 'Project', 'Parent Task', 'Description', 'Assignee', 'Department', 'Status', 'Priority', 'Is Milestone', 'Start Date', 'Due Date', 'Est. Hours', 'Actual Hours', 'Planned Hours', 'Deliverable', 'Dependencies', 'Sort Order'],
    ...state.tasks.map((t, idx) => {
      const project = state.projects.find(p => p.id === t.projectId);
      const parentTask = t.parentTaskId ? state.tasks.find(pt => pt.id === t.parentTaskId) : null;
      const assignee = state.resources.find(r => r.id === t.assigneeId);
      const dependencies = t.dependsOn?.map(id => state.tasks.find(dt => dt.id === id)?.title).filter(Boolean).join('; ') || '';
      return [
        idx + 1,
        t.id,
        t.wbsCode || '',
        t.title,
        project?.name || '',
        parentTask?.title || '',
        t.description,
        assignee?.name || '',
        t.departmentCode || '',
        t.kanbanStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        t.priority || 'Medium',
        t.isMilestone ? 'Yes' : 'No',
        t.startDate || '',
        t.dueDate,
        t.estimatedHours,
        t.actualHours,
        t.plannedHours || '',
        t.deliverable || '',
        dependencies,
        t.sortOrder ?? '',
      ];
    }),
  ];
  const tasksRefSheet = XLSX.utils.aoa_to_sheet(tasksRefData);
  setColumnWidths(tasksRefSheet, [5, 40, 10, 35, 25, 25, 40, 20, 10, 12, 10, 12, 12, 12, 10, 10, 10, 30, 30, 8]);
  XLSX.utils.book_append_sheet(workbook, tasksRefSheet, '6. Tasks (Ref)');

  // ============================================================
  // 9. MILESTONES REFERENCE SHEET
  // ============================================================
  const milestonesRefData = [
    ['#', 'ID', 'Milestone Name', 'Project', 'Description', 'Target Date', 'Completed Date', 'Status', 'Linked Tasks', 'Display Order'],
    ...(state.milestones || []).map((m, idx) => {
      const project = state.projects.find(p => p.id === m.projectId);
      const linkedTasks = m.linkedTaskIds?.map(id => state.tasks.find(t => t.id === id)?.title).filter(Boolean).join('; ') || '';
      return [
        idx + 1,
        m.id,
        m.name,
        project?.name || '',
        m.description || '',
        m.targetDate,
        m.completedDate || '',
        m.status.charAt(0).toUpperCase() + m.status.slice(1),
        linkedTasks,
        m.displayOrder,
      ];
    }),
  ];
  const milestonesRefSheet = XLSX.utils.aoa_to_sheet(milestonesRefData);
  setColumnWidths(milestonesRefSheet, [5, 40, 30, 25, 40, 12, 12, 12, 40, 12]);
  XLSX.utils.book_append_sheet(workbook, milestonesRefSheet, '7. Milestones (Ref)');

  // ============================================================
  // INPUT SHEETS
  // ============================================================

  // ============================================================
  // A. PILLARS INPUT SHEET
  // ============================================================
  const pillarsInputHeaders = [
    'Pillar Name *',
    'Description *',
    'RAG Status (dropdown)',
    'Display Order',
  ];
  const pillarsInputData = [
    pillarsInputHeaders,
    ['Example: Innovation & Technology', 'Drive digital transformation and technological advancement', 'GREEN', '5'],
    ['(Delete this example row)', '', '', ''],
    ...Array(10).fill(['', '', '', '']),
  ];
  const pillarsInputSheet = XLSX.utils.aoa_to_sheet(pillarsInputData);
  setColumnWidths(pillarsInputSheet, [35, 50, 20, 15]);
  XLSX.utils.book_append_sheet(workbook, pillarsInputSheet, 'A. Pillars (Input)');

  // ============================================================
  // B. KPIS INPUT SHEET
  // ============================================================
  const kpisInputHeaders = [
    'KPI Name *',
    'Linked Pillar * (dropdown)',
    'Target Value *',
    'Current Value',
    'Previous Value',
    'Unit (dropdown)',
  ];
  const kpisInputData = [
    kpisInputHeaders,
    ['Customer Satisfaction Score', 'Customer', '95', '88', '85', 'score'],
    ['(Delete this example row)', '', '', '', '', ''],
    ...Array(20).fill(['', '', '', '', '', '']),
  ];
  const kpisInputSheet = XLSX.utils.aoa_to_sheet(kpisInputData);
  setColumnWidths(kpisInputSheet, [35, 25, 15, 15, 15, 12]);
  XLSX.utils.book_append_sheet(workbook, kpisInputSheet, 'B. KPIs (Input)');

  // ============================================================
  // C. INITIATIVES INPUT SHEET
  // ============================================================
  const initiativesInputHeaders = [
    'Initiative Name *',
    'Linked Pillar * (dropdown)',
    'Description',
    'Owner (dropdown)',
    'Start Date',
    'End Date',
    'Budget ($)',
    'RAG Status (dropdown)',
    'Linked KPIs (semicolon-separated)',
  ];
  const initiativesInputData = [
    initiativesInputHeaders,
    ['Digital Transformation Program', 'Internal Processes', 'Transform core business processes through technology', 'John Smith', '2025-01-01', '2025-12-31', '500000', 'GREEN', 'Process Efficiency; Customer Satisfaction Score'],
    ['(Delete this example row)', '', '', '', '', '', '', '', ''],
    ...Array(15).fill(['', '', '', '', '', '', '', '', '']),
  ];
  const initiativesInputSheet = XLSX.utils.aoa_to_sheet(initiativesInputData);
  setColumnWidths(initiativesInputSheet, [35, 25, 40, 20, 12, 12, 12, 15, 35]);
  XLSX.utils.book_append_sheet(workbook, initiativesInputSheet, 'C. Initiatives (Input)');

  // ============================================================
  // D. RESOURCES INPUT SHEET
  // ============================================================
  const resourcesInputHeaders = [
    'Name *',
    'Email *',
    'Role *',
    'Team',
    'Department * (dropdown)',
    'Weekly Capacity (hrs)',
    'Hourly Rate ($)',
  ];
  const resourcesInputData = [
    resourcesInputHeaders,
    ['Jane Doe', 'jane.doe@company.com', 'Senior Developer', 'Engineering', 'ENG', '40', '85'],
    ['(Delete this example row)', '', '', '', '', '', ''],
    ...Array(20).fill(['', '', '', '', '', '', '']),
  ];
  const resourcesInputSheet = XLSX.utils.aoa_to_sheet(resourcesInputData);
  setColumnWidths(resourcesInputSheet, [25, 30, 25, 20, 15, 18, 15]);
  XLSX.utils.book_append_sheet(workbook, resourcesInputSheet, 'D. Resources (Input)');

  // ============================================================
  // E. PROJECTS INPUT SHEET
  // ============================================================
  const projectInputHeaders = [
    'Project Name *',
    'Initiative * (dropdown)',
    'Description',
    'Project Manager (dropdown)',
    'Department * (dropdown)',
    'Category * (dropdown)',
    'Fiscal Year',
    'Start Date',
    'End Date',
    'Budget ($)',
    'Status (dropdown)',
    'RAG Status (dropdown)',
  ];
  const projectInputData = [
    projectInputHeaders,
    ['Data Migration Project', 'Digital Transformation Program', 'Migrate legacy data to new platform', 'John Smith', 'IT', 'TRNS', '2025', '2025-01-15', '2025-06-30', '50000', 'Not Started', 'GREEN'],
    ['(Delete this example row)', '', '', '', '', '', '', '', '', '', '', ''],
    ...Array(25).fill(['', '', '', '', '', '', '', '', '', '', '', '']),
  ];
  const projectInputSheet = XLSX.utils.aoa_to_sheet(projectInputData);
  setColumnWidths(projectInputSheet, [35, 30, 40, 20, 12, 12, 10, 12, 12, 12, 15, 12]);
  XLSX.utils.book_append_sheet(workbook, projectInputSheet, 'E. Projects (Input)');

  // ============================================================
  // F. TASKS INPUT SHEET (with all WBS fields)
  // ============================================================
  const taskInputHeaders = [
    'Task Title *',
    'Project * (dropdown)',
    'Parent Task (dropdown)',
    'Description',
    'Assignee (dropdown)',
    'Department (dropdown)',
    'Status (dropdown)',
    'Priority (dropdown)',
    'Is Milestone (dropdown)',
    'Start Date',
    'Due Date',
    'Estimated Hours',
    'Planned Hours',
    'Deliverable',
    'Dependencies (semicolon-separated task titles)',
  ];
  const taskInputData = [
    taskInputHeaders,
    ['Set up development environment', 'Data Migration Project', '', 'Install required tools and configure access', 'John Smith', 'IT', 'To Do', 'High', 'No', '2025-01-15', '2025-02-01', '8', '8', 'Development environment ready', ''],
    ['Database schema design', 'Data Migration Project', '', 'Design new database schema', 'Jane Doe', 'ENG', 'To Do', 'Critical', 'Yes', '2025-01-20', '2025-02-15', '40', '40', 'Database schema document', 'Set up development environment'],
    ['Data extraction scripts', 'Data Migration Project', 'Database schema design', 'Write scripts to extract data from legacy system', 'John Smith', 'IT', 'To Do', 'High', 'No', '2025-02-15', '2025-03-01', '24', '24', 'Extraction scripts', 'Database schema design'],
    ['(Delete example rows above)', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ...Array(50).fill(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']),
  ];
  const taskInputSheet = XLSX.utils.aoa_to_sheet(taskInputData);
  setColumnWidths(taskInputSheet, [35, 25, 25, 40, 20, 12, 15, 10, 12, 12, 12, 12, 12, 30, 35]);
  XLSX.utils.book_append_sheet(workbook, taskInputSheet, 'F. Tasks (Input)');

  // ============================================================
  // G. MILESTONES INPUT SHEET
  // ============================================================
  const milestoneInputHeaders = [
    'Milestone Name *',
    'Project * (dropdown)',
    'Description',
    'Target Date *',
    'Status (dropdown)',
    'Linked Tasks (semicolon-separated task titles)',
    'Display Order',
  ];
  const milestoneInputData = [
    milestoneInputHeaders,
    ['Phase 1 Complete', 'Data Migration Project', 'All Phase 1 deliverables completed and signed off', '2025-03-31', 'Pending', 'Database schema design; Data extraction scripts', '1'],
    ['Go Live', 'Data Migration Project', 'System goes live in production', '2025-06-30', 'Pending', '', '2'],
    ['(Delete example rows above)', '', '', '', '', '', ''],
    ...Array(20).fill(['', '', '', '', '', '', '']),
  ];
  const milestoneInputSheet = XLSX.utils.aoa_to_sheet(milestoneInputData);
  setColumnWidths(milestoneInputSheet, [30, 25, 40, 12, 12, 40, 12]);
  XLSX.utils.book_append_sheet(workbook, milestoneInputSheet, 'G. Milestones (Input)');

  // ============================================================
  // CODES REFERENCE SHEET
  // ============================================================
  const codesRefData = [
    ['DEPARTMENT CODES', '', '', 'PROJECT CATEGORIES', '', ''],
    ['Code', 'Name', '', 'Code', 'Name', 'Description'],
    ...Array.from({ length: Math.max(departmentCodes.length, categoryCodes.length) }).map((_, i) => {
      const deptCode = departmentCodes[i];
      const catCode = categoryCodes[i];
      return [
        deptCode || '',
        deptCode ? DEPARTMENTS[deptCode].name : '',
        '',
        catCode || '',
        catCode ? PROJECT_CATEGORIES[catCode].name : '',
        catCode ? PROJECT_CATEGORIES[catCode].description : '',
      ];
    }),
    [''],
    ['STATUS OPTIONS', '', '', 'PRIORITY LEVELS', '', ''],
    ['Project Status', 'Task Status', '', 'Code', 'Description', ''],
    ['Not Started', 'To Do', '', 'Low', 'Low priority - can be deferred', ''],
    ['In Progress', 'In Progress', '', 'Medium', 'Normal priority', ''],
    ['On Hold', 'Blocked', '', 'High', 'High priority - needs attention', ''],
    ['Completed', 'Done', '', 'Critical', 'Critical - immediate attention required', ''],
    ['Cancelled', '', '', '', '', ''],
    [''],
    ['RAG STATUS', '', '', 'KPI UNITS', '', ''],
    ['Code', 'Meaning', '', 'Code', 'Description', ''],
    ['GREEN', 'On track', '', '%', 'Percentage', ''],
    ['AMBER', 'At risk', '', '$', 'Currency (dollars)', ''],
    ['RED', 'Off track', '', 'score', 'Score/rating', ''],
    ['', '', '', 'number', 'Numeric count', ''],
  ];
  const codesRefSheet = XLSX.utils.aoa_to_sheet(codesRefData);
  setColumnWidths(codesRefSheet, [15, 25, 5, 15, 20, 45]);
  XLSX.utils.book_append_sheet(workbook, codesRefSheet, 'Z. Codes Reference');

  // ============================================================
  // SUMMARY DASHBOARD SHEET
  // ============================================================
  const summaryData = [
    ['StratOS AI - Portfolio Summary'],
    [''],
    ['CURRENT STATE OVERVIEW'],
    [''],
    ['Entity', 'Count', 'Details'],
    ['Strategy Pillars', state.pillars.length, state.pillars.map(p => p.name).join(', ')],
    ['KPIs', state.kpis.length, `Avg Achievement: ${state.kpis.length > 0 ? Math.round(state.kpis.reduce((sum, k) => sum + (k.currentValue / k.targetValue * 100), 0) / state.kpis.length) : 0}%`],
    ['Initiatives', state.initiatives.length, `Green: ${state.initiatives.filter(i => i.ragStatus === 'green').length}, Amber: ${state.initiatives.filter(i => i.ragStatus === 'amber').length}, Red: ${state.initiatives.filter(i => i.ragStatus === 'red').length}`],
    ['Projects', state.projects.length, `Green: ${state.projects.filter(p => p.ragStatus === 'green').length}, Amber: ${state.projects.filter(p => p.ragStatus === 'amber').length}, Red: ${state.projects.filter(p => p.ragStatus === 'red').length}`],
    ['Tasks', state.tasks.length, `Todo: ${state.tasks.filter(t => t.kanbanStatus === 'todo').length}, In Progress: ${state.tasks.filter(t => t.kanbanStatus === 'in_progress').length}, Blocked: ${state.tasks.filter(t => t.kanbanStatus === 'blocked').length}, Done: ${state.tasks.filter(t => t.kanbanStatus === 'done').length}`],
    ['Milestones', (state.milestones || []).length, `Pending: ${(state.milestones || []).filter(m => m.status === 'pending').length}, Completed: ${(state.milestones || []).filter(m => m.status === 'completed').length}`],
    ['Resources', state.resources.length, [...new Set(state.resources.map(r => r.departmentCode))].join(', ')],
    [''],
    ['BUDGET SUMMARY'],
    [''],
    ['Level', 'Total Budget', 'Total Spent', 'Variance', 'Utilization %'],
    ['Initiatives', state.initiatives.reduce((sum, i) => sum + i.budget, 0), state.initiatives.reduce((sum, i) => sum + i.spentBudget, 0), state.initiatives.reduce((sum, i) => sum + (i.spentBudget - i.budget), 0), state.initiatives.length > 0 ? `${Math.round(state.initiatives.reduce((sum, i) => sum + i.spentBudget, 0) / state.initiatives.reduce((sum, i) => sum + i.budget, 0) * 100)}%` : '0%'],
    ['Projects', state.projects.reduce((sum, p) => sum + p.budget, 0), state.projects.reduce((sum, p) => sum + p.spentBudget, 0), state.projects.reduce((sum, p) => sum + (p.spentBudget - p.budget), 0), state.projects.length > 0 ? `${Math.round(state.projects.reduce((sum, p) => sum + p.spentBudget, 0) / state.projects.reduce((sum, p) => sum + p.budget, 0) * 100)}%` : '0%'],
    [''],
    ['HOURS SUMMARY'],
    [''],
    ['Metric', 'Value'],
    ['Total Estimated Hours', state.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)],
    ['Total Actual Hours', state.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)],
    ['Total Planned Hours', state.tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0)],
    ['Total Weekly Capacity', state.resources.reduce((sum, r) => sum + r.weeklyCapacity, 0)],
    [''],
    ['PROJECTS BY DEPARTMENT'],
    [''],
    ...departmentCodes.map(code => {
      const deptProjects = state.projects.filter(p => p.departmentCode === code);
      return [DEPARTMENTS[code].name, deptProjects.length, deptProjects.map(p => p.workId).join(', ')];
    }),
    [''],
    ['PROJECTS BY CATEGORY'],
    [''],
    ...categoryCodes.map(code => {
      const catProjects = state.projects.filter(p => p.category === code);
      return [PROJECT_CATEGORIES[code].name, catProjects.length, catProjects.map(p => p.workId).join(', ')];
    }),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  setColumnWidths(summarySheet, [25, 15, 15, 15, 40]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Dashboard');

  // Generate the file
  const fileName = `StratOS_AI_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// ============================================================
// FULL DATA EXPORT (Backup)
// ============================================================
export const exportFullData = (state: AppState): void => {
  const workbook = XLSX.utils.book_new();

  // Export Pillars with formatted headers
  const pillarsData = state.pillars.map(p => ({
    'ID': p.id,
    'Name': p.name,
    'Description': p.description,
    'Display Order': p.displayOrder,
    'RAG Status': p.ragStatus,
  }));
  const pillarsSheet = XLSX.utils.json_to_sheet(pillarsData);
  setColumnWidths(pillarsSheet, [40, 30, 50, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, pillarsSheet, 'Pillars');

  // Export KPIs
  const kpisData = state.kpis.map(k => {
    const pillar = state.pillars.find(p => p.id === k.pillarId);
    return {
      'ID': k.id,
      'Pillar': pillar?.name || '',
      'Pillar ID': k.pillarId,
      'Name': k.name,
      'Target Value': k.targetValue,
      'Current Value': k.currentValue,
      'Previous Value': k.previousValue,
      'Unit': k.unit,
      'Last Updated': k.lastUpdated,
    };
  });
  const kpisSheet = XLSX.utils.json_to_sheet(kpisData);
  setColumnWidths(kpisSheet, [40, 25, 40, 30, 12, 12, 12, 10, 12]);
  XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

  // Export Initiatives
  const initiativesData = state.initiatives.map(i => {
    const pillar = state.pillars.find(p => p.id === i.pillarId);
    const owner = state.resources.find(r => r.id === i.ownerId);
    return {
      'ID': i.id,
      'Pillar': pillar?.name || '',
      'Pillar ID': i.pillarId,
      'Name': i.name,
      'Description': i.description,
      'Owner': owner?.name || '',
      'Owner ID': i.ownerId,
      'Start Date': i.startDate,
      'End Date': i.endDate,
      'Budget': i.budget,
      'Spent Budget': i.spentBudget,
      'RAG Status': i.ragStatus,
      'Linked KPI IDs': i.linkedKpiIds?.join('; ') || '',
    };
  });
  const initiativesSheet = XLSX.utils.json_to_sheet(initiativesData);
  setColumnWidths(initiativesSheet, [40, 25, 40, 30, 50, 20, 40, 12, 12, 12, 12, 10, 40]);
  XLSX.utils.book_append_sheet(workbook, initiativesSheet, 'Initiatives');

  // Export Projects with all new fields
  const projectsData = state.projects.map(p => {
    const init = state.initiatives.find(i => i.id === p.initiativeId);
    const manager = state.resources.find(r => r.id === p.managerId);
    return {
      'ID': p.id,
      'Work ID': p.workId,
      'Initiative': init?.name || '',
      'Initiative ID': p.initiativeId,
      'Name': p.name,
      'Description': p.description,
      'Manager': manager?.name || '',
      'Manager ID': p.managerId,
      'Department': p.departmentCode,
      'Category': p.category,
      'Fiscal Year': p.fiscalYear,
      'Sequence #': p.sequenceNumber,
      'Status': p.status,
      'RAG Status': p.ragStatus,
      'Start Date': p.startDate,
      'End Date': p.endDate,
      'Budget': p.budget,
      'Spent Budget': p.spentBudget,
      'Completion %': p.completionPercentage,
    };
  });
  const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
  setColumnWidths(projectsSheet, [40, 18, 25, 40, 30, 40, 20, 40, 10, 10, 10, 10, 15, 10, 12, 12, 12, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

  // Export Tasks with all WBS fields
  const tasksData = state.tasks.map(t => {
    const project = state.projects.find(p => p.id === t.projectId);
    const assignee = state.resources.find(r => r.id === t.assigneeId);
    const parentTask = t.parentTaskId ? state.tasks.find(pt => pt.id === t.parentTaskId) : null;
    return {
      'ID': t.id,
      'Project': project?.name || '',
      'Project ID': t.projectId,
      'Project Work ID': project?.workId || '',
      'WBS Code': t.wbsCode || '',
      'Title': t.title,
      'Description': t.description,
      'Parent Task': parentTask?.title || '',
      'Parent Task ID': t.parentTaskId || '',
      'Assignee': assignee?.name || '',
      'Assignee ID': t.assigneeId,
      'Department': t.departmentCode || '',
      'Status': t.kanbanStatus,
      'Priority': t.priority || 'medium',
      'Is Milestone': t.isMilestone ? 'Yes' : 'No',
      'Start Date': t.startDate || '',
      'Due Date': t.dueDate,
      'Estimated Hours': t.estimatedHours,
      'Actual Hours': t.actualHours,
      'Planned Hours': t.plannedHours || '',
      'Deliverable': t.deliverable || '',
      'Dependencies': t.dependsOn?.join('; ') || '',
      'Sort Order': t.sortOrder ?? '',
    };
  });
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
  setColumnWidths(tasksSheet, [40, 25, 40, 18, 10, 35, 50, 25, 40, 20, 40, 10, 12, 10, 12, 12, 12, 12, 12, 12, 30, 40, 8]);
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  // Export Milestones
  const milestonesData = (state.milestones || []).map(m => {
    const project = state.projects.find(p => p.id === m.projectId);
    return {
      'ID': m.id,
      'Project': project?.name || '',
      'Project ID': m.projectId,
      'Name': m.name,
      'Description': m.description || '',
      'Target Date': m.targetDate,
      'Completed Date': m.completedDate || '',
      'Status': m.status,
      'Linked Task IDs': m.linkedTaskIds?.join('; ') || '',
      'Display Order': m.displayOrder,
    };
  });
  const milestonesSheet = XLSX.utils.json_to_sheet(milestonesData);
  setColumnWidths(milestonesSheet, [40, 25, 40, 30, 40, 12, 12, 12, 50, 12]);
  XLSX.utils.book_append_sheet(workbook, milestonesSheet, 'Milestones');

  // Export Resources
  const resourcesData = state.resources.map(r => ({
    'ID': r.id,
    'Name': r.name,
    'Email': r.email,
    'Role': r.role,
    'Team': r.team,
    'Department': r.departmentCode,
    'Weekly Capacity': r.weeklyCapacity,
    'Hourly Rate': r.hourlyRate || 75,
    'Avatar Color': r.avatarColor,
  }));
  const resourcesSheet = XLSX.utils.json_to_sheet(resourcesData);
  setColumnWidths(resourcesSheet, [40, 25, 30, 25, 20, 10, 15, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources');

  // Add summary sheet
  const summaryData = [
    ['StratOS AI - Full Data Export'],
    [''],
    ['Export Date:', new Date().toLocaleString()],
    [''],
    ['Data Summary:'],
    ['Pillars:', state.pillars.length],
    ['KPIs:', state.kpis.length],
    ['Initiatives:', state.initiatives.length],
    ['Projects:', state.projects.length],
    ['Tasks:', state.tasks.length],
    ['Milestones:', (state.milestones || []).length],
    ['Resources:', state.resources.length],
    [''],
    ['This file can be used as a backup.'],
    ['To restore, use the Import feature in StratOS AI.'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  setColumnWidths(summarySheet, [20, 30]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '_Summary');

  const fileName = `StratOS_AI_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// ============================================================
// STRATEGIC CASCADE EXPORT
// ============================================================
export const exportStrategicCascade = (state: AppState): void => {
  const workbook = XLSX.utils.book_new();

  // Create a hierarchical view: Pillar -> Initiative -> Project -> Tasks
  const cascadeData: any[][] = [
    ['Strategic Cascade - Golden Thread View'],
    [''],
    ['Level', 'Name', 'Work ID', 'Parent', 'RAG/Status', 'Budget', 'Spent', 'Completion', 'Owner/Manager', 'WBS Code'],
  ];

  state.pillars.forEach(pillar => {
    // Add Pillar row
    cascadeData.push([
      'PILLAR',
      pillar.name,
      '-',
      '-',
      pillar.ragStatus.toUpperCase(),
      '-',
      '-',
      '-',
      '-',
      '-',
    ]);

    // Get initiatives for this pillar
    const pillarInits = state.initiatives.filter(i => i.pillarId === pillar.id);
    pillarInits.forEach(init => {
      const owner = state.resources.find(r => r.id === init.ownerId);
      cascadeData.push([
        '  INITIATIVE',
        init.name,
        '-',
        pillar.name,
        init.ragStatus.toUpperCase(),
        init.budget,
        init.spentBudget,
        '-',
        owner?.name || '-',
        '-',
      ]);

      // Get projects for this initiative
      const initProjects = state.projects.filter(p => p.initiativeId === init.id);
      initProjects.forEach(project => {
        const manager = state.resources.find(r => r.id === project.managerId);
        cascadeData.push([
          '    PROJECT',
          project.name,
          project.workId,
          init.name,
          project.ragStatus.toUpperCase(),
          project.budget,
          project.spentBudget,
          `${project.completionPercentage}%`,
          manager?.name || '-',
          '-',
        ]);

        // Get root tasks for this project (no parent)
        const rootTasks = state.tasks.filter(t => t.projectId === project.id && !t.parentTaskId);

        // Recursive function to add tasks with hierarchy
        const addTasksRecursively = (tasks: typeof state.tasks, indent: string) => {
          tasks.forEach(task => {
            const assignee = state.resources.find(r => r.id === task.assigneeId);
            cascadeData.push([
              `${indent}TASK${task.isMilestone ? ' (MS)' : ''}`,
              task.title,
              '-',
              project.workId,
              task.kanbanStatus.replace('_', ' ').toUpperCase(),
              '-',
              '-',
              task.kanbanStatus === 'done' ? '100%' : '-',
              assignee?.name || '-',
              task.wbsCode || '-',
            ]);

            // Get child tasks
            const childTasks = state.tasks.filter(t => t.parentTaskId === task.id);
            if (childTasks.length > 0) {
              addTasksRecursively(childTasks, indent + '  ');
            }
          });
        };

        addTasksRecursively(rootTasks, '      ');
      });
    });

    // Add blank row between pillars
    cascadeData.push(['', '', '', '', '', '', '', '', '', '']);
  });

  const cascadeSheet = XLSX.utils.aoa_to_sheet(cascadeData);
  setColumnWidths(cascadeSheet, [20, 40, 18, 30, 15, 12, 12, 12, 20, 10]);
  XLSX.utils.book_append_sheet(workbook, cascadeSheet, 'Strategic Cascade');

  const fileName = `StratOS_AI_Strategic_Cascade_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
