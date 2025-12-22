/**
 * Field Schemas for Smart Import
 * Defines all entity fields with aliases and metadata for AI mapping
 */

import { ImportEntityType, FieldSchema, EntitySchema } from '../../types/smartImport';

// Re-export types for convenience
export type { FieldSchema, EntitySchema };

// =============================================================================
// STRATEGY PILLAR SCHEMA
// =============================================================================

const PILLAR_FIELDS: FieldSchema[] = [
  {
    name: 'name',
    label: 'Pillar Name',
    type: 'string',
    required: true,
    aliases: ['pillar', 'pillar name', 'perspective', 'bsc perspective', 'strategy pillar'],
    semanticTags: ['name', 'identifier', 'title'],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'string',
    required: false,
    aliases: ['desc', 'details', 'about', 'summary'],
    semanticTags: ['description', 'text'],
  },
  {
    name: 'displayOrder',
    label: 'Display Order',
    type: 'number',
    required: false,
    aliases: ['order', 'sort order', 'sequence', 'position', 'rank'],
    semanticTags: ['order', 'number'],
    defaultValue: 0,
  },
  {
    name: 'ragStatus',
    label: 'RAG Status',
    type: 'enum',
    required: false,
    aliases: ['rag', 'status', 'health', 'traffic light', 'color status'],
    semanticTags: ['status', 'rag'],
    enumValues: ['red', 'amber', 'green'],
    defaultValue: 'green',
  },
];

// =============================================================================
// STRATEGIC KPI SCHEMA
// =============================================================================

const KPI_FIELDS: FieldSchema[] = [
  {
    name: 'name',
    label: 'KPI Name',
    type: 'string',
    required: true,
    aliases: ['kpi', 'kpi name', 'metric', 'measure', 'indicator', 'key performance indicator'],
    semanticTags: ['name', 'identifier', 'title'],
  },
  {
    name: 'pillarId',
    label: 'Strategy Pillar',
    type: 'reference',
    required: true,
    referenceType: 'pillar',
    aliases: ['pillar', 'perspective', 'parent pillar', 'bsc perspective'],
    semanticTags: ['parent', 'reference'],
  },
  {
    name: 'targetValue',
    label: 'Target Value',
    type: 'number',
    required: true,
    aliases: ['target', 'goal', 'objective', 'target value'],
    semanticTags: ['number', 'target'],
  },
  {
    name: 'currentValue',
    label: 'Current Value',
    type: 'number',
    required: true,
    aliases: ['current', 'actual', 'value', 'current value'],
    semanticTags: ['number', 'current'],
  },
  {
    name: 'previousValue',
    label: 'Previous Value',
    type: 'number',
    required: false,
    aliases: ['previous', 'last', 'prior', 'previous value'],
    semanticTags: ['number', 'previous'],
    defaultValue: 0,
  },
  {
    name: 'unit',
    label: 'Unit',
    type: 'enum',
    required: false,
    aliases: ['unit', 'measurement', 'unit of measure', 'uom'],
    semanticTags: ['unit'],
    enumValues: ['%', '$', 'score', 'number'],
    defaultValue: 'number',
  },
  {
    name: 'lastUpdated',
    label: 'Last Updated',
    type: 'date',
    required: false,
    aliases: ['updated', 'last updated', 'date', 'as of'],
    semanticTags: ['date', 'updated'],
  },
];

// =============================================================================
// INITIATIVE SCHEMA
// =============================================================================

const INITIATIVE_FIELDS: FieldSchema[] = [
  {
    name: 'name',
    label: 'Initiative Name',
    type: 'string',
    required: true,
    aliases: ['initiative', 'initiative name', 'program', 'portfolio', 'workstream'],
    semanticTags: ['name', 'identifier', 'title'],
  },
  {
    name: 'pillarId',
    label: 'Strategy Pillar',
    type: 'reference',
    required: true,
    referenceType: 'pillar',
    aliases: ['pillar', 'perspective', 'parent pillar', 'strategy pillar'],
    semanticTags: ['parent', 'reference'],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'string',
    required: false,
    aliases: ['desc', 'details', 'about', 'summary', 'objective'],
    semanticTags: ['description', 'text'],
  },
  {
    name: 'ownerId',
    label: 'Owner',
    type: 'reference',
    required: false,
    referenceType: 'resource',
    aliases: ['owner', 'sponsor', 'lead', 'initiative owner', 'program manager'],
    semanticTags: ['person', 'owner'],
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: false,
    aliases: ['start', 'start date', 'begin', 'from', 'kick off'],
    semanticTags: ['date', 'start'],
    patterns: [/^\d{4}-\d{2}-\d{2}$/, /^\d{1,2}\/\d{1,2}\/\d{2,4}$/],
  },
  {
    name: 'endDate',
    label: 'End Date',
    type: 'date',
    required: false,
    aliases: ['end', 'end date', 'finish', 'to', 'target date', 'due'],
    semanticTags: ['date', 'end'],
    patterns: [/^\d{4}-\d{2}-\d{2}$/, /^\d{1,2}\/\d{1,2}\/\d{2,4}$/],
  },
  {
    name: 'budget',
    label: 'Budget',
    type: 'number',
    required: false,
    aliases: ['budget', 'total budget', 'allocated budget', 'funding'],
    semanticTags: ['budget', 'money', 'currency'],
    defaultValue: 0,
  },
  {
    name: 'spentBudget',
    label: 'Spent Budget',
    type: 'number',
    required: false,
    aliases: ['spent', 'spent budget', 'actual spend', 'expenditure', 'cost'],
    semanticTags: ['budget', 'money', 'spent'],
    defaultValue: 0,
  },
  {
    name: 'ragStatus',
    label: 'RAG Status',
    type: 'enum',
    required: false,
    aliases: ['rag', 'status', 'health', 'traffic light'],
    semanticTags: ['status', 'rag'],
    enumValues: ['red', 'amber', 'green'],
    defaultValue: 'green',
  },
];

// =============================================================================
// PROJECT SCHEMA
// =============================================================================

const PROJECT_FIELDS: FieldSchema[] = [
  {
    name: 'name',
    label: 'Project Name',
    type: 'string',
    required: true,
    aliases: ['project', 'project name', 'title', 'project title'],
    semanticTags: ['name', 'identifier', 'title'],
  },
  {
    name: 'initiativeId',
    label: 'Initiative',
    type: 'reference',
    required: true,
    referenceType: 'initiative',
    aliases: ['initiative', 'parent initiative', 'program', 'workstream'],
    semanticTags: ['parent', 'reference'],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'string',
    required: false,
    aliases: ['desc', 'details', 'about', 'summary', 'scope'],
    semanticTags: ['description', 'text'],
  },
  {
    name: 'managerId',
    label: 'Project Manager',
    type: 'reference',
    required: false,
    referenceType: 'resource',
    aliases: ['manager', 'pm', 'project manager', 'lead', 'owner'],
    semanticTags: ['person', 'manager'],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'enum',
    required: false,
    aliases: ['status', 'project status', 'state', 'phase'],
    semanticTags: ['status'],
    enumValues: ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    defaultValue: 'not_started',
  },
  {
    name: 'ragStatus',
    label: 'RAG Status',
    type: 'enum',
    required: false,
    aliases: ['rag', 'rag status', 'health', 'traffic light'],
    semanticTags: ['status', 'rag'],
    enumValues: ['red', 'amber', 'green'],
    defaultValue: 'green',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: false,
    aliases: ['start', 'start date', 'begin', 'from', 'kick off'],
    semanticTags: ['date', 'start'],
  },
  {
    name: 'endDate',
    label: 'End Date',
    type: 'date',
    required: false,
    aliases: ['end', 'end date', 'finish', 'to', 'target date', 'deadline'],
    semanticTags: ['date', 'end'],
  },
  {
    name: 'completionPercentage',
    label: 'Completion %',
    type: 'number',
    required: false,
    aliases: ['completion', 'percent complete', 'progress', '% complete', 'done'],
    semanticTags: ['percentage', 'progress'],
    defaultValue: 0,
  },
  {
    name: 'budget',
    label: 'Budget',
    type: 'number',
    required: false,
    aliases: ['budget', 'total budget', 'allocated budget', 'funding'],
    semanticTags: ['budget', 'money', 'currency'],
    defaultValue: 0,
  },
  {
    name: 'spentBudget',
    label: 'Spent Budget',
    type: 'number',
    required: false,
    aliases: ['spent', 'spent budget', 'actual spend', 'cost', 'expenditure'],
    semanticTags: ['budget', 'money', 'spent'],
    defaultValue: 0,
  },
  {
    name: 'departmentCode',
    label: 'Department',
    type: 'enum',
    required: false,
    aliases: ['department', 'dept', 'function', 'team', 'business unit'],
    semanticTags: ['department'],
    enumValues: ['FIN', 'MKT', 'OPS', 'IT', 'HR', 'SAL', 'PRD', 'ENG', 'LEG', 'ADM'],
    defaultValue: 'IT',
  },
  {
    name: 'category',
    label: 'Category',
    type: 'enum',
    required: false,
    aliases: ['category', 'type', 'project type', 'classification'],
    semanticTags: ['category'],
    enumValues: ['RUN', 'GROW', 'TRNS'],
    defaultValue: 'GROW',
  },
  {
    name: 'fiscalYear',
    label: 'Fiscal Year',
    type: 'number',
    required: false,
    aliases: ['fiscal year', 'fy', 'year', 'financial year'],
    semanticTags: ['year', 'date'],
  },
];

// =============================================================================
// TASK SCHEMA
// =============================================================================

const TASK_FIELDS: FieldSchema[] = [
  {
    name: 'title',
    label: 'Task Title',
    type: 'string',
    required: true,
    aliases: ['task', 'task name', 'title', 'name', 'task title', 'activity'],
    semanticTags: ['name', 'identifier', 'title'],
  },
  {
    name: 'projectId',
    label: 'Project',
    type: 'reference',
    required: true,
    referenceType: 'project',
    aliases: ['project', 'parent project', 'project name'],
    semanticTags: ['parent', 'reference'],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'string',
    required: false,
    aliases: ['desc', 'details', 'about', 'notes', 'summary'],
    semanticTags: ['description', 'text'],
  },
  {
    name: 'assigneeId',
    label: 'Assignee',
    type: 'reference',
    required: false,
    referenceType: 'resource',
    aliases: ['assignee', 'assigned to', 'owner', 'resource', 'responsible'],
    semanticTags: ['person', 'assignee'],
  },
  {
    name: 'kanbanStatus',
    label: 'Status',
    type: 'enum',
    required: false,
    aliases: ['status', 'task status', 'state', 'kanban'],
    semanticTags: ['status'],
    enumValues: ['todo', 'in_progress', 'blocked', 'done'],
    defaultValue: 'todo',
  },
  {
    name: 'dueDate',
    label: 'Due Date',
    type: 'date',
    required: false,
    aliases: ['due', 'due date', 'deadline', 'target date', 'end date'],
    semanticTags: ['date', 'due'],
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: false,
    aliases: ['start', 'start date', 'begin', 'from'],
    semanticTags: ['date', 'start'],
  },
  {
    name: 'estimatedHours',
    label: 'Estimated Hours',
    type: 'number',
    required: false,
    aliases: ['estimated hours', 'est hours', 'estimate', 'planned hours', 'effort'],
    semanticTags: ['hours', 'estimate'],
    defaultValue: 8,
  },
  {
    name: 'actualHours',
    label: 'Actual Hours',
    type: 'number',
    required: false,
    aliases: ['actual hours', 'act hours', 'actual', 'time spent', 'logged hours'],
    semanticTags: ['hours', 'actual'],
    defaultValue: 0,
  },
  {
    name: 'plannedHours',
    label: 'Planned Hours',
    type: 'number',
    required: false,
    aliases: ['planned hours', 'planned', 'budgeted hours'],
    semanticTags: ['hours', 'planned'],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'enum',
    required: false,
    aliases: ['priority', 'importance', 'urgency', 'level'],
    semanticTags: ['priority'],
    enumValues: ['low', 'medium', 'high', 'critical'],
    defaultValue: 'medium',
  },
  {
    name: 'parentTaskId',
    label: 'Parent Task',
    type: 'reference',
    required: false,
    referenceType: 'task',
    aliases: ['parent task', 'parent', 'parent wbs', 'wbs parent'],
    semanticTags: ['parent', 'hierarchy'],
  },
  {
    name: 'wbsCode',
    label: 'WBS Code',
    type: 'string',
    required: false,
    aliases: ['wbs', 'wbs code', 'wbs number', 'work breakdown'],
    semanticTags: ['code', 'wbs'],
  },
  {
    name: 'isMilestone',
    label: 'Is Milestone',
    type: 'boolean',
    required: false,
    aliases: ['milestone', 'is milestone', 'key milestone'],
    semanticTags: ['milestone', 'flag'],
    defaultValue: false,
  },
  {
    name: 'deliverable',
    label: 'Deliverable',
    type: 'string',
    required: false,
    aliases: ['deliverable', 'output', 'artifact', 'result'],
    semanticTags: ['deliverable', 'output'],
  },
  {
    name: 'departmentCode',
    label: 'Department',
    type: 'enum',
    required: false,
    aliases: ['department', 'dept', 'function', 'team'],
    semanticTags: ['department'],
    enumValues: ['FIN', 'MKT', 'OPS', 'IT', 'HR', 'SAL', 'PRD', 'ENG', 'LEG', 'ADM'],
  },
];

// =============================================================================
// RESOURCE SCHEMA
// =============================================================================

const RESOURCE_FIELDS: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'string',
    required: true,
    aliases: ['name', 'resource name', 'full name', 'person', 'employee'],
    semanticTags: ['name', 'identifier', 'person'],
  },
  {
    name: 'email',
    label: 'Email',
    type: 'string',
    required: false,
    aliases: ['email', 'e-mail', 'mail', 'email address'],
    semanticTags: ['email', 'contact'],
    patterns: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/],
  },
  {
    name: 'role',
    label: 'Role',
    type: 'string',
    required: false,
    aliases: ['role', 'job title', 'position', 'title', 'job role'],
    semanticTags: ['role', 'job'],
  },
  {
    name: 'team',
    label: 'Team',
    type: 'string',
    required: false,
    aliases: ['team', 'group', 'squad', 'unit'],
    semanticTags: ['team', 'group'],
  },
  {
    name: 'weeklyCapacity',
    label: 'Weekly Capacity',
    type: 'number',
    required: false,
    aliases: ['capacity', 'weekly capacity', 'hours per week', 'availability'],
    semanticTags: ['hours', 'capacity'],
    defaultValue: 40,
  },
  {
    name: 'departmentCode',
    label: 'Department',
    type: 'enum',
    required: false,
    aliases: ['department', 'dept', 'function', 'business unit'],
    semanticTags: ['department'],
    enumValues: ['FIN', 'MKT', 'OPS', 'IT', 'HR', 'SAL', 'PRD', 'ENG', 'LEG', 'ADM'],
    defaultValue: 'IT',
  },
  {
    name: 'hourlyRate',
    label: 'Hourly Rate',
    type: 'number',
    required: false,
    aliases: ['hourly rate', 'rate', 'cost rate', 'billing rate'],
    semanticTags: ['money', 'rate'],
  },
];

// =============================================================================
// MILESTONE SCHEMA
// =============================================================================

const MILESTONE_FIELDS: FieldSchema[] = [
  {
    name: 'name',
    label: 'Milestone Name',
    type: 'string',
    required: true,
    aliases: ['milestone', 'milestone name', 'name', 'title', 'gate'],
    semanticTags: ['name', 'identifier', 'milestone'],
  },
  {
    name: 'projectId',
    label: 'Project',
    type: 'reference',
    required: true,
    referenceType: 'project',
    aliases: ['project', 'parent project', 'project name'],
    semanticTags: ['parent', 'reference'],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'string',
    required: false,
    aliases: ['desc', 'details', 'about', 'summary'],
    semanticTags: ['description', 'text'],
  },
  {
    name: 'targetDate',
    label: 'Target Date',
    type: 'date',
    required: true,
    aliases: ['target date', 'target', 'due date', 'deadline', 'planned date'],
    semanticTags: ['date', 'target'],
  },
  {
    name: 'completedDate',
    label: 'Completed Date',
    type: 'date',
    required: false,
    aliases: ['completed date', 'completed', 'actual date', 'done date'],
    semanticTags: ['date', 'completed'],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'enum',
    required: false,
    aliases: ['status', 'milestone status', 'state'],
    semanticTags: ['status'],
    enumValues: ['pending', 'completed', 'missed'],
    defaultValue: 'pending',
  },
  {
    name: 'displayOrder',
    label: 'Display Order',
    type: 'number',
    required: false,
    aliases: ['order', 'display order', 'sequence', 'sort order'],
    semanticTags: ['order', 'number'],
    defaultValue: 0,
  },
];

// =============================================================================
// ENTITY SCHEMAS REGISTRY
// =============================================================================

export const ENTITY_SCHEMAS: Record<ImportEntityType, EntitySchema> = {
  pillar: {
    entityType: 'pillar',
    fields: PILLAR_FIELDS,
    identifierField: 'name',
  },
  kpi: {
    entityType: 'kpi',
    fields: KPI_FIELDS,
    identifierField: 'name',
    parentField: 'pillarId',
    parentType: 'pillar',
  },
  initiative: {
    entityType: 'initiative',
    fields: INITIATIVE_FIELDS,
    identifierField: 'name',
    parentField: 'pillarId',
    parentType: 'pillar',
  },
  project: {
    entityType: 'project',
    fields: PROJECT_FIELDS,
    identifierField: 'name',
    parentField: 'initiativeId',
    parentType: 'initiative',
  },
  task: {
    entityType: 'task',
    fields: TASK_FIELDS,
    identifierField: 'title',
    parentField: 'projectId',
    parentType: 'project',
  },
  resource: {
    entityType: 'resource',
    fields: RESOURCE_FIELDS,
    identifierField: 'name',
  },
  milestone: {
    entityType: 'milestone',
    fields: MILESTONE_FIELDS,
    identifierField: 'name',
    parentField: 'projectId',
    parentType: 'project',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get schema for an entity type
 */
export function getEntitySchema(entityType: ImportEntityType): EntitySchema {
  return ENTITY_SCHEMAS[entityType];
}

/**
 * Get field schema by name
 */
export function getFieldSchema(entityType: ImportEntityType, fieldName: string): FieldSchema | undefined {
  const schema = ENTITY_SCHEMAS[entityType];
  return schema.fields.find(f => f.name === fieldName);
}

/**
 * Get required fields for an entity type
 */
export function getRequiredFields(entityType: ImportEntityType): FieldSchema[] {
  return ENTITY_SCHEMAS[entityType].fields.filter(f => f.required);
}

/**
 * Get all field names and aliases for matching
 */
export function getAllFieldAliases(entityType: ImportEntityType): Map<string, string> {
  const aliasMap = new Map<string, string>();
  const schema = ENTITY_SCHEMAS[entityType];

  for (const field of schema.fields) {
    aliasMap.set(field.name.toLowerCase(), field.name);
    aliasMap.set(field.label.toLowerCase(), field.name);
    for (const alias of field.aliases) {
      aliasMap.set(alias.toLowerCase(), field.name);
    }
  }

  return aliasMap;
}

/**
 * Entity type keywords for sheet detection
 */
export const ENTITY_TYPE_KEYWORDS: Record<ImportEntityType, string[]> = {
  pillar: ['pillar', 'pillars', 'perspective', 'perspectives', 'bsc', 'balanced scorecard', 'strategy'],
  kpi: ['kpi', 'kpis', 'metric', 'metrics', 'indicator', 'indicators', 'measure', 'measures'],
  initiative: ['initiative', 'initiatives', 'program', 'programs', 'portfolio', 'workstream'],
  project: ['project', 'projects', 'prj', 'work', 'works'],
  task: ['task', 'tasks', 'activity', 'activities', 'action', 'actions', 'todo', 'wbs', 'work breakdown'],
  resource: ['resource', 'resources', 'people', 'person', 'employee', 'employees', 'team', 'staff', 'member'],
  milestone: ['milestone', 'milestones', 'gate', 'gates', 'checkpoint', 'checkpoints', 'deliverable'],
};
