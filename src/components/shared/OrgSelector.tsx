import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OrgUnit } from '../../types';
import { Building2, ChevronDown, ChevronRight, LayoutDashboard } from 'lucide-react';

interface OrgSelectorProps {
  selectedOrgUnitId: string | null;
  onSelect: (orgUnitId: string | null) => void;
  showAllOption?: boolean;
  compact?: boolean;
}

export const OrgSelector: React.FC<OrgSelectorProps> = ({
  selectedOrgUnitId,
  onSelect,
  showAllOption = true,
  compact = false,
}) => {
  const { state, getOrgUnit, getChildOrgUnits, getOrgConfig, getOrgUnitAncestors } = useApp();
  const config = getOrgConfig();
  const orgUnits = state.orgUnits || [];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUnit = selectedOrgUnitId ? getOrgUnit(selectedOrgUnitId) : null;
  const ancestors = selectedUnit ? getOrgUnitAncestors(selectedUnit.id) : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recursive org tree item
  const OrgTreeItem: React.FC<{
    unit: OrgUnit;
    depth: number;
  }> = ({ unit, depth }) => {
    const children = getChildOrgUnits(unit.id);
    const [expanded, setExpanded] = useState(
      // Expand if this unit or any descendant is selected
      ancestors.some((a) => a.id === unit.id) || selectedOrgUnitId === unit.id
    );

    return (
      <div>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-hover rounded-lg ${
            selectedOrgUnitId === unit.id ? 'bg-accent-blue/10 text-accent-blue' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-primary"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <div className="w-4" />
          )}
          <button
            onClick={() => {
              onSelect(unit.id);
              setIsOpen(false);
            }}
            className="flex-1 flex items-center gap-2 text-left"
          >
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{unit.name}</span>
            {unit.hasBSC && (
              <LayoutDashboard className="w-3 h-3 text-accent-blue" />
            )}
          </button>
        </div>
        {expanded && children.length > 0 && (
          <div>
            {children.map((child) => (
              <OrgTreeItem key={child.id} unit={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Top-level org units (directorates without parent)
  const topLevelOrgUnits = orgUnits.filter((u) => !u.parentId && u.isActive);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 bg-bg-card border border-border rounded-lg hover:bg-bg-hover transition-colors ${
          compact ? 'text-sm' : ''
        }`}
      >
        <Building2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-accent-blue`} />
        <span className="text-text-primary font-medium truncate max-w-[200px]">
          {selectedUnit ? selectedUnit.name : 'All Organizations'}
        </span>
        <ChevronDown className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-text-muted`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-card border border-border rounded-xl shadow-lg z-50 py-2 max-h-96 overflow-y-auto">
          {showAllOption && (
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-hover ${
                !selectedOrgUnitId ? 'bg-accent-blue/10 text-accent-blue' : ''
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">All Organizations</span>
            </button>
          )}

          {showAllOption && topLevelOrgUnits.length > 0 && (
            <div className="border-t border-border my-1" />
          )}

          {topLevelOrgUnits.map((unit) => (
            <OrgTreeItem key={unit.id} unit={unit} depth={0} />
          ))}

          {topLevelOrgUnits.length === 0 && (
            <div className="px-3 py-4 text-center text-text-muted text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No organization structure defined.</p>
              <p className="text-xs mt-1">Go to Settings to create one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Breadcrumb version for header navigation
interface OrgBreadcrumbProps {
  selectedOrgUnitId: string | null;
  onSelect: (orgUnitId: string | null) => void;
}

export const OrgBreadcrumb: React.FC<OrgBreadcrumbProps> = ({ selectedOrgUnitId, onSelect }) => {
  const { getOrgUnit, getOrgUnitAncestors, getOrgConfig } = useApp();
  const config = getOrgConfig();

  const selectedUnit = selectedOrgUnitId ? getOrgUnit(selectedOrgUnitId) : null;
  const ancestors = selectedUnit ? getOrgUnitAncestors(selectedUnit.id) : [];
  const breadcrumbPath = selectedUnit ? [...ancestors, selectedUnit] : [];

  if (breadcrumbPath.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {breadcrumbPath.map((unit, index) => (
        <React.Fragment key={unit.id}>
          {index > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
          <button
            onClick={() => onSelect(unit.id)}
            className={`px-2 py-1 rounded hover:bg-bg-hover transition-colors ${
              index === breadcrumbPath.length - 1
                ? 'text-accent-blue font-medium'
                : 'text-text-secondary'
            }`}
          >
            {unit.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
