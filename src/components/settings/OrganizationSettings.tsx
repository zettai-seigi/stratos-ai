import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrgUnit, OrgLevel, OrgHierarchyConfig, createOrgUnit, CorporateEntity } from '../../types';
import { ORG_LEVELS_ORDERED, getLevelName } from '../../utils/orgDefaults';
import { Button, Modal } from '../shared';
import { Building2, ChevronRight, Plus, Edit2, Trash2, LayoutDashboard, AlertTriangle, Building } from 'lucide-react';

// Level name configuration section
const LevelNamesConfig: React.FC<{
  config: OrgHierarchyConfig;
  onUpdate: (config: OrgHierarchyConfig) => void;
}> = ({ config, onUpdate }) => {
  const [names, setNames] = useState(config.levelNames);

  const handleSave = () => {
    onUpdate({ ...config, levelNames: names });
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Level Names</h3>
      <p className="text-sm text-text-secondary mb-4">
        Customize the names for each organizational level.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {ORG_LEVELS_ORDERED.map((level) => (
          <div key={level}>
            <label className="block text-sm font-medium text-text-secondary mb-1 capitalize">
              {level}
            </label>
            <input
              type="text"
              value={names[level]}
              onChange={(e) => setNames({ ...names, [level]: e.target.value })}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave}>Save Names</Button>
      </div>
    </div>
  );
};

// BSC configuration section
const BSCConfig: React.FC<{
  config: OrgHierarchyConfig;
  onUpdate: (config: OrgHierarchyConfig) => void;
}> = ({ config, onUpdate }) => {
  const toggleLevel = (level: OrgLevel) => {
    // Section level cannot have BSC
    if (level === 'section') return;

    const newLevels = config.levelsWithBSC.includes(level)
      ? config.levelsWithBSC.filter((l) => l !== level)
      : [...config.levelsWithBSC, level];

    // Ensure at least directorate level has BSC
    if (!newLevels.includes('directorate')) {
      newLevels.push('directorate');
    }

    onUpdate({ ...config, levelsWithBSC: newLevels });
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Balanced Scorecard Levels</h3>
      <p className="text-sm text-text-secondary mb-4">
        Select which organizational levels can have their own Balanced Scorecard. Other levels will inherit from their parent.
      </p>
      <div className="space-y-3">
        {ORG_LEVELS_ORDERED.map((level) => (
          <label
            key={level}
            className={`flex items-center gap-3 p-3 rounded-lg bg-bg-primary border border-border ${
              level === 'section' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-hover'
            }`}
          >
            <input
              type="checkbox"
              checked={config.levelsWithBSC.includes(level)}
              onChange={() => toggleLevel(level)}
              disabled={level === 'section' || level === 'directorate'}
              className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue"
            />
            <div className="flex-1">
              <span className="text-text-primary font-medium">{config.levelNames[level]}</span>
              {level === 'directorate' && (
                <span className="ml-2 text-xs text-text-muted">(always enabled)</span>
              )}
              {level === 'section' && (
                <span className="ml-2 text-xs text-text-muted">(operational only - no BSC)</span>
              )}
            </div>
            {config.levelsWithBSC.includes(level) && (
              <LayoutDashboard className="w-4 h-4 text-accent-blue" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

// Org unit form for create/edit
interface OrgUnitFormProps {
  unit?: OrgUnit;
  parentId?: string | null;
  level: OrgLevel;
  companyId: string;
  config: OrgHierarchyConfig;
  onSave: (unit: OrgUnit) => void;
  onClose: () => void;
}

const OrgUnitForm: React.FC<OrgUnitFormProps> = ({ unit, parentId, level, companyId, config, onSave, onClose }) => {
  const { state } = useApp();
  const isEditing = !!unit;

  const [formData, setFormData] = useState({
    name: unit?.name || '',
    code: unit?.code || '',
    description: unit?.description || '',
    hasBSC: unit?.hasBSC ?? (level !== 'section' && config.levelsWithBSC.includes(level)),
    inheritBSCFromId: unit?.inheritBSCFromId || parentId || '',
  });

  const availableParents = (state.orgUnits || []).filter(
    (u) => u.hasBSC && u.id !== unit?.id && u.companyId === companyId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orgUnit = createOrgUnit({
      id: unit?.id,
      name: formData.name,
      code: formData.code,
      level,
      companyId,
      parentId: unit?.parentId ?? parentId ?? null,
      description: formData.description || undefined,
      hasBSC: level === 'section' ? false : formData.hasBSC,
      inheritBSCFromId: !formData.hasBSC || level === 'section' ? formData.inheritBSCFromId : undefined,
      displayOrder: unit?.displayOrder ?? 1,
      isActive: unit?.isActive ?? true,
      createdAt: unit?.createdAt,
    });

    onSave(orgUnit);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={`e.g., ${config.levelNames[level]} Name`}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Code *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., IT, FIN"
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
            required
            maxLength={10}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this organizational unit..."
          rows={2}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue resize-none"
        />
      </div>

      {level !== 'section' && config.levelsWithBSC.includes(level) && (
        <div className="p-3 rounded-lg bg-bg-primary border border-border">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasBSC}
              onChange={(e) => setFormData({ ...formData, hasBSC: e.target.checked })}
              className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue"
            />
            <div>
              <span className="text-text-primary font-medium">Has Own Balanced Scorecard</span>
              <p className="text-xs text-text-muted">
                Enable if this {config.levelNames[level].toLowerCase()} should have its own BSC pillars
              </p>
            </div>
          </label>

          {!formData.hasBSC && availableParents.length > 0 && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Inherit BSC From
              </label>
              <select
                value={formData.inheritBSCFromId}
                onChange={(e) => setFormData({ ...formData, inheritBSCFromId: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
              >
                <option value="">Select parent unit...</option>
                {availableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({config.levelNames[p.level]})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {level === 'section' && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-amber-500">
            Sections are operational units and cannot have their own Balanced Scorecard.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
};

// Org unit tree item
interface OrgUnitTreeItemProps {
  unit: OrgUnit;
  config: OrgHierarchyConfig;
  children: OrgUnit[];
  onEdit: (unit: OrgUnit) => void;
  onDelete: (unit: OrgUnit) => void;
  onAddChild: (parentId: string, level: OrgLevel) => void;
}

const OrgUnitTreeItem: React.FC<OrgUnitTreeItemProps> = ({
  unit,
  config,
  children,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const [expanded, setExpanded] = useState(true);
  const { getChildOrgUnits, getInitiativesByOrgUnit, getProjectsByOrgUnit } = useApp();

  const hasChildren = children.length > 0;
  const nextLevel: OrgLevel | null =
    unit.level === 'directorate' ? 'division' :
    unit.level === 'division' ? 'department' :
    unit.level === 'department' ? 'section' : null;

  const initiativeCount = getInitiativesByOrgUnit(unit.id).length;
  const projectCount = getProjectsByOrgUnit(unit.id).length;

  return (
    <div className="ml-4">
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-bg-hover group">
        {hasChildren || nextLevel ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <div className="w-5" />
        )}

        <Building2 className="w-4 h-4 text-accent-blue" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary truncate">{unit.name}</span>
            <span className="text-xs text-text-muted">({unit.code})</span>
            {unit.hasBSC && (
              <span title="Has BSC">
                <LayoutDashboard className="w-3 h-3 text-accent-blue" />
              </span>
            )}
          </div>
          <div className="text-xs text-text-muted">
            {config.levelNames[unit.level]}
            {(initiativeCount > 0 || projectCount > 0) && (
              <span className="ml-2">
                {initiativeCount > 0 && `${initiativeCount} initiative${initiativeCount !== 1 ? 's' : ''}`}
                {initiativeCount > 0 && projectCount > 0 && ', '}
                {projectCount > 0 && `${projectCount} project${projectCount !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {nextLevel && (
            <button
              onClick={() => onAddChild(unit.id, nextLevel)}
              className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-accent-blue"
              title={`Add ${config.levelNames[nextLevel]}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(unit)}
            className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-accent-blue"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(unit)}
            className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-rag-red"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-border ml-2">
          {children.map((child) => (
            <OrgUnitTreeItem
              key={child.id}
              unit={child}
              config={config}
              children={getChildOrgUnits(child.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}

      {expanded && nextLevel && children.length === 0 && (
        <div className="ml-6 py-2 px-3 text-sm text-text-muted">
          <button
            onClick={() => onAddChild(unit.id, nextLevel)}
            className="flex items-center gap-2 text-accent-blue hover:underline"
          >
            <Plus className="w-3 h-3" />
            Add {config.levelNames[nextLevel]}
          </button>
        </div>
      )}
    </div>
  );
};

// Main OrganizationSettings component
export const OrganizationSettings: React.FC = () => {
  const { state, dispatch, getChildOrgUnits, getOrgConfig, getAllCompanies, getOrgUnitsForCompany } = useApp();
  const config = getOrgConfig();
  const companies = getAllCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const companyOrgUnits = selectedCompanyId ? getOrgUnitsForCompany(selectedCompanyId) : [];
  const topLevelUnits = companyOrgUnits.filter((u) => !u.parentId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrgUnit | undefined>();
  const [newUnitParentId, setNewUnitParentId] = useState<string | null>(null);
  const [newUnitLevel, setNewUnitLevel] = useState<OrgLevel>('directorate');
  const [deleteConfirm, setDeleteConfirm] = useState<OrgUnit | null>(null);

  const handleUpdateConfig = (newConfig: OrgHierarchyConfig) => {
    dispatch({ type: 'UPDATE_ORG_CONFIG', payload: newConfig });
  };

  const handleSaveUnit = (unit: OrgUnit) => {
    if (editingUnit) {
      dispatch({ type: 'UPDATE_ORG_UNIT', payload: unit });
    } else {
      dispatch({ type: 'ADD_ORG_UNIT', payload: unit });
    }
  };

  const handleEditUnit = (unit: OrgUnit) => {
    setEditingUnit(unit);
    setNewUnitLevel(unit.level);
    setNewUnitParentId(unit.parentId);
    setIsFormOpen(true);
  };

  const handleAddChild = (parentId: string, level: OrgLevel) => {
    setEditingUnit(undefined);
    setNewUnitParentId(parentId);
    setNewUnitLevel(level);
    setIsFormOpen(true);
  };

  const handleAddDirectorate = () => {
    setEditingUnit(undefined);
    setNewUnitParentId(null);
    setNewUnitLevel('directorate');
    setIsFormOpen(true);
  };

  const handleDeleteUnit = (unit: OrgUnit) => {
    setDeleteConfirm(unit);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      dispatch({ type: 'DELETE_ORG_UNIT', payload: deleteConfirm.id });
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Organization Hierarchy</h2>
        <p className="text-text-secondary">
          Configure your organization structure and Balanced Scorecard levels within each company.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LevelNamesConfig config={config} onUpdate={handleUpdateConfig} />
        <BSCConfig config={config} onUpdate={handleUpdateConfig} />
      </div>

      {/* Company Selector */}
      {companies.length > 0 && (
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Select Company</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompanyId(company.id)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  selectedCompanyId === company.id
                    ? 'bg-accent-blue text-white border-accent-blue'
                    : 'bg-bg-primary border-border text-text-primary hover:bg-bg-hover'
                }`}
              >
                <Building className="w-4 h-4" />
                {company.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Organization Tree */}
      <div className="bg-bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Organization Structure
            {selectedCompany && (
              <span className="text-text-secondary font-normal"> - {selectedCompany.name}</span>
            )}
          </h3>
          {selectedCompanyId && (
            <Button onClick={handleAddDirectorate}>
              <Plus className="w-4 h-4 mr-2" />
              Add {config.levelNames.directorate}
            </Button>
          )}
        </div>

        {!selectedCompanyId || companies.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No companies found.</p>
            <p className="text-sm">Create companies in the Corporate Structure settings first.</p>
          </div>
        ) : topLevelUnits.length > 0 ? (
          <div className="-ml-4">
            {topLevelUnits.map((unit) => (
              <OrgUnitTreeItem
                key={unit.id}
                unit={unit}
                config={config}
                children={getChildOrgUnits(unit.id)}
                onEdit={handleEditUnit}
                onDelete={handleDeleteUnit}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No organization structure defined for this company.</p>
            <p className="text-sm">Add a {config.levelNames.directorate.toLowerCase()} to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUnit ? `Edit ${config.levelNames[editingUnit.level]}` : `Add ${config.levelNames[newUnitLevel]}`}
      >
        <OrgUnitForm
          unit={editingUnit}
          parentId={newUnitParentId}
          level={editingUnit?.level || newUnitLevel}
          companyId={editingUnit?.companyId || selectedCompanyId}
          config={config}
          onSave={handleSaveUnit}
          onClose={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Organization Unit"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-rag-red/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-rag-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-text-primary">
                Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Any child units will be moved to the parent level. Initiatives and projects will be reassigned.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-rag-red hover:bg-rag-red/90">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
