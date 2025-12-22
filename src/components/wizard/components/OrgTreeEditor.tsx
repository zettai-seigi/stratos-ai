import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from '@dnd-kit/core';
import {
  Users,
  UserPlus,
  FolderTree,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  GripVertical,
  CornerDownRight,
} from 'lucide-react';
import { OrgUnit, OrgLevel, CorporateEntity, LEVELS_WITHOUT_BSC, getChildLevel } from '../../../types';

interface OrgTreeEditorProps {
  orgUnits: OrgUnit[];
  companyId: string;
  companies: CorporateEntity[];
  onAdd: (unit: Partial<OrgUnit> & Pick<OrgUnit, 'name' | 'level' | 'companyId'>) => void;
  onUpdate: (id: string, updates: Partial<OrgUnit>) => void;
  onDelete: (id: string) => void;
  onSelectCompany: (companyId: string | null) => void;
}

const LEVEL_ICONS: Record<OrgLevel, React.ReactNode> = {
  directorate: <Users className="w-4 h-4 text-[var(--cds-support-info)]" />,
  division: <FolderTree className="w-4 h-4 text-[var(--cds-support-warning)]" />,
  department: <Briefcase className="w-4 h-4 text-[var(--cds-support-success)]" />,
  section: <UserPlus className="w-4 h-4 text-[var(--cds-text-secondary)]" />,
};

const LEVEL_LABELS: Record<OrgLevel, string> = {
  directorate: 'Directorate',
  division: 'Division',
  department: 'Department',
  section: 'Section',
};

// Get the parent level for a given level
function getParentLevel(level: OrgLevel): OrgLevel | null {
  if (level === 'directorate') return null;
  if (level === 'division') return 'directorate';
  if (level === 'department') return 'division';
  if (level === 'section') return 'department';
  return null;
}

type DropPosition = 'before' | 'after' | 'child';

interface DropTargetInfo {
  unitId: string;
  position: DropPosition;
}

// Check if moving would create a cycle
function wouldCreateCycle(
  units: OrgUnit[],
  draggedId: string,
  targetParentId: string
): boolean {
  let current = units.find((u) => u.id === targetParentId);
  while (current) {
    if (current.id === draggedId) return true;
    current = units.find((u) => u.id === current?.parentId);
  }
  return false;
}

// Drop zone component
const DropZone: React.FC<{
  id: string;
  isActive: boolean;
  position: DropPosition;
  depth: number;
}> = ({ id, isActive, position, depth }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const showIndicator = isOver || isActive;

  if (position === 'child') {
    return (
      <div
        ref={setNodeRef}
        className={`
          mx-2 my-1 rounded-lg border-2 border-dashed transition-all
          ${showIndicator ? 'h-8 border-[var(--cds-interactive)] bg-[var(--cds-interactive)]/10' : 'h-0 border-transparent'}
        `}
        style={{ marginLeft: `${(depth + 1) * 20 + 8}px` }}
      >
        {showIndicator && (
          <div className="flex items-center gap-2 h-full px-3 text-xs text-[var(--cds-interactive)]">
            <CornerDownRight className="w-3 h-3" />
            <span>Drop as child</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all ${showIndicator ? 'h-1' : 'h-0'}`}
    >
      {showIndicator && (
        <div
          className="absolute left-0 right-0 h-1 bg-[var(--cds-interactive)]"
          style={{ marginLeft: `${depth * 20 + 8}px` }}
        >
          <div className="absolute -left-1 -top-1 w-3 h-3 bg-[var(--cds-interactive)] rounded-full" />
        </div>
      )}
    </div>
  );
};

interface TreeNodeProps {
  unit: OrgUnit;
  units: OrgUnit[];
  depth: number;
  onAdd: OrgTreeEditorProps['onAdd'];
  onUpdate: OrgTreeEditorProps['onUpdate'];
  onDelete: OrgTreeEditorProps['onDelete'];
  activeId: string | null;
  dropTarget: DropTargetInfo | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  unit,
  units,
  depth,
  onAdd,
  onUpdate,
  onDelete,
  activeId,
  dropTarget,
  selectedId,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(unit.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = units.filter((u) => u.parentId === unit.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === unit.id;
  const isDragging = activeId === unit.id;

  const childLevel = getChildLevel(unit.level);
  const canAddChild = childLevel !== null;
  const isSection = unit.level === 'section';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ id: unit.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;

  // Show drop zones when dragging another unit
  const showDropZones = activeId !== null && activeId !== unit.id && !wouldCreateCycle(units, activeId, unit.id);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onUpdate(unit.id, { name: editName.trim() });
    } else {
      setEditName(unit.name);
    }
    setIsEditing(false);
  };

  const handleAddChild = () => {
    if (!childLevel) return;
    onAdd({
      name: `New ${LEVEL_LABELS[childLevel]}`,
      level: childLevel,
      companyId: unit.companyId,
      parentId: unit.id,
      hasBSC: !LEVELS_WITHOUT_BSC.includes(childLevel),
    });
    setExpanded(true);
  };

  const handleAddSibling = () => {
    onAdd({
      name: `New ${LEVEL_LABELS[unit.level]}`,
      level: unit.level,
      companyId: unit.companyId,
      parentId: unit.parentId,
      hasBSC: !LEVELS_WITHOUT_BSC.includes(unit.level),
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditName(unit.name);
        setIsEditing(false);
      }
      return;
    }

    if (!isSelected) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      // Add sibling (same level)
      handleAddSibling();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // Add child
      if (canAddChild) {
        handleAddChild();
      }
    } else if (e.key === 'F2' || (e.key === 'Enter' && e.ctrlKey)) {
      e.preventDefault();
      setIsEditing(true);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete(unit.id);
    }
  };

  return (
    <div>
      {/* Drop zone: Before (sibling) */}
      {showDropZones && (
        <DropZone
          id={`${unit.id}:before`}
          isActive={dropTarget?.unitId === unit.id && dropTarget?.position === 'before'}
          position="before"
          depth={depth}
        />
      )}

      {/* Main item */}
      <div
        ref={setNodeRef}
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-lg group transition-colors
          ${isDragging ? 'opacity-50 bg-[var(--cds-interactive)]/20' : 'hover:bg-[var(--cds-background-hover)]'}
          ${isSelected ? 'bg-[var(--cds-background-active)] ring-1 ring-[var(--cds-interactive)]' : ''}
        `}
        style={{ ...style, paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(unit.id)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--cds-icon-secondary)] hover:text-[var(--cds-icon-primary)] transition-colors touch-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={`w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--cds-background-active)] ${
            !hasChildren ? 'invisible' : ''
          }`}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--cds-icon-secondary)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--cds-icon-secondary)]" />
          )}
        </button>

        {/* Icon */}
        {LEVEL_ICONS[unit.level]}

        {/* Name */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-2 py-0.5 text-sm bg-[var(--cds-field-01)] border border-[var(--cds-border-strong-01)] rounded focus:outline-none focus:border-[var(--cds-focus)]"
          />
        ) : (
          <span
            className="flex-1 text-sm text-[var(--cds-text-primary)] cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {unit.name}
          </span>
        )}

        {/* Level badge */}
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--cds-field-02)] text-[var(--cds-text-secondary)] rounded">
          {LEVEL_LABELS[unit.level]}
        </span>

        {/* BSC indicator */}
        {unit.hasBSC ? (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--cds-support-success)]/20 text-[var(--cds-support-success)] rounded">
            BSC
          </span>
        ) : (
          isSection && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[var(--cds-notification-warning-background)] text-[var(--cds-support-warning)] rounded"
              title="Sections are operational only and cannot have BSC"
            >
              <AlertCircle className="w-3 h-3" />
              No BSC
            </span>
          )
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAddChild && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild();
              }}
              className="p-1 rounded hover:bg-[var(--cds-background-active)]"
              title={`Add ${LEVEL_LABELS[childLevel!]} (Tab)`}
            >
              <Plus className="w-3.5 h-3.5 text-[var(--cds-icon-secondary)]" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-[var(--cds-background-active)]"
            title="Edit (F2)"
          >
            <Edit2 className="w-3.5 h-3.5 text-[var(--cds-icon-secondary)]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(unit.id);
            }}
            className="p-1 rounded hover:bg-[var(--cds-support-error)]/20"
            title="Delete (Del)"
          >
            <Trash2 className="w-3.5 h-3.5 text-[var(--cds-support-error)]" />
          </button>
        </div>
      </div>

      {/* Drop zone: As child */}
      {showDropZones && canAddChild && (
        <DropZone
          id={`${unit.id}:child`}
          isActive={dropTarget?.unitId === unit.id && dropTarget?.position === 'child'}
          position="child"
          depth={depth}
        />
      )}

      {/* Drop zone: After (sibling) */}
      {showDropZones && (
        <DropZone
          id={`${unit.id}:after`}
          isActive={dropTarget?.unitId === unit.id && dropTarget?.position === 'after'}
          position="after"
          depth={depth}
        />
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              unit={child}
              units={units}
              depth={depth + 1}
              onAdd={onAdd}
              onUpdate={onUpdate}
              onDelete={onDelete}
              activeId={activeId}
              dropTarget={dropTarget}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OrgTreeEditor: React.FC<OrgTreeEditorProps> = ({
  orgUnits,
  companyId,
  companies,
  onAdd,
  onUpdate,
  onDelete,
  onSelectCompany,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetInfo | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const companyUnits = orgUnits.filter((u) => u.companyId === companyId);
  const rootUnits = companyUnits.filter((u) => !u.parentId);
  const selectedCompany = companies.find((c) => c.id === companyId);
  const activeUnit = activeId ? companyUnits.find((u) => u.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }

    const overId = over.id as string;
    if (overId.includes(':')) {
      const [unitId, position] = overId.split(':');
      setDropTarget({ unitId, position: position as DropPosition });
    } else {
      setDropTarget({ unitId: overId, position: 'child' });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const currentDropTarget = dropTarget;

    setActiveId(null);
    setDropTarget(null);

    if (!currentDropTarget) return;

    const draggedId = active.id as string;
    const dragged = companyUnits.find((u) => u.id === draggedId);
    const target = companyUnits.find((u) => u.id === currentDropTarget.unitId);

    if (!dragged || !target || draggedId === currentDropTarget.unitId) return;

    const { position } = currentDropTarget;

    // Determine new parent
    let newParentId: string | undefined;
    if (position === 'child') {
      newParentId = target.id;
    } else {
      newParentId = target.parentId ?? undefined;
    }

    // Check for cycles
    if (newParentId && wouldCreateCycle(companyUnits, draggedId, newParentId)) {
      return;
    }

    // Validate level rules
    if (newParentId) {
      const newParent = companyUnits.find((u) => u.id === newParentId);
      if (newParent) {
        const validChildLevel = getChildLevel(newParent.level);
        if (validChildLevel !== dragged.level) {
          return; // Can't move this level under that parent
        }
      }
    } else {
      // Moving to root - only directorate allowed
      if (dragged.level !== 'directorate') {
        return;
      }
    }

    // Update dragged unit
    onUpdate(draggedId, { parentId: newParentId });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Company selector tabs */}
        {companies.length > 1 && (
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--cds-border-subtle-00)] overflow-x-auto">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  company.id === companyId
                    ? 'bg-[var(--cds-interactive)] text-white'
                    : 'bg-[var(--cds-field-01)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{company.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-[var(--cds-notification-info-background)] border-l-4 border-[var(--cds-support-info)] rounded-r">
          <p className="text-sm text-[var(--cds-text-primary)]">
            {selectedCompany ? (
              <>
                Define the organizational structure for <strong>{selectedCompany.name}</strong>.
                Drag to reorder. <strong>Enter</strong> adds sibling, <strong>Tab</strong> adds child, <strong>F2</strong> to edit.
              </>
            ) : (
              'Select a company to define its organizational structure.'
            )}
          </p>
        </div>

        {/* Tree */}
        <div className="border border-[var(--cds-border-subtle-00)] rounded-lg bg-[var(--cds-layer-01)] min-h-[200px]">
          {!selectedCompany ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--cds-text-secondary)]">
              <AlertCircle className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No company selected or no companies defined.</p>
            </div>
          ) : rootUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--cds-text-secondary)]">
              <FolderTree className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm mb-4">No organizational units defined for this company.</p>
              <button
                onClick={() =>
                  onAdd({
                    name: 'New Directorate',
                    level: 'directorate',
                    companyId: companyId,
                    hasBSC: true,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-[var(--cds-interactive)] text-white rounded hover:bg-[var(--cds-interactive)]/90"
              >
                <Plus className="w-4 h-4" />
                <span>Add Directorate</span>
              </button>
            </div>
          ) : (
            <div className="py-2">
              {rootUnits.map((unit) => (
                <TreeNode
                  key={unit.id}
                  unit={unit}
                  units={companyUnits}
                  depth={0}
                  onAdd={onAdd}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  activeId={activeId}
                  dropTarget={dropTarget}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ))}

              {/* Add root directorate button */}
              <button
                onClick={() =>
                  onAdd({
                    name: 'New Directorate',
                    level: 'directorate',
                    companyId: companyId,
                    hasBSC: true,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 mt-2 ml-2 text-sm text-[var(--cds-link-primary)] hover:bg-[var(--cds-background-hover)] rounded"
              >
                <Plus className="w-4 h-4" />
                <span>Add Directorate</span>
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--cds-text-secondary)]">
          <div className="flex items-center gap-1.5">
            {LEVEL_ICONS.directorate}
            <span>Directorate</span>
          </div>
          <div className="flex items-center gap-1.5">
            {LEVEL_ICONS.division}
            <span>Division</span>
          </div>
          <div className="flex items-center gap-1.5">
            {LEVEL_ICONS.department}
            <span>Department</span>
          </div>
          <div className="flex items-center gap-1.5">
            {LEVEL_ICONS.section}
            <span>Section (No BSC)</span>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeUnit && (
          <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-interactive)] rounded-lg shadow-xl px-4 py-2 opacity-90">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-[var(--cds-interactive)]" />
              {LEVEL_ICONS[activeUnit.level]}
              <span className="text-[var(--cds-text-primary)] font-medium">{activeUnit.name}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
