import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction, StrategyPillar, StrategicKPI, Initiative, Project, Task, Resource, Milestone } from '../types';
import { seedData } from '../utils/seedData';

const STORAGE_KEY = 'stratos-ai-data';

// Load initial state from localStorage or use seed data
const loadInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return seedData;
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

  const resetToSeedData = () => dispatch({ type: 'SET_STATE', payload: seedData });

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
