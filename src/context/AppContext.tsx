import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState,
  AppAction,
  StrategyPillar,
  StrategicKPI,
  Initiative,
  Project,
  Task,
  Resource,
  Milestone,
  OrgUnit,
  OrgHierarchyConfig,
  OrgLevel,
  CorporateEntity,
  CorporateHierarchyConfig,
  User,
  UserEntityAssignment,
  DEFAULT_ORG_CONFIG,
  DEFAULT_CORPORATE_CONFIG,
} from '../types';
import { seedData } from '../utils/seedData';
import { migrateToOrgHierarchy, needsOrgMigration } from '../utils/orgMigration';
import { migrateToCorporateStructure, needsCorporateMigration } from '../utils/corporateMigration';

const STORAGE_KEY = 'stratos-ai-data';

// Default BSC pillars - these should always exist
const DEFAULT_PILLARS: StrategyPillar[] = [
  {
    id: 'pillar-1',
    name: 'Financial',
    description: 'Financial health and growth objectives',
    displayOrder: 1,
    ragStatus: 'green',
  },
  {
    id: 'pillar-2',
    name: 'Customer',
    description: 'Customer satisfaction and loyalty metrics',
    displayOrder: 2,
    ragStatus: 'green',
  },
  {
    id: 'pillar-3',
    name: 'Internal Processes',
    description: 'Operational excellence and efficiency',
    displayOrder: 3,
    ragStatus: 'green',
  },
  {
    id: 'pillar-4',
    name: 'Learning & Growth',
    description: 'Employee development and organizational capability',
    displayOrder: 4,
    ragStatus: 'green',
  },
];

// Load initial state from localStorage or use seed data
// Always ensures the 4 default BSC pillars exist, org hierarchy, and corporate structure are initialized
const loadInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let parsed = JSON.parse(stored) as AppState;
      // Ensure default pillars always exist
      if (!parsed.pillars || parsed.pillars.length === 0) {
        parsed.pillars = DEFAULT_PILLARS;
      }
      // Migrate to org hierarchy if needed (legacy migration)
      if (needsOrgMigration(parsed)) {
        parsed = migrateToOrgHierarchy(parsed);
      }
      // Migrate to corporate structure if needed
      if (needsCorporateMigration(parsed)) {
        parsed = migrateToCorporateStructure(parsed);
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  // Apply migrations to seed data as well
  let migratedSeed = migrateToOrgHierarchy(seedData);
  migratedSeed = migrateToCorporateStructure(migratedSeed);
  return migratedSeed;
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    // Pillar actions
    case 'ADD_PILLAR':
      return { ...state, pillars: [...state.pillars, action.payload] };
    case 'UPDATE_PILLAR':
      return {
        ...state,
        pillars: state.pillars.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    case 'DELETE_PILLAR':
      return { ...state, pillars: state.pillars.filter((p) => p.id !== action.payload) };

    // KPI actions
    case 'ADD_KPI':
      return { ...state, kpis: [...state.kpis, action.payload] };
    case 'UPDATE_KPI':
      return {
        ...state,
        kpis: state.kpis.map((k) => (k.id === action.payload.id ? action.payload : k)),
      };
    case 'DELETE_KPI':
      return { ...state, kpis: state.kpis.filter((k) => k.id !== action.payload) };

    // Initiative actions
    case 'ADD_INITIATIVE':
      return { ...state, initiatives: [...state.initiatives, action.payload] };
    case 'UPDATE_INITIATIVE':
      return {
        ...state,
        initiatives: state.initiatives.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };
    case 'DELETE_INITIATIVE':
      return { ...state, initiatives: state.initiatives.filter((i) => i.id !== action.payload) };

    // Project actions
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.payload) };

    // Task actions
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };

    // Resource actions
    case 'ADD_RESOURCE':
      return { ...state, resources: [...state.resources, action.payload] };
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    case 'DELETE_RESOURCE':
      return { ...state, resources: state.resources.filter((r) => r.id !== action.payload) };

    // Milestone actions (WBS support)
    case 'ADD_MILESTONE':
      return { ...state, milestones: [...(state.milestones || []), action.payload] };
    case 'UPDATE_MILESTONE':
      return {
        ...state,
        milestones: (state.milestones || []).map((m) => (m.id === action.payload.id ? action.payload : m)),
      };
    case 'DELETE_MILESTONE':
      return { ...state, milestones: (state.milestones || []).filter((m) => m.id !== action.payload) };

    // Organization unit actions
    case 'ADD_ORG_UNIT':
      return { ...state, orgUnits: [...(state.orgUnits || []), action.payload] };
    case 'UPDATE_ORG_UNIT':
      return {
        ...state,
        orgUnits: (state.orgUnits || []).map((u) => (u.id === action.payload.id ? action.payload : u)),
      };
    case 'DELETE_ORG_UNIT':
      return { ...state, orgUnits: (state.orgUnits || []).filter((u) => u.id !== action.payload) };
    case 'UPDATE_ORG_CONFIG':
      return { ...state, orgConfig: action.payload };

    // Corporate entity actions
    case 'ADD_CORPORATE_ENTITY':
      return { ...state, corporateEntities: [...(state.corporateEntities || []), action.payload] };
    case 'UPDATE_CORPORATE_ENTITY':
      return {
        ...state,
        corporateEntities: (state.corporateEntities || []).map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_CORPORATE_ENTITY':
      return {
        ...state,
        corporateEntities: (state.corporateEntities || []).filter((e) => e.id !== action.payload),
      };
    case 'UPDATE_CORPORATE_CONFIG':
      return { ...state, corporateConfig: action.payload };

    // User management actions
    case 'ADD_USER':
      return { ...state, users: [...(state.users || []), action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: (state.users || []).map((u) => (u.id === action.payload.id ? action.payload : u)),
      };
    case 'DELETE_USER':
      return { ...state, users: (state.users || []).filter((u) => u.id !== action.payload) };
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.payload ?? undefined };

    // User assignment actions
    case 'ADD_USER_ASSIGNMENT':
      return { ...state, userAssignments: [...(state.userAssignments || []), action.payload] };
    case 'UPDATE_USER_ASSIGNMENT':
      return {
        ...state,
        userAssignments: (state.userAssignments || []).map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'DELETE_USER_ASSIGNMENT':
      return {
        ...state,
        userAssignments: (state.userAssignments || []).filter((a) => a.id !== action.payload),
      };

    // Setup wizard actions
    case 'SET_SETUP_WIZARD_COMPLETED':
      return { ...state, setupWizardCompleted: action.payload };

    // Import data (merge)
    case 'IMPORT_DATA':
      return {
        pillars: action.payload.pillars || state.pillars,
        kpis: action.payload.kpis || state.kpis,
        initiatives: action.payload.initiatives || state.initiatives,
        projects: [...state.projects, ...(action.payload.projects || [])],
        tasks: [...state.tasks, ...(action.payload.tasks || [])],
        resources: action.payload.resources || state.resources,
        milestones: [...(state.milestones || []), ...(action.payload.milestones || [])],
        corporateEntities: action.payload.corporateEntities || state.corporateEntities,
        corporateConfig: action.payload.corporateConfig || state.corporateConfig,
        orgUnits: action.payload.orgUnits || state.orgUnits,
        orgConfig: action.payload.orgConfig || state.orgConfig,
        users: action.payload.users || state.users,
        userAssignments: action.payload.userAssignments || state.userAssignments,
        currentUserId: state.currentUserId,
        setupWizardCompleted: state.setupWizardCompleted,
      };

    default:
      return state;
  }
};

// Context types
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  getPillar: (id: string) => StrategyPillar | undefined;
  getKPIsByPillar: (pillarId: string) => StrategicKPI[];
  getInitiative: (id: string) => Initiative | undefined;
  getInitiativesByPillar: (pillarId: string) => Initiative[];
  getProject: (id: string) => Project | undefined;
  getProjectsByInitiative: (initiativeId: string) => Project[];
  getTask: (id: string) => Task | undefined;
  getTasksByProject: (projectId: string) => Task[];
  getResource: (id: string) => Resource | undefined;
  // WBS helper functions
  getMilestone: (id: string) => Milestone | undefined;
  getMilestonesByProject: (projectId: string) => Milestone[];
  getChildTasks: (parentTaskId: string) => Task[];
  getRootTasks: (projectId: string) => Task[];
  // Corporate entity helper functions
  getCorporateEntity: (id: string) => CorporateEntity | undefined;
  getRootCorporation: () => CorporateEntity | undefined;
  getChildCorporateEntities: (parentId: string) => CorporateEntity[];
  getSiblingCorporateEntities: (id: string) => CorporateEntity[];
  getCorporateEntityAncestors: (id: string) => CorporateEntity[];
  getCorporateEntityDescendants: (id: string) => CorporateEntity[];
  getAllCompanies: () => CorporateEntity[];
  getCorporateConfig: () => CorporateHierarchyConfig;
  // Organization hierarchy helper functions
  getOrgUnit: (id: string) => OrgUnit | undefined;
  getOrgUnitsByLevel: (level: OrgLevel) => OrgUnit[];
  getOrgUnitsForCompany: (companyId: string) => OrgUnit[];
  getChildOrgUnits: (parentId: string) => OrgUnit[];
  getOrgUnitAncestors: (id: string) => OrgUnit[];
  getOrgUnitDescendants: (id: string) => OrgUnit[];
  getPillarsByOrgUnit: (orgUnitId: string) => StrategyPillar[];
  getInitiativesByOrgUnit: (orgUnitId: string, includeDescendants?: boolean) => Initiative[];
  getProjectsByOrgUnit: (orgUnitId: string, includeDescendants?: boolean) => Project[];
  getEffectiveBSCOrgUnit: (orgUnitId: string) => OrgUnit | undefined;
  getOrgConfig: () => OrgHierarchyConfig;
  // User helper functions
  getUser: (id: string) => User | undefined;
  getCurrentUser: () => User | undefined;
  getUserAssignments: (userId: string) => UserEntityAssignment[];
  // State helpers
  isSetupWizardCompleted: () => boolean;
  resetToSeedData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, null, loadInitialState);

  // Persist to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state]);

  // Helper functions
  const getPillar = (id: string) => state.pillars.find((p) => p.id === id);
  const getKPIsByPillar = (pillarId: string) => state.kpis.filter((k) => k.pillarId === pillarId);
  const getInitiative = (id: string) => state.initiatives.find((i) => i.id === id);
  const getInitiativesByPillar = (pillarId: string) => state.initiatives.filter((i) => i.pillarId === pillarId);
  const getProject = (id: string) => state.projects.find((p) => p.id === id);
  const getProjectsByInitiative = (initiativeId: string) => state.projects.filter((p) => p.initiativeId === initiativeId);
  const getTask = (id: string) => state.tasks.find((t) => t.id === id);
  const getTasksByProject = (projectId: string) => state.tasks.filter((t) => t.projectId === projectId);
  const getResource = (id: string) => state.resources.find((r) => r.id === id);

  // WBS helper functions
  const getMilestone = (id: string) => (state.milestones || []).find((m) => m.id === id);
  const getMilestonesByProject = (projectId: string) => (state.milestones || []).filter((m) => m.projectId === projectId);
  const getChildTasks = (parentTaskId: string) => state.tasks.filter((t) => t.parentTaskId === parentTaskId);
  const getRootTasks = (projectId: string) => state.tasks.filter((t) => t.projectId === projectId && !t.parentTaskId);

  // Corporate entity helper functions
  const getCorporateEntity = (id: string) => (state.corporateEntities || []).find((e) => e.id === id);

  const getRootCorporation = () =>
    (state.corporateEntities || []).find((e) => e.entityType === 'corporation' && !e.parentEntityId);

  const getChildCorporateEntities = (parentId: string) =>
    (state.corporateEntities || [])
      .filter((e) => e.parentEntityId === parentId && e.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

  const getSiblingCorporateEntities = (id: string): CorporateEntity[] => {
    const entity = getCorporateEntity(id);
    if (!entity || !entity.parentEntityId) return [];
    return (state.corporateEntities || []).filter(
      (e) => e.parentEntityId === entity.parentEntityId && e.id !== id && e.isActive
    );
  };

  const getCorporateEntityAncestors = (id: string): CorporateEntity[] => {
    const ancestors: CorporateEntity[] = [];
    let current = getCorporateEntity(id);
    while (current?.parentEntityId) {
      const parent = getCorporateEntity(current.parentEntityId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  };

  const getCorporateEntityDescendants = (id: string): CorporateEntity[] => {
    const descendants: CorporateEntity[] = [];
    const queue = getChildCorporateEntities(id);
    while (queue.length > 0) {
      const entity = queue.shift()!;
      descendants.push(entity);
      queue.push(...getChildCorporateEntities(entity.id));
    }
    return descendants;
  };

  const getAllCompanies = () =>
    (state.corporateEntities || [])
      .filter((e) => e.entityType === 'company' && e.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

  const getCorporateConfig = (): CorporateHierarchyConfig =>
    state.corporateConfig || DEFAULT_CORPORATE_CONFIG;

  // Organization hierarchy helper functions
  const getOrgUnit = (id: string) => (state.orgUnits || []).find((u) => u.id === id);

  const getOrgUnitsByLevel = (level: OrgLevel) =>
    (state.orgUnits || []).filter((u) => u.level === level && u.isActive);

  const getChildOrgUnits = (parentId: string) =>
    (state.orgUnits || []).filter((u) => u.parentId === parentId && u.isActive);

  const getOrgUnitAncestors = (id: string): OrgUnit[] => {
    const ancestors: OrgUnit[] = [];
    let current = getOrgUnit(id);
    while (current?.parentId) {
      const parent = getOrgUnit(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  };

  const getOrgUnitDescendants = (id: string): OrgUnit[] => {
    const descendants: OrgUnit[] = [];
    const queue = getChildOrgUnits(id);
    while (queue.length > 0) {
      const unit = queue.shift()!;
      descendants.push(unit);
      queue.push(...getChildOrgUnits(unit.id));
    }
    return descendants;
  };

  const getPillarsByOrgUnit = (orgUnitId: string) =>
    state.pillars.filter((p) => p.orgUnitId === orgUnitId || (!p.orgUnitId && orgUnitId === 'org-company'));

  const getInitiativesByOrgUnit = (orgUnitId: string, includeDescendants: boolean = false): Initiative[] => {
    const orgIds = new Set([orgUnitId]);
    if (includeDescendants) {
      getOrgUnitDescendants(orgUnitId).forEach((u) => orgIds.add(u.id));
    }
    return state.initiatives.filter(
      (i) => orgIds.has(i.orgUnitId || 'org-company')
    );
  };

  const getProjectsByOrgUnit = (orgUnitId: string, includeDescendants: boolean = false): Project[] => {
    const orgIds = new Set([orgUnitId]);
    if (includeDescendants) {
      getOrgUnitDescendants(orgUnitId).forEach((u) => orgIds.add(u.id));
    }
    return state.projects.filter(
      (p) => orgIds.has(p.orgUnitId || 'org-company')
    );
  };

  const getEffectiveBSCOrgUnit = (orgUnitId: string): OrgUnit | undefined => {
    const orgUnits = state.orgUnits || [];
    const visited = new Set<string>();
    let currentId: string | undefined = orgUnitId;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const unit = orgUnits.find((u) => u.id === currentId);

      if (!unit) return undefined;
      if (unit.hasBSC) return unit;

      // Follow inheritance chain
      currentId = unit.inheritBSCFromId || unit.parentId || undefined;
    }

    // Fallback to first directorate with BSC if no BSC found in chain
    return orgUnits.find((u) => u.level === 'directorate' && u.hasBSC);
  };

  const getOrgConfig = (): OrgHierarchyConfig => state.orgConfig || DEFAULT_ORG_CONFIG;

  const getOrgUnitsForCompany = (companyId: string): OrgUnit[] =>
    (state.orgUnits || [])
      .filter((u) => u.companyId === companyId && u.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

  // User helper functions
  const getUser = (id: string) => (state.users || []).find((u) => u.id === id);

  const getCurrentUser = () =>
    state.currentUserId ? getUser(state.currentUserId) : undefined;

  const getUserAssignments = (userId: string) =>
    (state.userAssignments || []).filter((a) => a.userId === userId && a.isActive);

  // State helpers
  const isSetupWizardCompleted = () => state.setupWizardCompleted ?? false;

  const resetToSeedData = () => {
    let migratedSeed = migrateToOrgHierarchy(seedData);
    migratedSeed = migrateToCorporateStructure(migratedSeed);
    dispatch({ type: 'SET_STATE', payload: migratedSeed });
  };

  const value: AppContextType = {
    state,
    dispatch,
    getPillar,
    getKPIsByPillar,
    getInitiative,
    getInitiativesByPillar,
    getProject,
    getProjectsByInitiative,
    getTask,
    getTasksByProject,
    getResource,
    // WBS helper functions
    getMilestone,
    getMilestonesByProject,
    getChildTasks,
    getRootTasks,
    // Corporate entity helper functions
    getCorporateEntity,
    getRootCorporation,
    getChildCorporateEntities,
    getSiblingCorporateEntities,
    getCorporateEntityAncestors,
    getCorporateEntityDescendants,
    getAllCompanies,
    getCorporateConfig,
    // Organization hierarchy helper functions
    getOrgUnit,
    getOrgUnitsByLevel,
    getOrgUnitsForCompany,
    getChildOrgUnits,
    getOrgUnitAncestors,
    getOrgUnitDescendants,
    getPillarsByOrgUnit,
    getInitiativesByOrgUnit,
    getProjectsByOrgUnit,
    getEffectiveBSCOrgUnit,
    getOrgConfig,
    // User helper functions
    getUser,
    getCurrentUser,
    getUserAssignments,
    // State helpers
    isSetupWizardCompleted,
    resetToSeedData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook for using the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
