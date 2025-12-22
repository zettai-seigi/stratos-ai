/**
 * Label Sidebar for Smart Import Spreadsheet
 * Displays available labels organized by entity fields and reference data
 */

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Tag,
  Database,
  Users,
  Briefcase,
  Target,
  ListChecks,
  Flag,
  Layers,
} from 'lucide-react';
import { ImportEntityType, AvailableLabel, FieldType } from '../../../types/smartImport';
import { ENTITY_SCHEMAS } from '../../../utils/smartImport';
import { AppState, DEPARTMENTS } from '../../../types';

interface LabelSidebarProps {
  entityType: ImportEntityType;
  appState: AppState;
  selectedLabel: AvailableLabel | null;
  onSelectLabel: (label: AvailableLabel) => void;
  selectionCount: number;
  onAssign: () => void;
}

interface LabelCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  labels: AvailableLabel[];
}

export const LabelSidebar: React.FC<LabelSidebarProps> = ({
  entityType,
  appState,
  selectedLabel,
  onSelectLabel,
  selectionCount,
  onAssign,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['fields', 'references'])
  );

  // Build available labels from entity fields and reference data
  const categories = useMemo(() => {
    const result: LabelCategory[] = [];

    // Get entity fields
    const schema = ENTITY_SCHEMAS[entityType];
    const fieldLabels: AvailableLabel[] = schema.fields.map((field) => ({
      id: `field:${field.name}`,
      name: field.name,
      displayName: field.label,
      type: 'field' as const,
      category: 'Entity Fields',
      required: field.required,
      dataType: field.type,
      enumValues: field.enumValues,
    }));

    result.push({
      id: 'fields',
      name: 'Entity Fields',
      icon: <Tag className="w-4 h-4" />,
      labels: fieldLabels,
    });

    // Build reference data categories
    const referenceCategories: LabelCategory[] = [];

    // Strategy Pillars
    if (appState.pillars.length > 0) {
      referenceCategories.push({
        id: 'ref:pillars',
        name: 'Strategy Pillars',
        icon: <Target className="w-4 h-4" />,
        labels: appState.pillars.map((p) => ({
          id: `ref:pillar:${p.id}`,
          name: p.name,
          displayName: p.name,
          type: 'reference' as const,
          category: 'Strategy Pillars',
        })),
      });
    }

    // Initiatives
    if (appState.initiatives.length > 0) {
      referenceCategories.push({
        id: 'ref:initiatives',
        name: 'Initiatives',
        icon: <Layers className="w-4 h-4" />,
        labels: appState.initiatives.map((i) => ({
          id: `ref:initiative:${i.id}`,
          name: i.name,
          displayName: i.name,
          type: 'reference' as const,
          category: 'Initiatives',
        })),
      });
    }

    // Projects
    if (appState.projects.length > 0) {
      referenceCategories.push({
        id: 'ref:projects',
        name: 'Projects',
        icon: <Briefcase className="w-4 h-4" />,
        labels: appState.projects.map((p) => ({
          id: `ref:project:${p.id}`,
          name: p.name,
          displayName: p.name,
          type: 'reference' as const,
          category: 'Projects',
        })),
      });
    }

    // Resources
    if (appState.resources.length > 0) {
      referenceCategories.push({
        id: 'ref:resources',
        name: 'Resources',
        icon: <Users className="w-4 h-4" />,
        labels: appState.resources.map((r) => ({
          id: `ref:resource:${r.id}`,
          name: r.name,
          displayName: `${r.name} (${r.role})`,
          type: 'reference' as const,
          category: 'Resources',
        })),
      });
    }

    // Departments
    referenceCategories.push({
      id: 'ref:departments',
      name: 'Departments',
      icon: <Database className="w-4 h-4" />,
      labels: Object.values(DEPARTMENTS).map((d) => ({
        id: `ref:dept:${d.code}`,
        name: d.code,
        displayName: d.name,
        type: 'reference' as const,
        category: 'Departments',
      })),
    });

    // RAG Status
    referenceCategories.push({
      id: 'ref:ragstatus',
      name: 'RAG Status',
      icon: <Flag className="w-4 h-4" />,
      labels: ['green', 'amber', 'red'].map((status) => ({
        id: `ref:rag:${status}`,
        name: status,
        displayName: status.charAt(0).toUpperCase() + status.slice(1),
        type: 'reference' as const,
        category: 'RAG Status',
      })),
    });

    // Task Status
    referenceCategories.push({
      id: 'ref:taskstatus',
      name: 'Task Status',
      icon: <ListChecks className="w-4 h-4" />,
      labels: [
        { id: 'todo', name: 'Todo' },
        { id: 'in_progress', name: 'In Progress' },
        { id: 'blocked', name: 'Blocked' },
        { id: 'done', name: 'Done' },
      ].map((s) => ({
        id: `ref:taskstatus:${s.id}`,
        name: s.id,
        displayName: s.name,
        type: 'reference' as const,
        category: 'Task Status',
      })),
    });

    // Project Status
    referenceCategories.push({
      id: 'ref:projectstatus',
      name: 'Project Status',
      icon: <Briefcase className="w-4 h-4" />,
      labels: [
        { id: 'not_started', name: 'Not Started' },
        { id: 'in_progress', name: 'In Progress' },
        { id: 'on_hold', name: 'On Hold' },
        { id: 'completed', name: 'Completed' },
        { id: 'cancelled', name: 'Cancelled' },
      ].map((s) => ({
        id: `ref:projectstatus:${s.id}`,
        name: s.id,
        displayName: s.name,
        type: 'reference' as const,
        category: 'Project Status',
      })),
    });

    // Add reference categories to result
    referenceCategories.forEach((cat) => result.push(cat));

    return result;
  }, [entityType, appState]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getTypeIcon = (dataType?: FieldType): string => {
    switch (dataType) {
      case 'string':
        return 'Aa';
      case 'number':
        return '#';
      case 'date':
        return '📅';
      case 'boolean':
        return '✓';
      case 'enum':
        return '▼';
      case 'reference':
        return '→';
      default:
        return '•';
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Assign Label
        </h3>
        <p className="text-xs text-text-muted">
          {selectionCount > 0
            ? `${selectionCount} cell${selectionCount > 1 ? 's' : ''} selected`
            : 'Select cells to assign a label'}
        </p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.id} className="border-b border-border/50">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-bg-hover transition-colors"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              {category.icon}
              <span className="text-sm font-medium text-text-primary flex-1 text-left">
                {category.name}
              </span>
              <span className="text-xs text-text-muted">
                {category.labels.length}
              </span>
            </button>

            {/* Category Labels */}
            {expandedCategories.has(category.id) && (
              <div className="pb-2">
                {category.labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => onSelectLabel(label)}
                    className={`
                      w-full flex items-center gap-2 px-6 py-1.5 text-left transition-colors
                      ${
                        selectedLabel?.id === label.id
                          ? 'bg-accent-blue/20 text-accent-blue'
                          : 'hover:bg-bg-hover text-text-secondary hover:text-text-primary'
                      }
                    `}
                  >
                    {label.type === 'field' && (
                      <span className="text-xs font-mono text-text-muted w-4">
                        {getTypeIcon(label.dataType)}
                      </span>
                    )}
                    <span className="text-sm flex-1 truncate">
                      {label.displayName}
                    </span>
                    {label.required && (
                      <span className="text-rag-red text-xs">*</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assign Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onAssign}
          disabled={!selectedLabel || selectionCount === 0}
          className={`
            w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
            ${
              selectedLabel && selectionCount > 0
                ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
                : 'bg-bg-hover text-text-muted cursor-not-allowed'
            }
          `}
        >
          {selectedLabel && selectionCount > 0
            ? `Assign "${selectedLabel.displayName}"`
            : 'Select cells and label'}
        </button>
      </div>
    </div>
  );
};

export default LabelSidebar;
