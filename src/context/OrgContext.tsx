import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useApp } from './AppContext';
import { OrgUnit } from '../types';

interface OrgContextType {
  // Selection state
  selectedOrgUnitId: string | null;
  setSelectedOrgUnitId: (id: string | null) => void;

  // Derived state
  selectedOrgUnit: OrgUnit | undefined;
  selectedOrgUnitAncestors: OrgUnit[];
  isFiltering: boolean;

  // Computed: current company based on selected org unit
  currentCompanyId: string | null;

  // Filtering helpers
  getFilteredOrgUnits: () => OrgUnit[];
  isOrgUnitVisible: (orgUnitId: string) => boolean;
}

const STORAGE_KEY = 'stratos-ai-selected-org';

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, getOrgUnit, getOrgUnitAncestors, getOrgUnitDescendants } = useApp();
  const [selectedOrgUnitId, setSelectedOrgUnitIdState] = useState<string | null>(null);

  // Load saved selection from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Verify the org unit still exists
        const orgUnits = state.orgUnits || [];
        if (orgUnits.some((u) => u.id === saved)) {
          setSelectedOrgUnitIdState(saved);
        }
      }
    } catch (error) {
      console.error('Error loading org selection:', error);
    }
  }, [state.orgUnits]);

  const setSelectedOrgUnitId = (id: string | null) => {
    setSelectedOrgUnitIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving org selection:', error);
    }
  };

  // Derived values
  const selectedOrgUnit = useMemo(
    () => (selectedOrgUnitId ? getOrgUnit(selectedOrgUnitId) : undefined),
    [selectedOrgUnitId, getOrgUnit]
  );

  const selectedOrgUnitAncestors = useMemo(
    () => (selectedOrgUnitId ? getOrgUnitAncestors(selectedOrgUnitId) : []),
    [selectedOrgUnitId, getOrgUnitAncestors]
  );

  const isFiltering = selectedOrgUnitId !== null;

  // Get current company ID from selected org unit
  const currentCompanyId = useMemo(() => {
    if (!selectedOrgUnit) return null;
    return selectedOrgUnit.companyId || null;
  }, [selectedOrgUnit]);

  // Get filtered org units based on selection
  const getFilteredOrgUnits = (): OrgUnit[] => {
    const orgUnits = state.orgUnits || [];
    if (!selectedOrgUnitId) {
      return orgUnits.filter((u) => u.isActive);
    }

    // Include selected unit and all its descendants
    const descendants = getOrgUnitDescendants(selectedOrgUnitId);
    const selectedUnit = getOrgUnit(selectedOrgUnitId);
    const visibleIds = new Set([
      selectedOrgUnitId,
      ...descendants.map((u) => u.id),
    ]);

    return orgUnits.filter((u) => u.isActive && visibleIds.has(u.id));
  };

  // Check if an org unit is visible under current filter
  const isOrgUnitVisible = (orgUnitId: string): boolean => {
    if (!selectedOrgUnitId) return true;
    if (orgUnitId === selectedOrgUnitId) return true;

    // Check if this org unit is a descendant of the selected one
    const ancestors = getOrgUnitAncestors(orgUnitId);
    return ancestors.some((a) => a.id === selectedOrgUnitId);
  };

  const value: OrgContextType = {
    selectedOrgUnitId,
    setSelectedOrgUnitId,
    selectedOrgUnit,
    selectedOrgUnitAncestors,
    isFiltering,
    currentCompanyId,
    getFilteredOrgUnits,
    isOrgUnitVisible,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrgContext = (): OrgContextType => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrgContext must be used within an OrgProvider');
  }
  return context;
};
