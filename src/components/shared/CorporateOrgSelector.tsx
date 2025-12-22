import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Building,
  Factory,
  Users,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { useCorporateContext } from '../../context/CorporateContext';
import { useOrgContext } from '../../context/OrgContext';
import { CorporateEntity, OrgUnit, OrgLevel } from '../../types';

interface CorporateOrgSelectorProps {
  compact?: boolean;
  showOrgUnits?: boolean;
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  corporation: <Building2 className="w-3.5 h-3.5 text-[var(--cds-support-info)]" />,
  holding: <Building className="w-3.5 h-3.5 text-[var(--cds-support-warning)]" />,
  company: <Factory className="w-3.5 h-3.5 text-[var(--cds-support-success)]" />,
};

const ORG_LEVEL_COLORS: Record<OrgLevel, string> = {
  directorate: 'var(--cds-support-info)',
  division: 'var(--cds-support-warning)',
  department: 'var(--cds-support-success)',
  section: 'var(--cds-text-secondary)',
};

export const CorporateOrgSelector: React.FC<CorporateOrgSelectorProps> = ({
  compact = false,
  showOrgUnits = true,
}) => {
  const {
    selectedCorporateEntityId,
    setSelectedCorporateEntityId,
    selectedEntity,
    getChildEntities,
    getCompanies,
    getOrgUnitsForCompany,
    getRootCorporation,
  } = useCorporateContext();

  const { selectedOrgUnitId, setSelectedOrgUnitId, selectedOrgUnit } = useOrgContext();

  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'corporate' | 'org'>('corporate');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Get display text
  const getDisplayText = () => {
    if (selectedOrgUnit) {
      return selectedOrgUnit.name;
    }
    if (selectedEntity) {
      return selectedEntity.name;
    }
    return 'All Organizations';
  };

  // Recursive corporate tree renderer
  const CorporateTreeNode: React.FC<{
    entity: CorporateEntity;
    depth: number;
  }> = ({ entity, depth }) => {
    const children = getChildEntities(entity.id);
    const [expanded, setExpanded] = useState(
      depth < 2 || selectedCorporateEntityId === entity.id
    );
    const isSelected = selectedCorporateEntityId === entity.id;

    return (
      <div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--cds-background-hover)] ${
            isSelected ? 'bg-[var(--cds-background-active)] text-[var(--cds-link-primary)]' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            setSelectedCorporateEntityId(entity.id);
            setSelectedOrgUnitId(null);
            if (entity.entityType === 'company' && showOrgUnits) {
              setActivePanel('org');
            } else {
              setIsOpen(false);
            }
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-4 h-4 flex items-center justify-center"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-[var(--cds-icon-secondary)]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[var(--cds-icon-secondary)]" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          {ENTITY_ICONS[entity.entityType]}
          <span className="text-xs truncate">{entity.name}</span>
        </div>
        {expanded && children.length > 0 && (
          <div>
            {children.map((child) => (
              <CorporateTreeNode key={child.id} entity={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Recursive org tree renderer
  const OrgTreeNode: React.FC<{
    unit: OrgUnit;
    allUnits: OrgUnit[];
    depth: number;
  }> = ({ unit, allUnits, depth }) => {
    const children = allUnits.filter((u) => u.parentId === unit.id);
    const [expanded, setExpanded] = useState(depth < 2);
    const isSelected = selectedOrgUnitId === unit.id;

    return (
      <div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--cds-background-hover)] ${
            isSelected ? 'bg-[var(--cds-background-active)] text-[var(--cds-link-primary)]' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            setSelectedOrgUnitId(unit.id);
            setIsOpen(false);
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-4 h-4 flex items-center justify-center"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-[var(--cds-icon-secondary)]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[var(--cds-icon-secondary)]" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Users className="w-3.5 h-3.5" style={{ color: ORG_LEVEL_COLORS[unit.level] }} />
          <span className="text-xs truncate">{unit.name}</span>
        </div>
        {expanded && children.length > 0 && (
          <div>
            {children.map((child) => (
              <OrgTreeNode key={child.id} unit={child} allUnits={allUnits} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get current company for org panel
  const currentCompanyId =
    selectedEntity?.entityType === 'company'
      ? selectedEntity.id
      : selectedOrgUnit?.companyId || null;
  const companyOrgUnits = currentCompanyId ? getOrgUnitsForCompany(currentCompanyId) : [];
  const rootOrgUnits = companyOrgUnits.filter((u) => !u.parentId);
  const rootCorporation = getRootCorporation();
  const rootEntities = rootCorporation ? [rootCorporation] : getChildEntities(null);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-[var(--cds-background-hover)] transition-colors ${
          compact ? '' : 'border border-[var(--cds-border-subtle-00)]'
        }`}
      >
        {selectedEntity ? (
          ENTITY_ICONS[selectedEntity.entityType]
        ) : (
          <Building2 className="w-3.5 h-3.5 text-[var(--cds-icon-secondary)]" />
        )}
        <span className="text-[var(--cds-text-secondary)] max-w-[150px] truncate">
          {getDisplayText()}
        </span>
        <ChevronDown className="w-3 h-3 text-[var(--cds-icon-secondary)]" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-00)] rounded-lg shadow-lg z-50 min-w-[280px]">
          {/* Panel tabs (if showing org units) */}
          {showOrgUnits && (
            <div className="flex border-b border-[var(--cds-border-subtle-00)]">
              <button
                onClick={() => setActivePanel('corporate')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activePanel === 'corporate'
                    ? 'text-[var(--cds-link-primary)] border-b-2 border-[var(--cds-link-primary)]'
                    : 'text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)]'
                }`}
              >
                Corporate
              </button>
              <button
                onClick={() => setActivePanel('org')}
                disabled={!currentCompanyId}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activePanel === 'org'
                    ? 'text-[var(--cds-link-primary)] border-b-2 border-[var(--cds-link-primary)]'
                    : 'text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)]'
                }`}
              >
                Organization
              </button>
            </div>
          )}

          {/* Content */}
          <div className="max-h-64 overflow-y-auto p-1">
            {/* All option */}
            <button
              onClick={() => {
                setSelectedCorporateEntityId(null);
                setSelectedOrgUnitId(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-[var(--cds-background-hover)] ${
                !selectedCorporateEntityId && !selectedOrgUnitId
                  ? 'bg-[var(--cds-background-active)] text-[var(--cds-link-primary)]'
                  : ''
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Organizations</span>
            </button>

            <div className="h-px bg-[var(--cds-border-subtle-00)] my-1" />

            {activePanel === 'corporate' ? (
              // Corporate tree
              rootEntities.length > 0 ? (
                rootEntities.map((entity) => (
                  <CorporateTreeNode key={entity.id} entity={entity} depth={0} />
                ))
              ) : (
                <div className="px-3 py-4 text-center text-[var(--cds-text-secondary)] text-xs">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No corporate structure defined.</p>
                </div>
              )
            ) : (
              // Org tree
              <>
                {currentCompanyId && (
                  <div className="px-2 py-1 text-[10px] text-[var(--cds-text-secondary)] uppercase tracking-wider">
                    {selectedEntity?.name || 'Company'} Units
                  </div>
                )}
                {rootOrgUnits.length > 0 ? (
                  rootOrgUnits.map((unit) => (
                    <OrgTreeNode key={unit.id} unit={unit} allUnits={companyOrgUnits} depth={0} />
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-[var(--cds-text-secondary)] text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No organizational units defined.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Clear selection */}
          {(selectedCorporateEntityId || selectedOrgUnitId) && (
            <div className="border-t border-[var(--cds-border-subtle-00)] p-1">
              <button
                onClick={() => {
                  setSelectedCorporateEntityId(null);
                  setSelectedOrgUnitId(null);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)] rounded"
              >
                <X className="w-3 h-3" />
                <span>Clear Selection</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
