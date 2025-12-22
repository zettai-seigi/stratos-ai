import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CorporateEntity,
  OrgUnit,
  StrategyPillar,
  createCorporateEntity,
  createOrgUnit,
} from '../../types';

export type WizardStep = 'corporate' | 'organization' | 'golden-thread';

interface WizardState {
  currentStep: WizardStep;
  corporateEntities: CorporateEntity[];
  orgUnits: OrgUnit[];
  pillars: StrategyPillar[];
  selectedCompanyId: string | null;
  isDirty: boolean;
}

interface UseSetupWizardReturn {
  // State
  state: WizardState;
  currentStep: WizardStep;
  stepIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isComplete: boolean;

  // Navigation
  goToStep: (step: WizardStep) => void;
  goNext: () => void;
  goBack: () => void;

  // Corporate entities
  addCorporateEntity: (entity: Partial<CorporateEntity> & Pick<CorporateEntity, 'name' | 'entityType'>) => void;
  updateCorporateEntity: (id: string, updates: Partial<CorporateEntity>) => void;
  deleteCorporateEntity: (id: string) => void;

  // Org units
  selectCompany: (companyId: string | null) => void;
  addOrgUnit: (unit: Partial<OrgUnit> & Pick<OrgUnit, 'name' | 'level' | 'companyId'>) => void;
  updateOrgUnit: (id: string, updates: Partial<OrgUnit>) => void;
  deleteOrgUnit: (id: string) => void;

  // Pillars
  addPillar: (pillar: StrategyPillar) => void;
  updatePillar: (id: string, updates: Partial<StrategyPillar>) => void;
  deletePillar: (id: string) => void;

  // Save/Cancel
  saveAndComplete: () => void;
  cancel: () => void;
  reset: () => void;
}

const STEPS: WizardStep[] = ['corporate', 'organization', 'golden-thread'];

const STEP_LABELS: Record<WizardStep, string> = {
  'corporate': 'Corporate Structure',
  'organization': 'Organization Units',
  'golden-thread': 'Golden Thread',
};

export function useSetupWizard(): UseSetupWizardReturn {
  const { state: appState, dispatch } = useApp();

  // Initialize wizard state from app state
  const [state, setState] = useState<WizardState>(() => ({
    currentStep: 'corporate',
    corporateEntities: appState.corporateEntities || [],
    orgUnits: appState.orgUnits || [],
    pillars: appState.pillars || [],
    selectedCompanyId: null,
    isDirty: false,
  }));

  const stepIndex = STEPS.indexOf(state.currentStep);
  const totalSteps = STEPS.length;
  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < totalSteps - 1;
  const isComplete = stepIndex === totalSteps - 1;

  // Navigation
  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setState((prev) => ({ ...prev, currentStep: STEPS[stepIndex + 1] }));
    }
  }, [canGoNext, stepIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      setState((prev) => ({ ...prev, currentStep: STEPS[stepIndex - 1] }));
    }
  }, [canGoBack, stepIndex]);

  // Corporate entities
  const addCorporateEntity = useCallback(
    (entity: Partial<CorporateEntity> & Pick<CorporateEntity, 'name' | 'entityType'>) => {
      const newEntity = createCorporateEntity(entity);
      setState((prev) => ({
        ...prev,
        corporateEntities: [...prev.corporateEntities, newEntity],
        isDirty: true,
      }));
    },
    []
  );

  const updateCorporateEntity = useCallback((id: string, updates: Partial<CorporateEntity>) => {
    setState((prev) => ({
      ...prev,
      corporateEntities: prev.corporateEntities.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
      isDirty: true,
    }));
  }, []);

  const deleteCorporateEntity = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      corporateEntities: prev.corporateEntities.filter((e) => e.id !== id),
      // Also remove org units that belong to this entity
      orgUnits: prev.orgUnits.filter((u) => u.companyId !== id),
      isDirty: true,
    }));
  }, []);

  // Company selection (for org structure step)
  const selectCompany = useCallback((companyId: string | null) => {
    setState((prev) => ({ ...prev, selectedCompanyId: companyId }));
  }, []);

  // Org units
  const addOrgUnit = useCallback(
    (unit: Partial<OrgUnit> & Pick<OrgUnit, 'name' | 'level' | 'companyId'>) => {
      const newUnit = createOrgUnit(unit);
      setState((prev) => ({
        ...prev,
        orgUnits: [...prev.orgUnits, newUnit],
        isDirty: true,
      }));
    },
    []
  );

  const updateOrgUnit = useCallback((id: string, updates: Partial<OrgUnit>) => {
    setState((prev) => ({
      ...prev,
      orgUnits: prev.orgUnits.map((u) =>
        u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
      ),
      isDirty: true,
    }));
  }, []);

  const deleteOrgUnit = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      orgUnits: prev.orgUnits.filter((u) => u.id !== id),
      isDirty: true,
    }));
  }, []);

  // Pillars
  const addPillar = useCallback((pillar: StrategyPillar) => {
    setState((prev) => ({
      ...prev,
      pillars: [...prev.pillars, pillar],
      isDirty: true,
    }));
  }, []);

  const updatePillar = useCallback((id: string, updates: Partial<StrategyPillar>) => {
    setState((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      isDirty: true,
    }));
  }, []);

  const deletePillar = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      pillars: prev.pillars.filter((p) => p.id !== id),
      isDirty: true,
    }));
  }, []);

  // Save and complete wizard
  const saveAndComplete = useCallback(() => {
    // Dispatch all changes to AppContext
    state.corporateEntities.forEach((entity) => {
      const existing = appState.corporateEntities?.find((e) => e.id === entity.id);
      if (existing) {
        dispatch({ type: 'UPDATE_CORPORATE_ENTITY', payload: entity });
      } else {
        dispatch({ type: 'ADD_CORPORATE_ENTITY', payload: entity });
      }
    });

    state.orgUnits.forEach((unit) => {
      const existing = appState.orgUnits?.find((u) => u.id === unit.id);
      if (existing) {
        dispatch({ type: 'UPDATE_ORG_UNIT', payload: unit });
      } else {
        dispatch({ type: 'ADD_ORG_UNIT', payload: unit });
      }
    });

    state.pillars.forEach((pillar) => {
      const existing = appState.pillars?.find((p) => p.id === pillar.id);
      if (existing) {
        dispatch({ type: 'UPDATE_PILLAR', payload: pillar });
      } else {
        dispatch({ type: 'ADD_PILLAR', payload: pillar });
      }
    });

    // Mark wizard as completed
    dispatch({ type: 'SET_SETUP_WIZARD_COMPLETED', payload: true });

    setState((prev) => ({ ...prev, isDirty: false }));
  }, [state, appState, dispatch]);

  // Cancel wizard
  const cancel = useCallback(() => {
    setState({
      currentStep: 'corporate',
      corporateEntities: appState.corporateEntities || [],
      orgUnits: appState.orgUnits || [],
      pillars: appState.pillars || [],
      selectedCompanyId: null,
      isDirty: false,
    });
  }, [appState]);

  // Reset wizard to defaults
  const reset = useCallback(() => {
    setState({
      currentStep: 'corporate',
      corporateEntities: [],
      orgUnits: [],
      pillars: [],
      selectedCompanyId: null,
      isDirty: true,
    });
  }, []);

  return {
    state,
    currentStep: state.currentStep,
    stepIndex,
    totalSteps,
    canGoBack,
    canGoNext,
    isComplete,
    goToStep,
    goNext,
    goBack,
    addCorporateEntity,
    updateCorporateEntity,
    deleteCorporateEntity,
    selectCompany,
    addOrgUnit,
    updateOrgUnit,
    deleteOrgUnit,
    addPillar,
    updatePillar,
    deletePillar,
    saveAndComplete,
    cancel,
    reset,
  };
}

export { STEPS, STEP_LABELS };
