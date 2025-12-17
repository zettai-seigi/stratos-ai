import * as XLSX from 'xlsx';
import { AppState, Project, Task, ProjectStatus, KanbanStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  projects: Project[];
  tasks: Task[];
}

export const parseExcelFile = async (
  file: File,
  currentState: AppState
): Promise<ImportValidationResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const result = validateAndParseWorkbook(workbook, currentState);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

const validateAndParseWorkbook = (
  workbook: XLSX.WorkBook,
  currentState: AppState
): ImportValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const projects: Project[] = [];
  const tasks: Task[] = [];

  // Parse Projects sheet
  if (workbook.SheetNames.includes('Projects')) {
    const projectsSheet = workbook.Sheets['Projects'];
    const projectRows = XLSX.utils.sheet_to_json<Record<string, any>>(projectsSheet, {
      header: 1,
      defval: '',
    }) as any[][];

    // Skip header row
    for (let i = 1; i < projectRows.length; i++) {
      const row = projectRows[i];
      const projectName = String(row[0] || '').trim();
      const initiativeName = String(row[1] || '').trim();

      if (!projectName) continue; // Skip empty rows

      // Validate initiative exists
      const initiative = currentState.initiatives.find(
        (init) => init.name.toLowerCase() === initiativeName.toLowerCase()
      );

      if (!initiative) {
        errors.push(
          `Row ${i + 1} in Projects: Initiative "${initiativeName}" not found. Available: ${currentState.initiatives.map((i) => i.name).join(', ')}`
        );
        continue;
      }

      // Check for duplicates
      const existingProject = currentState.projects.find(
        (p) => p.name.toLowerCase() === projectName.toLowerCase()
      );
      if (existingProject) {
        warnings.push(`Row ${i + 1}: Project "${projectName}" already exists and will be skipped.`);
        continue;
      }

      // Find manager
      const managerName = String(row[2] || '').trim();
      const manager = currentState.resources.find(
        (r) => r.name.toLowerCase() === managerName.toLowerCase()
      );

      // Parse status
      const statusMap: Record<string, ProjectStatus> = {
        'not started': 'not_started',
        'in progress': 'in_progress',
        'on hold': 'on_hold',
        'completed': 'completed',
        'cancelled': 'cancelled',
      };
      const statusInput = String(row[7] || 'not started').toLowerCase().trim();
      const status = statusMap[statusInput] || 'not_started';

      projects.push({
        id: uuidv4(),
        initiativeId: initiative.id,
        name: projectName,
        description: String(row[3] || ''),
        managerId: manager?.id || '',
        status,
        ragStatus: 'green',
        startDate: parseDate(row[4]) || new Date().toISOString().split('T')[0],
        endDate: parseDate(row[5]) || new Date().toISOString().split('T')[0],
        completionPercentage: 0,
        budget: parseNumber(row[6]) || 0,
        spentBudget: 0,
      });
    }
  } else {
    warnings.push('Projects sheet not found in workbook.');
  }

  // Parse Tasks sheet
  if (workbook.SheetNames.includes('Tasks')) {
    const tasksSheet = workbook.Sheets['Tasks'];
    const taskRows = XLSX.utils.sheet_to_json<Record<string, any>>(tasksSheet, {
      header: 1,
      defval: '',
    }) as any[][];

    // Create a map of all projects (existing + new)
    const allProjects = [
      ...currentState.projects,
      ...projects,
    ];

    // Skip header row
    for (let i = 1; i < taskRows.length; i++) {
      const row = taskRows[i];
      const taskTitle = String(row[0] || '').trim();
      const projectName = String(row[1] || '').trim();

      if (!taskTitle) continue; // Skip empty rows

      // Validate project exists
      const project = allProjects.find(
        (p) => p.name.toLowerCase() === projectName.toLowerCase()
      );

      if (!project) {
        errors.push(
          `Row ${i + 1} in Tasks: Project "${projectName}" not found.`
        );
        continue;
      }

      // Find assignee
      const assigneeName = String(row[2] || '').trim();
      const assignee = currentState.resources.find(
        (r) => r.name.toLowerCase() === assigneeName.toLowerCase()
      );

      // Parse status
      const statusMap: Record<string, KanbanStatus> = {
        'to do': 'todo',
        'in progress': 'in_progress',
        'blocked': 'blocked',
        'done': 'done',
      };
      const statusInput = String(row[6] || 'to do').toLowerCase().trim();
      const kanbanStatus = statusMap[statusInput] || 'todo';

      tasks.push({
        id: uuidv4(),
        projectId: project.id,
        title: taskTitle,
        description: String(row[3] || ''),
        assigneeId: assignee?.id || '',
        kanbanStatus,
        dueDate: parseDate(row[4]) || new Date().toISOString().split('T')[0],
        estimatedHours: parseNumber(row[5]) || 8,
        actualHours: 0,
      });
    }
  } else {
    warnings.push('Tasks sheet not found in workbook.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    projects,
    tasks,
  };
};

// Helper functions
const parseDate = (value: any): string | null => {
  if (!value) return null;

  // Handle Excel serial dates
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }

  // Handle string dates
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  return null;
};

const parseNumber = (value: any): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
};
