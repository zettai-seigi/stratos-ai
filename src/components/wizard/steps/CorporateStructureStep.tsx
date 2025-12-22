import React from 'react';
import { CorporateTreeEditor } from '../components/CorporateTreeEditor';
import { CorporateEntity } from '../../../types';

interface CorporateStructureStepProps {
  entities: CorporateEntity[];
  onAdd: (entity: Partial<CorporateEntity> & Pick<CorporateEntity, 'name' | 'entityType'>) => void;
  onUpdate: (id: string, updates: Partial<CorporateEntity>) => void;
  onDelete: (id: string) => void;
}

export const CorporateStructureStep: React.FC<CorporateStructureStepProps> = ({
  entities,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--cds-text-primary)] mb-2">
          Corporate Structure
        </h2>
        <p className="text-sm text-[var(--cds-text-secondary)]">
          Define your corporate hierarchy starting with the root Corporation, then add any Holding
          Companies and Operating Companies. Each Operating Company can have its own organizational
          structure (Directorates, Divisions, etc.).
        </p>
      </div>

      <CorporateTreeEditor
        entities={entities}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />

      {/* Tips section */}
      <div className="p-4 bg-[var(--cds-layer-02)] rounded-lg border border-[var(--cds-border-subtle-00)]">
        <h3 className="text-sm font-semibold text-[var(--cds-text-primary)] mb-2">Tips</h3>
        <ul className="space-y-1 text-xs text-[var(--cds-text-secondary)]">
          <li>
            <strong>Corporation</strong> is the root entity - typically your parent company or main
            legal entity.
          </li>
          <li>
            <strong>Holding Companies</strong> are intermediate entities that own other companies
            (e.g., regional holdings).
          </li>
          <li>
            <strong>Operating Companies</strong> are the entities where actual business operations
            occur. Each will have its own organizational structure.
          </li>
          <li>
            <strong>BSC Scope</strong>: Consolidated means metrics roll up from children; Standalone
            means independent tracking.
          </li>
        </ul>
      </div>
    </div>
  );
};
