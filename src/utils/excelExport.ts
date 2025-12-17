import * as XLSX from 'xlsx';
import { AppState } from '../types';

export const generateExcelTemplate = (state: AppState): void => {
  const workbook = XLSX.utils.book_new();

  // 1. Create hidden Lookups sheet with valid values
  const lookupsData = [
    ['Valid_Pillar_Names', 'Valid_Initiative_Names', 'Valid_Resource_Names', 'Valid_Project_Names'],
    ...Array.from({ length: Math.max(state.pillars.length, state.initiatives.length, state.resources.length, state.projects.length) }).map((_, i) => [
      state.pillars[i]?.name || '',
      state.initiatives[i]?.name || '',
      state.resources[i]?.name || '',
      state.projects[i]?.name || '',
    ]),
  ];
  const lookupsSheet = XLSX.utils.aoa_to_sheet(lookupsData);
  XLSX.utils.book_append_sheet(workbook, lookupsSheet, '_Lookups');

  // 2. Create Instructions sheet
  const instructionsData = [
    ['StratOS AI - Data Import Template'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. This template is pre-populated with your Balanced Scorecard structure.'],
    ['2. Strategy Pillars, Initiatives, and Resources are pre-filled for reference.'],
    ['3. Add new Projects in the "Projects" tab - select Parent Initiative from the dropdown.'],
    ['4. Add new Tasks in the "Tasks" tab - select Parent Project and Assignee from dropdowns.'],
    ['5. Save this file and import it back into StratOS AI.'],
    [''],
    ['IMPORTANT:'],
    ['- Do NOT modify the Pillars or Initiatives tabs (they are for reference only).'],
    ['- All parent references must match exactly (use dropdowns).'],
    ['- Required fields are marked with (Required) in the header.'],
    [''],
    ['Generated on: ' + new Date().toLocaleString()],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // 3. Create Pillars sheet (read-only reference)
  const pillarsData = [
    ['Pillar Name', 'Description', 'Current Status'],
    ...state.pillars.map((p) => [p.name, p.description, p.ragStatus.toUpperCase()]),
  ];
  const pillarsSheet = XLSX.utils.aoa_to_sheet(pillarsData);
  XLSX.utils.book_append_sheet(workbook, pillarsSheet, 'Pillars (Reference)');

  // 4. Create Initiatives sheet (read-only reference)
  const initiativesData = [
    ['Initiative Name', 'Linked Pillar', 'Owner', 'Start Date', 'End Date', 'Budget', 'Status'],
    ...state.initiatives.map((init) => {
      const pillar = state.pillars.find((p) => p.id === init.pillarId);
      const owner = state.resources.find((r) => r.id === init.ownerId);
      return [
        init.name,
        pillar?.name || '',
        owner?.name || '',
        init.startDate,
        init.endDate,
        init.budget,
        init.ragStatus.toUpperCase(),
      ];
    }),
  ];
  const initiativesSheet = XLSX.utils.aoa_to_sheet(initiativesData);
  XLSX.utils.book_append_sheet(workbook, initiativesSheet, 'Initiatives (Reference)');

  // 5. Create Resources sheet (read-only reference)
  const resourcesData = [
    ['Resource Name', 'Role', 'Team', 'Weekly Capacity (Hours)'],
    ...state.resources.map((r) => [r.name, r.role, r.team, r.weeklyCapacity]),
  ];
  const resourcesSheet = XLSX.utils.aoa_to_sheet(resourcesData);
  XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources (Reference)');

  // 6. Create Projects sheet (for input)
  const projectsData = [
    [
      'Project Name (Required)',
      'Parent Initiative Name (Required - select from dropdown)',
      'Project Manager (select from dropdown)',
      'Description',
      'Planned Start Date',
      'Planned End Date',
      'Budget ($)',
      'Status (Not Started/In Progress/On Hold/Completed/Cancelled)',
    ],
    // Add some empty rows for input
    ...Array(20).fill(['', '', '', '', '', '', '', '']),
  ];
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);

  // Add data validation for Initiative dropdown (column B)
  const initiativeRange = `'_Lookups'!$B$2:$B$${state.initiatives.length + 1}`;
  projectsSheet['!dataValidation'] = [
    {
      sqref: 'B2:B100',
      type: 'list',
      formula1: initiativeRange,
    },
  ];

  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

  // 7. Create Tasks sheet (for input)
  const tasksData = [
    [
      'Task Title (Required)',
      'Parent Project Name (Required - select from dropdown)',
      'Assignee (select from dropdown)',
      'Description',
      'Due Date',
      'Estimated Hours',
      'Status (To Do/In Progress/Blocked/Done)',
    ],
    // Add some empty rows for input
    ...Array(50).fill(['', '', '', '', '', '', '']),
  ];
  const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  // Generate the file
  const fileName = `StratOS_AI_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Function to export current data as full backup
export const exportFullData = (state: AppState): void => {
  const workbook = XLSX.utils.book_new();

  // Export all data
  const pillarsSheet = XLSX.utils.json_to_sheet(state.pillars);
  XLSX.utils.book_append_sheet(workbook, pillarsSheet, 'Pillars');

  const kpisSheet = XLSX.utils.json_to_sheet(state.kpis);
  XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

  const initiativesSheet = XLSX.utils.json_to_sheet(state.initiatives);
  XLSX.utils.book_append_sheet(workbook, initiativesSheet, 'Initiatives');

  const projectsSheet = XLSX.utils.json_to_sheet(state.projects);
  XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

  const tasksSheet = XLSX.utils.json_to_sheet(state.tasks);
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  const resourcesSheet = XLSX.utils.json_to_sheet(state.resources);
  XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources');

  const fileName = `StratOS_AI_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
