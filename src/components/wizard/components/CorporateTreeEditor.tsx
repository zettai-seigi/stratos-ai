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
  Building2,
  Building,
  Factory,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  CornerDownRight,
} from 'lucide-react';
import { CorporateEntity, CorporateEntityType } from '../../../types';

interface CorporateTreeEditorProps {
  entities: CorporateEntity[];
  onAdd: (entity: Partial<CorporateEntity> & Pick<CorporateEntity, 'name' | 'entityType'>) => void;
  onUpdate: (id: string, updates: Partial<CorporateEntity>) => void;
  onDelete: (id: string) => void;
}

const ENTITY_ICONS: Record<CorporateEntityType, React.ReactNode> = {
  corporation: <Building2 className="w-4 h-4 text-[var(--cds-support-info)]" />,
  holding: <Building className="w-4 h-4 text-[var(--cds-support-warning)]" />,
  company: <Factory className="w-4 h-4 text-[var(--cds-support-success)]" />,
};

const ENTITY_LABELS: Record<CorporateEntityType, string> = {
  corporation: 'Corporation',
  holding: 'Holding Company',
  company: 'Operating Company',
};

type DropPosition = 'before' | 'after' | 'child';

interface DropTargetInfo {
  entityId: string;
  position: DropPosition;
}

// Get valid child type for a parent type
function getChildType(parentType: CorporateEntityType): CorporateEntityType | null {
  if (parentType === 'corporation') return 'holding';
  if (parentType === 'holding') return 'company';
  return null; // company can't have children
}

// Get sibling type (same as current type)
function getSiblingType(currentType: CorporateEntityType): CorporateEntityType {
  return currentType;
}

// Check if moving would create a cycle
function wouldCreateCycle(
  entities: CorporateEntity[],
  draggedId: string,
  targetParentId: string
): boolean {
  let current = entities.find((e) => e.id === targetParentId);
  while (current) {
    if (current.id === draggedId) return true;
    current = entities.find((e) => e.id === current?.parentEntityId);
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
  entity: CorporateEntity;
  entities: CorporateEntity[];
  depth: number;
  onAdd: CorporateTreeEditorProps['onAdd'];
  onUpdate: CorporateTreeEditorProps['onUpdate'];
  onDelete: CorporateTreeEditorProps['onDelete'];
  activeId: string | null;
  dropTarget: DropTargetInfo | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  entity,
  entities,
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
  const [editName, setEditName] = useState(entity.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = entities.filter((e) => e.parentEntityId === entity.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === entity.id;
  const isDragging = activeId === entity.id;

  const childType = getChildType(entity.entityType);
  const canAddChild = childType !== null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ id: entity.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;

  // Show drop zones when dragging another entity
  const showDropZones = activeId !== null && activeId !== entity.id && !wouldCreateCycle(entities, activeId, entity.id);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onUpdate(entity.id, { name: editName.trim() });
    } else {
      setEditName(entity.name);
    }
    setIsEditing(false);
  };

  const handleAddChild = () => {
    if (!childType) return;
    onAdd({
      name: `New ${ENTITY_LABELS[childType]}`,
      entityType: childType,
      parentEntityId: entity.id,
      hasBSC: true,
      bscScope: childType === 'company' ? 'standalone' : 'consolidated',
    });
    setExpanded(true);
  };

  const handleAddSibling = () => {
    const siblingType = getSiblingType(entity.entityType);
    onAdd({
      name: `New ${ENTITY_LABELS[siblingType]}`,
      entityType: siblingType,
      parentEntityId: entity.parentEntityId || undefined,
      hasBSC: true,
      bscScope: siblingType === 'company' ? 'standalone' : 'consolidated',
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
        setEditName(entity.name);
        setIsEditing(false);
      }
      return;
    }

    if (!isSelected) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      // Add sibling (same level)
      if (entity.entityType !== 'corporation') {
        handleAddSibling();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // Add child
      if (canAddChild) {
        handleAddChild();
      }
    } else if (e.key === 'F2' || e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      setIsEditing(true);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (entity.entityType !== 'corporation') {
        e.preventDefault();
        onDelete(entity.id);
      }
    }
  };

  return (
    <div>
      {/* Drop zone: Before (sibling) */}
      {showDropZones && (
        <DropZone
          id={`${entity.id}:before`}
          isActive={dropTarget?.entityId === entity.id && dropTarget?.position === 'before'}
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
        onClick={() => onSelect(entity.id)}
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
        {ENTITY_ICONS[entity.entityType]}

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
            {entity.name}
          </span>
        )}

        {/* Type badge */}
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--cds-field-02)] text-[var(--cds-text-secondary)] rounded">
          {ENTITY_LABELS[entity.entityType]}
        </span>

        {/* BSC indicator */}
        {entity.hasBSC && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
              entity.bscScope === 'consolidated'
                ? 'bg-[var(--cds-support-info)]/20 text-[var(--cds-support-info)]'
                : 'bg-[var(--cds-support-success)]/20 text-[var(--cds-support-success)]'
            }`}
          >
            BSC: {entity.bscScope}
          </span>
        )}

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAddChild && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild();
              }}
              className="p-1 rounded hover:bg-[var(--cds-background-active)]"
              title={`Add ${ENTITY_LABELS[childType!]} (Tab)`}
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
          {entity.entityType !== 'corporation' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entity.id);
              }}
              className="p-1 rounded hover:bg-[var(--cds-support-error)]/20"
              title="Delete (Del)"
            >
              <Trash2 className="w-3.5 h-3.5 text-[var(--cds-support-error)]" />
            </button>
          )}
        </div>
      </div>

      {/* Drop zone: As child */}
      {showDropZones && canAddChild && (
        <DropZone
          id={`${entity.id}:child`}
          isActive={dropTarget?.entityId === entity.id && dropTarget?.position === 'child'}
          position="child"
          depth={depth}
        />
      )}

      {/* Drop zone: After (sibling) */}
      {showDropZones && (
        <DropZone
          id={`${entity.id}:after`}
          isActive={dropTarget?.entityId === entity.id && dropTarget?.position === 'after'}
          position="after"
          depth={depth}
        />
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((child) => (
              <TreeNode
                key={child.id}
                entity={child}
                entities={entities}
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

export const CorporateTreeEditor: React.FC<CorporateTreeEditorProps> = ({
  entities,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetInfo | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const rootEntities = entities.filter((e) => !e.parentEntityId);
  const activeEntity = activeId ? entities.find((e) => e.id === activeId) : null;

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
      const [entityId, position] = overId.split(':');
      setDropTarget({ entityId, position: position as DropPosition });
    } else {
      setDropTarget({ entityId: overId, position: 'child' });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const currentDropTarget = dropTarget;

    setActiveId(null);
    setDropTarget(null);

    if (!currentDropTarget) return;

    const draggedId = active.id as string;
    const dragged = entities.find((e) => e.id === draggedId);
    const target = entities.find((e) => e.id === currentDropTarget.entityId);

    if (!dragged || !target || draggedId === currentDropTarget.entityId) return;

    const { position } = currentDropTarget;

    // Determine new parent
    let newParentId: string | null;
    if (position === 'child') {
      newParentId = target.id;
    } else {
      newParentId = target.parentEntityId;
    }

    // Check for cycles
    if (newParentId && wouldCreateCycle(entities, draggedId, newParentId)) {
      return;
    }

    // Validate entity type rules
    if (newParentId) {
      const newParent = entities.find((e) => e.id === newParentId);
      if (newParent) {
        const validChildType = getChildType(newParent.entityType);
        if (validChildType !== dragged.entityType) {
          return; // Can't move this type under that parent
        }
      }
    } else {
      // Moving to root - only corporation allowed
      if (dragged.entityType !== 'corporation') {
        return;
      }
    }

    // Calculate new display order
    const siblings = entities
      .filter((e) => e.parentEntityId === newParentId && e.id !== draggedId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    let newOrder: number;
    if (position === 'child') {
      newOrder = siblings.length;
    } else if (position === 'before') {
      const targetIndex = siblings.findIndex((e) => e.id === target.id);
      newOrder = targetIndex >= 0 ? targetIndex : 0;
    } else {
      const targetIndex = siblings.findIndex((e) => e.id === target.id);
      newOrder = targetIndex >= 0 ? targetIndex + 1 : siblings.length;
    }

    // Update dragged entity
    onUpdate(draggedId, {
      parentEntityId: newParentId,
      displayOrder: newOrder,
    });

    // Reorder other siblings
    siblings.forEach((sibling, index) => {
      const actualIndex = index >= newOrder ? index + 1 : index;
      if (sibling.displayOrder !== actualIndex) {
        onUpdate(sibling.id, { displayOrder: actualIndex });
      }
    });
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
        {/* Instructions */}
        <div className="p-3 bg-[var(--cds-notification-info-background)] border-l-4 border-[var(--cds-support-info)] rounded-r">
          <p className="text-sm text-[var(--cds-text-primary)]">
            Define your corporate structure. Drag to reorder. <strong>Enter</strong> adds sibling, <strong>Tab</strong> adds child, <strong>F2</strong> to edit.
          </p>
        </div>

        {/* Tree */}
        <div className="border border-[var(--cds-border-subtle-00)] rounded-lg bg-[var(--cds-layer-01)] min-h-[200px]">
          {rootEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--cds-text-secondary)]">
              <Building2 className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm mb-4">No corporate structure defined yet.</p>
              <button
                onClick={() =>
                  onAdd({
                    name: 'My Corporation',
                    entityType: 'corporation',
                    hasBSC: true,
                    bscScope: 'consolidated',
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-[var(--cds-interactive)] text-white rounded hover:bg-[var(--cds-interactive)]/90"
              >
                <Plus className="w-4 h-4" />
                <span>Create Corporation</span>
              </button>
            </div>
          ) : (
            <div className="py-2">
              {rootEntities
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((entity) => (
                  <TreeNode
                    key={entity.id}
                    entity={entity}
                    entities={entities}
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
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--cds-text-secondary)]">
          <div className="flex items-center gap-1.5">
            {ENTITY_ICONS.corporation}
            <span>Corporation (Root)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {ENTITY_ICONS.holding}
            <span>Holding Company</span>
          </div>
          <div className="flex items-center gap-1.5">
            {ENTITY_ICONS.company}
            <span>Operating Company</span>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEntity && (
          <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-interactive)] rounded-lg shadow-xl px-4 py-2 opacity-90">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-[var(--cds-interactive)]" />
              {ENTITY_ICONS[activeEntity.entityType]}
              <span className="text-[var(--cds-text-primary)] font-medium">{activeEntity.name}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
