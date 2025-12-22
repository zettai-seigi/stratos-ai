import React, { useEffect } from 'react';
import { OrgTreeEditor } from '../components/OrgTreeEditor';
import { OrgUnit, CorporateEntity } from '../../../types';

interface OrgStructureStepProps {
  orgUnits: OrgUnit[];
  corporateEntities: CorporateEntity[];
  selectedCompanyId: string | null;
  onAdd: (unit: Partial<OrgUnit> & Pick<OrgUnit, 'name' | 'level' | 'companyId'>) => void;
  onUpdate: (id: string, updates: Partial<OrgUnit>) => void;
  onDelete: (id: string) => void;
  onSelectCompany: (companyId: string | null) => void;
}

export const OrgStructureStep: React.FC<OrgStructureStepProps> = ({
  orgUnits,
  corporateEntities,
  selectedCompanyId,
  onAdd,
  onUpdate,
  onDelete,
  onSelectCompany,
}) => {
  // Get all operating companies
  const companies = corporateEntities.filter((e) => e.entityType === 'company' && e.isActive);

  // Auto-select first company if none selected
  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      onSelectCompany(companies[0].id);
    }
  }, [selectedCompanyId, companies, onSelectCompany]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--cds-text-primary)] mb-2">
          Organization Structure
        </h2>
        <p className="text-sm text-[var(--cds-text-secondary)]">
          Define the organizational units within each Operating Company. The hierarchy goes:
          Directorate → Division → Department → Section. Note that Sections are operational only and
          cannot have BSC metrics.
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="p-6 text-center bg-[var(--cds-notification-warning-background)] rounded-lg border border-[var(--cds-support-warning)]">
          <p className="text-sm text-[var(--cds-text-primary)]">
            No Operating Companies defined yet. Please go back to the Corporate Structure step and
            add at least one Operating Company.
          </p>
        </div>
      ) : (
        <OrgTreeEditor
          orgUnits={orgUnits}
          companyId={selectedCompanyId || companies[0].id}
          companies={companies}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onSelectCompany={onSelectCompany}
        />
      )}

      {/* Tips section */}
      <div className="p-4 bg-[var(--cds-layer-02)] rounded-lg border border-[var(--cds-border-subtle-00)]">
        <h3 className="text-sm font-semibold text-[var(--cds-text-primary)] mb-2">Tips</h3>
        <ul className="space-y-1 text-xs text-[var(--cds-text-secondary)]">
          <li>
            <strong>Directorates</strong> are top-level organizational units (e.g., Technology,
            Operations, Finance).
          </li>
          <li>
            <strong>Divisions</strong> are major sub-units within a Directorate.
          </li>
          <li>
            <strong>Departments</strong> are functional teams within a Division.
          </li>
          <li>
            <strong>Sections</strong> are the smallest operational units - they cannot have their
            own BSC metrics.
          </li>
          <li>
            You can always edit this structure later in Settings → Organization.
          </li>
        </ul>
      </div>
    </div>
  );
};
