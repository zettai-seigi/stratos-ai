import React from 'react';
import { Check, Building2, GitBranch, Target } from 'lucide-react';
import { WizardStep, STEPS, STEP_LABELS } from '../useSetupWizard';

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps?: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
}

const STEP_ICONS: Record<WizardStep, React.ReactNode> = {
  'corporate': <Building2 className="w-4 h-4" />,
  'organization': <GitBranch className="w-4 h-4" />,
  'golden-thread': <Target className="w-4 h-4" />,
};

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  completedSteps = [],
  onStepClick,
}) => {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 bg-[var(--cds-layer-01)] border-b border-[var(--cds-border-subtle-00)]">
      {STEPS.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = completedSteps.includes(step) || index < currentIndex;
        const isClickable = onStepClick && (isCompleted || index <= currentIndex);

        return (
          <React.Fragment key={step}>
            {/* Step indicator */}
            <button
              onClick={() => isClickable && onStepClick?.(step)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-[var(--cds-interactive)] text-white'
                  : isCompleted
                  ? 'bg-[var(--cds-support-success)] text-white'
                  : 'bg-[var(--cds-field-01)] text-[var(--cds-text-secondary)]'
              } ${isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </span>
              <span className="text-sm font-medium hidden sm:inline">
                {STEP_LABELS[step]}
              </span>
              <span className="sm:hidden">{STEP_ICONS[step]}</span>
            </button>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  index < currentIndex
                    ? 'bg-[var(--cds-support-success)]'
                    : 'bg-[var(--cds-border-subtle-01)]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
