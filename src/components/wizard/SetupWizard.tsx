import React from 'react';
import { ArrowLeft, ArrowRight, Check, X, RotateCcw } from 'lucide-react';
import { useSetupWizard } from './useSetupWizard';
import { WizardProgress } from './components/WizardProgress';
import { CorporateStructureStep } from './steps/CorporateStructureStep';
import { OrgStructureStep } from './steps/OrgStructureStep';
import { GoldenThreadStep } from './steps/GoldenThreadStep';

interface SetupWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const wizard = useSetupWizard();

  const handleComplete = () => {
    wizard.saveAndComplete();
    onComplete?.();
  };

  const handleCancel = () => {
    wizard.cancel();
    onCancel?.();
  };

  // Validation
  const companies = wizard.state.corporateEntities.filter(
    (e) => e.entityType === 'company' && e.isActive
  );
  const hasMinimumSetup =
    wizard.state.corporateEntities.length > 0 && companies.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--cds-background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--cds-layer-01)] border-b border-[var(--cds-border-subtle-00)]">
        <div>
          <h1 className="text-xl font-semibold text-[var(--cds-text-primary)]">
            StratOS AI Setup Wizard
          </h1>
          <p className="text-sm text-[var(--cds-text-secondary)]">
            Configure your corporate and organizational structure
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)] transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      <WizardProgress
        currentStep={wizard.currentStep}
        onStepClick={wizard.goToStep}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {wizard.currentStep === 'corporate' && (
            <CorporateStructureStep
              entities={wizard.state.corporateEntities}
              onAdd={wizard.addCorporateEntity}
              onUpdate={wizard.updateCorporateEntity}
              onDelete={wizard.deleteCorporateEntity}
            />
          )}

          {wizard.currentStep === 'organization' && (
            <OrgStructureStep
              orgUnits={wizard.state.orgUnits}
              corporateEntities={wizard.state.corporateEntities}
              selectedCompanyId={wizard.state.selectedCompanyId}
              onAdd={wizard.addOrgUnit}
              onUpdate={wizard.updateOrgUnit}
              onDelete={wizard.deleteOrgUnit}
              onSelectCompany={wizard.selectCompany}
            />
          )}

          {wizard.currentStep === 'golden-thread' && (
            <GoldenThreadStep
              pillars={wizard.state.pillars}
              corporateEntities={wizard.state.corporateEntities}
              orgUnits={wizard.state.orgUnits}
              onAdd={wizard.addPillar}
              onUpdate={wizard.updatePillar}
              onDelete={wizard.deletePillar}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--cds-layer-01)] border-t border-[var(--cds-border-subtle-00)]">
        <div className="flex items-center gap-2">
          <button
            onClick={wizard.reset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--cds-text-secondary)] hover:bg-[var(--cds-background-hover)] rounded-lg transition-colors"
            title="Reset all data"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {wizard.canGoBack && (
            <button
              onClick={wizard.goBack}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--cds-text-primary)] bg-[var(--cds-field-01)] hover:bg-[var(--cds-background-hover)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {wizard.canGoNext ? (
            <button
              onClick={wizard.goNext}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--cds-interactive)] hover:bg-[var(--cds-interactive)]/90 rounded-lg transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!hasMinimumSetup}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--cds-support-success)] hover:bg-[var(--cds-support-success)]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasMinimumSetup ? 'At least one corporation and operating company is required' : undefined}
            >
              <Check className="w-4 h-4" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
