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

  // Build lookup data with named columns
  const maxLen = Math.max(
    state.pillars.length,
    state.initiatives.length,
    state.resources.length,
    state.projects.length,
    departmentCodes.length,
    categoryCodes.length,
    statusOptions.length,
    ragOptions.length,
    kanbanOptions.length
  );

  const lookupsData = [
    ['Pillars', 'Initiatives', 'Resources', 'Projects', 'Departments', 'Categories', 'ProjectStatus', 'RAGStatus', 'TaskStatus'],
    ...Array.from({ length: maxLen }).map((_, i) => [
      state.pillars[i]?.name || '',
      state.initiatives[i]?.name || '',
      state.resources[i]?.name || '',
      state.projects[i]?.name || '',
      departmentCodes[i] || '',
      categoryCodes[i] || '',
      statusOptions[i] || '',
      ragOptions[i] || '',
      kanbanOptions[i] || '',
    ]),
  ];
  const lookupsSheet = XLSX.utils.aoa_to_sheet(lookupsData);
  setColumnWidths(lookupsSheet, [25, 30, 25, 30, 15, 15, 15, 10, 15]);
  XLSX.utils.book_append_sheet(workbook, lookupsSheet, '_Lookups');

  // ============================================================
  // 2. INSTRUCTIONS SHEET
  // ============================================================
  const instructionsData = [
    ['StratOS AI - Strategic Portfolio Management'],
    ['Data Import/Export Template'],
    [''],
    ['=== HOW TO USE THIS TEMPLATE ==='],
    [''],
    ['STEP 1: Review Reference Data'],
    ['  - Check the "1. Pillars", "2. Initiatives", and "3. Resources" tabs'],
    ['  - These contain your current BSC structure (read-only reference)'],
    [''],
    ['STEP 2: Add New Projects'],
    ['  - Go to the "4. Projects (Input)" tab'],
    ['  - Fill in project details using the dropdown lists'],
    ['  - Work ID will be auto-generated on import based on Dept/Category/Year'],
    [''],
    ['STEP 3: Add Tasks'],
    ['  - Go to the "5. Tasks (Input)" tab'],
    ['  - Link each task to a Project (existing or newly added)'],
    ['  - Assign resources from the dropdown'],
    [''],
    ['STEP 4: Import'],
    ['  - Save this file'],
    ['  - Go to StratOS AI > Import page'],
    ['  - Upload the file and review validation results'],
    [''],
    ['=== WORK ID FORMAT ==='],
    ['Format: [DEPT]-[YY]-[CATEGORY]-[SEQ]'],
    ['Example: IT-25-GROW-001'],
    [''],
    ['Departments: FIN, MKT, OPS, IT, HR, SAL, PRD, ENG, LEG, ADM'],
    ['Categories: RUN (Operations), GROW (Expansion), TRNS (Transform)'],
    [''],
    ['=== IMPORTANT NOTES ==='],
    ['- Required fields are marked with *'],
    ['- Use dropdown lists when available to ensure data integrity'],
    ['- Do not modify reference sheets (Pillars, Initiatives, Resources)'],
    ['- Projects/Tasks with matching names will be skipped as duplicates'],
    [''],
    ['Generated: ' + new Date().toLocaleString()],
    ['Version: 2.0 - Enterprise Project Management'],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  setColumnWidths(instructionsSheet, [80]);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, '0. Instructions');

  // ============================================================
  // 3. PILLARS REFERENCE SHEET
  // ============================================================
  const pillarsData = [
    ['#', 'Pillar Name', 'Description', 'RAG Status', 'Display Order'],
    ...state.pillars.map((p, idx) => [
      idx + 1,
      p.name,
      p.description,
      p.ragStatus.toUpperCase(),
      p.displayOrder,
    ]),
  ];
  const pillarsSheet = XLSX.utils.aoa_to_sheet(pillarsData);
  setColumnWidths(pillarsSheet, [5, 30, 50, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, pillarsSheet, '1. Pillars (Ref)');

  // ============================================================
  // 4. INITIATIVES REFERENCE SHEET
  // ============================================================
  const initiativesData = [
    ['#', 'Initiative Name', 'Linked Pillar', 'Owner', 'Start Date', 'End Date', 'Budget ($)', 'Spent ($)', 'RAG Status'],
    ...state.initiatives.map((init, idx) => {
      const pillar = state.pillars.find((p) => p.id === init.pillarId);
      const owner = state.resources.find((r) => r.id === init.ownerId);
      return [
        idx + 1,
        init.name,
        pillar?.name || '',
        owner?.name || '',
        init.startDate,
        init.endDate,
        init.budget,
        init.spentBudget,
        init.ragStatus.toUpperCase(),
      ];
    }),
  ];
  const initiativesSheet = XLSX.utils.aoa_to_sheet(initiativesData);
  setColumnWidths(initiativesSheet, [5, 35, 25, 20, 12, 12, 12, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, initiativesSheet, '2. Initiatives (Ref)');

  // ============================================================
  // 5. RESOURCES REFERENCE SHEET
  // ============================================================
  const resourcesData = [
    ['#', 'Resource Name', 'Role', 'Team', 'Department', 'Weekly Capacity (hrs)', 'Hourly Rate ($)'],
    ...state.resources.map((r, idx) => {
      const deptInfo = DEPARTMENTS[r.departmentCode];
      return [
        idx + 1,
        r.name,
        r.role,
        r.team,
        `${r.departmentCode} - ${deptInfo?.name || ''}`,
        r.weeklyCapacity,
        r.hourlyRate || 75,
      ];
    }),
  ];
  const resourcesSheet = XLSX.utils.aoa_to_sheet(resourcesData);
  setColumnWidths(resourcesSheet, [5, 25, 25, 20, 25, 18, 15]);
  XLSX.utils.book_append_sheet(workbook, resourcesSheet, '3. Resources (Ref)');

  // ============================================================
  // 6. EXISTING PROJECTS REFERENCE SHEET
  // ============================================================
  const existingProjectsData = [
    ['#', 'Work ID', 'Project Name', 'Initiative', 'Department', 'Category', 'Manager', 'Status', 'RAG', 'Start', 'End', 'Budget ($)', 'Spent ($)', 'Completion %'],
    ...state.projects.map((proj, idx) => {
      const init = state.initiatives.find((i) => i.id === proj.initiativeId);
      const manager = state.resources.find((r) => r.id === proj.managerId);
      const deptInfo = DEPARTMENTS[proj.departmentCode];
      const catInfo = PROJECT_CATEGORIES[proj.category];
      return [
        idx + 1,
        proj.workId,
        proj.name,
        init?.name || '',
        `${proj.departmentCode} - ${deptInfo?.name || ''}`,
        `${proj.category} - ${catInfo?.name || ''}`,
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
  const existingProjectsSheet = XLSX.utils.aoa_to_sheet(existingProjectsData);
  setColumnWidths(existingProjectsSheet, [5, 18, 30, 25, 22, 20, 20, 15, 8, 12, 12, 12, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, existingProjectsSheet, '4. Existing Projects');

  // ============================================================
  // 7. PROJECTS INPUT SHEET (for new projects)
  // ============================================================
  const projectInputHeaders = [
    'Project Name *',
    'Initiative Name *',
    'Project Manager',
    'Description',
    'Start Date',
    'End Date',
    'Budget ($)',
    'Status',
    'Department *',
    'Category *',
    'Fiscal Year',
  ];

  // Create example rows with formulas/hints
  const projectInputData = [
    projectInputHeaders,
    ['Example: Data Migration Project', 'Digital Transformation', 'John Smith', 'Migrate legacy data to new platform', '2025-01-15', '2025-06-30', '50000', 'Not Started', 'IT', 'TRNS', '2025'],
    ['(Delete this example row)', '', '', '', '', '', '', '', '', '', ''],
    ...Array(25).fill(['', '', '', '', '', '', '', '', '', '', '']),
  ];

  const projectInputSheet = XLSX.utils.aoa_to_sheet(projectInputData);
  setColumnWidths(projectInputSheet, [35, 30, 20, 40, 12, 12, 12, 15, 12, 12, 12]);

  // Add data validations
  const initiativeCount = state.initiatives.length;
  const resourceCount = state.resources.length;

  // Note: XLSX.js has limited support for data validation in the output
  // These are hints for users - actual dropdowns may not work in all Excel versions
  projectInputSheet['!dataValidation'] = [
    { sqref: 'B2:B100', type: 'list', formula1: `'_Lookups'!$B$2:$B$${initiativeCount + 1}` },
    { sqref: 'C2:C100', type: 'list', formula1: `'_Lookups'!$C$2:$C$${resourceCount + 1}` },
    { sqref: 'H2:H100', type: 'list', formula1: `'_Lookups'!$G$2:$G$6` },
    { sqref: 'I2:I100', type: 'list', formula1: `'_Lookups'!$E$2:$E$11` },
    { sqref: 'J2:J100', type: 'list', formula1: `'_Lookups'!$F$2:$F$4` },
  ];

  XLSX.utils.book_append_sheet(workbook, projectInputSheet, '5. Projects (Input)');

  // ============================================================
  // 8. TASKS INPUT SHEET
  // ============================================================
  const taskInputHeaders = [
    'Task Title *',
    'Project Name *',
    'Assignee',
    'Description',
    'Due Date',
    'Estimated Hours',
    'Status',
  ];

  // Combine existing and new project names for task assignment
  const allProjectNames = state.projects.map(p => p.name);

  const taskInputData = [
    taskInputHeaders,
    ['Example: Set up development environment', 'Example: Data Migration Project', 'John Smith', 'Install required tools and configure access', '2025-02-01', '8', 'To Do'],
    ['(Delete this example row)', '', '', '', '', '', ''],
    ...Array(50).fill(['', '', '', '', '', '', '']),
  ];

  const taskInputSheet = XLSX.utils.aoa_to_sheet(taskInputData);
  setColumnWidths(taskInputSheet, [40, 35, 20, 50, 12, 15, 15]);

  // Add data validations for tasks
  const projectCount = state.projects.length;
  taskInputSheet['!dataValidation'] = [
    { sqref: 'B2:B100', type: 'list', formula1: `'_Lookups'!$D$2:$D$${projectCount + 1}` },
    { sqref: 'C2:C100', type: 'list', formula1: `'_Lookups'!$C$2:$C$${resourceCount + 1}` },
    { sqref: 'G2:G100', type: 'list', formula1: `'_Lookups'!$I$2:$I$5` },
  ];

  XLSX.utils.book_append_sheet(workbook, taskInputSheet, '6. Tasks (Input)');

  // ============================================================
  // 9. DEPARTMENT & CATEGORY REFERENCE SHEET
  // ============================================================
  const deptCatData = [
    ['DEPARTMENT CODES', '', '', 'PROJECT CATEGORIES'],
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
  ];

  const deptCatSheet = XLSX.utils.aoa_to_sheet(deptCatData);
  setColumnWidths(deptCatSheet, [10, 25, 5, 10, 15, 45]);
  XLSX.utils.book_append_sheet(workbook, deptCatSheet, '7. Codes Reference');

  // ============================================================
  // 10. SUMMARY DASHBOARD SHEET
  // ============================================================
  const summaryData = [
    ['StratOS AI - Portfolio Summary'],
    [''],
    ['CURRENT STATE OVERVIEW'],
    [''],
    ['Entity', 'Count', 'Details'],
    ['Strategy Pillars', state.pillars.length, state.pillars.map(p => p.name).join(', ')],
    ['Initiatives', state.initiatives.length, `Green: ${state.initiatives.filter(i => i.ragStatus === 'green').length}, Amber: ${state.initiatives.filter(i => i.ragStatus === 'amber').length}, Red: ${state.initiatives.filter(i => i.ragStatus === 'red').length}`],
    ['Projects', state.projects.length, `Green: ${state.projects.filter(p => p.ragStatus === 'green').length}, Amber: ${state.projects.filter(p => p.ragStatus === 'amber').length}, Red: ${state.projects.filter(p => p.ragStatus === 'red').length}`],
    ['Tasks', state.tasks.length, `Todo: ${state.tasks.filter(t => t.kanbanStatus === 'todo').length}, In Progress: ${state.tasks.filter(t => t.kanbanStatus === 'in_progress').length}, Blocked: ${state.tasks.filter(t => t.kanbanStatus === 'blocked').length}, Done: ${state.tasks.filter(t => t.kanbanStatus === 'done').length}`],
    ['Resources', state.resources.length, [...new Set(state.resources.map(r => r.departmentCode))].join(', ')],
    [''],
    ['BUDGET SUMMARY'],
    [''],
    ['Level', 'Total Budget', 'Total Spent', 'Variance'],
    ['Initiatives', state.initiatives.reduce((sum, i) => sum + i.budget, 0), state.initiatives.reduce((sum, i) => sum + i.spentBudget, 0), state.initiatives.reduce((sum, i) => sum + (i.spentBudget - i.budget), 0)],
    ['Projects', state.projects.reduce((sum, p) => sum + p.budget, 0), state.projects.reduce((sum, p) => sum + p.spentBudget, 0), state.projects.reduce((sum, p) => sum + (p.spentBudget - p.budget), 0)],
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
  setColumnWidths(summarySheet, [25, 15, 60]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '8. Summary');

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
      'Name': k.name,
      'Target Value': k.targetValue,
      'Current Value': k.currentValue,
      'Previous Value': k.previousValue,
      'Unit': k.unit,
      'Last Updated': k.lastUpdated,
    };
  });
  const kpisSheet = XLSX.utils.json_to_sheet(kpisData);
  setColumnWidths(kpisSheet, [40, 25, 30, 12, 12, 12, 10, 12]);
  XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

  // Export Initiatives
  const initiativesData = state.initiatives.map(i => {
    const pillar = state.pillars.find(p => p.id === i.pillarId);
    const owner = state.resources.find(r => r.id === i.ownerId);
    return {
      'ID': i.id,
      'Pillar': pillar?.name || '',
      'Name': i.name,
      'Description': i.description,
      'Owner': owner?.name || '',
      'Start Date': i.startDate,
      'End Date': i.endDate,
      'Budget': i.budget,
      'Spent Budget': i.spentBudget,
      'RAG Status': i.ragStatus,
    };
  });
  const initiativesSheet = XLSX.utils.json_to_sheet(initiativesData);
  setColumnWidths(initiativesSheet, [40, 25, 30, 50, 20, 12, 12, 12, 12, 10]);
  XLSX.utils.book_append_sheet(workbook, initiativesSheet, 'Initiatives');

  // Export Projects with all new fields
  const projectsData = state.projects.map(p => {
    const init = state.initiatives.find(i => i.id === p.initiativeId);
    const manager = state.resources.find(r => r.id === p.managerId);
    return {
      'ID': p.id,
      'Work ID': p.workId,
      'Initiative': init?.name || '',
      'Name': p.name,
      'Description': p.description,
      'Manager': manager?.name || '',
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
  setColumnWidths(projectsSheet, [40, 18, 25, 30, 40, 20, 10, 10, 10, 10, 15, 10, 12, 12, 12, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

  // Export Tasks
  const tasksData = state.tasks.map(t => {
    const project = state.projects.find(p => p.id === t.projectId);
    const assignee = state.resources.find(r => r.id === t.assigneeId);
    return {
      'ID': t.id,
      'Project': project?.name || '',
      'Project Work ID': project?.workId || '',
      'Title': t.title,
      'Description': t.description,
      'Assignee': assignee?.name || '',
      'Status': t.kanbanStatus,
      'Due Date': t.dueDate,
      'Estimated Hours': t.estimatedHours,
      'Actual Hours': t.actualHours,
    };
  });
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
  setColumnWidths(tasksSheet, [40, 25, 18, 35, 50, 20, 12, 12, 15, 12]);
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

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
  }));
  const resourcesSheet = XLSX.utils.json_to_sheet(resourcesData);
  setColumnWidths(resourcesSheet, [40, 25, 30, 25, 20, 10, 15, 12]);
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
    ['Level', 'Name', 'Work ID', 'Parent', 'RAG', 'Budget', 'Spent', 'Completion', 'Owner/Manager'],
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
        ]);

        // Get tasks for this project
        const projectTasks = state.tasks.filter(t => t.projectId === project.id);
        projectTasks.forEach(task => {
          const assignee = state.resources.find(r => r.id === task.assigneeId);
          cascadeData.push([
            '      TASK',
            task.title,
            '-',
            project.workId,
            task.kanbanStatus.replace('_', ' ').toUpperCase(),
            '-',
            '-',
            task.kanbanStatus === 'done' ? '100%' : '-',
            assignee?.name || '-',
          ]);
        });
      });
    });

    // Add blank row between pillars
    cascadeData.push(['', '', '', '', '', '', '', '', '']);
  });

  const cascadeSheet = XLSX.utils.aoa_to_sheet(cascadeData);
  setColumnWidths(cascadeSheet, [15, 40, 18, 30, 10, 12, 12, 12, 20]);
  XLSX.utils.book_append_sheet(workbook, cascadeSheet, 'Strategic Cascade');

  const fileName = `StratOS_AI_Strategic_Cascade_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
