import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useApp } from './AppContext';
import { CorporateEntity, CorporateEntityMetrics, OrgUnit } from '../types';

interface CorporateContextType {
  // Selection state
  selectedCorporateEntityId: string | null;
  setSelectedCorporateEntityId: (id: string | null) => void;

  // Navigation helpers (convenience wrappers around AppContext)
  getCorporateEntity: (id: string) => CorporateEntity | undefined;
  getRootCorporation: () => CorporateEntity | undefined;
  getChildEntities: (parentId: string | null) => CorporateEntity[];
  getSiblingEntities: (id: string) => CorporateEntity[]; // Same parent = siblings/uncles
  getEntityAncestors: (id: string) => CorporateEntity[];
  getEntityDescendants: (id: string) => CorporateEntity[];
  getCompanies: () => CorporateEntity[];
  getOrgUnitsForCompany: (companyId: string) => OrgUnit[];

  // Derived state
  selectedEntity: CorporateEntity | undefined;
  selectedEntityAncestors: CorporateEntity[];
  isFiltering: boolean;

  // Metrics
  calculateEntityMetrics: (id: string, includeDescendants?: boolean) => CorporateEntityMetrics;
}

const STORAGE_KEY = 'stratos-ai-selected-corporate-entity';

const CorporateContext = createContext<CorporateContextType | undefined>(undefined);

export const CorporateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    state,
    getCorporateEntity: appGetCorporateEntity,
    getRootCorporation: appGetRootCorporation,
    getChildCorporateEntities,
    getSiblingCorporateEntities,
    getCorporateEntityAncestors,
    getCorporateEntityDescendants,
    getAllCompanies,
    getOrgUnitsForCompany: appGetOrgUnitsForCompany,
  } = useApp();

  const [selectedCorporateEntityId, setSelectedCorporateEntityIdState] = useState<string | null>(null);

  // Load saved selection from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Verify the entity still exists
        const entities = state.corporateEntities || [];
        if (entities.some((e) => e.id === saved)) {
          setSelectedCorporateEntityIdState(saved);
        }
      }
    } catch (error) {
      console.error('Error loading corporate entity selection:', error);
    }
  }, [state.corporateEntities]);

  const setSelectedCorporateEntityId = (id: string | null) => {
    setSelectedCorporateEntityIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving corporate entity selection:', error);
    }
  };

  // Derived values
  const selectedEntity = useMemo(
    () => (selectedCorporateEntityId ? appGetCorporateEntity(selectedCorporateEntityId) : undefined),
    [selectedCorporateEntityId, appGetCorporateEntity]
  );

  const selectedEntityAncestors = useMemo(
    () => (selectedCorporateEntityId ? getCorporateEntityAncestors(selectedCorporateEntityId) : []),
    [selectedCorporateEntityId, getCorporateEntityAncestors]
  );

  const isFiltering = selectedCorporateEntityId !== null;

  // Calculate metrics for a corporate entity
  const calculateEntityMetrics = (id: string, includeDescendants: boolean = false): CorporateEntityMetrics => {
    const entity = appGetCorporateEntity(id);
    if (!entity) {
      return {
        entityId: id,
        totalInitiatives: 0,
        totalProjects: 0,
        totalTasks: 0,
        greenCount: 0,
        amberCount: 0,
        redCount: 0,
        totalBudget: 0,
        totalActualSpend: 0,
        budgetVariance: 0,
        weightedRAG: 'gray',
        childEntityCount: 0,
        childCompanyCount: 0,
      };
    }

    // Get entities to include in calculation
    let entitiesToInclude: CorporateEntity[] = [entity];
    let childEntities: CorporateEntity[] = [];
    if (includeDescendants) {
      childEntities = getCorporateEntityDescendants(id);
      entitiesToInclude = [...entitiesToInclude, ...childEntities];
    }

    const entityIds = new Set(entitiesToInclude.map((e) => e.id));

    // Get org units for these entities
    const orgUnits = (state.orgUnits || []).filter((u) => entityIds.has(u.companyId));
    const orgUnitIds = new Set(orgUnits.map((u) => u.id));

    // Get pillars for these org units (or no orgUnitId = corporate level)
    const pillars = (state.pillars || []).filter(
      (p) => !p.orgUnitId || orgUnitIds.has(p.orgUnitId)
    );
    const pillarIds = new Set(pillars.map((p) => p.id));

    // Get initiatives linked to these pillars
    const initiatives = (state.initiatives || []).filter((i) => pillarIds.has(i.pillarId));
    const initiativeIds = new Set(initiatives.map((i) => i.id));

    // Get projects linked to these initiatives
    const projects = (state.projects || []).filter((p) => initiativeIds.has(p.initiativeId));
    const projectIds = new Set(projects.map((p) => p.id));

    // Get tasks linked to these projects
    const tasks = (state.tasks || []).filter((t) => projectIds.has(t.projectId));

    // Calculate RAG distribution from initiatives
    let greenCount = 0;
    let amberCount = 0;
    let redCount = 0;
    initiatives.forEach((i) => {
      const status = i.ragStatus || 'green';
      if (status === 'green') greenCount++;
      else if (status === 'amber') amberCount++;
      else if (status === 'red') redCount++;
    });

    // Calculate budget totals
    const totalBudget = initiatives.reduce((sum, i) => sum + (i.budget || 0), 0);
    const totalActualSpend = initiatives.reduce((sum, i) => sum + (i.spentBudget || 0), 0);
    const budgetVariance = totalBudget - totalActualSpend;

    // Calculate weighted RAG based on budget
    let weightedRAG: 'green' | 'amber' | 'red' | 'gray' = 'gray';
    if (initiatives.length > 0) {
      const total = greenCount + amberCount + redCount;
      if (redCount > total * 0.2) weightedRAG = 'red';
      else if (amberCount > total * 0.3) weightedRAG = 'amber';
      else weightedRAG = 'green';
    }

    // Count child entities
    const childCompanies = childEntities.filter((e) => e.entityType === 'company');

    return {
      entityId: id,
      totalInitiatives: initiatives.length,
      totalProjects: projects.length,
      totalTasks: tasks.length,
      greenCount,
      amberCount,
      redCount,
      totalBudget,
      totalActualSpend,
      budgetVariance,
      weightedRAG,
      childEntityCount: childEntities.length,
      childCompanyCount: childCompanies.length,
    };
  };

  // Wrapper to handle null parent ID (returns root entities)
  const getChildEntities = (parentId: string | null): CorporateEntity[] => {
    if (parentId === null) {
      // Return root entities (corporation with no parent)
      return (state.corporateEntities || []).filter((e) => !e.parentEntityId && e.isActive);
    }
    return getChildCorporateEntities(parentId);
  };

  const value: CorporateContextType = {
    // Selection state
    selectedCorporateEntityId,
    setSelectedCorporateEntityId,

    // Navigation helpers
    getCorporateEntity: appGetCorporateEntity,
    getRootCorporation: appGetRootCorporation,
    getChildEntities,
    getSiblingEntities: getSiblingCorporateEntities,
    getEntityAncestors: getCorporateEntityAncestors,
    getEntityDescendants: getCorporateEntityDescendants,
    getCompanies: getAllCompanies,
    getOrgUnitsForCompany: appGetOrgUnitsForCompany,

    // Derived state
    selectedEntity,
    selectedEntityAncestors,
    isFiltering,

    // Metrics
    calculateEntityMetrics,
  };

  return <CorporateContext.Provider value={value}>{children}</CorporateContext.Provider>;
};

export const useCorporateContext = (): CorporateContextType => {
  const context = useContext(CorporateContext);
  if (!context) {
    throw new Error('useCorporateContext must be used within a CorporateProvider');
  }
  return context;
};

// Convenience hook for getting the current company context
export const useCurrentCompany = (): {
  companyId: string | null;
  company: CorporateEntity | undefined;
  companyOrgUnits: OrgUnit[];
} => {
  const { selectedCorporateEntityId, selectedEntity, getOrgUnitsForCompany, getCompanies } =
    useCorporateContext();

  // If selected entity is a company, use it directly
  // If it's a corporation/holding, use the first company under it (or null for "all")
  let companyId: string | null = null;
  let company: CorporateEntity | undefined = undefined;

  if (selectedEntity) {
    if (selectedEntity.entityType === 'company') {
      companyId = selectedEntity.id;
      company = selectedEntity;
    } else {
      // Corporation or Holding selected - could get first company under it
      // For now, return null (all companies)
      companyId = null;
    }
  }

  const companyOrgUnits = companyId ? getOrgUnitsForCompany(companyId) : [];

  return { companyId, company, companyOrgUnits };
};
